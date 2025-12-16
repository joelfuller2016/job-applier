/**
 * Base error class for JobAutoApply
 */
export class JobApplierError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'JobApplierError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Configuration error
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends JobApplierError {
  public readonly validationErrors: string[];

  constructor(message: string, errors: string[], context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    this.validationErrors = errors;
  }
}

/**
 * API error (for external API calls)
 */
export class ApiError extends JobApplierError {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    response?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', context);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends JobApplierError {
  public readonly retryAfter?: number; // seconds
  public readonly platform?: string;

  constructor(
    message: string,
    retryAfter?: number,
    platform?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_ERROR', context);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.platform = platform;
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends JobApplierError {
  public readonly platform?: string;

  constructor(
    message: string,
    platform?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHENTICATION_ERROR', context);
    this.name = 'AuthenticationError';
    this.platform = platform;
  }
}

/**
 * Browser automation error
 */
export class BrowserError extends JobApplierError {
  public readonly selector?: string;
  public readonly url?: string;
  public readonly screenshotPath?: string;

  constructor(
    message: string,
    context?: {
      selector?: string;
      url?: string;
      screenshotPath?: string;
      [key: string]: unknown;
    }
  ) {
    super(message, 'BROWSER_ERROR', context);
    this.name = 'BrowserError';
    this.selector = context?.selector;
    this.url = context?.url;
    this.screenshotPath = context?.screenshotPath;
  }
}

/**
 * Database error
 */
export class DatabaseError extends JobApplierError {
  public readonly query?: string;

  constructor(
    message: string,
    query?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'DATABASE_ERROR', context);
    this.name = 'DatabaseError';
    this.query = query;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends JobApplierError {
  public readonly configKey?: string;

  constructor(
    message: string,
    configKey?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'ConfigurationError';
    this.configKey = configKey;
  }
}

/**
 * Resume parsing error
 */
export class ResumeParseError extends JobApplierError {
  public readonly filePath?: string;

  constructor(
    message: string,
    filePath?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'RESUME_PARSE_ERROR', context);
    this.name = 'ResumeParseError';
    this.filePath = filePath;
  }
}

/**
 * Job application error
 */
export class ApplicationError extends JobApplierError {
  public readonly jobId?: string;
  public readonly platform?: string;
  public readonly step?: string;

  constructor(
    message: string,
    context?: {
      jobId?: string;
      platform?: string;
      step?: string;
      [key: string]: unknown;
    }
  ) {
    super(message, 'APPLICATION_ERROR', context);
    this.name = 'ApplicationError';
    this.jobId = context?.jobId;
    this.platform = context?.platform;
    this.step = context?.step;
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): JobApplierError {
  if (error instanceof JobApplierError) {
    return error;
  }

  if (error instanceof Error) {
    return new JobApplierError(error.message, 'UNKNOWN_ERROR', {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new JobApplierError(
    String(error),
    'UNKNOWN_ERROR',
    { originalValue: error }
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }

  if (error instanceof ApiError) {
    // Retry on server errors and rate limits
    return error.statusCode !== undefined &&
      (error.statusCode >= 500 || error.statusCode === 429);
  }

  if (error instanceof BrowserError) {
    // Some browser errors are retryable (timeout, network issues)
    return error.message.includes('timeout') ||
      error.message.includes('network');
  }

  return false;
}

/**
 * Get retry delay for an error
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 1 minute

  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000;
  }

  // Exponential backoff with jitter
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(2, attempt),
    maxDelay
  );

  const jitter = Math.random() * 0.3 * exponentialDelay;
  return exponentialDelay + jitter;
}
