/**
 * AI Form Filler
 * Uses AI to fill any job application form
 */
import { randomDelay } from '@job-applier/browser-automation';
import { AIPageAnalyzer } from './ai-page-analyzer.js';
export class AIFormFiller {
    analyzer;
    constructor() {
        this.analyzer = new AIPageAnalyzer();
    }
    /**
     * Fill all form fields on the current page
     */
    async fillForm(page, userProfile, jobContext, analysis) {
        const result = {
            success: true,
            fieldsFilled: 0,
            fieldsSkipped: 0,
            errors: [],
        };
        // Get page analysis if not provided
        if (!analysis) {
            analysis = await this.analyzer.analyzePage(page);
        }
        if (!analysis.formFields || analysis.formFields.length === 0) {
            result.errors.push('No form fields detected');
            result.success = false;
            return result;
        }
        console.log(`Found ${analysis.formFields.length} form fields to fill`);
        // Fill each field
        for (const field of analysis.formFields) {
            try {
                const filled = await this.fillField(page, field, userProfile, jobContext);
                if (filled) {
                    result.fieldsFilled++;
                }
                else {
                    result.fieldsSkipped++;
                }
                await new Promise(r => setTimeout(r, randomDelay(200, 500)));
            }
            catch (error) {
                const errorMsg = `Failed to fill ${field.label}: ${error instanceof Error ? error.message : String(error)}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }
        if (result.errors.length > 0 && result.fieldsFilled === 0) {
            result.success = false;
        }
        return result;
    }
    /**
     * Fill a single form field
     */
    async fillField(page, field, userProfile, jobContext) {
        // Get the element
        const element = await page.$(field.selector);
        if (!element) {
            console.log(`Element not found for selector: ${field.selector}`);
            return false;
        }
        // Check if visible
        if (!await element.isVisible()) {
            console.log(`Element not visible: ${field.selector}`);
            return false;
        }
        // Check if already filled
        if (await this.isAlreadyFilled(element, field.type)) {
            console.log(`Field already filled: ${field.label}`);
            return true;
        }
        // Get value to fill
        const value = await this.getValue(field, userProfile, jobContext);
        if (!value && field.required) {
            console.log(`No value for required field: ${field.label}`);
            return false;
        }
        if (!value) {
            return false;
        }
        // Fill based on field type
        await element.scrollIntoViewIfNeeded();
        await new Promise(r => setTimeout(r, randomDelay(100, 300)));
        switch (field.type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'textarea':
                await this.fillTextInput(element, value);
                break;
            case 'file':
                await this.fillFileInput(page, element, value);
                break;
            case 'select':
                await this.fillSelect(page, element, value, field.options);
                break;
            case 'checkbox':
                await this.fillCheckbox(element, value);
                break;
            case 'radio':
                await this.fillRadio(page, field.selector, value, field.options);
                break;
            default:
                console.log(`Unknown field type: ${field.type}`);
                return false;
        }
        console.log(`Filled ${field.label}: ${field.type === 'file' ? '[file]' : value.slice(0, 30)}...`);
        return true;
    }
    /**
     * Get value for a field
     */
    async getValue(field, userProfile, jobContext) {
        // Check for pre-set value
        if (field.value) {
            return field.value;
        }
        // Direct profile mappings
        const profileAsRecord = userProfile;
        if (field.profileMapping) {
            // Simple direct mappings
            const directMappings = {
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                email: userProfile.contact?.email || '',
                phone: userProfile.contact?.phone || '',
                linkedin: userProfile.contact?.linkedin || '',
                website: userProfile.contact?.portfolio || '',
                github: userProfile.contact?.github || '',
                location: userProfile.contact?.location || '',
                city: userProfile.contact?.location || '',
                resumePath: userProfile.resumePath || '',
            };
            if (directMappings[field.profileMapping]) {
                return directMappings[field.profileMapping];
            }
        }
        // Label-based inference
        const labelLower = field.label.toLowerCase();
        // Name fields
        if (labelLower.includes('first name') || labelLower === 'first') {
            return userProfile.firstName;
        }
        if (labelLower.includes('last name') || labelLower === 'last') {
            return userProfile.lastName;
        }
        if (labelLower.includes('full name') || labelLower === 'name') {
            return `${userProfile.firstName} ${userProfile.lastName}`;
        }
        // Contact fields
        if (labelLower.includes('email')) {
            return userProfile.contact?.email || '';
        }
        if (labelLower.includes('phone') || labelLower.includes('mobile') || labelLower.includes('cell')) {
            return userProfile.contact?.phone || '';
        }
        if (labelLower.includes('linkedin')) {
            return userProfile.contact?.linkedin || '';
        }
        if (labelLower.includes('github')) {
            return userProfile.contact?.github || '';
        }
        if (labelLower.includes('website') || labelLower.includes('portfolio')) {
            return userProfile.contact?.portfolio || '';
        }
        if (labelLower.includes('address') || labelLower.includes('location') || labelLower.includes('city')) {
            return userProfile.contact?.location || '';
        }
        // Resume/CV
        if (labelLower.includes('resume') || labelLower.includes('cv')) {
            return userProfile.resumePath || '';
        }
        // For complex or unknown fields, use AI
        return await this.analyzer.determineFieldValue(field, profileAsRecord, jobContext);
    }
    /**
     * Check if field is already filled
     */
    async isAlreadyFilled(element, type) {
        switch (type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'textarea':
                const value = await element.inputValue().catch(() => '');
                return value.length > 0;
            case 'checkbox':
                return await element.isChecked().catch(() => false);
            case 'select':
                const selected = await element.evaluate((el) => el.selectedIndex > 0).catch(() => false);
                return selected;
            default:
                return false;
        }
    }
    /**
     * Fill text input with human-like typing
     */
    async fillTextInput(element, value) {
        await element.click();
        await new Promise(r => setTimeout(r, randomDelay(100, 200)));
        // Clear existing value
        await element.evaluate((el) => {
            el.value = '';
        });
        // Type with human-like speed
        for (const char of value) {
            await element.type(char, { delay: 30 + Math.random() * 70 });
        }
    }
    /**
     * Fill file input
     */
    async fillFileInput(_page, element, filePath) {
        // Handle file input
        const inputFile = element;
        await inputFile.setInputFiles(filePath);
    }
    /**
     * Fill select dropdown
     */
    async fillSelect(_page, element, value, _options) {
        // Get available options
        const availableOptions = await element.evaluate((el) => Array.from(el.options).map(o => ({ value: o.value, text: o.text })));
        // Find best matching option
        const valueLower = value.toLowerCase();
        let bestMatch = availableOptions.find(o => o.text.toLowerCase() === valueLower ||
            o.value.toLowerCase() === valueLower);
        if (!bestMatch) {
            // Partial match
            bestMatch = availableOptions.find(o => o.text.toLowerCase().includes(valueLower) ||
                valueLower.includes(o.text.toLowerCase()));
        }
        if (!bestMatch && availableOptions.length > 1) {
            // Use first non-empty option as fallback
            bestMatch = availableOptions.find(o => o.value && o.value !== '');
        }
        if (bestMatch) {
            await element.selectOption(bestMatch.value);
        }
    }
    /**
     * Fill checkbox
     */
    async fillCheckbox(element, value) {
        const shouldCheck = value.toLowerCase() === 'true' ||
            value.toLowerCase() === 'yes' ||
            value === '1';
        const isChecked = await element.isChecked();
        if (shouldCheck !== isChecked) {
            await element.click();
        }
    }
    /**
     * Fill radio button group
     */
    async fillRadio(page, baseSelector, value, _options) {
        // Find all radio buttons in group
        const groupName = await page.$eval(baseSelector, (el) => el.name);
        const radios = await page.$$(`input[type="radio"][name="${groupName}"]`);
        const valueLower = value.toLowerCase();
        for (const radio of radios) {
            const radioValue = await radio.getAttribute('value') || '';
            const label = await radio.evaluate((el) => {
                const labelEl = el.labels?.[0] || document.querySelector(`label[for="${el.id}"]`);
                return labelEl?.textContent || el.value;
            });
            if (radioValue.toLowerCase() === valueLower ||
                label.toLowerCase().includes(valueLower)) {
                await radio.click();
                return;
            }
        }
        // If no match, select first option
        if (radios.length > 0) {
            await radios[0].click();
        }
    }
    /**
     * Handle common application questions using AI
     */
    async answerQuestion(question, userProfile, jobContext) {
        const field = {
            selector: '',
            type: 'textarea',
            label: question,
            required: true,
        };
        return await this.analyzer.determineFieldValue(field, userProfile, jobContext);
    }
}
//# sourceMappingURL=ai-form-filler.js.map