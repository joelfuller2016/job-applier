/**
 * Job Hunter Orchestrator
 * Main orchestration layer that ties together all components
 */
import { UserProfile } from '@job-applier/core';
import { DiscoveredJob, JobHuntConfig, JobHuntResult, ApplicationAttempt } from './types.js';
export interface HuntCallbacks {
    onJobDiscovered?: (job: DiscoveredJob) => void;
    onJobMatched?: (job: DiscoveredJob, score: number) => void;
    onApplicationStart?: (job: DiscoveredJob) => void;
    onApplicationComplete?: (attempt: ApplicationAttempt) => void;
    onConfirmationRequired?: (job: DiscoveredJob) => Promise<boolean>;
    onError?: (error: Error, job?: DiscoveredJob) => void;
    onProgress?: (message: string) => void;
}
export declare class JobHunterOrchestrator {
    private discovery;
    private analyzer;
    private navigator;
    private formFiller;
    private browserManager;
    constructor();
    /**
     * Run a complete job hunt session
     */
    hunt(userProfile: UserProfile, config: JobHuntConfig, callbacks?: HuntCallbacks): Promise<JobHuntResult>;
    /**
     * Discover jobs from various sources
     */
    private discoverJobs;
    /**
     * Match jobs against user profile
     */
    private matchJobs;
    /**
     * Apply to a single job
     */
    private applyToJob;
    /**
     * Save screenshot for debugging
     */
    private saveScreenshot;
    /**
     * Log progress
     */
    private log;
    /**
     * Random delay
     */
    private delay;
    /**
     * Quick hunt - simplified single-company application
     */
    quickApply(company: string, jobTitle: string, userProfile: UserProfile, callbacks?: HuntCallbacks): Promise<ApplicationAttempt>;
}
//# sourceMappingURL=job-hunter-orchestrator.d.ts.map