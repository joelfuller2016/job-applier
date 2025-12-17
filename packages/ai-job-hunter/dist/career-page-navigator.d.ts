/**
 * Career Page Navigator
 * Uses AI to navigate any company's career page
 */
import { Page } from 'playwright';
import { DiscoveredJob, PageAnalysis } from './types.js';
export interface NavigationResult {
    success: boolean;
    currentPage: 'job_listing' | 'job_details' | 'application_form' | 'login' | 'other' | 'error';
    job?: DiscoveredJob;
    analysis?: PageAnalysis;
    error?: string;
}
export declare class CareerPageNavigator {
    private analyzer;
    private maxNavigationSteps;
    constructor();
    /**
     * Navigate to a job's application page from any starting point
     */
    navigateToApplication(page: Page, job: DiscoveredJob): Promise<NavigationResult>;
    /**
     * Click the apply button on a job details page
     */
    private clickApplyButton;
    /**
     * Click on a specific job in a job listing
     */
    private clickOnJob;
    /**
     * Try to find any path to job application
     */
    private tryFindApplicationPath;
    /**
     * Handle multi-page application flow
     */
    navigateMultiPageForm(page: Page, onPageComplete: (analysis: PageAnalysis) => Promise<void>): Promise<{
        success: boolean;
        totalPages: number;
        error?: string;
    }>;
    /**
     * Check if two job titles are similar
     */
    private titlesMatch;
    /**
     * Check if page content indicates successful submission
     */
    private looksLikeSuccessPage;
    /**
     * Take screenshot for debugging/logging
     */
    captureScreenshot(page: Page, _name: string): Promise<Buffer>;
}
//# sourceMappingURL=career-page-navigator.d.ts.map