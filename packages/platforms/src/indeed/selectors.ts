/**
 * Indeed page selectors
 */
export const IndeedSelectors = {
  // Login page
  login: {
    emailInput: '#ifl-InputFormField-3',
    passwordInput: '#ifl-InputFormField-7',
    submitButton: 'button[type="submit"]',
    googleButton: 'button[data-tn-element="google-signin"]',
    errorMessage: '.icl-Alert--error',
    captchaFrame: 'iframe[src*="captcha"]',
  },

  // Navigation
  navigation: {
    profileIcon: '[data-gnav-element-name="Profile"]',
    jobsLink: '[data-gnav-element-name="Jobs"]',
    messagesLink: '[data-gnav-element-name="Messages"]',
    accountMenu: '#AccountMenu',
    signOutLink: 'a[href*="/account/logout"]',
  },

  // Job search
  search: {
    keywordInput: '#text-input-what',
    locationInput: '#text-input-where',
    searchButton: 'button[type="submit"].yosegi-InlineWhatWhere-primaryButton',
    jobCards: '.job_seen_beacon, .resultContent',
    jobTitle: '.jobTitle > a, h2.jobTitle a',
    companyName: '.companyName, [data-testid="company-name"]',
    location: '.companyLocation, [data-testid="text-location"]',
    salary: '.salary-snippet-container, .estimated-salary',
    postedDate: '.date, [data-testid="myJobsStateDate"]',
    easyApplyBadge: '.iaLabel, .indeed-apply-badge',
    pagination: '.pagination, nav[role="navigation"]',
    nextPage: 'a[data-testid="pagination-page-next"]',
    resultsCount: '#searchCountPages, .jobsearch-JobCountAndSortPane-jobCount',
  },

  // Job details (right panel or full page)
  jobDetails: {
    container: '#jobDescriptionText, .jobsearch-JobComponent',
    title: '.jobsearch-JobInfoHeader-title, h1[data-testid="jobsearch-JobInfoHeader-title"]',
    company: '.jobsearch-InlineCompanyRating-companyHeader a, [data-testid="inlineHeader-companyName"]',
    location: '.jobsearch-JobInfoHeader-subtitle > div:first-child, [data-testid="job-location"]',
    description: '#jobDescriptionText',
    applyButton: '#indeedApplyButton, .jobsearch-IndeedApplyButton-newDesign',
    externalApplyButton: 'button[id*="apply"], .jobsearch-ApplyButton-buttonWrapper a',
    saveButton: '.jobsearch-JobSaveButton, button[aria-label*="save"]',
    salary: '#salaryInfoAndJobType, [data-testid="attribute_snippet_testid"]',
    jobType: '.jobsearch-JobMetadataHeader-item',
    benefits: '#benefits',
    companyRating: '.jobsearch-CompanyRating',
  },

  // Indeed Apply modal
  indeedApply: {
    modal: '.indeed-apply-modal, #indeed-ia-modal',
    modalContent: '.indeed-apply-content, .ia-Modal-content',
    continueButton: 'button[data-testid="ia-continueButton"], .ia-continueButton',
    submitButton: 'button[data-testid="ia-submitButton"], .ia-submitButton',
    closeButton: 'button[aria-label="Close"], .ia-Modal-close',
    errorMessages: '.indeed-apply-error, .ia-error-message',

    // Form fields
    fields: {
      firstName: 'input[name="firstName"], #input-firstName',
      lastName: 'input[name="lastName"], #input-lastName',
      email: 'input[name="email"], #input-email',
      phone: 'input[name="phoneNumber"], #input-phoneNumber',
      city: 'input[name="city"]',
      state: 'select[name="state"]',
      resume: 'input[type="file"][name*="resume"]',
      coverLetter: 'textarea[name="coverLetter"], #input-coverLetter',
    },

    // Common questions
    questions: {
      yearsExperience: 'input[name*="experience"], select[name*="experience"]',
      education: 'select[name*="education"]',
      workAuthorization: 'input[name*="authorization"], select[name*="authorization"]',
      sponsorship: 'input[name*="sponsor"], select[name*="sponsor"]',
      startDate: 'input[name*="start"], select[name*="start"]',
      salaryExpectation: 'input[name*="salary"]',
      relocate: 'input[name*="relocate"]',
      remote: 'input[name*="remote"]',
      driverLicense: 'input[name*="license"]',
      drugTest: 'input[name*="drug"]',
      backgroundCheck: 'input[name*="background"]',
    },

    // Progress indicator
    progress: '.indeed-apply-progress, .ia-ProgressBar',
    stepIndicator: '.ia-StepIndicator',
  },

  // Application confirmation
  confirmation: {
    container: '.indeed-apply-confirmation, .ia-Confirmation',
    successMessage: '.ia-success-message, [data-testid="applied-success"]',
    applicationId: '.ia-applicationId',
    viewApplicationsLink: 'a[href*="/myjobs"]',
  },

  // My Jobs page
  myJobs: {
    container: '.my-jobs-container',
    appliedTab: 'button[data-testid="applied-jobs-tab"]',
    savedTab: 'button[data-testid="saved-jobs-tab"]',
    jobCard: '.jobCard, [data-testid="job-card"]',
    applicationStatus: '.applicationStatus, [data-testid="application-status"]',
  },

  // Common elements
  common: {
    loading: '.icl-LoadingIndicator, [role="progressbar"]',
    modal: '.icl-Modal, [role="dialog"]',
    closeModal: 'button[aria-label="Close"], .icl-CloseButton',
    toast: '.icl-Toast',
    alert: '.icl-Alert',
  },
} as const;

/**
 * Indeed URLs
 */
export const IndeedUrls = {
  base: 'https://www.indeed.com',
  login: 'https://secure.indeed.com/auth',
  jobs: 'https://www.indeed.com/jobs',
  jobSearch: 'https://www.indeed.com/jobs',
  viewJob: 'https://www.indeed.com/viewjob',
  myJobs: 'https://www.indeed.com/myjobs',
  profile: 'https://www.indeed.com/account/profile',
  resume: 'https://www.indeed.com/resume',
} as const;
