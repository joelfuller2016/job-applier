/**
 * AI Form Filler
 * Uses AI to fill any job application form
 */
import { Page } from 'playwright';
import { UserProfile } from '@job-applier/core';
import { PageAnalysis } from './types.js';
export interface FillResult {
    success: boolean;
    fieldsFilled: number;
    fieldsSkipped: number;
    errors: string[];
}
export interface JobContext {
    title: string;
    company: string;
    description: string;
}
export declare class AIFormFiller {
    private analyzer;
    constructor();
    /**
     * Fill all form fields on the current page
     */
    fillForm(page: Page, userProfile: UserProfile, jobContext: JobContext, analysis?: PageAnalysis): Promise<FillResult>;
    /**
     * Fill a single form field
     */
    private fillField;
    /**
     * Get value for a field
     */
    private getValue;
    /**
     * Check if field is already filled
     */
    private isAlreadyFilled;
    /**
     * Fill text input with human-like typing
     */
    private fillTextInput;
    /**
     * Fill file input
     */
    private fillFileInput;
    /**
     * Fill select dropdown
     */
    private fillSelect;
    /**
     * Fill checkbox
     */
    private fillCheckbox;
    /**
     * Fill radio button group
     */
    private fillRadio;
    /**
     * Handle common application questions using AI
     */
    answerQuestion(question: string, userProfile: UserProfile, jobContext: JobContext): Promise<string>;
}
//# sourceMappingURL=ai-form-filler.d.ts.map