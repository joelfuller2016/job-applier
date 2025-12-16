import {
  JobApplication,
  ApplicationStatus,
  JobPlatform,
} from '@job-applier/core';
import { ApplicationRepository, JobRepository } from '@job-applier/database';

/**
 * Application statistics summary
 */
export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byPlatform: Record<JobPlatform, number>;
  successRate: number;
  averageResponseTimeDays: number | null;
  thisWeek: number;
  thisMonth: number;
}

/**
 * Timeline entry for application activity
 */
export interface TimelineEntry {
  date: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
}

/**
 * Platform performance metrics
 */
export interface PlatformMetrics {
  platform: JobPlatform;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  averageResponseDays: number | null;
}

/**
 * Application analytics engine
 */
export class ApplicationAnalytics {
  private applicationRepo: ApplicationRepository;
  private jobRepo: JobRepository;

  constructor() {
    this.applicationRepo = new ApplicationRepository();
    this.jobRepo = new JobRepository();
  }

  /**
   * Get all applications for analytics
   */
  private async getAllApplications(profileId?: string): Promise<JobApplication[]> {
    if (profileId) {
      return this.applicationRepo.findByProfile(profileId);
    }

    // Get all applications by fetching each status
    const statuses: ApplicationStatus[] = [
      'draft',
      'submitted',
      'in-review',
      'viewed',
      'interview',
      'offer',
      'rejected',
      'withdrawn',
      'expired',
      'error',
    ];

    const allApplications: JobApplication[] = [];
    for (const status of statuses) {
      const apps = this.applicationRepo.findByStatus(status);
      allApplications.push(...apps);
    }

    return allApplications;
  }

  /**
   * Get overall application statistics
   */
  async getStats(profileId?: string): Promise<ApplicationStats> {
    const applications = await this.getAllApplications(profileId);

    const byStatus: Record<ApplicationStatus, number> = {
      draft: 0,
      submitted: 0,
      'in-review': 0,
      viewed: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
      expired: 0,
      error: 0,
    };

    const byPlatform: Record<JobPlatform, number> = {
      linkedin: 0,
      indeed: 0,
      glassdoor: 0,
      ziprecruiter: 0,
      monster: 0,
      dice: 0,
      angellist: 0,
      wellfound: 0,
      builtin: 0,
      'levels-fyi': 0,
      'company-website': 0,
      other: 0,
    };

    let responsesReceived = 0;
    let totalResponseTimeDays = 0;
    let responsesWithTime = 0;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let thisWeek = 0;
    let thisMonth = 0;

    for (const app of applications) {
      byStatus[app.status]++;
      byPlatform[app.platform]++;

      // Count applications this week/month
      const appliedAt = new Date(app.appliedAt || app.createdAt);
      if (appliedAt >= oneWeekAgo) thisWeek++;
      if (appliedAt >= oneMonthAgo) thisMonth++;

      // Calculate response time for applications that got responses
      const responseStatuses: ApplicationStatus[] = [
        'in-review',
        'viewed',
        'interview',
        'offer',
        'rejected',
      ];

      if (responseStatuses.includes(app.status)) {
        responsesReceived++;

        // Calculate response time if we have both dates
        if (app.appliedAt && app.updatedAt) {
          const applied = new Date(app.appliedAt);
          const updated = new Date(app.updatedAt);
          const daysDiff = Math.floor(
            (updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff >= 0) {
            totalResponseTimeDays += daysDiff;
            responsesWithTime++;
          }
        }
      }
    }

    const submitted = applications.filter(
      a => a.status !== 'draft' && a.status !== 'withdrawn'
    ).length;

    const successfulOutcomes = byStatus.offer;
    const successRate = submitted > 0 ? (successfulOutcomes / submitted) * 100 : 0;

    const averageResponseTimeDays =
      responsesWithTime > 0 ? totalResponseTimeDays / responsesWithTime : null;

    return {
      total: applications.length,
      byStatus,
      byPlatform,
      successRate,
      averageResponseTimeDays,
      thisWeek,
      thisMonth,
    };
  }

  /**
   * Get application timeline for the past N days
   */
  async getTimeline(days: number = 30, profileId?: string): Promise<TimelineEntry[]> {
    const applications = await this.getAllApplications(profileId);
    const timeline: TimelineEntry[] = [];

    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayApps = applications.filter(app => {
        const appDate = new Date(app.appliedAt || app.createdAt);
        return appDate.toISOString().split('T')[0] === dateStr;
      });

      const dayResponses = applications.filter(app => {
        if (!app.updatedAt || app.status === 'draft' || app.status === 'submitted') {
          return false;
        }
        const updateDate = new Date(app.updatedAt);
        return updateDate.toISOString().split('T')[0] === dateStr;
      });

      timeline.push({
        date: dateStr,
        applications: dayApps.length,
        responses: dayResponses.length,
        interviews: dayApps.filter(a => a.status === 'interview').length,
        offers: dayApps.filter(a => a.status === 'offer').length,
      });
    }

    return timeline;
  }

  /**
   * Get performance metrics by platform
   */
  async getPlatformMetrics(profileId?: string): Promise<PlatformMetrics[]> {
    const applications = await this.getAllApplications(profileId);
    const platforms: JobPlatform[] = [
      'linkedin',
      'indeed',
      'glassdoor',
      'ziprecruiter',
      'monster',
      'dice',
      'angellist',
      'wellfound',
      'builtin',
      'levels-fyi',
      'company-website',
      'other',
    ];
    const metrics: PlatformMetrics[] = [];

    for (const platform of platforms) {
      const platformApps = applications.filter(a => a.platform === platform);
      if (platformApps.length === 0) continue;

      const submitted = platformApps.filter(
        a => a.status !== 'draft' && a.status !== 'withdrawn'
      );

      const responses = platformApps.filter(a => {
        const responseStatuses: ApplicationStatus[] = [
          'in-review',
          'viewed',
          'interview',
          'offer',
          'rejected',
        ];
        return responseStatuses.includes(a.status);
      });

      const interviews = platformApps.filter(a => a.status === 'interview');

      const offers = platformApps.filter(a => a.status === 'offer');

      // Calculate average response time
      let totalDays = 0;
      let count = 0;
      for (const app of responses) {
        if (app.appliedAt && app.updatedAt) {
          const applied = new Date(app.appliedAt);
          const updated = new Date(app.updatedAt);
          const daysDiff = Math.floor(
            (updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff >= 0) {
            totalDays += daysDiff;
            count++;
          }
        }
      }

      metrics.push({
        platform,
        applications: platformApps.length,
        responses: responses.length,
        interviews: interviews.length,
        offers: offers.length,
        responseRate: submitted.length > 0 ? (responses.length / submitted.length) * 100 : 0,
        interviewRate: submitted.length > 0 ? (interviews.length / submitted.length) * 100 : 0,
        offerRate: submitted.length > 0 ? (offers.length / submitted.length) * 100 : 0,
        averageResponseDays: count > 0 ? totalDays / count : null,
      });
    }

    return metrics;
  }

  /**
   * Get top performing job titles
   */
  async getTopJobTitles(limit: number = 10, profileId?: string): Promise<Array<{ title: string; count: number; interviews: number }>> {
    const applications = await this.getAllApplications(profileId);
    const titleStats = new Map<string, { count: number; interviews: number }>();

    for (const app of applications) {
      const job = this.jobRepo.findById(app.jobId);
      if (!job) continue;

      const title = job.title.toLowerCase().trim();
      const current = titleStats.get(title) || { count: 0, interviews: 0 };
      current.count++;

      if (app.status === 'interview') {
        current.interviews++;
      }

      titleStats.set(title, current);
    }

    return Array.from(titleStats.entries())
      .map(([title, stats]) => ({ title, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get application funnel metrics
   */
  async getFunnelMetrics(profileId?: string): Promise<{
    applied: number;
    reviewed: number;
    interviewed: number;
    offered: number;
    accepted: number;
    conversionRates: {
      appliedToReviewed: number;
      reviewedToInterviewed: number;
      interviewedToOffered: number;
      offeredToAccepted: number;
    };
  }> {
    const applications = await this.getAllApplications(profileId);

    const applied = applications.filter(
      a => a.status !== 'draft' && a.status !== 'withdrawn'
    ).length;

    const reviewed = applications.filter(a => {
      const reviewedStatuses: ApplicationStatus[] = [
        'in-review',
        'viewed',
        'interview',
        'offer',
        'rejected',
      ];
      return reviewedStatuses.includes(a.status);
    }).length;

    const interviewed = applications.filter(a => {
      const interviewedStatuses: ApplicationStatus[] = ['interview', 'offer'];
      return interviewedStatuses.includes(a.status);
    }).length;

    const offered = applications.filter(a => a.status === 'offer').length;

    // For accepted, we'll count offers as accepted since there's no separate 'accepted' status
    const accepted = offered;

    return {
      applied,
      reviewed,
      interviewed,
      offered,
      accepted,
      conversionRates: {
        appliedToReviewed: applied > 0 ? (reviewed / applied) * 100 : 0,
        reviewedToInterviewed: reviewed > 0 ? (interviewed / reviewed) * 100 : 0,
        interviewedToOffered: interviewed > 0 ? (offered / interviewed) * 100 : 0,
        offeredToAccepted: offered > 0 ? (accepted / offered) * 100 : 0,
      },
    };
  }
}
