/**
 * Job types for job management interface
 */

export type JobPlatform = 'linkedin' | 'indeed' | 'glassdoor' | 'ziprecruiter' | 'company' | 'other';
export type WorkArrangement = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  workArrangement: WorkArrangement;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  };
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  skills: {
    required: string[];
    preferred: string[];
  };
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  platform: JobPlatform;
  platformJobId?: string;
  url: string;
  postedAt: string;
  discoveredAt: string;
  deadline?: string;
  applicantCount?: number;
  matchScore?: number;
  hasEasyApply: boolean;
  isSaved: boolean;
  isHidden: boolean;
  applicationId?: string;
  applicationStatus?: string;
  tags?: string[];
}

export interface JobFilters {
  searchQuery?: string;
  platforms?: JobPlatform[];
  workArrangements?: WorkArrangement[];
  experienceLevels?: ExperienceLevel[];
  employmentTypes?: EmploymentType[];
  locations?: string[];
  minSalary?: number;
  maxSalary?: number;
  minMatchScore?: number;
  hasEasyApply?: boolean;
  postedWithin?: '24h' | '7d' | '14d' | '30d' | 'all';
  showSaved?: boolean;
  showHidden?: boolean;
  showApplied?: boolean;
  skills?: string[];
  companies?: string[];
}

export type JobSortField = 'postedAt' | 'matchScore' | 'salary' | 'company' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface JobSort {
  field: JobSortField;
  direction: SortDirection;
}

export type JobViewMode = 'table' | 'grid' | 'compact';
