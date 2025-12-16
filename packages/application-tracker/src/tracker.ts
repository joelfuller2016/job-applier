import {
  JobApplication,
  ApplicationStatus,
  JobListing,
  toISOString,
  generateId,
  ApplicationMethod,
} from '@job-applier/core';
import { ApplicationRepository, JobRepository } from '@job-applier/database';

/**
 * Application lifecycle events
 */
export type ApplicationEvent =
  | 'created'
  | 'submitted'
  | 'viewed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected'
  | 'withdrawn'
  | 'follow_up_sent'
  | 'response_received';

/**
 * Application event log entry
 */
export interface ApplicationEventLog {
  id: string;
  applicationId: string;
  event: ApplicationEvent;
  timestamp: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Follow-up reminder
 */
export interface FollowUpReminder {
  id: string;
  applicationId: string;
  scheduledFor: string;
  type: 'initial' | 'second' | 'final';
  sent: boolean;
  sentAt?: string;
}

/**
 * Application tracker for managing the full application lifecycle
 */
export class ApplicationTracker {
  private applicationRepo: ApplicationRepository;
  private jobRepo: JobRepository;
  private eventLogs: Map<string, ApplicationEventLog[]> = new Map();
  private followUpReminders: Map<string, FollowUpReminder[]> = new Map();

  constructor() {
    this.applicationRepo = new ApplicationRepository();
    this.jobRepo = new JobRepository();
  }

  /**
   * Create a new application record
   */
  async createApplication(
    job: JobListing,
    profileId: string,
    _coverLetterId?: string
  ): Promise<JobApplication> {
    // Ensure job exists in database
    const existingJob = this.jobRepo.findByExternalId(job.platform, job.externalId);
    if (!existingJob) {
      this.jobRepo.upsert(job);
    }

    const application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> = {
      jobId: job.id,
      profileId,
      platform: job.platform,
      status: 'draft',
      method: 'easy-apply' as ApplicationMethod,
      appliedAt: toISOString(new Date()),
      responseReceived: false,
    };

    const created = this.applicationRepo.create(application);
    await this.logEvent(created.id, 'created', 'Application record created');

    return created;
  }

  /**
   * Mark application as submitted
   */
  async markSubmitted(
    applicationId: string,
    externalApplicationId?: string
  ): Promise<JobApplication | null> {
    const application = this.applicationRepo.findById(applicationId);
    if (!application) return null;

    const updated = this.applicationRepo.markSubmitted(applicationId, externalApplicationId);

    if (updated) {
      await this.logEvent(applicationId, 'submitted', 'Application submitted successfully');
      await this.scheduleFollowUps(applicationId);
    }

    return updated;
  }

  /**
   * Update application status
   */
  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<JobApplication | null> {
    const updated = this.applicationRepo.updateStatus(applicationId, status, notes);

    if (updated) {
      const eventMap: Partial<Record<ApplicationStatus, ApplicationEvent>> = {
        draft: 'created',
        submitted: 'submitted',
        viewed: 'viewed',
        'in-review': 'response_received',
        interview: 'interview_scheduled',
        offer: 'offer_received',
        rejected: 'rejected',
        withdrawn: 'withdrawn',
      };

      const event = eventMap[status];
      if (event) {
        await this.logEvent(applicationId, event, notes);
      }
    }

    return updated;
  }

  /**
   * Record a failed application attempt
   */
  async recordFailedAttempt(
    applicationId: string,
    errorMessage: string
  ): Promise<JobApplication | null> {
    const application = this.applicationRepo.findById(applicationId);
    if (!application) return null;

    // Update status to error
    const updated = this.applicationRepo.updateStatus(applicationId, 'error', errorMessage);

    if (updated) {
      await this.logEvent(applicationId, 'rejected', `Error: ${errorMessage}`);
    }

    return updated;
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string): Promise<JobApplication | null> {
    return this.applicationRepo.findById(applicationId);
  }

  /**
   * Get all applications for a profile
   */
  async getApplicationsForProfile(profileId: string): Promise<JobApplication[]> {
    return this.applicationRepo.findByProfile(profileId);
  }

  /**
   * Get applications by status
   */
  async getApplicationsByStatus(status: ApplicationStatus): Promise<JobApplication[]> {
    return this.applicationRepo.findByStatus(status);
  }

  /**
   * Get applications needing follow-up
   */
  async getApplicationsNeedingFollowUp(): Promise<JobApplication[]> {
    const now = new Date();
    const applications: JobApplication[] = [];

    // Get all submitted applications
    const submitted = this.applicationRepo.findByStatus('submitted');

    for (const app of submitted) {
      const reminders = this.followUpReminders.get(app.id) || [];
      const dueReminders = reminders.filter(
        r => !r.sent && new Date(r.scheduledFor) <= now
      );

      if (dueReminders.length > 0) {
        applications.push(app);
      }
    }

    return applications;
  }

  /**
   * Schedule follow-up reminders for an application
   */
  private async scheduleFollowUps(applicationId: string): Promise<void> {
    const now = new Date();
    const reminders: FollowUpReminder[] = [
      {
        id: generateId(),
        applicationId,
        scheduledFor: toISOString(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)), // 1 week
        type: 'initial',
        sent: false,
      },
      {
        id: generateId(),
        applicationId,
        scheduledFor: toISOString(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)), // 2 weeks
        type: 'second',
        sent: false,
      },
      {
        id: generateId(),
        applicationId,
        scheduledFor: toISOString(new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)), // 3 weeks
        type: 'final',
        sent: false,
      },
    ];

    this.followUpReminders.set(applicationId, reminders);
  }

  /**
   * Mark a follow-up reminder as sent
   */
  async markFollowUpSent(applicationId: string, reminderId: string): Promise<void> {
    const reminders = this.followUpReminders.get(applicationId);
    if (!reminders) return;

    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.sent = true;
      reminder.sentAt = toISOString(new Date());

      await this.logEvent(applicationId, 'follow_up_sent', `${reminder.type} follow-up sent`);
    }
  }

  /**
   * Get pending follow-up reminders
   */
  getFollowUpReminders(applicationId: string): FollowUpReminder[] {
    return this.followUpReminders.get(applicationId) || [];
  }

  /**
   * Log an event for an application
   */
  private async logEvent(
    applicationId: string,
    event: ApplicationEvent,
    details?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log: ApplicationEventLog = {
      id: generateId(),
      applicationId,
      event,
      timestamp: toISOString(new Date()),
      details,
      metadata,
    };

    const logs = this.eventLogs.get(applicationId) || [];
    logs.push(log);
    this.eventLogs.set(applicationId, logs);
  }

  /**
   * Get event log for an application
   */
  getEventLog(applicationId: string): ApplicationEventLog[] {
    return this.eventLogs.get(applicationId) || [];
  }

  /**
   * Check if application can be retried
   */
  canRetry(application: JobApplication, maxAttempts = 3): boolean {
    if (application.status !== 'draft' && application.status !== 'error') return false;
    // Since attempts property doesn't exist on JobApplication, we'll check event logs instead
    const events = this.eventLogs.get(application.id) || [];
    const attemptCount = events.filter(e => e.event === 'submitted').length;
    if (attemptCount >= maxAttempts) return false;
    return true;
  }

  /**
   * Withdraw an application
   */
  async withdrawApplication(
    applicationId: string,
    reason?: string
  ): Promise<JobApplication | null> {
    const updated = this.applicationRepo.updateStatus(applicationId, 'withdrawn', reason);

    if (updated) {
      await this.logEvent(applicationId, 'withdrawn', reason);
    }

    return updated;
  }
}
