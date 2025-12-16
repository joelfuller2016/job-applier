import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResumeParser, parseResumeWithClaude, type ExtractedContent } from '../index.js';
import { ConfigManager, initConfig } from '@job-applier/config';
import { generateId } from '@job-applier/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn();

  class MockAnthropicClass {
    messages = {
      create: mockCreate,
    };
  }

  // Attach mockCreate so we can access it from tests
  (MockAnthropicClass as any).mockCreate = mockCreate;

  return {
    default: MockAnthropicClass,
    APIError: class APIError extends Error {
      status?: number;
      constructor(message: string, status?: number) {
        super(message);
        this.status = status;
      }
    },
  };
});

// Get reference to the mock after import
const getMockCreate = () => (Anthropic as any).mockCreate;

/**
 * Helper function to create valid mock profile data that matches UserProfileSchema
 */
function createValidMockProfile(overrides: any = {}) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    firstName: overrides.firstName || 'John',
    lastName: overrides.lastName || 'Doe',
    headline: overrides.headline,
    summary: overrides.summary,
    contact: {
      email: overrides.email || 'john@example.com',
      ...(overrides.phone && { phone: overrides.phone }),
      ...(overrides.linkedin && { linkedin: overrides.linkedin }),
      ...(overrides.github && { github: overrides.github }),
      ...(overrides.portfolio && { portfolio: overrides.portfolio }),
      ...(overrides.location && { location: overrides.location }),
    },
    experience: (overrides.experience || []).map((exp: any) => ({
      id: generateId(),
      company: exp.company,
      title: exp.title,
      startDate: exp.startDate,
      endDate: exp.endDate !== undefined ? exp.endDate : null,
      description: exp.description || '',
      highlights: exp.highlights || [],
      skills: exp.skills || [],
      ...(exp.location && { location: exp.location }),
    })),
    education: (overrides.education || []).map((edu: any) => ({
      id: generateId(),
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate || '2000',
      endDate: edu.endDate !== undefined ? edu.endDate : null,
      ...(edu.location && { location: edu.location }),
      ...(edu.gpa && { gpa: edu.gpa }),
      ...(edu.honors && { honors: edu.honors }),
    })),
    skills: (overrides.skills || []).map((skill: any) => ({
      name: typeof skill === 'string' ? skill : skill.name,
      category: skill.category || 'technical',
      proficiency: skill.proficiency || 'intermediate',
      ...(skill.yearsOfExperience && { yearsOfExperience: skill.yearsOfExperience }),
    })),
    certifications: (overrides.certifications || []).map((cert: any) => ({
      id: generateId(),
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate !== undefined ? cert.expirationDate : null,
      ...(cert.credentialId && { credentialId: cert.credentialId }),
      ...(cert.url && { url: cert.url }),
    })),
    projects: (overrides.projects || []).map((proj: any) => ({
      id: generateId(),
      name: proj.name,
      description: proj.description,
      ...(proj.url && { url: proj.url }),
      ...(proj.repoUrl && { repoUrl: proj.repoUrl }),
      ...(proj.startDate && { startDate: proj.startDate }),
      ...(proj.endDate !== undefined && { endDate: proj.endDate }),
      technologies: proj.technologies || [],
      highlights: proj.highlights || [],
    })),
    preferences: {
      targetRoles: overrides.targetRoles || ['Software Engineer'],
      ...(overrides.targetIndustries && { targetIndustries: overrides.targetIndustries }),
      ...(overrides.minSalary && { minSalary: overrides.minSalary }),
      ...(overrides.maxSalary && { maxSalary: overrides.maxSalary }),
      preferredLocations: overrides.preferredLocations || ['Remote'],
      remotePreference: overrides.remotePreference || 'flexible',
      willingToRelocate: overrides.willingToRelocate ?? false,
      ...(overrides.excludedCompanies && { excludedCompanies: overrides.excludedCompanies }),
      ...(overrides.excludedIndustries && { excludedIndustries: overrides.excludedIndustries }),
      ...(overrides.visaRequired !== undefined && { visaRequired: overrides.visaRequired }),
      experienceLevel: overrides.experienceLevel || 'mid',
    },
    ...(overrides.resumePath && { resumePath: overrides.resumePath }),
    ...(overrides.parsedAt && { parsedAt: overrides.parsedAt }),
    createdAt: now,
    updatedAt: now,
  };
}

describe('ResumeParser', () => {
  let parser: ResumeParser;

  beforeEach(() => {
    // Reset configuration
    ConfigManager.reset();

    // Set required environment variables
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.EXA_API_KEY = 'test-exa-key';
    process.env.NODE_ENV = 'test';

    // Initialize config with a temporary path
    initConfig({
      configPath: path.join(os.tmpdir(), 'test-config.json'),
    });

    // Create parser instance
    parser = new ResumeParser();

    // Reset all mocks
    vi.clearAllMocks();
  });

  // Helper function to mock Claude API response
  function mockClaudeResponse(profile: any) {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(profile),
        },
      ],
    });

    return mockCreate;
  }

  describe('Text Extraction with parseResumeWithClaude', () => {
    it('should extract basic contact info from resume text', async () => {
      const resumeText = `
        John Doe
        john.doe@example.com
        +1 (555) 123-4567
        San Francisco, CA

        Senior Software Engineer with 8+ years of experience in full-stack development.

        SKILLS
        - TypeScript, JavaScript, Node.js
        - React, Vue.js, Angular
        - PostgreSQL, MongoDB, Redis
        - AWS, Docker, Kubernetes

        EXPERIENCE
        Senior Software Engineer at Tech Corp
        January 2019 - Present
        - Led development of microservices architecture
        - Reduced system latency by 40%

        Software Engineer at Startup Inc
        June 2015 - December 2018
        - Built full-stack web applications
        - Implemented CI/CD pipelines

        EDUCATION
        BS Computer Science - MIT - 2015
      `;

      const content: ExtractedContent = {
        text: resumeText,
        metadata: {
          fileName: 'test-resume.txt',
          fileType: 'txt',
          fileSize: resumeText.length,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock the Claude API response
      mockClaudeResponse(createValidMockProfile({
        firstName: 'John',
        lastName: 'Doe',
        headline: 'Senior Software Engineer',
        summary: 'Senior Software Engineer with 8+ years of experience in full-stack development.',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        experience: [
          {
            company: 'Tech Corp',
            title: 'Senior Software Engineer',
            startDate: '2019-01',
            endDate: null,
            description: 'Led development of microservices architecture. Reduced system latency by 40%',
            highlights: ['Led development of microservices architecture', 'Reduced system latency by 40%'],
            skills: ['microservices'],
          },
          {
            company: 'Startup Inc',
            title: 'Software Engineer',
            startDate: '2015-06',
            endDate: '2018-12',
            description: 'Built full-stack web applications. Implemented CI/CD pipelines',
            highlights: ['Built full-stack web applications', 'Implemented CI/CD pipelines'],
            skills: [],
          },
        ],
        education: [
          {
            institution: 'MIT',
            degree: 'BS',
            field: 'Computer Science',
            endDate: '2015',
          },
        ],
        skills: [
          { name: 'TypeScript', category: 'technical', proficiency: 'advanced' },
          { name: 'JavaScript', category: 'technical', proficiency: 'advanced' },
          { name: 'Node.js', category: 'technical', proficiency: 'advanced' },
          { name: 'React', category: 'technical', proficiency: 'advanced' },
        ],
        resumePath: 'test-resume.txt',
        parsedAt: content.metadata.extractedAt,
      }));

      const profile = await parseResumeWithClaude(content);

      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
      expect(profile.contact.email).toBe('john.doe@example.com');
      expect(profile.contact.phone).toContain('555');
      expect(profile.contact.location).toContain('San Francisco');
    });

    it('should extract skills from resume', async () => {
      const resumeText = `
        Jane Smith
        jane@test.com

        TECHNICAL SKILLS
        Programming: Python, JavaScript, TypeScript, Go
        Frameworks: Django, React, FastAPI
        Databases: PostgreSQL, MongoDB
        Cloud: AWS, GCP, Azure
      `;

      const content: ExtractedContent = {
        text: resumeText,
        metadata: {
          fileName: 'test-resume.txt',
          fileType: 'txt',
          fileSize: resumeText.length,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock the Claude API response
      mockClaudeResponse(createValidMockProfile({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        skills: [
          { name: 'Python', category: 'technical', proficiency: 'advanced' },
          { name: 'JavaScript', category: 'technical', proficiency: 'advanced' },
          { name: 'TypeScript', category: 'technical', proficiency: 'advanced' },
          { name: 'Go', category: 'technical', proficiency: 'intermediate' },
          { name: 'Django', category: 'framework', proficiency: 'advanced' },
          { name: 'React', category: 'framework', proficiency: 'advanced' },
          { name: 'FastAPI', category: 'framework', proficiency: 'intermediate' },
          { name: 'PostgreSQL', category: 'tool', proficiency: 'advanced' },
          { name: 'MongoDB', category: 'tool', proficiency: 'intermediate' },
          { name: 'AWS', category: 'tool', proficiency: 'advanced' },
          { name: 'GCP', category: 'tool', proficiency: 'intermediate' },
          { name: 'Azure', category: 'tool', proficiency: 'intermediate' },
        ],
        resumePath: 'test-resume.txt',
        parsedAt: content.metadata.extractedAt,
      }));

      const profile = await parseResumeWithClaude(content);

      const skillNames = profile.skills.map(s => s.name);
      expect(skillNames).toContain('Python');
      expect(skillNames).toContain('JavaScript');
      expect(skillNames).toContain('TypeScript');
      expect(skillNames).toContain('React');
    });

    it('should extract work experience', async () => {
      const resumeText = `
        Alex Johnson
        alex@company.com

        EXPERIENCE

        Lead Developer - Google - Mountain View, CA
        March 2020 - Present
        - Architected large-scale distributed systems
        - Led team of 12 engineers
        - Improved system reliability to 99.99%

        Software Engineer - Facebook - Menlo Park, CA
        January 2017 - February 2020
        - Developed news feed ranking algorithms
        - Optimized content delivery performance
      `;

      const content: ExtractedContent = {
        text: resumeText,
        metadata: {
          fileName: 'test-resume.txt',
          fileType: 'txt',
          fileSize: resumeText.length,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock the Claude API response
      mockClaudeResponse(createValidMockProfile({
        firstName: 'Alex',
        lastName: 'Johnson',
        headline: 'Lead Developer',
        email: 'alex@company.com',
        experience: [
          {
            company: 'Google',
            title: 'Lead Developer',
            location: 'Mountain View, CA',
            startDate: '2020-03',
            endDate: null,
            description: 'Architected large-scale distributed systems. Led team of 12 engineers. Improved system reliability to 99.99%',
            highlights: [
              'Architected large-scale distributed systems',
              'Led team of 12 engineers',
              'Improved system reliability to 99.99%',
            ],
            skills: ['distributed systems', 'leadership'],
          },
          {
            company: 'Facebook',
            title: 'Software Engineer',
            location: 'Menlo Park, CA',
            startDate: '2017-01',
            endDate: '2020-02',
            description: 'Developed news feed ranking algorithms. Optimized content delivery performance',
            highlights: [
              'Developed news feed ranking algorithms',
              'Optimized content delivery performance',
            ],
            skills: ['algorithms', 'optimization'],
          },
        ],
        resumePath: 'test-resume.txt',
        parsedAt: content.metadata.extractedAt,
      }));

      const profile = await parseResumeWithClaude(content);

      expect(profile.experience.length).toBeGreaterThanOrEqual(2);
      expect(profile.experience.some(e => e.company === 'Google')).toBe(true);
      expect(profile.experience.some(e => e.company === 'Facebook')).toBe(true);
    });

    it('should extract education', async () => {
      const resumeText = `
        Sam Wilson
        sam@edu.com

        EDUCATION

        Master of Science in Computer Science
        Stanford University - 2019

        Bachelor of Science in Mathematics
        UCLA - 2017
      `;

      const content: ExtractedContent = {
        text: resumeText,
        metadata: {
          fileName: 'test-resume.txt',
          fileType: 'txt',
          fileSize: resumeText.length,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock the Claude API response
      mockClaudeResponse(createValidMockProfile({
        firstName: 'Sam',
        lastName: 'Wilson',
        email: 'sam@edu.com',
        education: [
          {
            institution: 'Stanford University',
            degree: 'Master of Science',
            field: 'Computer Science',
            endDate: '2019',
          },
          {
            institution: 'UCLA',
            degree: 'Bachelor of Science',
            field: 'Mathematics',
            endDate: '2017',
          },
        ],
        resumePath: 'test-resume.txt',
        parsedAt: content.metadata.extractedAt,
      }));

      const profile = await parseResumeWithClaude(content);

      expect(profile.education.length).toBeGreaterThanOrEqual(2);
      expect(profile.education.some(e => e.institution === 'Stanford University')).toBe(true);
    });
  });

  describe('File Parsing', () => {
    it('should handle text file path', async () => {
      // Create a temporary text file
      const tmpDir = os.tmpdir();
      const testResumePath = path.join(tmpDir, 'test-resume.txt');
      const resumeContent = `
        John Test
        john@test.com
        Software Engineer

        SKILLS
        JavaScript, TypeScript, React
      `;

      await fs.writeFile(testResumePath, resumeContent);

      // Mock the Claude API response
      mockClaudeResponse(createValidMockProfile({
        firstName: 'John',
        lastName: 'Test',
        headline: 'Software Engineer',
        email: 'john@test.com',
        skills: [
          { name: 'JavaScript', category: 'technical', proficiency: 'advanced' },
          { name: 'TypeScript', category: 'technical', proficiency: 'advanced' },
          { name: 'React', category: 'framework', proficiency: 'advanced' },
        ],
        resumePath: path.basename(testResumePath),
        parsedAt: new Date().toISOString(),
      }));

      try {
        const result = await parser.parse(testResumePath);

        expect(result).toBeDefined();
        expect(result.profile).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.fileType).toBe('txt');
        expect(result.profile.contact.email).toBe('john@test.com');
      } finally {
        // Cleanup
        await fs.unlink(testResumePath).catch(() => {});
      }
    });

    it('should handle non-existent file', async () => {
      await expect(parser.parse('/nonexistent/file.pdf')).rejects.toThrow();
    });

    it('should handle invalid file format', async () => {
      // Create a temp file with unsupported extension
      const tmpDir = os.tmpdir();
      const invalidFile = path.join(tmpDir, 'test.xyz');
      await fs.writeFile(invalidFile, 'test content');

      try {
        await expect(parser.parse(invalidFile)).rejects.toThrow();
      } finally {
        await fs.unlink(invalidFile).catch(() => {});
      }
    });
  });

  describe('extractText method', () => {
    it('should extract text from a file', async () => {
      const tmpDir = os.tmpdir();
      const testFile = path.join(tmpDir, 'extract-test.txt');
      const content = 'This is test resume content';

      await fs.writeFile(testFile, content);

      try {
        const extracted = await parser.extractText(testFile);

        expect(extracted).toBeDefined();
        expect(extracted.text).toContain('test resume');
        expect(extracted.metadata.fileType).toBe('txt');
        expect(extracted.metadata.fileName).toContain('extract-test.txt');
      } finally {
        await fs.unlink(testFile).catch(() => {});
      }
    });
  });

  describe('extractSkills method', () => {
    it('should extract skills from a file', async () => {
      const tmpDir = os.tmpdir();
      const testFile = path.join(tmpDir, 'skills-test.txt');
      const content = `
        Developer Resume

        SKILLS
        JavaScript, TypeScript, Python, React, Node.js, Docker
      `;

      await fs.writeFile(testFile, content);

      // Mock the Claude API response for skills extraction
      const mockCreate = getMockCreate();
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '["JavaScript", "TypeScript", "Python", "React", "Node.js", "Docker"]',
          },
        ],
      });

      try {
        const skills = await parser.extractSkills(testFile);

        expect(Array.isArray(skills)).toBe(true);
        expect(skills.length).toBeGreaterThan(0);
        expect(skills).toContain('JavaScript');
        expect(skills).toContain('TypeScript');
      } finally {
        await fs.unlink(testFile).catch(() => {});
      }
    });
  });

  describe('validate method', () => {
    it('should validate a file', async () => {
      const tmpDir = os.tmpdir();
      const testFile = path.join(tmpDir, 'validate-test.txt');
      const content = 'Resume content here';

      await fs.writeFile(testFile, content);

      try {
        const validation = await parser.validate(testFile);

        expect(validation).toBeDefined();
        expect(validation.valid).toBeDefined();
        expect(validation.fileType).toBe('txt');
        expect(Array.isArray(validation.issues)).toBe(true);
      } finally {
        await fs.unlink(testFile).catch(() => {});
      }
    });
  });

  describe('getSupportedTypes method', () => {
    it('should return supported file types', () => {
      const types = parser.getSupportedTypes();

      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('pdf');
      expect(types).toContain('docx');
      expect(types).toContain('txt');
    });
  });

  describe('Profile Validation', () => {
    it('should generate valid profile structure', async () => {
      const resumeText = `
        Test User
        test@example.com
        Skills: JavaScript
      `;

      const content: ExtractedContent = {
        text: resumeText,
        metadata: {
          fileName: 'test.txt',
          fileType: 'txt',
          fileSize: resumeText.length,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock the Claude API response
      mockClaudeResponse(createValidMockProfile({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        skills: [
          { name: 'JavaScript', category: 'technical', proficiency: 'advanced' },
        ],
        resumePath: 'test.txt',
        parsedAt: content.metadata.extractedAt,
      }));

      const profile = await parseResumeWithClaude(content);

      expect(profile.firstName).toBeDefined();
      expect(profile.lastName).toBeDefined();
      expect(typeof profile.firstName).toBe('string');
      expect(typeof profile.lastName).toBe('string');
      expect(profile.contact).toBeDefined();
      expect(profile.contact.email).toBeDefined();
      expect(Array.isArray(profile.skills)).toBe(true);
      expect(Array.isArray(profile.experience)).toBe(true);
      expect(Array.isArray(profile.education)).toBe(true);
    });

    it('should handle missing optional fields', async () => {
      const minimalResume = `
        Minimal User
        minimal@test.com
      `;

      const content: ExtractedContent = {
        text: minimalResume,
        metadata: {
          fileName: 'minimal.txt',
          fileType: 'txt',
          fileSize: minimalResume.length,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock the Claude API response
      mockClaudeResponse(createValidMockProfile({
        firstName: 'Minimal',
        lastName: 'User',
        email: 'minimal@test.com',
        resumePath: 'minimal.txt',
        parsedAt: content.metadata.extractedAt,
      }));

      const profile = await parseResumeWithClaude(content);

      expect(profile.firstName).toBe('Minimal');
      expect(profile.lastName).toBe('User');
      expect(profile.contact.email).toBe('minimal@test.com');
      // Skills and experience might be empty arrays
      expect(Array.isArray(profile.skills)).toBe(true);
      expect(Array.isArray(profile.experience)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input', async () => {
      const content: ExtractedContent = {
        text: '',
        metadata: {
          fileName: 'empty.txt',
          fileType: 'txt',
          fileSize: 0,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock an error response
      const mockCreate = getMockCreate();
      mockCreate.mockRejectedValue(new Error('Empty content'));

      await expect(parseResumeWithClaude(content)).rejects.toThrow();
    });
  });

  describe('Name Parsing', () => {
    it('should parse various name formats', async () => {
      const testCases = [
        { input: 'John Doe\njohn@test.com', firstName: 'John', lastName: 'Doe' },
        { input: 'John Michael Doe\njohn@test.com', firstName: 'John Michael', lastName: 'Doe' },
        { input: 'Dr. Jane Smith\njane@test.com', firstName: 'Jane', lastName: 'Smith' },
        { input: 'Jane Smith, PhD\njane@test.com', firstName: 'Jane', lastName: 'Smith' },
      ];

      for (const tc of testCases) {
        const content: ExtractedContent = {
          text: tc.input,
          metadata: {
            fileName: 'test.txt',
            fileType: 'txt',
            fileSize: tc.input.length,
            extractedAt: new Date().toISOString(),
          },
        };

        // Mock the Claude API response with varying names
        mockClaudeResponse(createValidMockProfile({
          firstName: tc.firstName,
          lastName: tc.lastName,
          email: tc.input.includes('john@test.com') ? 'john@test.com' : 'jane@test.com',
          resumePath: 'test.txt',
          parsedAt: content.metadata.extractedAt,
        }));

        const result = await parseResumeWithClaude(content);
        // Name parsing might vary, but should contain key parts
        expect(result.firstName).toBeDefined();
        expect(result.lastName).toBeDefined();
        expect(typeof result.firstName).toBe('string');
        expect(typeof result.lastName).toBe('string');
      }
    });
  });

  describe('Date Parsing', () => {
    it('should parse various date formats in experience', async () => {
      const resumeText = `
        Date Test
        date@test.com

        EXPERIENCE

        Engineer - Company A
        Jan 2020 - Dec 2022

        Engineer - Company B
        2018 - 2019

        Engineer - Company C
        March 2015 - Present
      `;

      const content: ExtractedContent = {
        text: resumeText,
        metadata: {
          fileName: 'dates.txt',
          fileType: 'txt',
          fileSize: resumeText.length,
          extractedAt: new Date().toISOString(),
        },
      };

      // Mock the Claude API response with various date formats
      mockClaudeResponse(createValidMockProfile({
        firstName: 'Date',
        lastName: 'Test',
        headline: 'Engineer',
        email: 'date@test.com',
        experience: [
          {
            company: 'Company A',
            title: 'Engineer',
            startDate: '2020-01',
            endDate: '2022-12',
            description: 'Worked on projects',
            highlights: ['Worked on projects'],
            skills: [],
          },
          {
            company: 'Company B',
            title: 'Engineer',
            startDate: '2018',
            endDate: '2019',
            description: 'Developed software',
            highlights: ['Developed software'],
            skills: [],
          },
          {
            company: 'Company C',
            title: 'Engineer',
            startDate: '2015-03',
            endDate: null,
            description: 'Current position',
            highlights: ['Current position'],
            skills: [],
          },
        ],
        resumePath: 'dates.txt',
        parsedAt: content.metadata.extractedAt,
      }));

      const profile = await parseResumeWithClaude(content);

      profile.experience.forEach(exp => {
        expect(exp.startDate).toBeDefined();
        // End date should be defined (either a string or null)
        expect(exp.endDate !== undefined).toBe(true);
      });
    });
  });
});

describe('ResumeParser with Claude API', () => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  describe.skipIf(!hasApiKey)('Integration Tests', () => {
    let parser: ResumeParser;

    beforeEach(() => {
      // Reset configuration for integration tests
      ConfigManager.reset();

      // Set environment variables (these should be real for integration tests)
      if (!process.env.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = 'test-key';
      }
      if (!process.env.EXA_API_KEY) {
        process.env.EXA_API_KEY = 'test-key';
      }
      process.env.NODE_ENV = 'test';

      // Initialize config
      initConfig({
        configPath: path.join(os.tmpdir(), 'integration-test-config.json'),
      });

      parser = new ResumeParser();
    });

    it('should parse resume using Claude API with parse() method', async () => {
      const resumeText = `
        John Developer
        john.developer@techcompany.com
        (415) 555-0123
        San Francisco, CA 94102

        SUMMARY
        Full-stack software engineer with 7 years of experience building
        scalable web applications. Expert in TypeScript, React, and Node.js.
        Passionate about clean code and mentoring junior developers.

        TECHNICAL SKILLS
        Languages: TypeScript, JavaScript, Python, Go, SQL
        Frontend: React, Next.js, Vue.js, Redux, GraphQL
        Backend: Node.js, Express, NestJS, FastAPI
        Databases: PostgreSQL, MongoDB, Redis, Elasticsearch
        Cloud & DevOps: AWS (Lambda, ECS, RDS), Docker, Kubernetes, Terraform
        Tools: Git, GitHub Actions, Jest, Playwright

        PROFESSIONAL EXPERIENCE

        Senior Software Engineer | TechCorp Inc. | San Francisco, CA
        March 2021 - Present
        • Led development of microservices architecture serving 1M+ daily users
        • Reduced API response time by 60% through query optimization
        • Mentored 5 junior engineers and conducted code reviews
        • Implemented CI/CD pipeline reducing deployment time by 80%

        Software Engineer | StartupXYZ | San Francisco, CA
        June 2018 - February 2021
        • Built React-based dashboard used by 500+ enterprise customers
        • Developed RESTful APIs handling 10K requests per second
        • Integrated third-party services including Stripe and Twilio
        • Wrote comprehensive test suites achieving 90% code coverage

        Junior Developer | WebAgency | Oakland, CA
        January 2017 - May 2018
        • Created responsive websites for 20+ clients
        • Learned React and Node.js through hands-on projects
        • Collaborated with design team on UI/UX improvements

        EDUCATION
        Bachelor of Science in Computer Science
        University of California, Berkeley | 2016
        GPA: 3.7/4.0

        CERTIFICATIONS
        • AWS Certified Solutions Architect
        • Google Cloud Professional Developer
      `;

      // Create a temporary file
      const tmpDir = os.tmpdir();
      const testFile = path.join(tmpDir, 'integration-test-resume.txt');
      await fs.writeFile(testFile, resumeText);

      try {
        const result = await parser.parse(testFile);

        expect(result.profile.firstName).toBeDefined();
        expect(result.profile.lastName).toBeDefined();
        expect(result.profile.contact.email).toBe('john.developer@techcompany.com');
        expect(result.profile.skills.length).toBeGreaterThan(5);
        expect(result.profile.experience.length).toBeGreaterThanOrEqual(3);
        expect(result.profile.education.length).toBeGreaterThanOrEqual(1);
        expect(result.metadata.fileType).toBe('txt');
        expect(result.metadata.parsedAt).toBeDefined();
      } finally {
        await fs.unlink(testFile).catch(() => {});
      }
    });

    it('should parse resume using parseResumeWithClaude directly', async () => {
      const resumeText = `
        Jane Engineer
        jane.engineer@example.com

        SKILLS
        JavaScript, TypeScript, Python, React, Node.js

        EXPERIENCE
        Software Engineer at Tech Company
        2020 - Present
        - Built web applications
      `;

      const content: ExtractedContent = {
        text: resumeText,
        metadata: {
          fileName: 'jane-resume.txt',
          fileType: 'txt',
          fileSize: resumeText.length,
          extractedAt: new Date().toISOString(),
        },
      };

      const profile = await parseResumeWithClaude(content);

      expect(profile.firstName).toBeDefined();
      expect(profile.lastName).toBeDefined();
      expect(profile.contact.email).toBe('jane.engineer@example.com');
      expect(profile.skills.length).toBeGreaterThan(0);
      expect(profile.experience.length).toBeGreaterThan(0);
    });
  });
});
