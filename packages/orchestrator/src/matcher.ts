import Anthropic from '@anthropic-ai/sdk';
import {
  JobListing,
  UserProfile,
  JobMatch,
  generateId,
  toISOString,
} from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';
import { MatchRepository } from '@job-applier/database';

/**
 * Match criteria weights
 */
export interface MatchWeights {
  skillsMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
  titleMatch: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  skillsMatch: 0.35,
  experienceMatch: 0.25,
  locationMatch: 0.15,
  salaryMatch: 0.15,
  titleMatch: 0.10,
};

/**
 * Job matcher that calculates compatibility scores
 */
export class JobMatcher {
  private client: Anthropic;
  private matchRepo: MatchRepository;
  private weights: MatchWeights;

  constructor(weights: MatchWeights = DEFAULT_WEIGHTS) {
    const config = getConfigManager();
    this.client = new Anthropic({
      apiKey: config.getClaude().apiKey,
    });
    this.matchRepo = new MatchRepository();
    this.weights = weights;
  }

  /**
   * Calculate match score between a job and profile
   */
  async calculateMatch(job: JobListing, profile: UserProfile): Promise<JobMatch> {
    // Check for cached match
    const existingMatch = await this.matchRepo.findByJobAndProfile(job.id, profile.id);
    if (existingMatch) {
      return existingMatch;
    }

    // Calculate individual scores
    const skillsScore = this.calculateSkillsScore(job, profile);
    const experienceScore = this.calculateExperienceScore(job, profile);
    const locationScore = this.calculateLocationScore(job, profile);
    const salaryScore = this.calculateSalaryScore(job, profile);
    const titleScore = this.calculateTitleScore(job, profile);

    // Calculate weighted overall score
    const overallScore =
      skillsScore * this.weights.skillsMatch +
      experienceScore * this.weights.experienceMatch +
      locationScore * this.weights.locationMatch +
      salaryScore * this.weights.salaryMatch +
      titleScore * this.weights.titleMatch;

    // Get AI-generated analysis
    const analysis = await this.getAIAnalysis(job, profile);

    const match: JobMatch = {
      id: generateId(),
      jobId: job.id,
      profileId: profile.id,
      overallScore: Math.round(overallScore * 100),
      skillScore: Math.round(skillsScore * 100),
      experienceScore: Math.round(experienceScore * 100),
      locationScore: Math.round(locationScore * 100),
      salaryScore: Math.round(salaryScore * 100),
      skillMatches: this.getSkillMatches(job, profile),
      experienceMatch: this.getExperienceMatch(job, profile),
      locationMatch: this.getLocationMatch(job, profile),
      salaryMatch: this.getSalaryMatch(job, profile),
      strengths: analysis.strengths,
      gaps: analysis.gaps,
      recommendations: analysis.recommendations,
      fitCategory: analysis.fitCategory,
      confidence: analysis.confidence,
      analyzedAt: toISOString(new Date()),
    };

    // Save match to database
    this.matchRepo.save(match);

    return match;
  }

  /**
   * Calculate skills match score
   */
  private calculateSkillsScore(job: JobListing, profile: UserProfile): number {
    if (!job.requiredSkills || job.requiredSkills.length === 0) {
      return 0.7; // Default score if no skills specified
    }

    const profileSkills = profile.skills.map(s => s.name.toLowerCase());
    const jobSkills = job.requiredSkills.map(s => s.toLowerCase());

    let matchCount = 0;
    for (const skill of jobSkills) {
      if (profileSkills.some(ps => ps.includes(skill) || skill.includes(ps))) {
        matchCount++;
      }
    }

    return matchCount / jobSkills.length;
  }

  /**
   * Calculate experience match score
   */
  private calculateExperienceScore(job: JobListing, profile: UserProfile): number {
    // Extract years of experience from job description
    const yearsMatch = job.description.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (!yearsMatch) {
      return 0.8; // Default if not specified
    }

    const requiredYears = parseInt(yearsMatch[1], 10);
    const profileYears = this.calculateTotalExperience(profile);

    if (profileYears >= requiredYears) {
      return 1.0;
    } else if (profileYears >= requiredYears * 0.75) {
      return 0.8;
    } else if (profileYears >= requiredYears * 0.5) {
      return 0.6;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate location match score
   */
  private calculateLocationScore(job: JobListing, profile: UserProfile): number {
    const jobLocation = job.location.toLowerCase();
    const profileLocation = profile.contact.location?.toLowerCase() || '';

    // Remote jobs always match
    if (jobLocation.includes('remote')) {
      return 1.0;
    }

    // Check for city/state match
    if (profileLocation && jobLocation.includes(profileLocation)) {
      return 1.0;
    }

    // Check if willing to relocate
    if (profile.preferences?.willingToRelocate) {
      return 0.7;
    }

    return 0.3;
  }

  /**
   * Calculate salary match score
   */
  private calculateSalaryScore(job: JobListing, profile: UserProfile): number {
    if (!job.salary || !profile.preferences?.minSalary) {
      return 0.7; // Default if not specified
    }

    // Get salary min from the object
    const jobSalary = job.salary.min || job.salary.max;
    if (!jobSalary) {
      return 0.7;
    }

    const minSalary = profile.preferences.minSalary;

    if (jobSalary >= minSalary) {
      return 1.0;
    } else if (jobSalary >= minSalary * 0.9) {
      return 0.8;
    } else if (jobSalary >= minSalary * 0.8) {
      return 0.6;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate title match score
   */
  private calculateTitleScore(job: JobListing, profile: UserProfile): number {
    const jobTitle = job.title.toLowerCase();
    const targetRoles = profile.preferences?.targetRoles || [];

    if (targetRoles.length === 0) {
      // Check against current job titles
      const currentTitles = profile.experience.map(e => e.title.toLowerCase());
      for (const title of currentTitles) {
        if (this.titlesMatch(jobTitle, title)) {
          return 1.0;
        }
      }
      return 0.5;
    }

    for (const target of targetRoles) {
      if (this.titlesMatch(jobTitle, target.toLowerCase())) {
        return 1.0;
      }
    }

    return 0.3;
  }

  /**
   * Check if two job titles match
   */
  private titlesMatch(title1: string, title2: string): boolean {
    // Normalize titles
    const normalize = (t: string) =>
      t.replace(/\b(senior|sr|junior|jr|lead|principal|staff)\b/gi, '')
        .replace(/[^a-z]/g, '')
        .trim();

    const n1 = normalize(title1);
    const n2 = normalize(title2);

    return n1.includes(n2) || n2.includes(n1);
  }

  /**
   * Calculate total years of experience
   */
  private calculateTotalExperience(profile: UserProfile): number {
    if (profile.experience.length === 0) return 0;

    const startDates = profile.experience.map(e => new Date(e.startDate));
    const earliest = Math.min(...startDates.map(d => d.getTime()));
    const years = (Date.now() - earliest) / (365.25 * 24 * 60 * 60 * 1000);

    return Math.floor(years);
  }

  /**
   * Get skill matches
   */
  private getSkillMatches(job: JobListing, profile: UserProfile) {
    if (!job.requiredSkills) return [];

    const profileSkillMap = new Map(
      profile.skills.map(s => [s.name.toLowerCase(), s.proficiency])
    );

    return job.requiredSkills.map(skill => {
      const skillLower = skill.toLowerCase();
      const userSkill = Array.from(profileSkillMap.entries()).find(
        ([name]) => name.includes(skillLower) || skillLower.includes(name)
      );

      return {
        skill,
        required: true,
        userHas: !!userSkill,
        proficiencyMatch: userSkill ? 'exact' as const : 'none' as const,
        weight: 1.0,
      };
    });
  }

  /**
   * Get experience match
   */
  private getExperienceMatch(job: JobListing, profile: UserProfile) {
    const yearsMatch = job.description.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    const requiredYears = yearsMatch ? parseInt(yearsMatch[1], 10) : undefined;
    const userYears = this.calculateTotalExperience(profile);

    const relevantRoles = profile.experience
      .filter(exp => {
        const titleMatch = this.titlesMatch(exp.title, job.title);
        return titleMatch;
      })
      .map(exp => exp.title);

    let seniorityMatch: 'exact' | 'above' | 'below' = 'exact';
    if (requiredYears) {
      if (userYears >= requiredYears) {
        seniorityMatch = 'above';
      } else if (userYears < requiredYears) {
        seniorityMatch = 'below';
      }
    }

    return {
      requiredYears,
      userYears,
      relevantRoles,
      industryMatch: true,
      seniorityMatch,
    };
  }

  /**
   * Get location match
   */
  private getLocationMatch(job: JobListing, profile: UserProfile) {
    const jobLocation = job.location.toLowerCase();
    const userLocation = profile.contact.location?.toLowerCase() || '';
    const remoteCompatible = jobLocation.includes('remote');
    const willingToRelocate = profile.preferences?.willingToRelocate || false;

    let matchType: 'exact' | 'remote' | 'willing-to-relocate' | 'nearby' | 'no-match';

    if (remoteCompatible) {
      matchType = 'remote';
    } else if (userLocation && jobLocation.includes(userLocation)) {
      matchType = 'exact';
    } else if (willingToRelocate) {
      matchType = 'willing-to-relocate';
    } else {
      matchType = 'no-match';
    }

    return {
      jobLocation: job.location,
      userLocation: profile.contact.location,
      remoteCompatible,
      willingToRelocate,
      matchType,
    };
  }

  /**
   * Get salary match
   */
  private getSalaryMatch(job: JobListing, profile: UserProfile) {
    if (!job.salary) return undefined;

    const jobSalaryMin = job.salary.min;
    const jobSalaryMax = job.salary.max;
    const userExpectation = profile.preferences?.minSalary;
    const meetsMinimum = jobSalaryMin && userExpectation ? jobSalaryMin >= userExpectation : true;

    return {
      jobSalaryMin,
      jobSalaryMax,
      userExpectation,
      meetsMinimum,
      percentageMatch: jobSalaryMin && userExpectation
        ? Math.min(100, (jobSalaryMin / userExpectation) * 100)
        : undefined,
    };
  }

  /**
   * Get AI-generated analysis
   */
  private async getAIAnalysis(
    job: JobListing,
    profile: UserProfile
  ): Promise<{
    strengths: string[];
    gaps: string[];
    recommendations: string[];
    fitCategory: 'excellent' | 'good' | 'moderate' | 'stretch' | 'unlikely';
    confidence: number;
  }> {
    try {
      const prompt = `Analyze this job match and provide detailed assessment.

Job Title: ${job.title}
Company: ${job.company.name}
Location: ${job.location}
Description: ${job.description.substring(0, 1000)}...

Candidate Profile:
- Current Role: ${profile.experience[0]?.title || 'Not specified'}
- Years of Experience: ${this.calculateTotalExperience(profile)}
- Skills: ${profile.skills.map(s => s.name).join(', ')}
- Education: ${profile.education.map(e => `${e.degree} in ${e.field}`).join(', ')}

Provide your response in this exact JSON format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "fitCategory": "excellent" | "good" | "moderate" | "stretch" | "unlikely",
  "confidence": 0.85
}

Only respond with the JSON, no other text.`;

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        return {
          strengths: parsed.strengths,
          gaps: parsed.gaps,
          recommendations: parsed.recommendations,
          fitCategory: parsed.fitCategory,
          confidence: parsed.confidence,
        };
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    }

    // Default fallback
    return {
      strengths: [],
      gaps: [],
      recommendations: ['Unable to generate detailed analysis.'],
      fitCategory: 'moderate',
      confidence: 0.5,
    };
  }

  /**
   * Batch calculate matches for multiple jobs
   */
  async batchCalculateMatches(
    jobs: JobListing[],
    profile: UserProfile
  ): Promise<JobMatch[]> {
    const matches: JobMatch[] = [];

    for (const job of jobs) {
      const match = await this.calculateMatch(job, profile);
      matches.push(match);
    }

    // Sort by overall score descending
    return matches.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get top matches above a threshold
   */
  async getTopMatches(
    jobs: JobListing[],
    profile: UserProfile,
    minScore: number = 0.6
  ): Promise<JobMatch[]> {
    const matches = await this.batchCalculateMatches(jobs, profile);
    return matches.filter(m => m.overallScore >= minScore);
  }
}
