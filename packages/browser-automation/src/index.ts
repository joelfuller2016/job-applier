// Browser manager exports
export {
  BrowserManager,
  getBrowserManager,
} from './browser.js';

// Actions exports
export {
  randomDelay,
  humanDelay,
  waitForElement,
  clickElement,
  typeText,
  fillField,
  selectOption,
  setCheckbox,
  uploadFile,
  getTextContent,
  getAttribute,
  elementExists,
  scrollIntoView,
  navigateTo,
  waitForNavigation,
  getAllElements,
  evaluate,
  type WaitOptions,
  type ClickOptions,
  type TypeOptions,
} from './actions.js';

// Forms exports
export {
  fillFormField,
  fillForm,
  submitForm,
  profileToFormFields,
  autoFillApplicationForm,
  waitForFormReady,
  type FormField,
  type FormDefinition,
  type JobApplicationFormFields,
} from './forms.js';

// Session exports
export {
  SessionManager,
  sessionManager,
  getSessionManager,
  createPageWithSession,
  savePageSession,
  type SessionState,
} from './session.js';

// Re-export playwright types
export type { Page, Browser, BrowserContext, Locator } from 'playwright';
