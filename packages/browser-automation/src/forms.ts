import { Page } from 'playwright';
import { BrowserError, UserProfile } from '@job-applier/core';
import {
  fillField,
  selectOption,
  setCheckbox,
  uploadFile,
  clickElement,
  elementExists,
  waitForElement,
  humanDelay,
} from './actions.js';

/**
 * Form field definition
 */
export interface FormField {
  selector: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  value?: string | boolean;
  required?: boolean;
}

/**
 * Form definition
 */
export interface FormDefinition {
  fields: FormField[];
  submitSelector?: string;
}

/**
 * Fill a single form field
 */
export async function fillFormField(
  page: Page,
  field: FormField
): Promise<boolean> {
  if (field.value === undefined || field.value === null) {
    return false;
  }

  const exists = await elementExists(page, field.selector);
  if (!exists) {
    if (field.required) {
      throw new BrowserError(`Required field not found: ${field.selector}`);
    }
    return false;
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'textarea':
      await fillField(page, field.selector, String(field.value));
      break;

    case 'select':
      await selectOption(page, field.selector, String(field.value));
      break;

    case 'checkbox':
      await setCheckbox(page, field.selector, Boolean(field.value));
      break;

    case 'radio':
      if (field.value) {
        await clickElement(page, field.selector);
      }
      break;

    case 'file':
      await uploadFile(page, field.selector, String(field.value));
      break;

    default:
      throw new BrowserError(`Unknown field type: ${field.type}`);
  }

  return true;
}

/**
 * Fill an entire form
 */
export async function fillForm(
  page: Page,
  form: FormDefinition
): Promise<{ filled: number; skipped: number; errors: string[] }> {
  let filled = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const field of form.fields) {
    try {
      const success = await fillFormField(page, field);
      if (success) {
        filled++;
      } else {
        skipped++;
      }
    } catch (error) {
      errors.push(`${field.selector}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { filled, skipped, errors };
}

/**
 * Submit a form
 */
export async function submitForm(
  page: Page,
  submitSelector: string
): Promise<void> {
  await humanDelay();
  await clickElement(page, submitSelector);
}

/**
 * Common job application form field mappings
 */
export interface JobApplicationFormFields {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  resume?: string;
  coverLetter?: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsExperience?: string;
  salary?: string;
  startDate?: string;
  sponsorship?: boolean;
  relocate?: boolean;
  remote?: boolean;
  customQuestions?: Record<string, string>;
}

/**
 * Generate form fields from user profile
 */
export function profileToFormFields(
  profile: UserProfile,
  coverLetterPath?: string
): JobApplicationFormFields {
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName,
    email: profile.contact.email,
    phone: profile.contact.phone,
    location: profile.contact.location,
    linkedin: profile.contact.linkedin,
    github: profile.contact.github,
    website: profile.contact.portfolio,
    resume: profile.resumePath,
    coverLetter: coverLetterPath,
    currentTitle: profile.headline,
    currentCompany: profile.experience[0]?.company,
    yearsExperience: calculateYearsExperience(profile),
  };
}

/**
 * Calculate total years of experience
 */
function calculateYearsExperience(profile: UserProfile): string {
  if (profile.experience.length === 0) return '0';

  const earliest = profile.experience
    .map(exp => exp.startDate)
    .sort()[0];

  if (!earliest) return '0';

  const startYear = parseInt(earliest.split('-')[0], 10);
  const currentYear = new Date().getFullYear();
  const years = currentYear - startYear;

  return String(Math.max(0, years));
}

/**
 * Detect and fill common form fields automatically
 */
export async function autoFillApplicationForm(
  page: Page,
  formFields: JobApplicationFormFields,
  selectors: Record<string, string>
): Promise<{ filled: number; skipped: number; errors: string[] }> {
  const fieldMappings: FormField[] = [];

  // Build field mappings
  if (selectors.firstName && formFields.firstName) {
    fieldMappings.push({ selector: selectors.firstName, type: 'text', value: formFields.firstName });
  }
  if (selectors.lastName && formFields.lastName) {
    fieldMappings.push({ selector: selectors.lastName, type: 'text', value: formFields.lastName });
  }
  if (selectors.fullName && formFields.fullName) {
    fieldMappings.push({ selector: selectors.fullName, type: 'text', value: formFields.fullName });
  }
  if (selectors.email && formFields.email) {
    fieldMappings.push({ selector: selectors.email, type: 'email', value: formFields.email });
  }
  if (selectors.phone && formFields.phone) {
    fieldMappings.push({ selector: selectors.phone, type: 'tel', value: formFields.phone });
  }
  if (selectors.location && formFields.location) {
    fieldMappings.push({ selector: selectors.location, type: 'text', value: formFields.location });
  }
  if (selectors.linkedin && formFields.linkedin) {
    fieldMappings.push({ selector: selectors.linkedin, type: 'text', value: formFields.linkedin });
  }
  if (selectors.github && formFields.github) {
    fieldMappings.push({ selector: selectors.github, type: 'text', value: formFields.github });
  }
  if (selectors.website && formFields.website) {
    fieldMappings.push({ selector: selectors.website, type: 'text', value: formFields.website });
  }
  if (selectors.resume && formFields.resume) {
    fieldMappings.push({ selector: selectors.resume, type: 'file', value: formFields.resume });
  }
  if (selectors.coverLetter && formFields.coverLetter) {
    fieldMappings.push({ selector: selectors.coverLetter, type: 'file', value: formFields.coverLetter });
  }

  return fillForm(page, { fields: fieldMappings });
}

/**
 * Wait for form to be ready
 */
export async function waitForFormReady(
  page: Page,
  formSelector: string,
  timeout = 30000
): Promise<void> {
  await waitForElement(page, formSelector, { timeout, state: 'visible' });
}
