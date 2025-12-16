import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDatabase, closeDatabase } from '../connection.js';
import { profileRepository } from '../repositories/profile-repository.js';
import { jobRepository } from '../repositories/job-repository.js';
import { applicationRepository } from '../repositories/application-repository.js';
import { matchRepository } from '../repositories/match-repository.js';
import type { UserProfile, JobListing, JobApplication, JobMatch } from '@job-applier/core';
import { randomUUID } from 'crypto';

// Helper to create minimal valid profile data
function createMinimalProfile(overrides: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    firstName: 'Test',
    lastName: 'User',
    contact: { email: 'test@example.com' },
    skills: [],
    experience: [],
    education: [],
    preferences: {
      targetRoles: ['Developer'],
      preferredLocations: ['Remote'],
      remotePreference: 'flexible',
      willingToRelocate: false,
      experienceLevel: 'mid',
    },
    ...overrides,
  };
}

// Helper to create minimal valid match data
function createMinimalMatch(jobId: string, profileId: string, overrides: Partial<Omit<JobMatch, 'id' | 'analyzedAt'>> = {}): Omit<JobMatch, 'id' | 'analyzedAt'> {
  return {
    jobId,
    profileId,
    overallScore: 75,
    skillScore: 75,
    experienceScore: 75,
    locationScore: 75,
    salaryScore: 75,
    skillMatches: [
      { skill: 'TypeScript', required: true, userHas: true, proficiencyMatch: 'exact', weight: 1 },
    ],
    experienceMatch: {
      requiredYears: 5,
      userYears: 4,
      relevantRoles: ['Engineer'],
      industryMatch: true,
      seniorityMatch: 'exact',
    },
    locationMatch: {
      jobLocation: 'Remote',
      userLocation: 'San Francisco',
      remoteCompatible: true,
      willingToRelocate: false,
      distance: 0,
      matchType: 'remote',
    },
    strengths: ['Good technical match'],
    gaps: [],
    recommendations: ['Apply confidently'],
    fitCategory: 'good',
    confidence: 0.75,
    suggestedApproach: 'Apply with standard resume',
    customizationTips: [],
    ...overrides,
  };
}

// Helper to create minimal valid application data
function createMinimalApplication(jobId: string, profileId: string, overrides: Partial<Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    jobId,
    profileId,
    platform: 'linkedin',
    status: 'draft',
    method: 'easy-apply',
    responseReceived: false,
    followUpDates: [],
    ...overrides,
  };
}

describe('Database Repositories', () => {
  beforeAll(async () => {
    await initDatabase({ path: ':memory:' });
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('ProfileRepository', () => {
    let testProfileId: string;

    beforeEach(() => {
      testProfileId = randomUUID();
    });

    it('should create and retrieve a profile', () => {
      const profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: 'John',
        lastName: 'Doe',
        headline: 'Senior Software Engineer',
        summary: 'Experienced software engineer with expertise in TypeScript and Node.js',
        contact: {
          email: 'john.doe@example.com',
          phone: '+1234567890',
          location: 'San Francisco, CA',
          linkedin: 'https://linkedin.com/in/johndoe',
        },
        skills: [
          { name: 'TypeScript', category: 'technical', proficiency: 'expert', yearsOfExperience: 5 },
          { name: 'Node.js', category: 'framework', proficiency: 'advanced', yearsOfExperience: 5 },
          { name: 'React', category: 'framework', proficiency: 'advanced', yearsOfExperience: 4 },
          { name: 'PostgreSQL', category: 'technical', proficiency: 'intermediate', yearsOfExperience: 3 },
        ],
        experience: [
          {
            id: randomUUID(),
            company: 'Tech Corp',
            title: 'Senior Engineer',
            startDate: '2020-01',
            endDate: '2023-12',
            description: 'Built scalable systems',
            highlights: ['Led team of 5', 'Reduced latency by 50%'],
            skills: ['TypeScript', 'Node.js', 'React'],
          },
        ],
        education: [
          {
            id: randomUUID(),
            institution: 'MIT',
            degree: 'BS Computer Science',
            field: 'Computer Science',
            startDate: '2015',
            endDate: '2019',
          },
        ],
        certifications: [
          {
            id: randomUUID(),
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon',
            issueDate: '2021-06',
            expirationDate: null,
          },
        ],
        projects: [],
        preferences: {
          targetRoles: ['Senior Software Engineer', 'Staff Engineer'],
          preferredLocations: ['San Francisco', 'Remote'],
          remotePreference: 'flexible',
          willingToRelocate: false,
          minSalary: 150000,
          experienceLevel: 'senior',
        },
      };

      const created = profileRepository.create(profileData);
      expect(created.id).toBeDefined();
      expect(created.firstName).toBe('John');
      expect(created.lastName).toBe('Doe');
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      const found = profileRepository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.firstName).toBe('John');
      expect(found?.lastName).toBe('Doe');
      expect(found?.skills.some(s => s.name === 'TypeScript')).toBe(true);
      expect(found?.contact.email).toBe('john.doe@example.com');
    });

    it('should update a profile', () => {
      const profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: 'Jane',
        lastName: 'Smith',
        contact: {
          email: 'jane@example.com',
          location: 'New York',
        },
        skills: [{ name: 'Python', category: 'technical', proficiency: 'advanced' }],
        experience: [],
        education: [],
        preferences: {
          targetRoles: ['Developer'],
          preferredLocations: ['New York'],
          remotePreference: 'onsite',
          willingToRelocate: false,
          experienceLevel: 'mid',
        },
      };

      const created = profileRepository.create(profileData);

      const updated = profileRepository.update(created.id, {
        skills: [
          { name: 'Python', category: 'technical', proficiency: 'advanced' },
          { name: 'Django', category: 'framework', proficiency: 'intermediate' },
          { name: 'PostgreSQL', category: 'technical', proficiency: 'intermediate' },
        ],
        headline: 'Python Developer',
      });

      expect(updated).not.toBeNull();
      expect(updated?.skills).toHaveLength(3);
      expect(updated?.skills.some(s => s.name === 'Django')).toBe(true);
      expect(updated?.headline).toBe('Python Developer');
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('should find all profiles', () => {
      const profile1Data = createMinimalProfile({
        firstName: 'User1',
        contact: { email: 'user1@test.com', location: 'Boston' },
        skills: [{ name: 'JavaScript', category: 'technical', proficiency: 'intermediate' }],
      });

      const profile2Data = createMinimalProfile({
        firstName: 'User2',
        contact: { email: 'user2@test.com', location: 'Seattle' },
        skills: [{ name: 'Go', category: 'technical', proficiency: 'advanced' }],
      });

      profileRepository.create(profile1Data);
      profileRepository.create(profile2Data);

      const all = profileRepository.findAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.some(p => p.firstName === 'User1')).toBe(true);
      expect(all.some(p => p.firstName === 'User2')).toBe(true);
    });

    it('should delete a profile', () => {
      const profileData = createMinimalProfile({
        firstName: 'Delete',
        lastName: 'Me',
        contact: { email: 'delete@test.com', location: 'Austin' },
      });

      const created = profileRepository.create(profileData);
      const deleted = profileRepository.delete(created.id);
      expect(deleted).toBe(true);

      const found = profileRepository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should get default profile', () => {
      const profileData = createMinimalProfile({
        firstName: 'Default',
        contact: { email: 'default@test.com', location: 'Denver' },
      });

      profileRepository.create(profileData);
      const defaultProfile = profileRepository.getDefault();
      expect(defaultProfile).not.toBeNull();
      expect(defaultProfile?.firstName).toBeDefined();
    });
  });

  describe('JobRepository', () => {
    it('should create and retrieve a job', () => {
      const jobData: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: 'linkedin-123',
        url: 'https://linkedin.com/jobs/123',
        title: 'Senior Software Engineer',
        company: {
          name: 'Google',
          url: 'https://google.com',
          industry: 'Technology',
          size: '10000+',
        },
        location: 'Mountain View, CA',
        description: 'Build amazing products at scale',
        requirements: ['5+ years experience', 'CS degree', 'Strong coding skills'],
        responsibilities: ['Design systems', 'Write code', 'Mentor team'],
        requiredSkills: ['Python', 'Go', 'Kubernetes'],
        preferredSkills: ['Machine Learning', 'Distributed Systems'],
        employmentType: 'full-time',
        experienceLevel: 'senior',
        workArrangement: 'hybrid',
        salary: {
          min: 150000,
          max: 250000,
          currency: 'USD',
        },
        benefits: ['Health insurance', '401k', 'Stock options'],
        easyApply: true,
        postedAt: new Date().toISOString(),
      };

      const created = jobRepository.upsert(jobData);
      expect(created.id).toBeDefined();
      expect(created.title).toBe('Senior Software Engineer');
      expect(created.discoveredAt).toBeDefined();

      const found = jobRepository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Senior Software Engineer');
      expect(found?.company.name).toBe('Google');
      expect(found?.salary?.min).toBe(150000);
      expect(found?.easyApply).toBe(true);
    });

    it('should find job by external ID', () => {
      const jobData: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: 'unique-external-123',
        url: 'https://linkedin.com/jobs/unique',
        title: 'Unique Job',
        company: { name: 'Unique Co' },
        location: 'Boston',
        description: 'Unique description',
        requirements: [],
        requiredSkills: [],
        easyApply: false,
      };

      jobRepository.upsert(jobData);

      const found = jobRepository.findByExternalId('linkedin', 'unique-external-123');
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Unique Job');
    });

    it('should upsert (update existing job)', () => {
      const jobData: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'indeed',
        externalId: 'indeed-upsert-test',
        url: 'https://indeed.com/jobs/upsert',
        title: 'Original Title',
        company: { name: 'Test Company' },
        location: 'Chicago',
        description: 'Original description',
        requirements: [],
        requiredSkills: ['Java'],
        easyApply: true,
      };

      const first = jobRepository.upsert(jobData);
      expect(first.title).toBe('Original Title');

      // Upsert with updated data
      const updatedData: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        ...jobData,
        title: 'Updated Title',
        requiredSkills: ['Java', 'Spring'],
      };

      const second = jobRepository.upsert(updatedData);
      expect(second.id).toBe(first.id); // Same ID
      expect(second.title).toBe('Updated Title');
      expect(second.requiredSkills).toContain('Spring');
    });

    it('should search jobs by keywords', () => {
      const job1: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'indeed',
        externalId: 'search-test-1',
        url: 'https://indeed.com/jobs/1',
        title: 'Machine Learning Engineer',
        company: { name: 'AI Corp' },
        location: 'Seattle',
        description: 'ML and AI work',
        requirements: [],
        requiredSkills: ['Python', 'TensorFlow'],
        easyApply: false,
      };

      const job2: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: 'search-test-2',
        url: 'https://linkedin.com/jobs/2',
        title: 'Frontend Developer',
        company: { name: 'Web Co' },
        location: 'Austin',
        description: 'Build React apps',
        requirements: [],
        requiredSkills: ['React', 'TypeScript'],
        easyApply: true,
      };

      jobRepository.upsert(job1);
      jobRepository.upsert(job2);

      const mlResults = jobRepository.search({ keywords: ['Machine Learning'] });
      expect(mlResults.some(j => j.title.includes('Machine Learning'))).toBe(true);

      const frontendResults = jobRepository.search({ keywords: ['Frontend'] });
      expect(frontendResults.some(j => j.title.includes('Frontend'))).toBe(true);
    });

    it('should search jobs with filters', () => {
      const remoteJob: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: 'remote-job',
        url: 'https://linkedin.com/jobs/remote',
        title: 'Remote Engineer',
        company: { name: 'Remote Co' },
        location: 'Remote',
        description: 'Work from anywhere',
        requirements: [],
        requiredSkills: ['Node.js'],
        workArrangement: 'remote',
        employmentType: 'full-time',
        easyApply: true,
      };

      jobRepository.upsert(remoteJob);

      const results = jobRepository.search({
        remote: true,
        employmentType: 'full-time',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(j => j.workArrangement === 'remote')).toBe(true);
    });

    it('should get recent jobs', () => {
      const job: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'indeed',
        externalId: 'recent-test',
        url: 'https://indeed.com/jobs/recent',
        title: 'Recent Job',
        company: { name: 'Recent Co' },
        location: 'Portland',
        description: 'Recently posted',
        requirements: [],
        requiredSkills: ['Ruby'],
        easyApply: false,
      };

      jobRepository.upsert(job);

      const recent = jobRepository.getRecent(10);
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[0]).toBeDefined();
    });

    it('should count jobs by platform', () => {
      const linkedinJob: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: 'count-li',
        url: 'https://linkedin.com/jobs/count',
        title: 'LinkedIn Job',
        company: { name: 'Co' },
        location: 'NYC',
        description: 'Test',
        requirements: [],
        requiredSkills: [],
        easyApply: false,
      };

      const indeedJob: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'indeed',
        externalId: 'count-ind',
        url: 'https://indeed.com/jobs/count',
        title: 'Indeed Job',
        company: { name: 'Co' },
        location: 'LA',
        description: 'Test',
        requirements: [],
        requiredSkills: [],
        easyApply: false,
      };

      jobRepository.upsert(linkedinJob);
      jobRepository.upsert(indeedJob);

      const counts = jobRepository.countByPlatform();
      expect(counts.linkedin).toBeGreaterThan(0);
      expect(counts.indeed).toBeGreaterThan(0);
    });

    it('should delete a job', () => {
      const jobData: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: 'delete-test',
        url: 'https://linkedin.com/jobs/delete',
        title: 'Delete Me',
        company: { name: 'Delete Co' },
        location: 'Nowhere',
        description: 'To be deleted',
        requirements: [],
        requiredSkills: [],
        easyApply: false,
      };

      const created = jobRepository.upsert(jobData);
      const deleted = jobRepository.delete(created.id);
      expect(deleted).toBe(true);

      const found = jobRepository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('ApplicationRepository', () => {
    let testJobId: string;
    let testProfileId: string;

    beforeEach(() => {
      // Create test profile
      const profileData = createMinimalProfile({
        firstName: 'Applicant',
        lastName: 'Test',
        contact: { email: 'applicant@test.com', location: 'Remote' },
        skills: [{ name: 'Testing', category: 'technical', proficiency: 'advanced' }],
        preferences: {
          targetRoles: ['Tester'],
          preferredLocations: ['Remote'],
          remotePreference: 'remote-only',
          willingToRelocate: false,
          experienceLevel: 'mid',
        },
      });
      const profile = profileRepository.create(profileData);
      testProfileId = profile.id;

      // Create test job
      const jobData: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: `app-test-job-${randomUUID()}`,
        url: 'https://linkedin.com/jobs/app-test',
        title: 'Test Position',
        company: { name: 'Test Company' },
        location: 'Remote',
        description: 'Test job description',
        requirements: [],
        requiredSkills: ['Testing'],
        easyApply: true,
      };
      const job = jobRepository.upsert(jobData);
      testJobId = job.id;
    });

    it('should create and retrieve an application', () => {
      const applicationData = createMinimalApplication(testJobId, testProfileId);

      const created = applicationRepository.create(applicationData);
      expect(created.id).toBeDefined();
      expect(created.status).toBe('draft');

      const found = applicationRepository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.status).toBe('draft');
      expect(found?.jobId).toBe(testJobId);
      expect(found?.profileId).toBe(testProfileId);
      expect(found?.events).toBeDefined();
      expect(found?.events?.length).toBeGreaterThan(0);
    });

    it('should update application status', () => {
      const applicationData = createMinimalApplication(testJobId, testProfileId);

      const created = applicationRepository.create(applicationData);

      const updated = applicationRepository.updateStatus(created.id, 'submitted', 'Application submitted via API');
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('submitted');

      // Check that event was created
      const found = applicationRepository.findById(created.id);
      expect(found?.events?.some(e => e.type === 'status-change')).toBe(true);
    });

    it('should mark application as submitted', () => {
      const applicationData = createMinimalApplication(testJobId, testProfileId);

      const created = applicationRepository.create(applicationData);

      const submitted = applicationRepository.markSubmitted(created.id, 'platform-app-123');
      expect(submitted).not.toBeNull();
      expect(submitted?.status).toBe('submitted');
      expect(submitted?.appliedAt).toBeDefined();
      expect(submitted?.platformApplicationId).toBe('platform-app-123');
    });

    it('should find applications by status', () => {
      const app1Data = createMinimalApplication(testJobId, testProfileId, {
        status: 'submitted',
        appliedAt: new Date().toISOString(),
      });

      const app2Data = createMinimalApplication(testJobId, testProfileId, {
        platform: 'indeed',
        status: 'rejected',
        responseReceived: true,
        responseDate: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
      });

      const app1 = applicationRepository.create(app1Data);
      const app2 = applicationRepository.create(app2Data);

      const submitted = applicationRepository.findByStatus('submitted');
      const rejected = applicationRepository.findByStatus('rejected');

      expect(submitted.some(a => a.id === app1.id)).toBe(true);
      expect(rejected.some(a => a.id === app2.id)).toBe(true);
    });

    it('should find applications by profile', () => {
      const app1Data = createMinimalApplication(testJobId, testProfileId, {
        status: 'submitted',
      });

      const app2Data = createMinimalApplication(testJobId, testProfileId, {
        platform: 'indeed',
        status: 'interview',
        responseReceived: true,
      });

      const app1 = applicationRepository.create(app1Data);
      const app2 = applicationRepository.create(app2Data);

      const applications = applicationRepository.findByProfile(testProfileId);
      expect(applications.length).toBeGreaterThanOrEqual(2);
      expect(applications.some(a => a.id === app1.id)).toBe(true);
      expect(applications.some(a => a.id === app2.id)).toBe(true);
    });

    it('should add events to application', () => {
      const applicationData = createMinimalApplication(testJobId, testProfileId, {
        status: 'submitted',
      });

      const application = applicationRepository.create(applicationData);

      const event = applicationRepository.addEvent(application.id, {
        type: 'interview-scheduled',
        description: 'Phone screen scheduled for next week',
        metadata: { interviewType: 'phone', date: '2024-12-20' },
      });

      expect(event.id).toBeDefined();
      expect(event.type).toBe('interview-scheduled');
      expect(event.applicationId).toBe(application.id);

      const found = applicationRepository.findById(application.id);
      expect(found?.events?.some(e => e.type === 'interview-scheduled')).toBe(true);
    });

    it('should check if already applied', () => {
      const applicationData = createMinimalApplication(testJobId, testProfileId, {
        status: 'submitted',
      });

      applicationRepository.create(applicationData);

      const hasApplied = applicationRepository.hasApplied(testProfileId, testJobId);
      expect(hasApplied).toBe(true);

      const hasNotApplied = applicationRepository.hasApplied(testProfileId, randomUUID());
      expect(hasNotApplied).toBe(false);
    });

    it('should get application statistics', () => {
      const app1Data = createMinimalApplication(testJobId, testProfileId, {
        status: 'submitted',
        appliedAt: new Date().toISOString(),
      });

      const app2Data = createMinimalApplication(testJobId, testProfileId, {
        platform: 'indeed',
        status: 'interview',
        responseReceived: true,
        responseDate: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
      });

      applicationRepository.create(app1Data);
      applicationRepository.create(app2Data);

      const stats = applicationRepository.getStats(testProfileId);
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byPlatform).toBeDefined();
      expect(stats.responseRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('MatchRepository', () => {
    let testJobId: string;
    let testProfileId: string;

    beforeEach(() => {
      // Create test profile
      const profileData = createMinimalProfile({
        firstName: 'Match',
        lastName: 'Tester',
        contact: { email: 'match@test.com', location: 'SF' },
        skills: [
          { name: 'TypeScript', category: 'technical', proficiency: 'expert' },
          { name: 'React', category: 'framework', proficiency: 'advanced' },
          { name: 'Node.js', category: 'framework', proficiency: 'advanced' },
        ],
        preferences: {
          targetRoles: ['Engineer'],
          preferredLocations: ['SF'],
          remotePreference: 'flexible',
          willingToRelocate: false,
          experienceLevel: 'senior',
        },
      });
      const profile = profileRepository.create(profileData);
      testProfileId = profile.id;

      // Create test job
      const jobData: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'> = {
        platform: 'linkedin',
        externalId: `match-test-job-${randomUUID()}`,
        url: 'https://linkedin.com/jobs/match-test',
        title: 'Software Engineer',
        company: { name: 'Match Co' },
        location: 'San Francisco',
        description: 'Build great software',
        requirements: [],
        requiredSkills: ['TypeScript', 'React'],
        easyApply: true,
      };
      const job = jobRepository.upsert(jobData);
      testJobId = job.id;
    });

    it('should save and retrieve a match', () => {
      const matchData = createMinimalMatch(testJobId, testProfileId, {
        overallScore: 85,
        skillScore: 90,
        experienceScore: 80,
        locationScore: 100,
        salaryScore: 75,
        skillMatches: [
          { skill: 'TypeScript', required: true, userHas: true, proficiencyMatch: 'exact', weight: 1 },
          { skill: 'React', required: true, userHas: true, proficiencyMatch: 'exact', weight: 1 },
          { skill: 'AWS', required: false, userHas: false, proficiencyMatch: 'none', weight: 0.5 },
        ],
        strengths: ['Strong technical skills', 'Good culture fit'],
        gaps: ['AWS experience'],
        recommendations: ['Highlight Node.js projects', 'Emphasize learning ability'],
        fitCategory: 'excellent',
        confidence: 0.85,
        suggestedApproach: 'Apply with tailored cover letter',
        customizationTips: ['Mention cloud learning goals', 'Show Node.js expertise'],
      });

      const created = matchRepository.save(matchData);
      expect(created.id).toBeDefined();
      expect(created.analyzedAt).toBeDefined();
      expect(created.overallScore).toBe(85);

      const found = matchRepository.findByJobAndProfile(testJobId, testProfileId);
      expect(found).not.toBeNull();
      expect(found?.overallScore).toBe(85);
      expect(found?.fitCategory).toBe('excellent');
      expect(found?.skillMatches.some(s => s.skill === 'TypeScript')).toBe(true);
    });

    it('should upsert matches (update existing)', () => {
      const matchData = createMinimalMatch(testJobId, testProfileId, {
        overallScore: 70,
        skillScore: 75,
        experienceScore: 65,
        fitCategory: 'moderate',
        confidence: 0.7,
      });

      const first = matchRepository.save(matchData);
      expect(first.overallScore).toBe(70);

      // Update with better match
      const updatedData = createMinimalMatch(testJobId, testProfileId, {
        overallScore: 85,
        skillScore: 90,
        skillMatches: [
          { skill: 'TypeScript', required: true, userHas: true, proficiencyMatch: 'exact', weight: 1 },
          { skill: 'React', required: true, userHas: true, proficiencyMatch: 'exact', weight: 1 },
        ],
        fitCategory: 'excellent',
      });

      const second = matchRepository.save(updatedData);

      // Should update the existing match
      const found = matchRepository.findByJobAndProfile(testJobId, testProfileId);
      expect(found?.overallScore).toBe(85);
      expect(found?.fitCategory).toBe('excellent');
    });

    it('should get top matches', () => {
      // Create multiple matches with different scores
      const match1 = createMinimalMatch(testJobId, testProfileId, {
        overallScore: 95,
        skillScore: 95,
        experienceScore: 95,
        locationScore: 95,
        fitCategory: 'excellent',
        confidence: 0.95,
        strengths: ['Excellent match'],
      });

      matchRepository.save(match1);

      const topMatches = matchRepository.getTopMatches(testProfileId, 10, 50);
      expect(topMatches.length).toBeGreaterThan(0);
      expect(topMatches[0].overallScore).toBeGreaterThanOrEqual(50);
      // Should be sorted by score descending
      if (topMatches.length > 1) {
        expect(topMatches[0].overallScore).toBeGreaterThanOrEqual(topMatches[1].overallScore);
      }
    });

    it('should get matches by fit category', () => {
      const excellentMatch = createMinimalMatch(testJobId, testProfileId, {
        overallScore: 90,
        skillScore: 90,
        experienceScore: 90,
        locationScore: 90,
        fitCategory: 'excellent',
        confidence: 0.9,
      });

      matchRepository.save(excellentMatch);

      const excellentMatches = matchRepository.getByFitCategory(testProfileId, 'excellent');
      expect(excellentMatches.length).toBeGreaterThan(0);
      expect(excellentMatches.every(m => m.fitCategory === 'excellent')).toBe(true);
    });

    it('should get match statistics', () => {
      const match = createMinimalMatch(testJobId, testProfileId, {
        overallScore: 80,
        skillScore: 85,
        experienceScore: 75,
        locationScore: 90,
        gaps: ['AWS', 'Kubernetes'],
        fitCategory: 'good',
        confidence: 0.8,
      });

      matchRepository.save(match);

      const stats = matchRepository.getStats(testProfileId);
      expect(stats.totalMatches).toBeGreaterThan(0);
      expect(stats.averageScore).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.topSkillGaps).toBeDefined();
      expect(stats.topSkillGaps.some(g => g.skill === 'AWS' || g.skill === 'Kubernetes')).toBe(true);
    });

    it('should delete old matches', () => {
      const match = createMinimalMatch(testJobId, testProfileId, {
        fitCategory: 'moderate',
        confidence: 0.75,
      });

      matchRepository.save(match);

      // Deleting matches older than 365 days shouldn't affect newly created matches
      const deleted = matchRepository.deleteOlderThan(365);
      expect(deleted).toBeGreaterThanOrEqual(0);

      const found = matchRepository.findByJobAndProfile(testJobId, testProfileId);
      expect(found).not.toBeNull(); // Should still exist
    });
  });
});
