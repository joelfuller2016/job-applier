/**
 * AI-Powered Page Analyzer
 * Uses Claude Vision to understand any webpage structure
 */
import { Page } from 'playwright';
import { PageAnalysis, FormField } from './types.js';
export declare class AIPageAnalyzer {
    private client;
    constructor();
    /**
     * Analyze a page using Claude Vision
     */
    analyzePage(page: Page): Promise<PageAnalysis>;
    /**
     * Analyze a job description and match against user profile
     */
    analyzeJobMatch(jobDescription: string, userProfile: {
        skills: string[];
        experience: Array<{
            title: string;
            company: string;
            description?: string;
        }>;
        education: Array<{
            degree: string;
            field: string;
        }>;
    }): Promise<{
        score: number;
        analysis: string;
        missingSkills: string[];
    }>;
    /**
     * Determine what value to fill for a form field
     */
    determineFieldValue(field: FormField, userProfile: Record<string, unknown>, jobContext: {
        title: string;
        company: string;
        description: string;
    }): Promise<string>;
    /**
     * Find the careers page for a company
     */
    findCareersPage(companyName: string, companyWebsite?: string): Promise<string | null>;
}
//# sourceMappingURL=ai-page-analyzer.d.ts.map