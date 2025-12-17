/**
 * Types for AI Job Hunter
 */
import { UserProfile } from '@job-applier/core';
/**
 * Job search sources
 */
export type JobSource = 'exa' | 'google' | 'linkedin' | 'indeed' | 'glassdoor' | 'company_site' | 'greenhouse' | 'lever' | 'workday';
/**
 * Discovered job from web search
 */
export interface DiscoveredJob {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    source: JobSource;
    salary?: string;
    postedDate?: string;
    applyUrl?: string;
    matchScore?: number;
    matchAnalysis?: string;
    discoveredAt: string;
}
/**
 * Company with career page
 */
export interface Company {
    name: string;
    website?: string;
    careersUrl?: string;
    linkedinUrl?: string;
    industry?: string;
    size?: string;
    jobs?: DiscoveredJob[];
}
/**
 * Form field identified by AI
 */
export interface FormField {
    selector: string;
    type: 'text' | 'email' | 'phone' | 'file' | 'select' | 'checkbox' | 'radio' | 'textarea';
    label: string;
    required: boolean;
    profileMapping?: keyof UserProfile | string;
    value?: string;
    options?: string[];
}
/**
 * Page analysis result from Claude
 */
export interface PageAnalysis {
    pageType: 'job_listing' | 'job_details' | 'application_form' | 'login' | 'other';
    title?: string;
    jobs?: Array<{
        title: string;
        selector: string;
        url?: string;
    }>;
    formFields?: FormField[];
    submitButton?: string;
    nextButton?: string;
    loginRequired?: boolean;
    errors?: string[];
}
/**
 * Job hunt configuration
 */
export interface JobHuntConfig {
    searchQuery: string;
    location?: string;
    remote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
    maxJobs?: number;
    matchThreshold?: number;
    sources?: JobSource[];
    excludeCompanies?: string[];
    includeCompanies?: string[];
    autoApply?: boolean;
    requireConfirmation?: boolean;
    dryRun?: boolean;
}
/**
 * Application attempt result
 */
export interface ApplicationAttempt {
    jobId: string;
    companyName: string;
    jobTitle: string;
    url: string;
    status: 'success' | 'failed' | 'skipped' | 'requires_manual' | 'pending_confirmation';
    message?: string;
    screenshotPath?: string;
    appliedAt?: string;
    formFieldsFilled?: number;
    errors?: string[];
}
/**
 * Job hunt session result
 */
export interface JobHuntResult {
    sessionId: string;
    startedAt: string;
    completedAt?: string;
    config: JobHuntConfig;
    jobsDiscovered: number;
    jobsMatched: number;
    applicationsAttempted: number;
    applicationsSuccessful: number;
    applicationsFailed: number;
    applications: ApplicationAttempt[];
}
//# sourceMappingURL=types.d.ts.map