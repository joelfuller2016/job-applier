/**
 * Career Page Navigator
 * Uses AI to navigate any company's career page
 */

import { Page } from 'playwright';
import { randomDelay } from '@job-applier/browser-automation';
import { AIPageAnalyzer } from './ai-page-analyzer.js';
import { DiscoveredJob, PageAnalysis } from './types.js';

export interface NavigationResult {
  success: boolean;
  currentPage: 'job_listing' | 'job_details' | 'application_form' | 'login' | 'other' | 'error';
  job?: DiscoveredJob;
  analysis?: PageAnalysis;
  error?: string;
}

export class CareerPageNavigator {
  private analyzer: AIPageAnalyzer;
  private maxNavigationSteps = 10;

  constructor() {
    this.analyzer = new AIPageAnalyzer();
  }

  /**
   * Navigate to a job's application page from any starting point
   */
  async navigateToApplication(
    page: Page,
    job: DiscoveredJob
  ): Promise<NavigationResult> {
    let steps = 0;

    try {
      // Start at job URL
      await page.goto(job.url, { waitUntil: 'networkidle', timeout: 30000 });
      await new Promise(r => setTimeout(r, randomDelay(1500, 2500)));

      while (steps < this.maxNavigationSteps) {
        steps++;
        console.log(`Navigation step ${steps}...`);

        const analysis = await this.analyzer.analyzePage(page);
        console.log(`Page type: ${analysis.pageType}`);

        // Check for errors
        if (analysis.errors && analysis.errors.length > 0) {
          console.log(`Page errors detected: ${analysis.errors.join(', ')}`);
        }

        switch (analysis.pageType) {
          case 'application_form':
            return {
              success: true,
              currentPage: 'application_form',
              job,
              analysis,
            };

          case 'job_details':
            // Need to click apply button
            const applyResult = await this.clickApplyButton(page, analysis);
            if (!applyResult.success) {
              return {
                success: false,
                currentPage: 'job_details',
                error: applyResult.error,
                analysis,
              };
            }
            await new Promise(r => setTimeout(r, randomDelay(2000, 3000)));
            break;

          case 'job_listing':
            // Need to click on specific job
            const jobClickResult = await this.clickOnJob(page, job.title, analysis);
            if (!jobClickResult.success) {
              return {
                success: false,
                currentPage: 'job_listing',
                error: jobClickResult.error,
                analysis,
              };
            }
            await new Promise(r => setTimeout(r, randomDelay(2000, 3000)));
            break;

          case 'login':
            return {
              success: false,
              currentPage: 'login',
              error: 'Login required - manual authentication needed',
              analysis,
            };

          case 'other':
            // Try to find and click any "Apply" or "Careers" link
            const navigated = await this.tryFindApplicationPath(page);
            if (!navigated) {
              return {
                success: false,
                currentPage: 'other',
                error: 'Unable to find application path',
                analysis,
              };
            }
            await new Promise(r => setTimeout(r, randomDelay(2000, 3000)));
            break;
        }
      }

      return {
        success: false,
        currentPage: 'error',
        error: 'Max navigation steps exceeded',
      };
    } catch (error) {
      return {
        success: false,
        currentPage: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Click the apply button on a job details page
   */
  private async clickApplyButton(
    page: Page,
    analysis: PageAnalysis
  ): Promise<{ success: boolean; error?: string }> {
    // Try the submit button from analysis first
    const buttonSelectors = [
      analysis.submitButton,
      analysis.nextButton,
      // Common apply button patterns
      'button:has-text("Apply")',
      'a:has-text("Apply")',
      '[class*="apply"]',
      '[id*="apply"]',
      'button:has-text("Easy Apply")',
      'button:has-text("Apply Now")',
      'a:has-text("Apply Now")',
      'button[type="submit"]',
    ].filter(Boolean) as string[];

    for (const selector of buttonSelectors) {
      try {
        const button = await page.$(selector);
        if (button && await button.isVisible()) {
          await button.scrollIntoViewIfNeeded();
          await new Promise(r => setTimeout(r, randomDelay(300, 600)));
          await button.click();
          return { success: true };
        }
      } catch {
        // Try next selector
      }
    }

    return { success: false, error: 'Could not find apply button' };
  }

  /**
   * Click on a specific job in a job listing
   */
  private async clickOnJob(
    page: Page,
    jobTitle: string,
    analysis: PageAnalysis
  ): Promise<{ success: boolean; error?: string }> {
    // Try to find job from analysis
    if (analysis.jobs) {
      for (const job of analysis.jobs) {
        if (this.titlesMatch(job.title, jobTitle)) {
          try {
            const element = await page.$(job.selector);
            if (element && await element.isVisible()) {
              await element.scrollIntoViewIfNeeded();
              await new Promise(r => setTimeout(r, randomDelay(300, 600)));
              await element.click();
              return { success: true };
            }
          } catch {
            // Try URL if available
            if (job.url) {
              await page.goto(job.url, { waitUntil: 'networkidle' });
              return { success: true };
            }
          }
        }
      }
    }

    // Fallback: search for job title text
    try {
      const jobLink = await page.$(`a:has-text("${jobTitle.slice(0, 30)}")`);
      if (jobLink && await jobLink.isVisible()) {
        await jobLink.scrollIntoViewIfNeeded();
        await new Promise(r => setTimeout(r, randomDelay(300, 600)));
        await jobLink.click();
        return { success: true };
      }
    } catch {
      // Ignore
    }

    return { success: false, error: `Could not find job: ${jobTitle}` };
  }

  /**
   * Try to find any path to job application
   */
  private async tryFindApplicationPath(page: Page): Promise<boolean> {
    const paths = [
      'a:has-text("Apply")',
      'a:has-text("Careers")',
      'a:has-text("Jobs")',
      'a:has-text("View Jobs")',
      'a:has-text("Open Positions")',
      'a[href*="careers"]',
      'a[href*="jobs"]',
      'a[href*="apply"]',
    ];

    for (const selector of paths) {
      try {
        const link = await page.$(selector);
        if (link && await link.isVisible()) {
          await link.scrollIntoViewIfNeeded();
          await new Promise(r => setTimeout(r, randomDelay(300, 600)));
          await link.click();
          return true;
        }
      } catch {
        // Try next
      }
    }

    return false;
  }

  /**
   * Handle multi-page application flow
   */
  async navigateMultiPageForm(
    page: Page,
    onPageComplete: (analysis: PageAnalysis) => Promise<void>
  ): Promise<{ success: boolean; totalPages: number; error?: string }> {
    let pageCount = 0;

    while (pageCount < 20) { // Max 20 form pages
      pageCount++;
      console.log(`Processing form page ${pageCount}...`);

      const analysis = await this.analyzer.analyzePage(page);

      if (analysis.pageType !== 'application_form') {
        // Check if we've reached a success page
        const pageText = await page.evaluate(() => document.body.textContent || '');
        if (this.looksLikeSuccessPage(pageText)) {
          return { success: true, totalPages: pageCount };
        }

        return {
          success: false,
          totalPages: pageCount,
          error: `Unexpected page type: ${analysis.pageType}`,
        };
      }

      // Let caller fill the form
      await onPageComplete(analysis);

      // Check for next/submit button
      if (analysis.nextButton) {
        try {
          const nextBtn = await page.$(analysis.nextButton);
          if (nextBtn && await nextBtn.isVisible()) {
            await nextBtn.scrollIntoViewIfNeeded();
            await new Promise(r => setTimeout(r, randomDelay(500, 1000)));
            await nextBtn.click();
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            await new Promise(r => setTimeout(r, randomDelay(1000, 2000)));
            continue;
          }
        } catch {
          // Try submit
        }
      }

      if (analysis.submitButton) {
        try {
          const submitBtn = await page.$(analysis.submitButton);
          if (submitBtn && await submitBtn.isVisible()) {
            await submitBtn.scrollIntoViewIfNeeded();
            await new Promise(r => setTimeout(r, randomDelay(500, 1000)));
            await submitBtn.click();
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            await new Promise(r => setTimeout(r, randomDelay(1500, 2500)));

            // Check if application was submitted
            const postSubmitText = await page.evaluate(() => document.body.textContent || '');
            if (this.looksLikeSuccessPage(postSubmitText)) {
              return { success: true, totalPages: pageCount };
            }

            // Otherwise, continue to next page
            continue;
          }
        } catch {
          // No button found
        }
      }

      return {
        success: false,
        totalPages: pageCount,
        error: 'Could not find next/submit button',
      };
    }

    return {
      success: false,
      totalPages: pageCount,
      error: 'Too many form pages',
    };
  }

  /**
   * Check if two job titles are similar
   */
  private titlesMatch(title1: string, title2: string): boolean {
    const normalize = (s: string) =>
      s.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const t1 = normalize(title1);
    const t2 = normalize(title2);

    // Exact match
    if (t1 === t2) return true;

    // One contains the other
    if (t1.includes(t2) || t2.includes(t1)) return true;

    // Word overlap
    const words1 = new Set(t1.split(' '));
    const words2 = new Set(t2.split(' '));
    const overlap = [...words1].filter(w => words2.has(w) && w.length > 2);

    return overlap.length >= Math.min(words1.size, words2.size) / 2;
  }

  /**
   * Check if page content indicates successful submission
   */
  private looksLikeSuccessPage(text: string): boolean {
    const successIndicators = [
      'application submitted',
      'thank you for applying',
      'application received',
      'successfully submitted',
      'we have received your application',
      'application complete',
      'you have applied',
      'thanks for applying',
    ];

    const textLower = text.toLowerCase();
    return successIndicators.some(indicator => textLower.includes(indicator));
  }

  /**
   * Take screenshot for debugging/logging
   */
  async captureScreenshot(
    page: Page,
    _name: string
  ): Promise<Buffer> {
    return await page.screenshot({
      type: 'png',
      fullPage: false,
    });
  }
}
