/**
 * Central export for all types
 */

export * from './profile.js';
export * from './job.js';
export * from './application.js';
export * from './platform.js';
export * from './matching.js';

// Type aliases for backward compatibility
export { WorkExperience as Experience } from './profile.js';
