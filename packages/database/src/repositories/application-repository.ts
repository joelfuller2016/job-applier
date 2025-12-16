import { run, get, all, saveDatabase } from '../connection.js';
import {
  JobApplication,
  JobApplicationSchema,
  ApplicationStatus,
  ApplicationEvent,
  generateId,
  toISOString,
  DatabaseError,
} from '@job-applier/core';

/**
 * Application repository for database operations
 */
export class ApplicationRepository {
  /**
   * Create a new application
   */
  create(application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): JobApplication {
    const now = toISOString(new Date());

    const newApplication: JobApplication = {
      ...application,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      run(`
        INSERT INTO applications (
          id, profile_id, job_id, status, method, cover_letter, submission,
          platform, platform_application_id, match_score, match_reasons,
          response_received, response_date, response_details, follow_up_dates,
          next_follow_up, notes, applied_at, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        newApplication.id,
        newApplication.profileId,
        newApplication.jobId,
        newApplication.status,
        newApplication.method ?? null,
        newApplication.coverLetter ? JSON.stringify(newApplication.coverLetter) : null,
        newApplication.submission ? JSON.stringify(newApplication.submission) : null,
        newApplication.platform,
        newApplication.platformApplicationId ?? null,
        newApplication.matchScore ?? null,
        newApplication.matchReasons ? JSON.stringify(newApplication.matchReasons) : null,
        newApplication.responseReceived ? 1 : 0,
        newApplication.responseDate ?? null,
        newApplication.responseDetails ?? null,
        newApplication.followUpDates ? JSON.stringify(newApplication.followUpDates) : null,
        newApplication.nextFollowUp ?? null,
        newApplication.notes ?? null,
        newApplication.appliedAt ?? null,
        newApplication.createdAt,
        newApplication.updatedAt
      ]);

      saveDatabase();

      // Create initial event
      this.addEvent(newApplication.id, {
        type: 'created',
        description: 'Application created',
      });

      return newApplication;
    } catch (error) {
      throw new DatabaseError(
        `Failed to create application: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find application by ID
   */
  findById(id: string): JobApplication | null {
    try {
      const row = get<Record<string, unknown>>('SELECT * FROM applications WHERE id = ?', [id]);
      if (!row) return null;

      const application = this.rowToApplication(row);

      // Load events
      const events = all<Record<string, unknown>>(
        'SELECT * FROM application_events WHERE application_id = ? ORDER BY timestamp ASC',
        [id]
      );

      application.events = events.map(e => ({
        id: e.id as string,
        applicationId: e.application_id as string,
        type: e.type as ApplicationEvent['type'],
        description: e.description as string,
        metadata: e.metadata ? JSON.parse(e.metadata as string) : undefined,
        timestamp: e.timestamp as string,
      }));

      return application;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find application: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find applications by profile ID
   */
  findByProfile(profileId: string): JobApplication[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM applications
        WHERE profile_id = ?
        ORDER BY created_at DESC
      `, [profileId]);

      return rows.map(row => this.rowToApplication(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find applications: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find applications by status
   */
  findByStatus(status: ApplicationStatus): JobApplication[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM applications
        WHERE status = ?
        ORDER BY created_at DESC
      `, [status]);

      return rows.map(row => this.rowToApplication(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find applications by status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update application status
   */
  updateStatus(id: string, status: ApplicationStatus, details?: string): JobApplication | null {
    const existing = this.findById(id);
    if (!existing) return null;

    try {
      const now = toISOString(new Date());

      run(`
        UPDATE applications
        SET status = ?, updated_at = ?
        WHERE id = ?
      `, [status, now, id]);

      // Add status change event
      this.addEvent(id, {
        type: 'status-change',
        description: `Status changed from ${existing.status} to ${status}`,
        metadata: { previousStatus: existing.status, newStatus: status, details },
      });

      saveDatabase();
      return this.findById(id);
    } catch (error) {
      throw new DatabaseError(
        `Failed to update application status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Mark application as submitted
   */
  markSubmitted(id: string, platformApplicationId?: string): JobApplication | null {
    const now = toISOString(new Date());

    try {
      run(`
        UPDATE applications
        SET status = 'submitted', applied_at = ?, platform_application_id = ?, updated_at = ?
        WHERE id = ?
      `, [now, platformApplicationId ?? null, now, id]);

      this.addEvent(id, {
        type: 'submitted',
        description: 'Application submitted successfully',
        metadata: { platformApplicationId },
      });

      saveDatabase();
      return this.findById(id);
    } catch (error) {
      throw new DatabaseError(
        `Failed to mark application as submitted: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Add an event to an application
   */
  addEvent(
    applicationId: string,
    event: Omit<ApplicationEvent, 'id' | 'applicationId' | 'timestamp'>
  ): ApplicationEvent {
    const now = toISOString(new Date());

    const newEvent: ApplicationEvent = {
      id: generateId(),
      applicationId,
      ...event,
      timestamp: now,
    };

    try {
      run(`
        INSERT INTO application_events (id, application_id, type, description, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        newEvent.id,
        newEvent.applicationId,
        newEvent.type,
        newEvent.description,
        newEvent.metadata ? JSON.stringify(newEvent.metadata) : null,
        newEvent.timestamp
      ]);

      saveDatabase();
      return newEvent;
    } catch (error) {
      throw new DatabaseError(
        `Failed to add event: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get application statistics
   */
  getStats(profileId?: string): {
    total: number;
    byStatus: Record<string, number>;
    byPlatform: Record<string, number>;
    todayCount: number;
    responseRate: number;
  } {
    const profileFilter = profileId ? 'WHERE profile_id = ?' : '';
    const params = profileId ? [profileId] : [];

    try {
      // Total count
      const total = get<{ count: number }>(`SELECT COUNT(*) as count FROM applications ${profileFilter}`, params);

      // By status
      const statusCounts = all<{ status: string; count: number }>(`
        SELECT status, COUNT(*) as count FROM applications ${profileFilter} GROUP BY status
      `, params);

      // By platform
      const platformCounts = all<{ platform: string; count: number }>(`
        SELECT platform, COUNT(*) as count FROM applications ${profileFilter} GROUP BY platform
      `, params);

      // Today's count
      const today = get<{ count: number }>(`
        SELECT COUNT(*) as count FROM applications
        ${profileFilter ? profileFilter + ' AND' : 'WHERE'} date(applied_at) = date('now')
      `, params);

      // Response rate
      const responses = get<{ total: number; responses: number }>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN response_received = 1 THEN 1 ELSE 0 END) as responses
        FROM applications
        ${profileFilter ? profileFilter + ' AND' : 'WHERE'} status != 'draft'
      `, params);

      return {
        total: total?.count ?? 0,
        byStatus: Object.fromEntries(statusCounts.map(s => [s.status, s.count])),
        byPlatform: Object.fromEntries(platformCounts.map(p => [p.platform, p.count])),
        todayCount: today?.count ?? 0,
        responseRate: (responses?.total ?? 0) > 0 ? (responses?.responses ?? 0) / (responses?.total ?? 1) : 0,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if already applied to a job
   */
  hasApplied(profileId: string, jobId: string): boolean {
    try {
      const row = get<Record<string, unknown>>(`
        SELECT 1 FROM applications
        WHERE profile_id = ? AND job_id = ? AND status NOT IN ('withdrawn', 'error')
      `, [profileId, jobId]);

      return row !== undefined;
    } catch (error) {
      throw new DatabaseError(
        `Failed to check application: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to JobApplication
   */
  private rowToApplication(row: Record<string, unknown>): JobApplication {
    const application: Record<string, unknown> = {
      id: row.id as string,
      profileId: row.profile_id as string,
      jobId: row.job_id as string,
      status: row.status as ApplicationStatus,
      platform: row.platform as string,
      responseReceived: (row.response_received as number) === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };

    // Add optional fields only if not null
    if (row.method !== null && row.method !== undefined) {
      application.method = row.method as string;
    }
    if (row.cover_letter !== null && row.cover_letter !== undefined) {
      const parsed = JSON.parse(row.cover_letter as string);
      if (parsed !== null && parsed !== undefined) application.coverLetter = parsed;
    }
    if (row.submission !== null && row.submission !== undefined) {
      const parsed = JSON.parse(row.submission as string);
      if (parsed !== null && parsed !== undefined) application.submission = parsed;
    }
    if (row.platform_application_id !== null && row.platform_application_id !== undefined) {
      application.platformApplicationId = row.platform_application_id as string;
    }
    if (row.match_score !== null && row.match_score !== undefined) {
      application.matchScore = row.match_score as number;
    }
    if (row.match_reasons !== null && row.match_reasons !== undefined) {
      const parsed = JSON.parse(row.match_reasons as string);
      if (parsed && parsed.length > 0) application.matchReasons = parsed;
    }
    if (row.response_date !== null && row.response_date !== undefined) {
      application.responseDate = row.response_date as string;
    }
    if (row.response_details !== null && row.response_details !== undefined) {
      application.responseDetails = row.response_details as string;
    }
    if (row.follow_up_dates !== null && row.follow_up_dates !== undefined) {
      const parsed = JSON.parse(row.follow_up_dates as string);
      if (parsed && parsed.length > 0) application.followUpDates = parsed;
    }
    if (row.next_follow_up !== null && row.next_follow_up !== undefined) {
      application.nextFollowUp = row.next_follow_up as string;
    }
    if (row.notes !== null && row.notes !== undefined) {
      application.notes = row.notes as string;
    }
    if (row.applied_at !== null && row.applied_at !== undefined) {
      application.appliedAt = row.applied_at as string;
    }

    const result = JobApplicationSchema.safeParse(application);
    if (!result.success) {
      throw new DatabaseError(`Invalid application data: ${result.error.message}`);
    }

    return result.data;
  }
}

export const applicationRepository = new ApplicationRepository();
