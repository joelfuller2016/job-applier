/**
 * Web Job Discovery
 * Uses Exa semantic search and web scraping to find jobs
 */
import { Exa } from 'exa-js';
import { getConfigManager } from '@job-applier/config';
import { AIPageAnalyzer } from './ai-page-analyzer.js';
export class WebJobDiscovery {
    exa;
    analyzer;
    constructor() {
        const config = getConfigManager();
        const exaConfig = config.getExa();
        this.exa = new Exa(exaConfig.apiKey);
        this.analyzer = new AIPageAnalyzer();
    }
    /**
     * Search for jobs using Exa semantic search
     */
    async searchJobsWithExa(config) {
        const jobs = [];
        // Build search query
        let query = config.searchQuery;
        if (config.location) {
            query += ` ${config.location}`;
        }
        if (config.remote) {
            query += ' remote';
        }
        if (config.experienceLevel) {
            query += ` ${config.experienceLevel} level`;
        }
        console.log(`Searching Exa for: "${query}"`);
        try {
            const results = await this.exa.searchAndContents(query, {
                type: 'neural',
                useAutoprompt: true,
                numResults: Math.min(config.maxJobs || 20, 50),
                text: { maxCharacters: 3000 },
                category: 'company',
            });
            for (const result of results.results) {
                // Filter out non-job pages
                if (!this.looksLikeJobPage(result.url, result.title || '', result.text || '')) {
                    continue;
                }
                const job = {
                    id: this.generateJobId(result.url),
                    title: this.extractJobTitle(result.title || '', result.text || ''),
                    company: this.extractCompany(result.url, result.title || ''),
                    location: config.location || 'Not specified',
                    description: result.text || '',
                    url: result.url,
                    source: this.detectSource(result.url),
                    discoveredAt: new Date().toISOString(),
                };
                // Apply exclusion filters
                if (config.excludeCompanies?.some(c => job.company.toLowerCase().includes(c.toLowerCase()))) {
                    continue;
                }
                jobs.push(job);
            }
        }
        catch (error) {
            console.error('Exa search failed:', error);
        }
        return jobs;
    }
    /**
     * Search for companies in a specific industry
     */
    async discoverCompanies(industry, location) {
        const companies = [];
        const query = `${industry} companies ${location || ''} careers jobs hiring`;
        try {
            const results = await this.exa.searchAndContents(query, {
                type: 'neural',
                useAutoprompt: true,
                numResults: 20,
                text: { maxCharacters: 1000 },
                category: 'company',
            });
            for (const result of results.results) {
                const companyName = this.extractCompany(result.url, result.title || '');
                if (!companyName || companies.some(c => c.name === companyName)) {
                    continue;
                }
                const company = {
                    name: companyName,
                    website: this.extractDomain(result.url),
                    industry,
                };
                // Try to find careers URL
                const careersUrl = await this.analyzer.findCareersPage(companyName, company.website);
                if (careersUrl) {
                    company.careersUrl = careersUrl;
                }
                companies.push(company);
            }
        }
        catch (error) {
            console.error('Company discovery failed:', error);
        }
        return companies;
    }
    /**
     * Scrape jobs from a company careers page
     */
    async scrapeCompanyCareersPage(page, company, searchQuery) {
        const jobs = [];
        const careersUrl = company.careersUrl || `${company.website}/careers`;
        try {
            await page.goto(careersUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(2000);
            // Use AI to analyze the page
            const analysis = await this.analyzer.analyzePage(page);
            if (analysis.pageType === 'job_listing' && analysis.jobs) {
                for (const jobInfo of analysis.jobs) {
                    // If search query provided, filter jobs
                    if (searchQuery && !this.jobMatchesQuery(jobInfo.title, searchQuery)) {
                        continue;
                    }
                    const job = {
                        id: this.generateJobId(jobInfo.url || careersUrl + jobInfo.selector),
                        title: jobInfo.title,
                        company: company.name,
                        location: 'Check job details',
                        description: '',
                        url: jobInfo.url || careersUrl,
                        source: this.detectSource(careersUrl),
                        discoveredAt: new Date().toISOString(),
                    };
                    jobs.push(job);
                }
            }
            // If this is a job board or ATS, try to search
            if (searchQuery && analysis.pageType !== 'job_listing') {
                const searchedJobs = await this.searchOnPage(page, searchQuery, company);
                jobs.push(...searchedJobs);
            }
        }
        catch (error) {
            console.error(`Failed to scrape ${company.name} careers page:`, error);
        }
        return jobs;
    }
    /**
     * Search for jobs on the current page (for ATS systems)
     */
    async searchOnPage(page, query, company) {
        const jobs = [];
        try {
            // Look for search input
            const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[name*="search" i], input[id*="search" i]');
            if (searchInput) {
                await searchInput.fill(query);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(3000);
                // Re-analyze page after search
                const analysis = await this.analyzer.analyzePage(page);
                if (analysis.jobs) {
                    for (const jobInfo of analysis.jobs) {
                        jobs.push({
                            id: this.generateJobId(jobInfo.url || page.url() + jobInfo.selector),
                            title: jobInfo.title,
                            company: company.name,
                            location: 'Check job details',
                            description: '',
                            url: jobInfo.url || page.url(),
                            source: this.detectSource(page.url()),
                            discoveredAt: new Date().toISOString(),
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Search on page failed:', error);
        }
        return jobs;
    }
    /**
     * Get detailed job information by visiting the job page
     */
    async getJobDetails(page, job) {
        try {
            await page.goto(job.url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(2000);
            // Get full page text for description
            const bodyText = await page.evaluate(() => {
                const article = document.querySelector('article, [class*="job-description"], [class*="description"], main');
                return article?.textContent || document.body.textContent || '';
            });
            job.description = bodyText.slice(0, 5000);
            // Try to extract more details
            const details = await page.evaluate(() => {
                const getText = (selectors) => {
                    for (const sel of selectors) {
                        const el = document.querySelector(sel);
                        if (el?.textContent)
                            return el.textContent.trim();
                    }
                    return null;
                };
                return {
                    location: getText([
                        '[class*="location"]',
                        '[data-testid*="location"]',
                        'span:has-text("Location")',
                    ]),
                    salary: getText([
                        '[class*="salary"]',
                        '[class*="compensation"]',
                        '[data-testid*="salary"]',
                    ]),
                    applyUrl: document.querySelector('a[href*="apply"], button[class*="apply"]')?.href,
                };
            });
            if (details.location)
                job.location = details.location;
            if (details.salary)
                job.salary = details.salary;
            if (details.applyUrl)
                job.applyUrl = details.applyUrl;
        }
        catch (error) {
            console.error(`Failed to get details for job: ${job.title}`, error);
        }
        return job;
    }
    /**
     * Check if a URL/content looks like a job posting
     */
    looksLikeJobPage(url, title, text) {
        const jobKeywords = [
            'job', 'career', 'position', 'opening', 'hiring', 'apply',
            'engineer', 'developer', 'manager', 'analyst', 'designer'
        ];
        const combined = `${url} ${title} ${text}`.toLowerCase();
        return jobKeywords.some(kw => combined.includes(kw));
    }
    /**
     * Extract job title from content
     */
    extractJobTitle(title, text) {
        // If title looks like a job title, use it
        const titlePatterns = [
            /^(senior|junior|lead|staff|principal)?\s*(software|frontend|backend|fullstack|full-stack|data|ml|ai|devops|cloud|security|mobile|ios|android)\s*(engineer|developer|architect|scientist|analyst)/i,
            /^(product|project|engineering|technical|program)\s*manager/i,
            /^(ux|ui|product|graphic)\s*designer/i,
        ];
        for (const pattern of titlePatterns) {
            if (pattern.test(title)) {
                return title;
            }
        }
        // Try to extract from text
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        for (const line of lines.slice(0, 5)) {
            for (const pattern of titlePatterns) {
                const match = line.match(pattern);
                if (match) {
                    return line.slice(0, 100);
                }
            }
        }
        return title || 'Job Opening';
    }
    /**
     * Extract company name from URL or title
     */
    extractCompany(url, title) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            // Handle common ATS platforms
            if (hostname.includes('greenhouse.io')) {
                const match = url.match(/greenhouse\.io\/([^/]+)/);
                return match ? this.formatCompanyName(match[1]) : '';
            }
            if (hostname.includes('lever.co')) {
                const match = url.match(/lever\.co\/([^/]+)/);
                return match ? this.formatCompanyName(match[1]) : '';
            }
            if (hostname.includes('workday.com')) {
                const match = url.match(/([^.]+)\.wd\d+\.myworkdayjobs\.com/);
                return match ? this.formatCompanyName(match[1]) : '';
            }
            if (hostname.includes('linkedin.com')) {
                // Try to extract from title
                const companyMatch = title.match(/at\s+([^|]+)/i);
                return companyMatch ? companyMatch[1].trim() : '';
            }
            // Use domain name
            const parts = hostname.replace('www.', '').split('.');
            return this.formatCompanyName(parts[0]);
        }
        catch {
            return '';
        }
    }
    /**
     * Format company name
     */
    formatCompanyName(name) {
        return name
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    /**
     * Extract base domain from URL
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        }
        catch {
            return url;
        }
    }
    /**
     * Detect job source from URL
     */
    detectSource(url) {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('linkedin.com'))
            return 'linkedin';
        if (urlLower.includes('indeed.com'))
            return 'indeed';
        if (urlLower.includes('glassdoor.com'))
            return 'glassdoor';
        if (urlLower.includes('greenhouse.io'))
            return 'greenhouse';
        if (urlLower.includes('lever.co'))
            return 'lever';
        if (urlLower.includes('workday.com') || urlLower.includes('myworkdayjobs.com'))
            return 'workday';
        return 'company_site';
    }
    /**
     * Check if job title matches search query
     */
    jobMatchesQuery(title, query) {
        const titleLower = title.toLowerCase();
        const queryWords = query.toLowerCase().split(/\s+/);
        // At least half the query words should be in the title
        const matchCount = queryWords.filter(word => titleLower.includes(word) || word.length < 3).length;
        return matchCount >= queryWords.length / 2;
    }
    /**
     * Generate unique job ID from URL
     */
    generateJobId(url) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
    }
}
//# sourceMappingURL=web-job-discovery.js.map