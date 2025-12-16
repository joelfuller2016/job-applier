import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApplicationTracker } from '../tracker.js';
import { ApplicationAnalytics } from '../analytics.js';
import { initDatabase, closeDatabase } from '@job-applier/database';
import { profileRepository, jobRepository, applicationRepository } from '@job-applier/database';
import type { JobListing, UserProfile } from '@job-applier/core';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

describe('Application Tracker', () => {
  let testDbPath: string;
  let tracker: ApplicationTracker;
  let testJob: JobListing;
  let testProfileId: string;

  beforeEach(async () => {
    testDbPath = path.join(process.cwd(), `test-tracker-${randomUUID()}.sqlite`);
    await initDatabase({ path: testDbPath });

    tracker = new ApplicationTracker();

    // Create test profile
    const profile = profileRepository.create({
      firstName: 'Test',
      lastName: 'User',
      contact: {
        email: 'test@example.com',
        phone: '555-0100',
      },
      skills: ['JavaScript', 'TypeScript'],
      experience: [],
      education: [],
      preferences: {
        jobTypes: ['full-time'],
        locations: ['Remote'],
        salaryMin: 80000,
      },
    });
    testProfileId = profile.id;

    // Create test job
    testJob = jobRepository.upsert({
      platform: 'linkedin',
      externalId: 'test-job-1',
      url: 'https://linkedin.com/jobs/test',
      title: 'Software Engineer',
      company: { name: 'Test Corp' },
      location: 'Remote',
      description: 'Test job description',
      requirements: ['JavaScript', 'TypeScript'],
      responsibilities: ['Write code', 'Review PRs'],
      requiredSkills: ['JavaScript'],
      preferredSkills: ['TypeScript'],
      employmentType: 'full-time',
      experienceLevel: 'mid',
      workArrangement: 'remote',
      easyApply: true,
    });
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('ApplicationTracker', () => {
    it('should create a new application', async () => {
      const application = await tracker.createApplication(testJob, testProfileId);

      expect(application.id).toBeDefined();
      expect(application.jobId).toBe(testJob.id);
      expect(application.profileId).toBe(testProfileId);
      expect(application.status).toBe('draft');
    });

    it('should mark application as submitted', async () => {
      const application = await tracker.createApplication(testJob, testProfileId);
      const updated = await tracker.markSubmitted(application.id);

      expect(updated?.status).toBe('submitted');
      expect(updated?.appliedAt).toBeDefined();
    });

    it('should update application status', async () => {
      const application = await tracker.createApplication(testJob, testProfileId);
      await tracker.markSubmitted(application.id);

      const updated = await tracker.updateStatus(
        application.id,
        'in-review',
        'Received confirmation email'
      );

      expect(updated?.status).toBe('in-review');
      expect(updated?.events).toBeDefined();
      // Check that a status-change event was recorded
      expect(updated?.events?.some(e => e.type === 'status-change' && e.description?.includes('in-review'))).toBe(true);
    });

    it('should track interview scheduled', async () => {
      const application = await tracker.createApplication(testJob, testProfileId);
      await tracker.markSubmitted(application.id);

      const interviewDate = new Date();
      interviewDate.setDate(interviewDate.getDate() + 7);

      const updated = await tracker.updateStatus(
        application.id,
        'interview',
        `Interview scheduled for ${interviewDate.toISOString()}`
      );

      expect(updated?.status).toBe('interview');
    });

    it('should record failed attempt', async () => {
      const application = await tracker.createApplication(testJob, testProfileId);

      const failed = await tracker.recordFailedAttempt(
        application.id,
        'Form validation error: Missing phone number'
      );

      expect(failed?.status).toBe('error');
      // The error details are stored in events with status-change type
      expect(failed?.events).toBeDefined();
      expect(failed?.events && failed.events.length > 0).toBe(true);
    });

    it('should get pending follow-ups', async () => {
      const app1 = await tracker.createApplication(testJob, testProfileId);
      await tracker.markSubmitted(app1.id);

      // Create another job and application
      const job2 = jobRepository.upsert({
        platform: 'indeed',
        externalId: 'test-job-2',
        url: 'https://indeed.com/jobs/test',
        title: 'Developer',
        company: { name: 'Another Corp' },
        location: 'NYC',
        description: 'Another job',
        requirements: ['JavaScript'],
        responsibilities: ['Develop features'],
        requiredSkills: ['JavaScript'],
        preferredSkills: ['Node.js'],
        employmentType: 'full-time',
        experienceLevel: 'mid',
        workArrangement: 'hybrid',
        easyApply: true,
      });

      const app2 = await tracker.createApplication(job2, testProfileId);
      await tracker.markSubmitted(app2.id);

      // The tracker uses in-memory reminders, so we need to check the follow-up system works
      const followUps = await tracker.getApplicationsNeedingFollowUp();
      // Follow-ups are scheduled for 7 days after submission, so there should be none immediately
      expect(followUps.length).toBe(0);
    });

    it('should check if application already exists', async () => {
      await tracker.createApplication(testJob, testProfileId);

      // Check if already applied
      const hasApplied = applicationRepository.hasApplied(testProfileId, testJob.id);
      expect(hasApplied).toBe(true);
    });
  });
});

describe('Application Analytics', () => {
  let testDbPath: string;
  let analytics: ApplicationAnalytics;
  let tracker: ApplicationTracker;
  let testProfileId: string;

  beforeEach(async () => {
    testDbPath = path.join(process.cwd(), `test-analytics-${randomUUID()}.sqlite`);
    await initDatabase({ path: testDbPath });

    tracker = new ApplicationTracker();
    analytics = new ApplicationAnalytics();

    // Create test profile
    const profile = profileRepository.create({
      firstName: 'Analyst',
      lastName: 'Test',
      contact: {
        email: 'analyst@test.com',
        phone: '555-0200',
      },
      skills: [],
      experience: [],
      education: [],
      preferences: {
        jobTypes: ['full-time'],
        locations: ['Remote'],
        salaryMin: 70000,
      },
    });
    testProfileId = profile.id;
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  async function createTestApplications() {
    // Create jobs and applications with various statuses
    const statuses: ('submitted' | 'in-review' | 'interview' | 'rejected' | 'offer')[] = [
      'submitted',
      'in-review',
      'interview',
      'rejected',
      'offer',
    ];

    for (let i = 0; i < statuses.length; i++) {
      const job = jobRepository.upsert({
        platform: i % 2 === 0 ? 'linkedin' : 'indeed',
        externalId: `analytics-job-${i}`,
        url: `https://example.com/jobs/${i}`,
        title: i < 2 ? 'Software Engineer' : 'Product Manager',
        company: { name: `Company ${i}` },
        location: 'Remote',
        description: 'Job description',
        requirements: ['JavaScript'],
        responsibilities: ['Build features'],
        requiredSkills: ['JavaScript'],
        preferredSkills: ['React'],
        employmentType: 'full-time',
        experienceLevel: 'mid',
        workArrangement: 'remote',
        easyApply: true,
      });

      const app = await tracker.createApplication(job, testProfileId);
      await tracker.markSubmitted(app.id);

      // Only update status if it's not submitted (since it's already submitted)
      if (statuses[i] !== 'submitted') {
        await tracker.updateStatus(app.id, statuses[i]);
      }
    }
  }

  it('should calculate overall stats', async () => {
    await createTestApplications();

    const stats = await analytics.getStats();

    expect(stats.total).toBe(5);
    expect(stats.byStatus.submitted).toBeDefined();
    expect(stats.byStatus.rejected).toBeDefined();
    expect(stats.byStatus.offer).toBeDefined();
  });

  it('should calculate success rate', async () => {
    await createTestApplications();

    const stats = await analytics.getStats();

    // Success = offer / submitted * 100
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
    expect(stats.successRate).toBeLessThanOrEqual(100);
  });

  it('should get platform metrics', async () => {
    await createTestApplications();

    const metrics = await analytics.getPlatformMetrics();

    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics.some(m => m.platform === 'linkedin')).toBe(true);
    expect(metrics.some(m => m.platform === 'indeed')).toBe(true);
  });

  it('should get funnel metrics', async () => {
    await createTestApplications();

    const funnel = await analytics.getFunnelMetrics();

    expect(funnel.applied).toBeGreaterThan(0);
    expect(funnel.reviewed).toBeDefined();
    expect(funnel.interviewed).toBeDefined();
    expect(funnel.offered).toBeDefined();
    expect(funnel.conversionRates).toBeDefined();
  });

  it('should get timeline for specified days', async () => {
    await createTestApplications();

    const timeline = await analytics.getTimeline(30);

    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeLessThanOrEqual(30);
  });

  it('should get top job titles', async () => {
    await createTestApplications();

    const topTitles = await analytics.getTopJobTitles(5);

    expect(Array.isArray(topTitles)).toBe(true);
    topTitles.forEach(title => {
      expect(title.title).toBeDefined();
      expect(title.count).toBeGreaterThan(0);
    });
  });

  it('should calculate applications this week', async () => {
    await createTestApplications();

    const stats = await analytics.getStats();

    expect(stats.thisWeek).toBeGreaterThanOrEqual(0);
  });

  it('should calculate applications this month', async () => {
    await createTestApplications();

    const stats = await analytics.getStats();

    expect(stats.thisMonth).toBeGreaterThanOrEqual(0);
    expect(stats.thisMonth).toBeGreaterThanOrEqual(stats.thisWeek);
  });
});
