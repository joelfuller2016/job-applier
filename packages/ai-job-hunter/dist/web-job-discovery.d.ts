/**
 * Web Job Discovery
 * Uses Exa semantic search and web scraping to find jobs
 */
import { Page } from 'playwright';
import { DiscoveredJob, JobHuntConfig, Company } from './types.js';
export declare class WebJobDiscovery {
    private exa;
    private analyzer;
    constructor();
    /**
     * Search for jobs using Exa semantic search
     */
    searchJobsWithExa(config: JobHuntConfig): Promise<DiscoveredJob[]>;
    /**
     * Search for companies in a specific industry
     */
    discoverCompanies(industry: string, location?: string): Promise<Company[]>;
    /**
     * Scrape jobs from a company careers page
     */
    scrapeCompanyCareersPage(page: Page, company: Company, searchQuery?: string): Promise<DiscoveredJob[]>;
    /**
     * Search for jobs on the current page (for ATS systems)
     */
    private searchOnPage;
    /**
     * Get detailed job information by visiting the job page
     */
    getJobDetails(page: Page, job: DiscoveredJob): Promise<DiscoveredJob>;
    /**
     * Check if a URL/content looks like a job posting
     */
    private looksLikeJobPage;
    /**
     * Extract job title from content
     */
    private extractJobTitle;
    /**
     * Extract company name from URL or title
     */
    private extractCompany;
    /**
     * Format company name
     */
    private formatCompanyName;
    /**
     * Extract base domain from URL
     */
    private extractDomain;
    /**
     * Detect job source from URL
     */
    private detectSource;
    /**
     * Check if job title matches search query
     */
    private jobMatchesQuery;
    /**
     * Generate unique job ID from URL
     */
    private generateJobId;
}
//# sourceMappingURL=web-job-discovery.d.ts.map