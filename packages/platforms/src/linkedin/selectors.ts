/**
 * LinkedIn page selectors
 */
export const LinkedInSelectors = {
  // Login page
  login: {
    emailInput: '#username',
    passwordInput: '#password',
    submitButton: 'button[type="submit"]',
    errorMessage: '.form__label--error',
    rememberMe: '#rememberMeOptIn',
  },

  // Navigation
  navigation: {
    profileIcon: '.global-nav__me-photo',
    jobsLink: 'a[href*="/jobs"]',
    homeLink: 'a[href*="/feed"]',
    messagesLink: 'a[href*="/messaging"]',
  },

  // Job search
  search: {
    searchInput: 'input[aria-label="Search by title, skill, or company"]',
    locationInput: 'input[aria-label="City, state, or zip code"]',
    searchButton: 'button[aria-label="Search"]',
    jobCards: '.jobs-search-results__list-item',
    jobTitle: '.job-card-list__title',
    companyName: '.job-card-container__company-name',
    location: '.job-card-container__metadata-item',
    postedDate: '.job-card-container__listed-time',
    easyApplyBadge: '.job-card-container__apply-method',
  },

  // Job details
  jobDetails: {
    container: '.jobs-details',
    title: '.job-details-jobs-unified-top-card__job-title',
    company: '.job-details-jobs-unified-top-card__company-name',
    location: '.job-details-jobs-unified-top-card__bullet',
    description: '.jobs-description-content__text',
    applyButton: '.jobs-apply-button',
    easyApplyButton: '.jobs-apply-button--top-card',
    saveButton: '.jobs-save-button',
    applicantCount: '.jobs-unified-top-card__applicant-count',
    postedTime: '.jobs-unified-top-card__posted-date',
  },

  // Easy Apply modal
  easyApply: {
    modal: '.jobs-easy-apply-modal',
    modalTitle: '.jobs-easy-apply-modal__title',
    nextButton: 'button[aria-label="Continue to next step"]',
    reviewButton: 'button[aria-label="Review your application"]',
    submitButton: 'button[aria-label="Submit application"]',
    closeButton: 'button[aria-label="Dismiss"]',
    errorMessages: '.artdeco-inline-feedback--error',

    // Form fields
    fields: {
      firstName: 'input[name="firstName"]',
      lastName: 'input[name="lastName"]',
      email: 'input[name="email"]',
      phone: 'input[name="phone"]',
      phoneCountry: 'select[name="phoneCountryCode"]',
      city: 'input[name="city"]',
      resume: 'input[type="file"][name*="resume"]',
      coverLetter: 'input[type="file"][name*="cover"]',
      linkedin: 'input[name="urls[LinkedIn]"]',
      website: 'input[name="urls[Portfolio]"]',
    },

    // Common questions
    questions: {
      yearsExperience: 'input[name*="years"]',
      currentlyEmployed: 'input[name*="currently"]',
      sponsorship: 'input[name*="visa"]',
      startDate: 'input[name*="start"]',
      salaryExpectation: 'input[name*="salary"]',
      relocate: 'input[name*="relocate"]',
      remote: 'input[name*="remote"]',
      workAuthorization: 'select[name*="authorization"]',
    },

    // Follow company checkbox
    followCompany: 'input[name="followCompany"]',

    // Progress indicator
    progress: '.jobs-easy-apply-modal__progress',
    progressBar: '.artdeco-completeness-meter-linear__progress-element',
  },

  // Application confirmation
  confirmation: {
    container: '.jobs-apply-form-confirmation',
    successMessage: '.artdeco-toast-item--visible',
    applicationId: '.jobs-apply-form-confirmation__application-id',
  },

  // Premium/InMail
  premium: {
    premiumBadge: '.premium-icon',
    inMailButton: '.message-anywhere-button',
  },

  // Common elements
  common: {
    loading: '.artdeco-loader',
    pagination: '.artdeco-pagination',
    nextPage: '.artdeco-pagination__button--next',
    prevPage: '.artdeco-pagination__button--previous',
  },
} as const;

/**
 * LinkedIn URLs
 */
export const LinkedInUrls = {
  base: 'https://www.linkedin.com',
  login: 'https://www.linkedin.com/login',
  feed: 'https://www.linkedin.com/feed/',
  jobs: 'https://www.linkedin.com/jobs/',
  jobSearch: 'https://www.linkedin.com/jobs/search/',
  myJobs: 'https://www.linkedin.com/my-items/saved-jobs/',
  appliedJobs: 'https://www.linkedin.com/my-items/applied-jobs/',
} as const;
