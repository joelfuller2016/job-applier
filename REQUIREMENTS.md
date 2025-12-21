# Job-Applier: Comprehensive Requirements Document

**Version:** 1.0
**Last Updated:** December 2024
**Document Status:** Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Goals & Objectives](#2-project-goals--objectives)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technical Requirements](#5-technical-requirements)
6. [Security Requirements](#6-security-requirements)
7. [User Interface Requirements](#7-user-interface-requirements)
8. [Integration Requirements](#8-integration-requirements)
9. [Data Requirements](#9-data-requirements)
10. [Performance Requirements](#10-performance-requirements)
11. [Deployment & Operations Requirements](#11-deployment--operations-requirements)
12. [Compliance & Legal Requirements](#12-compliance--legal-requirements)
13. [Application Modules System](#13-application-modules-system)
14. [Platform Integration Modules](#14-platform-integration-modules)
15. [Testing Requirements](#15-testing-requirements)
16. [Acceptance Criteria](#16-acceptance-criteria)
17. [Future Roadmap](#17-future-roadmap)

---

## 1. Executive Summary

### 1.1 Project Overview

**Job-Applier** is an AI-powered automated job application system designed to streamline the job search process. The platform intelligently discovers job opportunities, matches them against user profiles using Claude AI analysis, and automates the application submission process through browser automation.

### 1.2 Vision Statement

To create a comprehensive job search automation platform that reduces the time and effort required to find and apply for suitable job opportunities while maintaining high-quality matches and giving users complete control over their job search.

### 1.3 Target Users

- **Primary Users:** Active job seekers looking to automate repetitive application tasks
- **Secondary Users:** Career changers managing multiple job profiles for different roles
- **Tertiary Users:** Recruiters or career coaches assisting clients with job applications

### 1.4 Key Value Propositions

1. AI-powered job-profile matching beyond simple keyword matching
2. Multi-source job discovery combining semantic search with direct scraping
3. Automated application submission reducing manual work
4. Multiple profile support for different job search strategies
5. Comprehensive application tracking and analytics
6. Privacy-focused with local database and encrypted credentials

---

## 2. Project Goals & Objectives

### 2.1 Primary Goals

| ID | Goal | Description | Success Metric |
|----|------|-------------|----------------|
| G1 | Automate Job Discovery | Automatically find relevant job postings matching user preferences | >80% match relevance rating |
| G2 | AI-Powered Matching | Use AI to analyze job-profile compatibility beyond keywords | Match score accuracy >85% |
| G3 | Streamline Applications | Reduce time spent on repetitive application tasks | 75% reduction in manual effort |
| G4 | Track Progress | Provide comprehensive tracking of all applications | 100% application status visibility |
| G5 | Maintain Quality | Ensure applications are high-quality and personalized | <10% rejection due to poor fit |

### 2.2 Secondary Goals

| ID | Goal | Description |
|----|------|-------------|
| G6 | Multi-Profile Support | Allow users to maintain multiple profiles for different job types |
| G7 | Analytics & Insights | Provide actionable insights from application data |
| G8 | Platform Integration | Support major job boards (LinkedIn, Indeed, etc.) |
| G9 | User Control | Give users complete control over automation decisions |
| G10 | Security & Privacy | Protect user data and credentials with encryption |

### 2.3 Business Objectives

- Reduce average job search time by 50%
- Increase application submission rate by 300%
- Improve interview-to-application ratio by 25%
- Achieve 90% user satisfaction rating

---

## 3. Functional Requirements

### 3.1 User Authentication & Account Management

#### FR-AUTH-001: User Registration
**Priority:** High
**Description:** Users must be able to create accounts to access the platform.

| Requirement | Details |
|------------|---------|
| FR-AUTH-001.1 | Support Google OAuth 2.0 authentication with secure callback handling |
| FR-AUTH-001.2 | Support email/password credential authentication with bcrypt hashing |
| FR-AUTH-001.3 | Validate email format during registration (RFC 5322 compliant) |
| FR-AUTH-001.4 | Create user record in database upon successful registration |
| FR-AUTH-001.5 | Generate secure session token upon login (256-bit entropy) |
| FR-AUTH-001.6 | Support GitHub OAuth 2.0 as alternative provider |
| FR-AUTH-001.7 | Support Microsoft/Azure AD OAuth for enterprise users |
| FR-AUTH-001.8 | Implement email verification flow with secure token |
| FR-AUTH-001.9 | Enforce password complexity (min 8 chars, mixed case, number, symbol) |
| FR-AUTH-001.10 | Implement rate limiting on registration (5 attempts/IP/hour) |

#### FR-AUTH-002: User Login
**Priority:** High
**Description:** Users must be able to securely log into the platform.

| Requirement | Details |
|------------|---------|
| FR-AUTH-002.1 | Support multiple authentication providers (Google, GitHub, Microsoft, credentials) |
| FR-AUTH-002.2 | Implement session management with HttpOnly, Secure, SameSite cookies |
| FR-AUTH-002.3 | Persist login state across browser sessions (remember me option) |
| FR-AUTH-002.4 | Track last login timestamp and IP address |
| FR-AUTH-002.5 | Support logout functionality with complete session invalidation |
| FR-AUTH-002.6 | Implement brute force protection (lockout after 5 failed attempts) |
| FR-AUTH-002.7 | Support account lockout notification via email |
| FR-AUTH-002.8 | Implement session timeout (configurable, default 24 hours) |
| FR-AUTH-002.9 | Support concurrent session management (limit active sessions) |
| FR-AUTH-002.10 | Provide "logout from all devices" functionality |

#### FR-AUTH-003: Two-Factor Authentication (2FA)
**Priority:** High
**Description:** Users must be able to enable 2FA for enhanced security.

| Requirement | Details |
|------------|---------|
| FR-AUTH-003.1 | Support TOTP-based 2FA (Google Authenticator, Authy compatible) |
| FR-AUTH-003.2 | Generate and display QR code for authenticator setup |
| FR-AUTH-003.3 | Provide backup codes (10 single-use recovery codes) |
| FR-AUTH-003.4 | Allow 2FA to be enabled/disabled from settings |
| FR-AUTH-003.5 | Require current password to modify 2FA settings |
| FR-AUTH-003.6 | Support SMS-based 2FA as fallback option |
| FR-AUTH-003.7 | Implement 2FA bypass for trusted devices (30-day remember) |
| FR-AUTH-003.8 | Log all 2FA events for security audit |

#### FR-AUTH-004: Password Management
**Priority:** High
**Description:** Users must be able to manage their passwords securely.

| Requirement | Details |
|------------|---------|
| FR-AUTH-004.1 | Support password reset via email with secure token |
| FR-AUTH-004.2 | Implement password reset token expiration (1 hour) |
| FR-AUTH-004.3 | Allow password change from account settings |
| FR-AUTH-004.4 | Require current password for password changes |
| FR-AUTH-004.5 | Prevent reuse of last 5 passwords |
| FR-AUTH-004.6 | Check passwords against known breach databases (HaveIBeenPwned) |
| FR-AUTH-004.7 | Display password strength indicator during entry |
| FR-AUTH-004.8 | Send email notification on password change |

#### FR-AUTH-005: Demo Mode
**Priority:** Medium
**Description:** Provide a demo mode for testing without production credentials.

| Requirement | Details |
|------------|---------|
| FR-AUTH-005.1 | Enable demo mode only when APP_MODE=demo AND NODE_ENV=development |
| FR-AUTH-005.2 | Provide default demo credentials (demo@example.com / demo123) |
| FR-AUTH-005.3 | Gate all mock data behind isDemoMode() checks |
| FR-AUTH-005.4 | Explicitly disable demo features in production builds |
| FR-AUTH-005.5 | Display clear "Demo Mode" indicator in UI |
| FR-AUTH-005.6 | Reset demo data on each session start |
| FR-AUTH-005.7 | Prevent demo credentials from working in production |

#### FR-AUTH-006: Account Management
**Priority:** Medium
**Description:** Users must be able to manage their account settings.

| Requirement | Details |
|------------|---------|
| FR-AUTH-006.1 | Allow users to update display name and avatar |
| FR-AUTH-006.2 | Support account deletion with cascade delete of all data |
| FR-AUTH-006.3 | Display current authentication provider(s) |
| FR-AUTH-006.4 | Show email verification status with resend option |
| FR-AUTH-006.5 | Allow linking multiple OAuth providers to one account |
| FR-AUTH-006.6 | Support unlinking OAuth providers (if password set) |
| FR-AUTH-006.7 | Display active sessions with device/location info |
| FR-AUTH-006.8 | Allow terminating individual sessions |
| FR-AUTH-006.9 | Implement account export for GDPR compliance |
| FR-AUTH-006.10 | Require email confirmation for account deletion |

#### FR-AUTH-007: Platform Credentials Management
**Priority:** High
**Description:** System must securely manage credentials for job platforms.

| Requirement | Details |
|------------|---------|
| FR-AUTH-007.1 | Store LinkedIn credentials with AES-256-GCM encryption |
| FR-AUTH-007.2 | Store Indeed credentials with AES-256-GCM encryption |
| FR-AUTH-007.3 | Store Glassdoor credentials with AES-256-GCM encryption |
| FR-AUTH-007.4 | Store ZipRecruiter credentials with AES-256-GCM encryption |
| FR-AUTH-007.5 | Support OAuth tokens for platforms that offer it |
| FR-AUTH-007.6 | Implement secure key derivation (PBKDF2 with 100k iterations) |
| FR-AUTH-007.7 | Never log or display plaintext passwords |
| FR-AUTH-007.8 | Validate credential encryption on storage |
| FR-AUTH-007.9 | Support credential rotation without re-entry |
| FR-AUTH-007.10 | Detect and alert on credential expiration |

#### FR-AUTH-008: Session Persistence for Automation
**Priority:** High
**Description:** System must maintain authenticated sessions for browser automation.

| Requirement | Details |
|------------|---------|
| FR-AUTH-008.1 | Persist browser cookies between automation sessions |
| FR-AUTH-008.2 | Store session data with 24-hour validity window |
| FR-AUTH-008.3 | Support platform-specific session files (linkedin.json, indeed.json) |
| FR-AUTH-008.4 | Implement automatic session refresh before expiration |
| FR-AUTH-008.5 | Detect login status before each automation run |
| FR-AUTH-008.6 | Handle CAPTCHA detection with user notification |
| FR-AUTH-008.7 | Support manual login fallback for CAPTCHA resolution |
| FR-AUTH-008.8 | Implement session recovery after browser crash |
| FR-AUTH-008.9 | Track session activity timestamps |
| FR-AUTH-008.10 | Clean up expired sessions automatically |

#### FR-AUTH-009: Admin Authentication
**Priority:** High
**Description:** Administrators must have elevated access controls.

| Requirement | Details |
|------------|---------|
| FR-AUTH-009.1 | Support admin role designation in user records |
| FR-AUTH-009.2 | Require 2FA for all admin accounts |
| FR-AUTH-009.3 | Implement admin session timeout (4 hours max) |
| FR-AUTH-009.4 | Log all admin actions for audit trail |
| FR-AUTH-009.5 | Support admin impersonation for troubleshooting |
| FR-AUTH-009.6 | Require additional authentication for sensitive admin actions |
| FR-AUTH-009.7 | Implement IP whitelist option for admin access |
| FR-AUTH-009.8 | Send alerts on admin login from new device/location |

---

### 3.2 Profile Management

#### FR-PROF-001: Profile Creation
**Priority:** High
**Description:** Users must be able to create job seeker profiles.

| Requirement | Details |
|------------|---------|
| FR-PROF-001.1 | Capture personal information (name, contact, headline) |
| FR-PROF-001.2 | Support professional summary/bio |
| FR-PROF-001.3 | Record work experience with company, title, dates, descriptions |
| FR-PROF-001.4 | Capture education history with institutions, degrees, dates |
| FR-PROF-001.5 | Maintain skills list with proficiency levels |
| FR-PROF-001.6 | Store certifications with issuer and dates |
| FR-PROF-001.7 | Record projects with descriptions and technologies |

#### FR-PROF-002: Resume Parsing
**Priority:** High
**Description:** System must parse uploaded resumes to populate profile data.

| Requirement | Details |
|------------|---------|
| FR-PROF-002.1 | Support PDF file format |
| FR-PROF-002.2 | Support DOCX file format |
| FR-PROF-002.3 | Support DOC file format |
| FR-PROF-002.4 | Support TXT file format |
| FR-PROF-002.5 | Use Claude AI for intelligent parsing |
| FR-PROF-002.6 | Extract contact information (email, phone, location) |
| FR-PROF-002.7 | Parse work experience into structured format |
| FR-PROF-002.8 | Parse education history into structured format |
| FR-PROF-002.9 | Extract skills and categorize them |
| FR-PROF-002.10 | Provide parsing confidence scores |
| FR-PROF-002.11 | Return parsing warnings for ambiguous content |
| FR-PROF-002.12 | Suggest target roles based on resume analysis |

#### FR-PROF-003: Profile Preferences
**Priority:** High
**Description:** Users must be able to set job search preferences.

| Requirement | Details |
|------------|---------|
| FR-PROF-003.1 | Define target job titles |
| FR-PROF-003.2 | Set preferred work locations |
| FR-PROF-003.3 | Specify salary range expectations |
| FR-PROF-003.4 | Select work arrangements (remote, hybrid, on-site) |
| FR-PROF-003.5 | Choose employment types (full-time, contract, etc.) |
| FR-PROF-003.6 | Set willingness to relocate |
| FR-PROF-003.7 | Define company size preferences |
| FR-PROF-003.8 | Specify industry preferences |

#### FR-PROF-004: Multi-Profile Support
**Priority:** Medium
**Description:** Users must be able to maintain multiple profiles.

| Requirement | Details |
|------------|---------|
| FR-PROF-004.1 | Create unlimited profiles per user |
| FR-PROF-004.2 | Set a default/active profile |
| FR-PROF-004.3 | Duplicate existing profiles for quick setup |
| FR-PROF-004.4 | Delete profiles with confirmation |
| FR-PROF-004.5 | Switch between profiles in UI |

---

### 3.3 Job Discovery

#### FR-DISC-001: Job Search
**Priority:** High
**Description:** System must discover relevant job opportunities.

| Requirement | Details |
|------------|---------|
| FR-DISC-001.1 | Integrate with Exa API for semantic search |
| FR-DISC-001.2 | Support natural language job queries |
| FR-DISC-001.3 | Search based on profile preferences |
| FR-DISC-001.4 | Filter by job platform (LinkedIn, Indeed, etc.) |
| FR-DISC-001.5 | Filter by employment type |
| FR-DISC-001.6 | Filter by location |
| FR-DISC-001.7 | Filter by salary range |
| FR-DISC-001.8 | Support keyword searches |
| FR-DISC-001.9 | Limit results by configurable maximum |

#### FR-DISC-002: Job Data Extraction
**Priority:** High
**Description:** System must extract structured data from job listings.

| Requirement | Details |
|------------|---------|
| FR-DISC-002.1 | Extract job title |
| FR-DISC-002.2 | Extract company name |
| FR-DISC-002.3 | Extract job location |
| FR-DISC-002.4 | Extract job description |
| FR-DISC-002.5 | Extract requirements and qualifications |
| FR-DISC-002.6 | Extract salary information when available |
| FR-DISC-002.7 | Extract benefits information |
| FR-DISC-002.8 | Identify required skills |
| FR-DISC-002.9 | Detect easy-apply availability |
| FR-DISC-002.10 | Detect work arrangement type |
| FR-DISC-002.11 | Extract application URL |

#### FR-DISC-003: Job Recommendations
**Priority:** Medium
**Description:** System should recommend similar jobs.

| Requirement | Details |
|------------|---------|
| FR-DISC-003.1 | Suggest similar jobs based on saved jobs |
| FR-DISC-003.2 | Recommend jobs based on application history |
| FR-DISC-003.3 | Provide personalized daily job recommendations |

---

### 3.4 AI Job Matching

#### FR-MATCH-001: Match Scoring
**Priority:** High
**Description:** System must calculate match scores between jobs and profiles.

| Requirement | Details |
|------------|---------|
| FR-MATCH-001.1 | Calculate overall match score (0-100) |
| FR-MATCH-001.2 | Calculate skills match score (40% weight) |
| FR-MATCH-001.3 | Calculate experience match score (25% weight) |
| FR-MATCH-001.4 | Calculate location match score (15% weight) |
| FR-MATCH-001.5 | Calculate salary match score (15% weight) |
| FR-MATCH-001.6 | Calculate title match score (5% weight) |
| FR-MATCH-001.7 | Determine fit category (excellent, good, moderate, stretch, unlikely) |
| FR-MATCH-001.8 | Provide confidence level (0-1) |

#### FR-MATCH-002: Match Analysis
**Priority:** High
**Description:** AI must provide detailed match analysis.

| Requirement | Details |
|------------|---------|
| FR-MATCH-002.1 | Identify matching strengths |
| FR-MATCH-002.2 | Identify skill gaps |
| FR-MATCH-002.3 | Provide application recommendations |
| FR-MATCH-002.4 | Generate tailored talking points |
| FR-MATCH-002.5 | Highlight transferable skills |

#### FR-MATCH-003: Match Filtering
**Priority:** Medium
**Description:** Users must be able to filter jobs by match quality.

| Requirement | Details |
|------------|---------|
| FR-MATCH-003.1 | Set minimum match score threshold |
| FR-MATCH-003.2 | Filter by fit category |
| FR-MATCH-003.3 | Sort jobs by match score |

---

### 3.5 Job Hunt Workflow

#### FR-HUNT-001: Hunt Initiation
**Priority:** High
**Description:** Users must be able to start AI-powered job hunts.

| Requirement | Details |
|------------|---------|
| FR-HUNT-001.1 | Configure search query parameters |
| FR-HUNT-001.2 | Select target profile |
| FR-HUNT-001.3 | Set maximum jobs to discover |
| FR-HUNT-001.4 | Set match score threshold |
| FR-HUNT-001.5 | Select job sources (platforms) |
| FR-HUNT-001.6 | Enable/disable auto-apply mode |
| FR-HUNT-001.7 | Support dry-run mode for testing |

#### FR-HUNT-002: Hunt Execution
**Priority:** High
**Description:** System must execute job hunt workflow.

| Requirement | Details |
|------------|---------|
| FR-HUNT-002.1 | Discover jobs based on search criteria |
| FR-HUNT-002.2 | Match discovered jobs against profile |
| FR-HUNT-002.3 | Filter jobs by match threshold |
| FR-HUNT-002.4 | Optionally auto-apply to matching jobs |
| FR-HUNT-002.5 | Track hunt progress in real-time |
| FR-HUNT-002.6 | Log all hunt activities |

#### FR-HUNT-003: Quick Apply
**Priority:** Medium
**Description:** Users must be able to quickly apply to specific roles.

| Requirement | Details |
|------------|---------|
| FR-HUNT-003.1 | Target specific company |
| FR-HUNT-003.2 | Target specific role |
| FR-HUNT-003.3 | Auto-discover matching positions |
| FR-HUNT-003.4 | Submit applications automatically |

---

### 3.6 Application Submission

#### FR-APP-001: Browser Automation
**Priority:** High
**Description:** System must automate application submission via browser.

| Requirement | Details |
|------------|---------|
| FR-APP-001.1 | Support LinkedIn Easy Apply |
| FR-APP-001.2 | Support Indeed Quick Apply |
| FR-APP-001.3 | Support direct company website applications |
| FR-APP-001.4 | Navigate application forms automatically |
| FR-APP-001.5 | Fill form fields with profile data |
| FR-APP-001.6 | Upload resume documents |
| FR-APP-001.7 | Handle multi-step application forms |

#### FR-APP-002: Form Intelligence
**Priority:** High
**Description:** AI must intelligently complete application forms.

| Requirement | Details |
|------------|---------|
| FR-APP-002.1 | Analyze form field purposes |
| FR-APP-002.2 | Map profile data to form fields |
| FR-APP-002.3 | Generate appropriate responses for text fields |
| FR-APP-002.4 | Handle dropdown selections |
| FR-APP-002.5 | Handle checkbox and radio selections |
| FR-APP-002.6 | Skip optional fields when appropriate |

#### FR-APP-003: Cover Letter Generation
**Priority:** Medium
**Description:** System should generate personalized cover letters.

| Requirement | Details |
|------------|---------|
| FR-APP-003.1 | Generate cover letter based on job description |
| FR-APP-003.2 | Personalize based on profile data |
| FR-APP-003.3 | Highlight relevant experience |
| FR-APP-003.4 | Allow user editing before submission |
| FR-APP-003.5 | Save cover letters for future reference |

#### FR-APP-004: Platform Credentials
**Priority:** High
**Description:** System must securely manage platform login credentials.

| Requirement | Details |
|------------|---------|
| FR-APP-004.1 | Store credentials for LinkedIn |
| FR-APP-004.2 | Store credentials for Indeed |
| FR-APP-004.3 | Encrypt all stored credentials |
| FR-APP-004.4 | Support OAuth tokens where available |
| FR-APP-004.5 | Manage session persistence |

---

### 3.7 Application Tracking

#### FR-TRACK-001: Application Status Management
**Priority:** High
**Description:** System must track application lifecycle.

| Requirement | Details |
|------------|---------|
| FR-TRACK-001.1 | Track draft status |
| FR-TRACK-001.2 | Track submitted status |
| FR-TRACK-001.3 | Track viewed status |
| FR-TRACK-001.4 | Track in-review status |
| FR-TRACK-001.5 | Track interview status |
| FR-TRACK-001.6 | Track offer status |
| FR-TRACK-001.7 | Track rejected status |
| FR-TRACK-001.8 | Track withdrawn status |

#### FR-TRACK-002: Application Events
**Priority:** Medium
**Description:** System must log all application events.

| Requirement | Details |
|------------|---------|
| FR-TRACK-002.1 | Log application creation |
| FR-TRACK-002.2 | Log status changes |
| FR-TRACK-002.3 | Log submission attempts |
| FR-TRACK-002.4 | Log user notes |
| FR-TRACK-002.5 | Log follow-up actions |
| FR-TRACK-002.6 | Timestamp all events |

#### FR-TRACK-003: Application Filtering
**Priority:** Medium
**Description:** Users must be able to filter and search applications.

| Requirement | Details |
|------------|---------|
| FR-TRACK-003.1 | Filter by status |
| FR-TRACK-003.2 | Filter by profile |
| FR-TRACK-003.3 | Filter by platform |
| FR-TRACK-003.4 | Filter by date range |
| FR-TRACK-003.5 | Search by company name |
| FR-TRACK-003.6 | Search by job title |

---

### 3.8 Analytics & Insights

#### FR-ANAL-001: Application Statistics
**Priority:** Medium
**Description:** System must provide application statistics.

| Requirement | Details |
|------------|---------|
| FR-ANAL-001.1 | Total applications count |
| FR-ANAL-001.2 | Applications by status |
| FR-ANAL-001.3 | Applications by platform |
| FR-ANAL-001.4 | Response rate calculation |
| FR-ANAL-001.5 | Interview rate calculation |
| FR-ANAL-001.6 | Offer rate calculation |

#### FR-ANAL-002: Dashboard Metrics
**Priority:** Medium
**Description:** Dashboard must display key metrics.

| Requirement | Details |
|------------|---------|
| FR-ANAL-002.1 | Jobs discovered count |
| FR-ANAL-002.2 | Applications sent count |
| FR-ANAL-002.3 | Success rate percentage |
| FR-ANAL-002.4 | Pending actions count |
| FR-ANAL-002.5 | Recent activity feed |
| FR-ANAL-002.6 | Active hunt sessions |

#### FR-ANAL-003: Trend Analysis
**Priority:** Low
**Description:** System should show application trends.

| Requirement | Details |
|------------|---------|
| FR-ANAL-003.1 | Weekly application trend |
| FR-ANAL-003.2 | Monthly application trend |
| FR-ANAL-003.3 | Response time analysis |
| FR-ANAL-003.4 | Best performing job types |

---

### 3.9 Automation Control

#### FR-AUTO-001: Automation Configuration
**Priority:** Medium
**Description:** Users must be able to configure automation settings.

| Requirement | Details |
|------------|---------|
| FR-AUTO-001.1 | Set daily application limits |
| FR-AUTO-001.2 | Set hourly rate limits |
| FR-AUTO-001.3 | Configure delay between actions |
| FR-AUTO-001.4 | Enable/disable headless mode |
| FR-AUTO-001.5 | Enable/disable screenshot on error |
| FR-AUTO-001.6 | Set browser timeout |

#### FR-AUTO-002: Automation Control
**Priority:** Medium
**Description:** Users must be able to control automation execution.

| Requirement | Details |
|------------|---------|
| FR-AUTO-002.1 | Start automation workflow |
| FR-AUTO-002.2 | Stop automation workflow |
| FR-AUTO-002.3 | Pause automation workflow |
| FR-AUTO-002.4 | Resume automation workflow |
| FR-AUTO-002.5 | View automation status (idle, running, paused, error) |

#### FR-AUTO-003: Automation Logging
**Priority:** Medium
**Description:** System must log automation activities.

| Requirement | Details |
|------------|---------|
| FR-AUTO-003.1 | Log automation sessions |
| FR-AUTO-003.2 | Log individual actions |
| FR-AUTO-003.3 | Log errors and warnings |
| FR-AUTO-003.4 | Provide log search/filter |

---

### 3.10 Settings & Configuration

#### FR-SET-001: Application Settings
**Priority:** Medium
**Description:** Users must be able to configure application settings.

| Requirement | Details |
|------------|---------|
| FR-SET-001.1 | Configure Claude AI model |
| FR-SET-001.2 | Configure max tokens for AI |
| FR-SET-001.3 | Set data directory paths |
| FR-SET-001.4 | Configure notification preferences |
| FR-SET-001.5 | Reset settings to defaults |

#### FR-SET-002: Safety Settings
**Priority:** High
**Description:** Users must be able to configure safety controls.

| Requirement | Details |
|------------|---------|
| FR-SET-002.1 | Enable/disable dry-run mode |
| FR-SET-002.2 | Enable/disable confirmation requirements |
| FR-SET-002.3 | Manage blocked companies list |
| FR-SET-002.4 | Set minimum match threshold for auto-apply |

---

### 3.11 Command Line Interface (CLI)

#### FR-CLI-001: CLI Commands
**Priority:** Medium
**Description:** System must provide a command-line interface for power users.

| Requirement | Details |
|------------|---------|
| FR-CLI-001.1 | Support job search from command line |
| FR-CLI-001.2 | Support profile management via CLI |
| FR-CLI-001.3 | Support application submission via CLI |
| FR-CLI-001.4 | Support status checking via CLI |
| FR-CLI-001.5 | Provide interactive mode for complex operations |
| FR-CLI-001.6 | Support batch operations for multiple jobs |
| FR-CLI-001.7 | Provide verbose/quiet output modes |

#### FR-CLI-002: CLI Configuration
**Priority:** Medium
**Description:** CLI must support configuration management.

| Requirement | Details |
|------------|---------|
| FR-CLI-002.1 | Support configuration file loading |
| FR-CLI-002.2 | Support environment variable overrides |
| FR-CLI-002.3 | Provide config validation command |
| FR-CLI-002.4 | Support multiple output formats (JSON, table, plain) |

---

### 3.12 Notifications & Alerts

#### FR-NOTIF-001: In-App Notifications
**Priority:** Medium
**Description:** System must provide real-time in-app notifications.

| Requirement | Details |
|------------|---------|
| FR-NOTIF-001.1 | Display toast notifications for important events |
| FR-NOTIF-001.2 | Show notification badge for unread items |
| FR-NOTIF-001.3 | Provide notification history/feed |
| FR-NOTIF-001.4 | Allow dismissing/clearing notifications |
| FR-NOTIF-001.5 | Support notification preferences per type |

#### FR-NOTIF-002: Real-Time Updates
**Priority:** Medium
**Description:** System must provide real-time updates via WebSocket.

| Requirement | Details |
|------------|---------|
| FR-NOTIF-002.1 | Push hunt progress updates in real-time |
| FR-NOTIF-002.2 | Push application status changes |
| FR-NOTIF-002.3 | Push automation status updates |
| FR-NOTIF-002.4 | Handle connection drops gracefully |
| FR-NOTIF-002.5 | Support reconnection with state recovery |

---

### 3.13 Data Export & Backup

#### FR-EXPORT-001: Data Export
**Priority:** Medium
**Description:** Users must be able to export their data.

| Requirement | Details |
|------------|---------|
| FR-EXPORT-001.1 | Export profile data as JSON |
| FR-EXPORT-001.2 | Export application history as CSV |
| FR-EXPORT-001.3 | Export job matches as CSV |
| FR-EXPORT-001.4 | Export analytics data |
| FR-EXPORT-001.5 | Support selective data export |

#### FR-EXPORT-002: Data Import
**Priority:** Low
**Description:** Users should be able to import data.

| Requirement | Details |
|------------|---------|
| FR-EXPORT-002.1 | Import profile from JSON |
| FR-EXPORT-002.2 | Import from LinkedIn export |
| FR-EXPORT-002.3 | Validate imported data |
| FR-EXPORT-002.4 | Handle import conflicts |

---

### 3.14 Error Handling & Recovery

#### FR-ERR-001: Error Handling
**Priority:** High
**Description:** System must handle errors gracefully.

| Requirement | Details |
|------------|---------|
| FR-ERR-001.1 | Display user-friendly error messages |
| FR-ERR-001.2 | Log errors for debugging |
| FR-ERR-001.3 | Provide error recovery suggestions |
| FR-ERR-001.4 | Support retry for transient failures |
| FR-ERR-001.5 | Prevent data loss during errors |

#### FR-ERR-002: External API Failures
**Priority:** High
**Description:** System must handle external API failures gracefully.

| Requirement | Details |
|------------|---------|
| FR-ERR-002.1 | Detect Claude API rate limits and back off |
| FR-ERR-002.2 | Detect Exa API rate limits and back off |
| FR-ERR-002.3 | Cache responses to reduce API calls |
| FR-ERR-002.4 | Queue requests during rate limiting |
| FR-ERR-002.5 | Notify user of API issues |
| FR-ERR-002.6 | Implement exponential backoff (2s, 4s, 8s, 16s) |

---

## 4. Non-Functional Requirements

### 4.1 Usability Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-USE-001 | Intuitive Navigation | Users should find primary functions within 3 clicks |
| NFR-USE-002 | Responsive Design | UI must work on desktop (1024px+) and tablet (768px+) |
| NFR-USE-003 | Accessibility | Comply with WCAG 2.1 Level AA guidelines |
| NFR-USE-004 | Error Messages | All errors must have clear, actionable messages |
| NFR-USE-005 | Loading States | All async operations must show loading indicators |
| NFR-USE-006 | Tooltips | Complex features must have explanatory tooltips |

### 4.2 Reliability Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-REL-001 | Uptime | System should maintain 99% uptime |
| NFR-REL-002 | Data Persistence | No data loss during normal operations |
| NFR-REL-003 | Error Recovery | Graceful handling of external API failures |
| NFR-REL-004 | Retry Logic | Automatic retry for transient failures (4 retries with exponential backoff) |
| NFR-REL-005 | Session Persistence | Browser sessions should persist across automation runs |

### 4.3 Scalability Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-SCA-001 | User Capacity | Support minimum 1000 concurrent users |
| NFR-SCA-002 | Data Volume | Handle 100,000+ job listings per user |
| NFR-SCA-003 | Profile Scaling | No limit on profiles per user |
| NFR-SCA-004 | Application History | Maintain full application history indefinitely |

### 4.4 Maintainability Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-MNT-001 | Modular Architecture | Each package must be independently deployable |
| NFR-MNT-002 | Type Safety | 100% TypeScript coverage with strict mode |
| NFR-MNT-003 | Documentation | All public APIs must be documented |
| NFR-MNT-004 | Code Quality | Enforce ESLint rules with no warnings |
| NFR-MNT-005 | Test Coverage | Minimum 80% code coverage for critical paths |

---

## 5. Technical Requirements

### 5.1 Architecture Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| TR-ARCH-001 | Monorepo Structure | Use pnpm workspace for package management |
| TR-ARCH-002 | Package Separation | Maintain 14 separate packages with clear responsibilities |
| TR-ARCH-003 | Type-Safe API | Use tRPC for end-to-end type safety |
| TR-ARCH-004 | Schema Validation | Use Zod for runtime validation |
| TR-ARCH-005 | State Management | Use Zustand for client-side state |
| TR-ARCH-006 | Data Fetching | Use TanStack Query for server state |

### 5.2 Frontend Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| TR-FE-001 | Framework | Next.js 14 with React 18 |
| TR-FE-002 | Styling | TailwindCSS with CVA for variants |
| TR-FE-003 | Components | Radix UI primitives for accessibility |
| TR-FE-004 | Charts | Recharts for data visualization |
| TR-FE-005 | Forms | React Hook Form with Zod validation |
| TR-FE-006 | Real-time | Socket.io for live updates |

### 5.3 Backend Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| TR-BE-001 | API | tRPC 10 routers |
| TR-BE-002 | Authentication | NextAuth.js v4 |
| TR-BE-003 | Database | SQLite via sql.js (no native bindings) |
| TR-BE-004 | File Storage | Local filesystem with configurable paths |

### 5.4 Browser Automation Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| TR-BA-001 | Framework | Playwright for cross-browser automation |
| TR-BA-002 | Browser Support | Chromium, Firefox, WebKit |
| TR-BA-003 | Headless Mode | Support both headless and headed modes |
| TR-BA-004 | Screenshots | Capture screenshots on errors |
| TR-BA-005 | Timeouts | Configurable operation timeouts |
| TR-BA-006 | Slow Mode | Configurable slowmo for debugging |

### 5.5 Environment Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| TR-ENV-001 | Node.js | Version 18+ required |
| TR-ENV-002 | Package Manager | pnpm 8+ required |
| TR-ENV-003 | OS Support | Linux, macOS, Windows |

---

## 6. Security Requirements

### 6.1 Authentication Security

| ID | Requirement | Details |
|----|-------------|---------|
| SR-AUTH-001 | OAuth 2.0 | Implement secure OAuth flow with Google |
| SR-AUTH-002 | Session Tokens | Generate cryptographically secure session tokens |
| SR-AUTH-003 | Session Encryption | Encrypt session data at rest |
| SR-AUTH-004 | Secure Cookies | Use HttpOnly, Secure, SameSite cookies |
| SR-AUTH-005 | Demo Isolation | Completely disable demo mode in production |

### 6.2 Data Security

| ID | Requirement | Details |
|----|-------------|---------|
| SR-DATA-001 | Credential Encryption | Encrypt all platform credentials with AES-256 |
| SR-DATA-002 | Encryption Key | Use environment-provided 32-byte encryption key |
| SR-DATA-003 | Salt | Use environment-provided 16-byte salt |
| SR-DATA-004 | No Plain Text | Never store passwords in plain text |
| SR-DATA-005 | Log Sanitization | Filter sensitive data from logs |

### 6.3 API Security

| ID | Requirement | Details |
|----|-------------|---------|
| SR-API-001 | CORS | Implement strict CORS policies |
| SR-API-002 | Rate Limiting | Implement request rate limiting |
| SR-API-003 | Input Validation | Validate all inputs with Zod schemas |
| SR-API-004 | Error Handling | Never expose internal errors to clients |

### 6.4 Environment Security

| ID | Requirement | Details |
|----|-------------|---------|
| SR-ENV-001 | Secrets | Store all secrets in environment variables |
| SR-ENV-002 | Validation | Fail fast on missing required secrets |
| SR-ENV-003 | No Hardcoding | Never hardcode secrets in source code |

---

## 7. User Interface Requirements

### 7.1 Design System Requirements

#### UI-DS-001: Core Design System
**Priority:** High
**Description:** Establish consistent visual language across the application.

| Requirement | Details |
|-------------|---------|
| UI-DS-001.1 | Implement TailwindCSS design tokens for colors, spacing, typography |
| UI-DS-001.2 | Define 8-point spacing grid system (4px, 8px, 16px, 24px, 32px, etc.) |
| UI-DS-001.3 | Establish typography scale (12px, 14px, 16px, 18px, 24px, 32px, 48px) |
| UI-DS-001.4 | Define primary, secondary, accent, success, warning, error color palettes |
| UI-DS-001.5 | Create shadow elevation system (sm, md, lg, xl) |
| UI-DS-001.6 | Define border radius tokens (none, sm, md, lg, full) |
| UI-DS-001.7 | Establish transition timing functions and durations |
| UI-DS-001.8 | Document all design tokens in Storybook or equivalent |

#### UI-DS-002: Theme Support
**Priority:** Medium
**Description:** Support light and dark color themes.

| Requirement | Details |
|-------------|---------|
| UI-DS-002.1 | Implement system preference detection (prefers-color-scheme) |
| UI-DS-002.2 | Provide manual theme toggle in UI |
| UI-DS-002.3 | Persist theme preference in localStorage |
| UI-DS-002.4 | Define semantic color tokens for both themes |
| UI-DS-002.5 | Ensure all components render correctly in both themes |
| UI-DS-002.6 | Support theme switching without page reload |
| UI-DS-002.7 | Provide high-contrast theme option for accessibility |

---

### 7.2 Layout Requirements

#### UI-LAY-001: Application Shell
**Priority:** High
**Description:** Define the overall application layout structure.

| Requirement | Details |
|-------------|---------|
| UI-LAY-001.1 | Implement responsive sidebar navigation (collapsible on mobile) |
| UI-LAY-001.2 | Provide persistent header with user menu and notifications |
| UI-LAY-001.3 | Implement breadcrumb navigation for nested routes |
| UI-LAY-001.4 | Support keyboard navigation between main sections (Cmd/Ctrl + 1-9) |
| UI-LAY-001.5 | Display global search accessible via Cmd/Ctrl + K |
| UI-LAY-001.6 | Show system status indicator in header (automation running, etc.) |
| UI-LAY-001.7 | Implement command palette for power users |
| UI-LAY-001.8 | Support full-screen mode for focused workflows |

#### UI-LAY-002: Responsive Breakpoints
**Priority:** High
**Description:** Define responsive behavior across device sizes.

| Requirement | Details |
|-------------|---------|
| UI-LAY-002.1 | Mobile: 320px - 767px (single column, bottom nav) |
| UI-LAY-002.2 | Tablet: 768px - 1023px (sidebar + content, collapsible) |
| UI-LAY-002.3 | Desktop: 1024px - 1439px (full sidebar + content) |
| UI-LAY-002.4 | Large: 1440px+ (sidebar + content + optional panel) |
| UI-LAY-002.5 | Touch targets minimum 44x44px on mobile |
| UI-LAY-002.6 | Horizontal scrolling prevention on all breakpoints |
| UI-LAY-002.7 | Maintain readable line lengths (max 75 characters) |

---

### 7.3 Page Requirements

#### Dashboard (`/`) - UI-DASH
**Priority:** High
**Description:** Primary landing page displaying overview and quick actions.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-DASH-001 | Statistics Cards | Display jobs discovered, applications sent, response rate, interviews |
| UI-DASH-002 | Trend Indicators | Show percentage change from previous period (week/month) |
| UI-DASH-003 | Activity Feed | Real-time feed of recent events (applications, matches, responses) |
| UI-DASH-004 | Application Pipeline | Visual Kanban-style pipeline (Applied → Reviewed → Interview → Offer) |
| UI-DASH-005 | Active Hunts Widget | Display currently running automation sessions with progress |
| UI-DASH-006 | Recent Jobs Widget | Show 5 most recent job discoveries with match scores |
| UI-DASH-007 | Quick Actions | Primary CTAs: Start Hunt, Upload Resume, View Applications |
| UI-DASH-008 | Module Status | Display enabled/disabled status of application modules |
| UI-DASH-009 | Daily Goal Tracker | Show progress toward daily application targets |
| UI-DASH-010 | Upcoming Follow-ups | List applications requiring follow-up action |
| UI-DASH-011 | Skills Gap Summary | Highlight most common missing skills from rejections |
| UI-DASH-012 | Platform Health | Status indicators for each integrated platform |

#### Profile Page (`/profile`) - UI-PROF
**Priority:** High
**Description:** Comprehensive profile management interface.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-PROF-001 | Profile Switcher | Dropdown/tabs to switch between multiple profiles |
| UI-PROF-002 | Profile Overview | Summary card with name, headline, photo, completeness score |
| UI-PROF-003 | Personal Info Form | First name, last name, headline, summary, contact details |
| UI-PROF-004 | Contact Editor | Email, phone, location, LinkedIn URL, GitHub, portfolio |
| UI-PROF-005 | Experience Editor | Add/edit/remove work experiences with rich text descriptions |
| UI-PROF-006 | Experience Timeline | Visual timeline view of work history |
| UI-PROF-007 | Education Editor | Add/edit/remove education with degree, field, dates, GPA |
| UI-PROF-008 | Skills Manager | Add skills with proficiency levels (1-5 stars or percentage) |
| UI-PROF-009 | Skill Categories | Group skills by category (Languages, Frameworks, Tools, Soft) |
| UI-PROF-010 | Certifications List | Add certifications with issuer, date, expiration, credential ID |
| UI-PROF-011 | Projects Showcase | Add projects with description, tech stack, links |
| UI-PROF-012 | Resume Upload | Drag-and-drop resume upload with preview |
| UI-PROF-013 | Resume Parsing Status | Progress indicator during AI parsing |
| UI-PROF-014 | Parse Review Modal | Review and confirm extracted data before saving |
| UI-PROF-015 | Preferences Panel | Job preferences (titles, locations, salary, remote, type) |
| UI-PROF-016 | Blocked Companies | List of companies to exclude from applications |
| UI-PROF-017 | Profile Actions | Duplicate, Export, Delete profile options |
| UI-PROF-018 | Completeness Indicator | Visual indicator of profile completeness with suggestions |
| UI-PROF-019 | Version History | Track changes to profile over time |
| UI-PROF-020 | Import Options | Import from LinkedIn, Indeed, or JSON file |

#### Hunt Page (`/hunt`) - UI-HUNT
**Priority:** High
**Description:** AI-powered job discovery and application interface.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-HUNT-001 | Search Configuration | Form with query, location, remote toggle, salary range |
| UI-HUNT-002 | Advanced Filters | Experience level, job type, date posted, company size |
| UI-HUNT-003 | Profile Selector | Choose which profile to use for matching |
| UI-HUNT-004 | Source Selector | Toggle which platforms/modules to search (LinkedIn, Indeed, etc.) |
| UI-HUNT-005 | Match Threshold Slider | Set minimum match score (0-100) for results |
| UI-HUNT-006 | Auto-Apply Toggle | Enable/disable automatic application submission |
| UI-HUNT-007 | Dry Run Option | Test mode that simulates without submitting |
| UI-HUNT-008 | Max Jobs Limit | Set maximum number of jobs to process |
| UI-HUNT-009 | Hunt Progress Panel | Real-time progress (Discovering → Matching → Applying) |
| UI-HUNT-010 | Live Job Stream | Stream of discovered jobs appearing in real-time |
| UI-HUNT-011 | Match Results Grid | Grid/list of matched jobs with scores |
| UI-HUNT-012 | Job Preview Card | Expandable card with job details, match analysis |
| UI-HUNT-013 | Match Breakdown | Visual breakdown of match score components |
| UI-HUNT-014 | Skills Gap Display | Highlight missing skills for each job |
| UI-HUNT-015 | Confirmation Dialog | Per-job confirmation before auto-apply (if enabled) |
| UI-HUNT-016 | Activity Log | Scrolling log of hunt activities and events |
| UI-HUNT-017 | Error Notifications | Toast notifications for errors with retry options |
| UI-HUNT-018 | Hunt Summary | Final summary with stats (found, matched, applied) |
| UI-HUNT-019 | Save Search | Save search parameters for quick re-run |
| UI-HUNT-020 | Hunt History | Access previous hunt sessions and results |

#### Jobs Page (`/jobs`) - UI-JOBS
**Priority:** High
**Description:** Browse and manage discovered job listings.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-JOBS-001 | Search Bar | Full-text search across job titles, companies, descriptions |
| UI-JOBS-002 | Filter Sidebar | Filters: platform, match score, date, location, salary, status |
| UI-JOBS-003 | Sort Options | Sort by: match score, date posted, salary, company name |
| UI-JOBS-004 | View Toggle | Switch between grid, list, and table views |
| UI-JOBS-005 | Job Cards | Card showing title, company, location, salary, match score, platform icon |
| UI-JOBS-006 | Match Score Badge | Color-coded badge (green/yellow/red) based on match score |
| UI-JOBS-007 | Easy Apply Indicator | Badge indicating if Easy Apply is available |
| UI-JOBS-008 | Platform Icon | Visual indicator of source platform |
| UI-JOBS-009 | Job Detail Modal | Full job description, requirements, benefits in modal |
| UI-JOBS-010 | Match Analysis Tab | Detailed AI analysis of job-profile fit |
| UI-JOBS-011 | Similar Jobs Tab | List of similar positions |
| UI-JOBS-012 | Company Info Tab | Company details, size, industry, Glassdoor ratings |
| UI-JOBS-013 | Apply Button | Primary action to apply (manual or automated) |
| UI-JOBS-014 | Save Job Action | Save job for later review |
| UI-JOBS-015 | Hide Job Action | Remove job from list (with undo) |
| UI-JOBS-016 | Bulk Actions | Select multiple jobs for bulk apply/save/hide |
| UI-JOBS-017 | Pagination/Infinite Scroll | Load more jobs on scroll or pagination |
| UI-JOBS-018 | Empty State | Helpful message and actions when no jobs found |
| UI-JOBS-019 | Job Status Indicators | Applied, Saved, Hidden status on cards |
| UI-JOBS-020 | Quick Filters | One-click filters: "High Match", "Easy Apply", "Remote" |

#### Applications Page (`/applications`) - UI-APP
**Priority:** High
**Description:** Track and manage job applications.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-APP-001 | Kanban Board | Drag-and-drop columns: Applied, Reviewed, Interview, Offer, Rejected |
| UI-APP-002 | List View Toggle | Alternative list view for applications |
| UI-APP-003 | Status Filters | Filter by application status |
| UI-APP-004 | Platform Filters | Filter by source platform |
| UI-APP-005 | Date Range Filter | Filter by application date range |
| UI-APP-006 | Search | Search applications by company or job title |
| UI-APP-007 | Application Cards | Card with job title, company, date, status, next action |
| UI-APP-008 | Detail Modal | Full application details in slide-out panel |
| UI-APP-009 | Timeline Tab | Chronological timeline of all application events |
| UI-APP-010 | Notes Tab | Add/view notes and comments |
| UI-APP-011 | Documents Tab | View submitted resume, cover letter |
| UI-APP-012 | Status Update | Quick status change dropdown |
| UI-APP-013 | Add Note Action | Quick add note to application |
| UI-APP-014 | Schedule Follow-up | Set reminder for follow-up action |
| UI-APP-015 | Archive Action | Archive completed/rejected applications |
| UI-APP-016 | Reapply Action | Reapply to job with updated profile |
| UI-APP-017 | Statistics Summary | Stats bar showing counts per status |
| UI-APP-018 | Response Rate | Calculate and display response rate |
| UI-APP-019 | Average Response Time | Display average time to response |
| UI-APP-020 | Export Applications | Export application data to CSV |

#### Automation Page (`/automation`) - UI-AUTO
**Priority:** Medium
**Description:** Control and monitor automation workflows.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-AUTO-001 | Master Controls | Start, Stop, Pause, Resume buttons |
| UI-AUTO-002 | Status Display | Current status (Idle, Running, Paused, Error) with indicator |
| UI-AUTO-003 | Progress Bar | Overall progress of current automation session |
| UI-AUTO-004 | Rate Limit Display | Show current rate limits and usage |
| UI-AUTO-005 | Rate Limit Config | Adjust applications per hour/day limits |
| UI-AUTO-006 | Delay Config | Set delay between actions (min/max) |
| UI-AUTO-007 | Browser Mode Toggle | Headless vs headed browser mode |
| UI-AUTO-008 | Screenshot Toggle | Enable/disable screenshots on error |
| UI-AUTO-009 | Session History | Table of past automation sessions |
| UI-AUTO-010 | Session Details | Click to view session logs and results |
| UI-AUTO-011 | Live Log Viewer | Real-time scrolling log output |
| UI-AUTO-012 | Log Filters | Filter logs by level (info, warn, error) |
| UI-AUTO-013 | Error Summary | Highlight recent errors with details |
| UI-AUTO-014 | Retry Failed | Button to retry failed applications |
| UI-AUTO-015 | Platform Status | Connection status per platform |
| UI-AUTO-016 | Session Management | Manage platform login sessions |
| UI-AUTO-017 | CAPTCHA Alert | Prominent alert when CAPTCHA detected |
| UI-AUTO-018 | Manual Login | Button to open browser for manual login |
| UI-AUTO-019 | Schedule Config | Schedule automation runs (future) |
| UI-AUTO-020 | Resource Monitor | CPU/memory usage of automation |

#### Analytics Page (`/analytics`) - UI-ANAL
**Priority:** Medium
**Description:** Visualize application statistics and insights.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-ANAL-001 | Date Range Selector | Select time period for all charts |
| UI-ANAL-002 | Applications Over Time | Line chart of applications per day/week |
| UI-ANAL-003 | Status Distribution | Pie/donut chart of applications by status |
| UI-ANAL-004 | Platform Distribution | Bar chart of applications by platform |
| UI-ANAL-005 | Response Rate Trend | Line chart of response rate over time |
| UI-ANAL-006 | Match Score Distribution | Histogram of match scores |
| UI-ANAL-007 | Top Companies | Bar chart of most applied-to companies |
| UI-ANAL-008 | Skills Gap Analysis | Chart of most common missing skills |
| UI-ANAL-009 | Salary Analysis | Distribution of applied job salaries |
| UI-ANAL-010 | Location Heatmap | Geographic distribution of applications |
| UI-ANAL-011 | Success Funnel | Funnel visualization (Applied → Interview → Offer) |
| UI-ANAL-012 | Week-over-Week | Comparison metrics vs previous period |
| UI-ANAL-013 | Goal Progress | Progress toward defined goals |
| UI-ANAL-014 | Export Report | Export analytics as PDF report |
| UI-ANAL-015 | Insights Panel | AI-generated insights and recommendations |

#### Settings Page (`/settings`) - UI-SET
**Priority:** Medium
**Description:** Application configuration and preferences.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-SET-001 | Settings Navigation | Sidebar or tabs for settings categories |
| UI-SET-002 | Account Settings | Profile photo, name, email, password change |
| UI-SET-003 | Security Settings | 2FA setup, active sessions, login history |
| UI-SET-004 | Platform Credentials | Manage login credentials for each platform |
| UI-SET-005 | AI Configuration | Claude model selection, temperature, max tokens |
| UI-SET-006 | Browser Settings | Headless mode, timeout, viewport size |
| UI-SET-007 | Rate Limits | Default rate limit configuration |
| UI-SET-008 | Notification Settings | Email and in-app notification preferences |
| UI-SET-009 | Data Management | Export data, delete data, storage usage |
| UI-SET-010 | Module Management | Enable/disable application modules (Admin) |
| UI-SET-011 | API Keys | Manage API keys for integrations |
| UI-SET-012 | Webhook Config | Configure webhook endpoints for events |
| UI-SET-013 | Theme Settings | Light/dark mode, accent color |
| UI-SET-014 | Language Settings | UI language preference |
| UI-SET-015 | Reset to Defaults | Reset all settings to default values |

#### Admin Panel (`/admin`) - UI-ADMIN
**Priority:** High
**Description:** Administrative controls for module and system management.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-ADMIN-001 | Admin Dashboard | System overview with health metrics |
| UI-ADMIN-002 | Module Manager | Enable/disable application modules |
| UI-ADMIN-003 | Module Status | Health status of each module |
| UI-ADMIN-004 | Module Config | Per-module configuration options |
| UI-ADMIN-005 | User Management | View and manage user accounts |
| UI-ADMIN-006 | Usage Statistics | Platform-wide usage statistics |
| UI-ADMIN-007 | Error Dashboard | System-wide error monitoring |
| UI-ADMIN-008 | Rate Limit Manager | Global rate limit configuration |
| UI-ADMIN-009 | Platform Health | Status of all platform integrations |
| UI-ADMIN-010 | Audit Log | View all admin actions |
| UI-ADMIN-011 | Feature Flags | Toggle experimental features |
| UI-ADMIN-012 | System Announcements | Create user-facing announcements |

#### Authentication Pages - UI-AUTH
**Priority:** High
**Description:** Login, registration, and account recovery flows.

| ID | Requirement | Details |
|----|-------------|---------|
| UI-AUTH-001 | Login Page | Email/password form with OAuth buttons |
| UI-AUTH-002 | OAuth Buttons | Google, GitHub, Microsoft sign-in buttons |
| UI-AUTH-003 | Remember Me | Checkbox to persist login session |
| UI-AUTH-004 | Forgot Password Link | Link to password reset flow |
| UI-AUTH-005 | Register Page | Registration form with validation |
| UI-AUTH-006 | Password Strength | Real-time password strength indicator |
| UI-AUTH-007 | Terms Checkbox | Agreement to terms and privacy policy |
| UI-AUTH-008 | Email Verification | Verification code/link entry page |
| UI-AUTH-009 | Password Reset | Request reset and set new password pages |
| UI-AUTH-010 | 2FA Entry | TOTP code entry page |
| UI-AUTH-011 | Backup Codes | Display and manage backup codes |
| UI-AUTH-012 | Error Messages | Clear, specific error messages |
| UI-AUTH-013 | Loading States | Button loading states during auth |
| UI-AUTH-014 | Demo Mode Login | Special demo login button (dev only) |
| UI-AUTH-015 | Session Expired | Redirect with message on session expiry |

---

### 7.4 Component Library Requirements

#### UI-COMP-001: Form Components
| Requirement | Details |
|-------------|---------|
| UI-COMP-001.1 | Text input with label, placeholder, validation, helper text |
| UI-COMP-001.2 | Textarea with character count and auto-resize |
| UI-COMP-001.3 | Select dropdown with search and multi-select options |
| UI-COMP-001.4 | Checkbox with label and indeterminate state |
| UI-COMP-001.5 | Radio group with horizontal and vertical layouts |
| UI-COMP-001.6 | Toggle switch for boolean options |
| UI-COMP-001.7 | Date picker with range selection support |
| UI-COMP-001.8 | File upload with drag-and-drop and preview |
| UI-COMP-001.9 | Slider for numeric range selection |
| UI-COMP-001.10 | Form validation with inline error messages |

#### UI-COMP-002: Display Components
| Requirement | Details |
|-------------|---------|
| UI-COMP-002.1 | Card component with header, body, footer, actions |
| UI-COMP-002.2 | Badge for status and count indicators |
| UI-COMP-002.3 | Avatar with fallback initials and status dot |
| UI-COMP-002.4 | Table with sorting, filtering, pagination |
| UI-COMP-002.5 | List with selectable items and actions |
| UI-COMP-002.6 | Timeline for event history display |
| UI-COMP-002.7 | Progress bar and progress ring |
| UI-COMP-002.8 | Skeleton loaders for loading states |
| UI-COMP-002.9 | Empty states with illustration and CTA |
| UI-COMP-002.10 | Stats card with trend indicator |

#### UI-COMP-003: Feedback Components
| Requirement | Details |
|-------------|---------|
| UI-COMP-003.1 | Toast notifications (success, error, warning, info) |
| UI-COMP-003.2 | Modal dialog with customizable actions |
| UI-COMP-003.3 | Confirmation dialog for destructive actions |
| UI-COMP-003.4 | Alert banner for page-level messages |
| UI-COMP-003.5 | Tooltip with configurable placement |
| UI-COMP-003.6 | Popover for contextual content |
| UI-COMP-003.7 | Loading spinner with optional text |
| UI-COMP-003.8 | Error boundary with retry action |

#### UI-COMP-004: Navigation Components
| Requirement | Details |
|-------------|---------|
| UI-COMP-004.1 | Sidebar with collapsible sections |
| UI-COMP-004.2 | Top navigation bar with user menu |
| UI-COMP-004.3 | Breadcrumb navigation |
| UI-COMP-004.4 | Tabs with lazy loading support |
| UI-COMP-004.5 | Pagination with page size selector |
| UI-COMP-004.6 | Command palette (Cmd+K) |
| UI-COMP-004.7 | Dropdown menu with icons |
| UI-COMP-004.8 | Mobile bottom navigation |

---

### 7.5 Accessibility Requirements (WCAG 2.1 AA)

| ID | Requirement | Details |
|----|-------------|---------|
| UI-A11Y-001 | Keyboard Navigation | All interactive elements reachable via keyboard |
| UI-A11Y-002 | Focus Indicators | Visible focus rings on all focusable elements |
| UI-A11Y-003 | Skip Links | Skip to main content link at page start |
| UI-A11Y-004 | ARIA Labels | Proper ARIA labels on all interactive elements |
| UI-A11Y-005 | Screen Reader Support | All content readable by screen readers |
| UI-A11Y-006 | Alt Text | Descriptive alt text on all images |
| UI-A11Y-007 | Color Contrast | Minimum 4.5:1 contrast ratio for text |
| UI-A11Y-008 | Error Identification | Errors identified in text, not color alone |
| UI-A11Y-009 | Form Labels | All form fields have associated labels |
| UI-A11Y-010 | Heading Structure | Proper heading hierarchy (h1 → h2 → h3) |
| UI-A11Y-011 | Resize Support | Content usable at 200% zoom |
| UI-A11Y-012 | Motion Reduction | Respect prefers-reduced-motion setting |
| UI-A11Y-013 | Touch Targets | Minimum 44x44px touch targets on mobile |
| UI-A11Y-014 | Language Attribute | Proper lang attribute on html element |
| UI-A11Y-015 | Live Regions | ARIA live regions for dynamic content updates |

---

### 7.6 Performance Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| UI-PERF-001 | First Contentful Paint | < 1.5 seconds |
| UI-PERF-002 | Largest Contentful Paint | < 2.5 seconds |
| UI-PERF-003 | Time to Interactive | < 3.5 seconds |
| UI-PERF-004 | Cumulative Layout Shift | < 0.1 |
| UI-PERF-005 | First Input Delay | < 100ms |
| UI-PERF-006 | Bundle Size (Initial) | < 200KB gzipped |
| UI-PERF-007 | Code Splitting | Lazy load routes and heavy components |
| UI-PERF-008 | Image Optimization | WebP/AVIF with lazy loading |
| UI-PERF-009 | List Virtualization | Virtualize lists > 100 items |
| UI-PERF-010 | Debounced Inputs | Debounce search inputs (300ms) |

---

## 8. Integration Requirements

### 8.1 Claude AI Integration

| ID | Requirement | Details |
|----|-------------|---------|
| IR-CLAUDE-001 | Resume Parsing | Parse uploaded resumes into structured profiles |
| IR-CLAUDE-002 | Job Matching | Analyze job-profile compatibility |
| IR-CLAUDE-003 | Cover Letters | Generate personalized cover letters |
| IR-CLAUDE-004 | Form Analysis | Understand and complete application forms |
| IR-CLAUDE-005 | Model Selection | Support claude-3-5-sonnet (configurable) |
| IR-CLAUDE-006 | Token Limits | Configurable max tokens (default 4096) |

### 8.2 Exa API Integration

| ID | Requirement | Details |
|----|-------------|---------|
| IR-EXA-001 | Semantic Search | Natural language job queries |
| IR-EXA-002 | Content Retrieval | Extract job listing content |
| IR-EXA-003 | Similar Jobs | Find similar job recommendations |
| IR-EXA-004 | Platform Detection | Identify job posting platform |

### 8.3 Job Platform Integration

| ID | Requirement | Details |
|----|-------------|---------|
| IR-PLAT-001 | LinkedIn Support | Easy Apply automation |
| IR-PLAT-002 | Indeed Support | Quick Apply automation |
| IR-PLAT-003 | Direct Apply | Company website applications |
| IR-PLAT-004 | Session Management | Maintain login sessions |
| IR-PLAT-005 | Credential Storage | Secure encrypted storage |

---

## 9. Data Requirements

### 9.1 Database Schema

#### Users Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| email | String | Yes | User email (unique) |
| provider | String | Yes | Auth provider |
| emailVerified | Boolean | No | Email verification status |
| lastLoginAt | DateTime | No | Last login timestamp |
| createdAt | DateTime | Yes | Account creation date |
| updatedAt | DateTime | Yes | Last update date |

#### Profiles Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| userId | UUID | Yes | Foreign key to users |
| name | String | Yes | Profile name |
| firstName | String | Yes | First name |
| lastName | String | Yes | Last name |
| headline | String | No | Professional headline |
| summary | String | No | Professional summary |
| contact | JSON | Yes | Contact information |
| experience | JSON | Yes | Work experience array |
| education | JSON | Yes | Education history array |
| skills | JSON | Yes | Skills array |
| certifications | JSON | No | Certifications array |
| projects | JSON | No | Projects array |
| preferences | JSON | Yes | Job preferences |
| isDefault | Boolean | Yes | Default profile flag |

#### Jobs Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| platform | String | Yes | Job platform source |
| externalId | String | No | External platform ID |
| title | String | Yes | Job title |
| company | String | Yes | Company name |
| location | String | Yes | Job location |
| description | Text | Yes | Full job description |
| requirements | JSON | No | Requirements list |
| salary | JSON | No | Salary information |
| benefits | JSON | No | Benefits list |
| requiredSkills | JSON | No | Skills list |
| easyApply | Boolean | Yes | Easy apply available |
| url | String | Yes | Application URL |
| postedAt | DateTime | No | Job posting date |
| expiresAt | DateTime | No | Job expiration date |

#### Applications Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| profileId | UUID | Yes | Foreign key to profiles |
| jobId | UUID | Yes | Foreign key to jobs |
| status | Enum | Yes | Application status |
| method | Enum | Yes | Application method |
| coverLetter | Text | No | Cover letter content |
| matchScore | Float | No | Match score |
| submittedAt | DateTime | No | Submission timestamp |
| createdAt | DateTime | Yes | Creation date |
| updatedAt | DateTime | Yes | Last update date |

#### Job Matches Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| jobId | UUID | Yes | Foreign key to jobs |
| profileId | UUID | Yes | Foreign key to profiles |
| overallScore | Float | Yes | Overall match score |
| skillScore | Float | Yes | Skills match score |
| experienceScore | Float | Yes | Experience match score |
| locationScore | Float | Yes | Location match score |
| salaryScore | Float | Yes | Salary match score |
| fitCategory | Enum | Yes | Fit assessment |
| gaps | JSON | No | Identified gaps |
| recommendations | JSON | No | AI recommendations |
| confidence | Float | Yes | Analysis confidence |

#### Application Events Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| applicationId | UUID | Yes | Foreign key to applications |
| type | String | Yes | Event type |
| description | String | Yes | Event description |
| timestamp | DateTime | Yes | Event timestamp |

#### Platform Credentials Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| platform | String | Yes | Platform name |
| email | String | Yes | Login email |
| passwordEncrypted | String | Yes | Encrypted password |
| accessToken | String | No | OAuth token |
| refreshToken | String | No | Refresh token |
| expiresAt | DateTime | No | Token expiration |

### 9.2 Data Validation

| ID | Requirement | Details |
|----|-------------|---------|
| DR-VAL-001 | Email Validation | RFC 5322 compliant email format |
| DR-VAL-002 | URL Validation | Valid URL format for job links |
| DR-VAL-003 | Phone Validation | Valid phone number format |
| DR-VAL-004 | Date Validation | ISO 8601 date format |
| DR-VAL-005 | Salary Validation | Numeric range validation |

### 9.3 Data Retention

| ID | Requirement | Details |
|----|-------------|---------|
| DR-RET-001 | Application History | Retain indefinitely |
| DR-RET-002 | Job Listings | Retain for 90 days after expiration |
| DR-RET-003 | Session Data | Retain for 30 days |
| DR-RET-004 | Automation Logs | Retain for 30 days |

---

## 10. Performance Requirements

### 10.1 Response Time Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| PR-RT-001 | Page Load | < 2 seconds |
| PR-RT-002 | API Response | < 500ms for most endpoints |
| PR-RT-003 | Resume Parsing | < 30 seconds |
| PR-RT-004 | Job Search | < 10 seconds |
| PR-RT-005 | Job Matching | < 5 seconds per job |
| PR-RT-006 | Application Submission | < 60 seconds per application |

### 10.2 Throughput Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| PR-TH-001 | Concurrent Users | Support 1000+ simultaneous users |
| PR-TH-002 | Job Discovery | Process 100+ jobs per search |
| PR-TH-003 | Applications | Submit 50+ applications per day per user |

### 10.3 Resource Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| PR-RES-001 | Memory | < 512MB for web application |
| PR-RES-002 | Storage | < 100MB for SQLite database per user |
| PR-RES-003 | Browser Memory | < 1GB for Playwright automation |

---

## 11. Deployment & Operations Requirements

### 11.1 Deployment Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| DOR-DEP-001 | Containerization | Support Docker deployment |
| DOR-DEP-002 | Environment Configuration | Support .env file configuration |
| DOR-DEP-003 | Build Process | Provide production build scripts |
| DOR-DEP-004 | Static Assets | Optimize and bundle static assets |
| DOR-DEP-005 | Health Checks | Provide health check endpoints |
| DOR-DEP-006 | Graceful Shutdown | Handle SIGTERM signals properly |

### 11.2 Environment Management

| ID | Requirement | Details |
|----|-------------|---------|
| DOR-ENV-001 | Development Mode | Support local development with hot reload |
| DOR-ENV-002 | Staging Environment | Support staging for pre-production testing |
| DOR-ENV-003 | Production Mode | Optimized production configuration |
| DOR-ENV-004 | Environment Isolation | Prevent cross-environment data access |
| DOR-ENV-005 | Secret Management | Support external secret providers |

### 11.3 Monitoring & Logging

| ID | Requirement | Details |
|----|-------------|---------|
| DOR-MON-001 | Application Logging | Structured JSON logging |
| DOR-MON-002 | Log Levels | Support debug, info, warn, error levels |
| DOR-MON-003 | Request Logging | Log all API requests with timing |
| DOR-MON-004 | Error Tracking | Capture and report exceptions |
| DOR-MON-005 | Metrics Collection | Track key performance metrics |
| DOR-MON-006 | Audit Trail | Log security-relevant events |

### 11.4 Backup & Recovery

| ID | Requirement | Details |
|----|-------------|---------|
| DOR-BAK-001 | Database Backup | Support scheduled database backups |
| DOR-BAK-002 | Backup Verification | Validate backup integrity |
| DOR-BAK-003 | Point-in-Time Recovery | Support recovery to specific points |
| DOR-BAK-004 | Disaster Recovery | Document recovery procedures |
| DOR-BAK-005 | Data Migration | Support schema migrations |

---

## 12. Compliance & Legal Requirements

### 12.1 Privacy Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| CR-PRIV-001 | Data Minimization | Only collect necessary data |
| CR-PRIV-002 | Purpose Limitation | Use data only for stated purposes |
| CR-PRIV-003 | User Consent | Obtain consent for data processing |
| CR-PRIV-004 | Data Access | Allow users to view their data |
| CR-PRIV-005 | Data Deletion | Allow users to delete their data |
| CR-PRIV-006 | Data Portability | Allow users to export their data |

### 12.2 GDPR Compliance

| ID | Requirement | Details |
|----|-------------|---------|
| CR-GDPR-001 | Right to Access | Provide data access requests |
| CR-GDPR-002 | Right to Rectification | Allow data correction |
| CR-GDPR-003 | Right to Erasure | Implement data deletion |
| CR-GDPR-004 | Right to Portability | Provide data export functionality |
| CR-GDPR-005 | Privacy Policy | Maintain clear privacy policy |
| CR-GDPR-006 | Cookie Consent | Implement cookie consent mechanism |

### 12.3 Terms of Service Compliance

| ID | Requirement | Details |
|----|-------------|---------|
| CR-TOS-001 | LinkedIn ToS | Comply with LinkedIn Terms of Service |
| CR-TOS-002 | Indeed ToS | Comply with Indeed Terms of Service |
| CR-TOS-003 | Rate Limiting | Respect platform rate limits |
| CR-TOS-004 | User Agent | Use appropriate user agent strings |
| CR-TOS-005 | Robots.txt | Respect robots.txt directives |
| CR-TOS-006 | API Usage | Use official APIs where available |

### 12.4 Accessibility Compliance

| ID | Requirement | Details |
|----|-------------|---------|
| CR-A11Y-001 | WCAG 2.1 AA | Meet WCAG 2.1 Level AA standards |
| CR-A11Y-002 | Keyboard Navigation | Full keyboard accessibility |
| CR-A11Y-003 | Screen Reader Support | Compatible with screen readers |
| CR-A11Y-004 | Color Contrast | Sufficient color contrast ratios |
| CR-A11Y-005 | Focus Indicators | Visible focus indicators |
| CR-A11Y-006 | Alt Text | Provide alt text for images |

---

## 13. Application Modules System

### 13.1 Module Architecture Overview

The application uses a modular architecture for job application automation, allowing administrators to enable, disable, and configure individual modules based on platform availability, compliance requirements, and user needs.

#### MOD-ARCH-001: Core Module System
**Priority:** High
**Description:** Define the modular system architecture for application automation.

| Requirement | Details |
|-------------|---------|
| MOD-ARCH-001.1 | Each platform integration exists as an independent module |
| MOD-ARCH-001.2 | Modules can be enabled/disabled without affecting other modules |
| MOD-ARCH-001.3 | Modules share common interfaces (BasePlatformAdapter) |
| MOD-ARCH-001.4 | Module configuration stored in database per-user and globally |
| MOD-ARCH-001.5 | Admin can set global module availability |
| MOD-ARCH-001.6 | Users can enable/disable available modules for their account |
| MOD-ARCH-001.7 | Modules report health status to central monitoring |
| MOD-ARCH-001.8 | Failed modules auto-disable with admin notification |

---

### 13.2 Admin Module Controls

#### MOD-ADMIN-001: Global Module Management
**Priority:** High
**Description:** Administrators can control module availability system-wide.

| Requirement | Details |
|-------------|---------|
| MOD-ADMIN-001.1 | View list of all registered modules with status |
| MOD-ADMIN-001.2 | Enable/disable modules globally (affects all users) |
| MOD-ADMIN-001.3 | Set module availability: "Enabled", "Disabled", "Beta", "Deprecated" |
| MOD-ADMIN-001.4 | Configure per-module rate limits (override defaults) |
| MOD-ADMIN-001.5 | Set maintenance mode per module (disable with message) |
| MOD-ADMIN-001.6 | View module health metrics and error rates |
| MOD-ADMIN-001.7 | Force reconnection/re-authentication for module |
| MOD-ADMIN-001.8 | View aggregated usage statistics per module |

#### MOD-ADMIN-002: Module Configuration
**Priority:** High
**Description:** Administrators can configure module-specific settings.

| Requirement | Details |
|-------------|---------|
| MOD-ADMIN-002.1 | Configure module-specific API keys (if required) |
| MOD-ADMIN-002.2 | Set default rate limits per module |
| MOD-ADMIN-002.3 | Configure retry policies (attempts, backoff) |
| MOD-ADMIN-002.4 | Set timeout values per module |
| MOD-ADMIN-002.5 | Configure stealth mode options (delays, user-agent rotation) |
| MOD-ADMIN-002.6 | Enable/disable specific module features |
| MOD-ADMIN-002.7 | Set geographic restrictions per module |
| MOD-ADMIN-002.8 | Configure fallback behavior when module fails |

#### MOD-ADMIN-003: Module Monitoring Dashboard
**Priority:** Medium
**Description:** Real-time monitoring of module health and performance.

| Requirement | Details |
|-------------|---------|
| MOD-ADMIN-003.1 | Display module status indicators (green/yellow/red) |
| MOD-ADMIN-003.2 | Show success/failure rates per module (last 24h/7d/30d) |
| MOD-ADMIN-003.3 | Display average response times per module |
| MOD-ADMIN-003.4 | Track CAPTCHA encounter rates per platform |
| MOD-ADMIN-003.5 | Show account lockout incidents |
| MOD-ADMIN-003.6 | Alert on unusual error patterns |
| MOD-ADMIN-003.7 | Track API quota usage (where applicable) |
| MOD-ADMIN-003.8 | Display active user sessions per module |

---

### 13.3 User Module Controls

#### MOD-USER-001: Module Selection
**Priority:** Medium
**Description:** Users can select which modules to use for job hunting.

| Requirement | Details |
|-------------|---------|
| MOD-USER-001.1 | View list of available modules (enabled by admin) |
| MOD-USER-001.2 | Enable/disable modules for personal use |
| MOD-USER-001.3 | See module status (connected, disconnected, error) |
| MOD-USER-001.4 | View module description and capabilities |
| MOD-USER-001.5 | See compliance notes and ToS warnings per module |
| MOD-USER-001.6 | Set priority order for multi-module searches |
| MOD-USER-001.7 | View personal usage statistics per module |

#### MOD-USER-002: Module Authentication
**Priority:** High
**Description:** Users can authenticate with each platform module.

| Requirement | Details |
|-------------|---------|
| MOD-USER-002.1 | Enter credentials for each platform requiring login |
| MOD-USER-002.2 | Initiate OAuth flow for platforms supporting it |
| MOD-USER-002.3 | View connection status for each module |
| MOD-USER-002.4 | Manually trigger re-authentication |
| MOD-USER-002.5 | See session expiration warnings |
| MOD-USER-002.6 | Clear stored credentials per module |
| MOD-USER-002.7 | View last successful login time |

---

### 13.4 Module Disable Reasons

Administrators may disable modules for the following reasons:

| Reason Code | Description | User Message |
|-------------|-------------|--------------|
| MAINTENANCE | Scheduled or emergency maintenance | "Module temporarily unavailable for maintenance" |
| TOS_VIOLATION | Platform ToS concerns | "Module disabled due to platform policy changes" |
| HIGH_ERROR_RATE | Excessive failures detected | "Module temporarily disabled due to technical issues" |
| API_DEPRECATED | Platform API no longer available | "Module discontinued - platform no longer supported" |
| LEGAL_COMPLIANCE | Legal or regulatory concerns | "Module unavailable in your region" |
| RATE_LIMITED | Platform-wide rate limiting | "Module temporarily limited - please try later" |
| SECURITY_CONCERN | Security issue detected | "Module disabled for security review" |
| BETA_ENDED | Beta testing period concluded | "Module beta period has ended" |

---

### 13.5 Module Registry Schema

```
Module {
  id: string                    // Unique module identifier
  name: string                  // Display name
  description: string           // Module description
  version: string               // Semantic version
  platform: string              // Target platform
  type: 'browser' | 'api' | 'hybrid'
  status: 'enabled' | 'disabled' | 'beta' | 'deprecated'

  // Capabilities
  capabilities: {
    jobSearch: boolean          // Can search for jobs
    easyApply: boolean          // Supports easy/quick apply
    directApply: boolean        // Can fill external forms
    statusTracking: boolean     // Can track application status
    profileSync: boolean        // Can sync profile data
  }

  // Configuration
  config: {
    requiresAuth: boolean       // Needs platform credentials
    authMethod: 'credentials' | 'oauth' | 'session'
    rateLimit: {
      perMinute: number
      perHour: number
      perDay: number
    }
    timeout: number             // Request timeout (ms)
    retryPolicy: {
      maxAttempts: number
      backoffMs: number
    }
  }

  // Health
  health: {
    status: 'healthy' | 'degraded' | 'down'
    lastCheck: timestamp
    successRate24h: number
    avgResponseTime: number
    errorCount24h: number
  }

  // Metadata
  createdAt: timestamp
  updatedAt: timestamp
  disabledReason?: string
  disabledAt?: timestamp
  disabledBy?: string           // Admin user ID
}
```

---

## 14. Platform Integration Modules

### 16.1 Module Overview

The following modules are available or planned for integration. Each module can be independently enabled or disabled by administrators.

| Module ID | Platform | Type | Status | Auth Method |
|-----------|----------|------|--------|-------------|
| linkedin | LinkedIn | Browser | Active | Credentials/OAuth |
| indeed | Indeed | Browser | Active | Credentials |
| glassdoor | Glassdoor | Browser | Planned | Credentials |
| ziprecruiter | ZipRecruiter | API/Browser | Planned | API Key |
| greenhouse | Greenhouse ATS | Browser | Active | Session |
| lever | Lever ATS | Browser | Active | Session |
| workday | Workday ATS | Browser | Active | Session |
| exa | Exa Search | API | Active | API Key |
| company_sites | Direct Apply | Browser | Active | AI-Powered |

---

### 16.2 LinkedIn Module

#### MOD-LI-001: LinkedIn Easy Apply
**Status:** Active
**Type:** Browser Automation (Playwright)
**Source:** [GitHub - LinkedIn Easy Apply Bots](https://github.com/NathanDuma/LinkedIn-Easy-Apply-Bot)

| Requirement | Details |
|-------------|---------|
| MOD-LI-001.1 | Authenticate via email/password to linkedin.com/login |
| MOD-LI-001.2 | Navigate and search jobs with filters (keywords, location, remote) |
| MOD-LI-001.3 | Filter for Easy Apply jobs only (f_AL=true) |
| MOD-LI-001.4 | Click "Easy Apply" button to open modal |
| MOD-LI-001.5 | Handle multi-step modal forms (up to 10 pages) |
| MOD-LI-001.6 | Auto-fill common fields: name, email, phone, LinkedIn URL |
| MOD-LI-001.7 | Handle common questions: experience years, work authorization, sponsorship |
| MOD-LI-001.8 | Upload resume file when required |
| MOD-LI-001.9 | Detect and skip "Follow company" checkbox |
| MOD-LI-001.10 | Submit application and verify success toast |
| MOD-LI-001.11 | Extract job details: title, company, location, description, skills |
| MOD-LI-001.12 | Track applicant count for job popularity |

**Technical Implementation:**
- Uses Playwright for browser control
- CSS selectors defined in `linkedin/selectors.ts`
- Session persistence via cookies (24-hour validity)
- CAPTCHA detection with user notification
- Rate limiting: 10/minute, 50/hour, 200/day (configurable)

**Detection Avoidance:**
- Human-like typing delays (50-150ms per character)
- Random delays between actions (200-500ms)
- Realistic viewport and user-agent strings
- Session cookie persistence to avoid repeated logins

**References:**
- [LinkedIn Easy Apply Bot - NathanDuma](https://github.com/NathanDuma/LinkedIn-Easy-Apply-Bot)
- [LinkedIn GPT EasyApplyBot](https://github.com/JorgeFrias/LinkedIn-GPT-EasyApplyBot)
- [AI-Powered LinkedIn Easy Apply](https://github.com/srikar-kodakandla/linkedin-easyapply-using-AI)

---

### 16.3 Indeed Module

#### MOD-IN-001: Indeed Quick Apply
**Status:** Active
**Type:** Browser Automation (Playwright)
**Source:** [Indeed Apply Documentation](https://docs.indeed.com/indeed-apply)

| Requirement | Details |
|-------------|---------|
| MOD-IN-001.1 | Authenticate via secure.indeed.com/auth (2-step: email then password) |
| MOD-IN-001.2 | Detect CAPTCHA and notify user for manual resolution |
| MOD-IN-001.3 | Search jobs with filters (keywords, location, remote, salary, type) |
| MOD-IN-001.4 | Identify Indeed Apply vs external apply buttons |
| MOD-IN-001.5 | Handle Indeed Apply modal or new tab flow |
| MOD-IN-001.6 | Auto-fill fields: name, email, phone, city, state |
| MOD-IN-001.7 | Handle education dropdown (match to profile degree) |
| MOD-IN-001.8 | Handle work authorization and sponsorship questions |
| MOD-IN-001.9 | Upload resume and enter cover letter text |
| MOD-IN-001.10 | Navigate multi-page forms (up to 10 pages) |
| MOD-IN-001.11 | Submit and verify success message |
| MOD-IN-001.12 | Parse salary information (min/max, period, estimated) |

**Technical Implementation:**
- Playwright browser automation
- CSS selectors in `indeed/selectors.ts`
- Handles new tab popups for some applications
- Session persistence via cookies
- Rate limiting: 8/minute, 40/hour, 150/day

**References:**
- [Indeed Apply Integration Guide](https://docs.indeed.com/indeed-apply)
- [Indeed API Documentation](https://docs.indeed.com/)
- [Apply with Indeed (AWI)](https://docs.indeed.com/indeed-apply/apply-with-indeed)

---

### 16.4 Glassdoor Module

#### MOD-GD-001: Glassdoor Apply
**Status:** Planned
**Type:** Browser Automation (Playwright)
**Source:** [Glassdoor + ZipRecruiter Scraper](https://apify.com/canadesk/glassdoor-ziprecruiter/api)

| Requirement | Details |
|-------------|---------|
| MOD-GD-001.1 | Authenticate via Glassdoor login |
| MOD-GD-001.2 | Search jobs with company ratings filter |
| MOD-GD-001.3 | Extract company reviews and ratings |
| MOD-GD-001.4 | Handle Easy Apply where available |
| MOD-GD-001.5 | Navigate to external apply for non-Easy Apply |
| MOD-GD-001.6 | Extract salary estimates from listings |
| MOD-GD-001.7 | Track interview difficulty ratings |

**References:**
- [Apify Glassdoor Scraper](https://apify.com/canadesk/glassdoor-ziprecruiter/api)

---

### 16.5 ZipRecruiter Module

#### MOD-ZR-001: ZipRecruiter Apply
**Status:** Planned
**Type:** Hybrid (API + Browser)
**Source:** [ZipRecruiter Partner Documentation](https://www.ziprecruiter.com/partner/documentation/)

| Requirement | Details |
|-------------|---------|
| MOD-ZR-001.1 | Integrate with ZipRecruiter Partner API (where available) |
| MOD-ZR-001.2 | Browser fallback for non-API flows |
| MOD-ZR-001.3 | Handle One-Click Apply feature |
| MOD-ZR-001.4 | Track applications via Apply Webhook |
| MOD-ZR-001.5 | Sync job postings via Job API |
| MOD-ZR-001.6 | Report hiring events back to ZipRecruiter |

**References:**
- [ZipRecruiter Partner Platform](https://www.ziprecruiter.com/partner/documentation/)
- [ZipSearch API Program](https://www.ziprecruiter.com/zipsearch)
- [ZipRecruiter APIs on RapidAPI](https://rapidapi.com/collection/ziprecruiter-api)

---

### 16.6 ATS Platform Modules

#### MOD-ATS-001: Greenhouse ATS
**Status:** Active
**Type:** Browser Automation
**Source:** [Greenhouse API](https://developers.greenhouse.io/)

| Requirement | Details |
|-------------|---------|
| MOD-ATS-001.1 | Detect Greenhouse job boards (*.greenhouse.io) |
| MOD-ATS-001.2 | Navigate multi-page application forms |
| MOD-ATS-001.3 | Handle custom screening questions |
| MOD-ATS-001.4 | Upload resume and cover letter |
| MOD-ATS-001.5 | Auto-fill standard fields via AI page analysis |
| MOD-ATS-001.6 | Handle EEOC demographic questions (optional) |
| MOD-ATS-001.7 | Submit and detect confirmation page |

**References:**
- [Greenhouse API Integration](https://developers.greenhouse.io/)
- [Unified.to Multi-ATS API](https://unified.to/blog/how_to_build_a_job_board_that_connects_to_greenhouse_lever_and_60_ats_platforms_with_a_unified_api)

#### MOD-ATS-002: Lever ATS
**Status:** Active
**Type:** Browser Automation
**Source:** [Lever API](https://hire.lever.co/developer/documentation)

| Requirement | Details |
|-------------|---------|
| MOD-ATS-002.1 | Detect Lever job boards (jobs.lever.co/*) |
| MOD-ATS-002.2 | Parse job listings from company pages |
| MOD-ATS-002.3 | Navigate application forms |
| MOD-ATS-002.4 | Handle custom fields via AI analysis |
| MOD-ATS-002.5 | Upload required documents |
| MOD-ATS-002.6 | Submit and verify confirmation |

**References:**
- [Lever Developer Documentation](https://hire.lever.co/developer/documentation)

#### MOD-ATS-003: Workday ATS
**Status:** Active
**Type:** Browser Automation
**Source:** [Workday API](https://www.getknit.dev/blog/workday-api-integration-in-depth)

| Requirement | Details |
|-------------|---------|
| MOD-ATS-003.1 | Detect Workday career sites (*.myworkdayjobs.com) |
| MOD-ATS-003.2 | Handle account creation if required |
| MOD-ATS-003.3 | Parse resume into Workday profile format |
| MOD-ATS-003.4 | Navigate complex multi-section forms |
| MOD-ATS-003.5 | Handle work history, education entry |
| MOD-ATS-003.6 | Answer screening questions |
| MOD-ATS-003.7 | Submit and track application ID |

**References:**
- [Workday API Integration Guide](https://www.getknit.dev/blog/workday-api-integration-in-depth)
- [Greenhouse-Workday Integration](https://kognitivinc.com/blog/integrating-greenhouse-ats-with-workday-kognitiv-faq/)

---

### 16.7 AI Job Discovery Module

#### MOD-EXA-001: Exa Semantic Search
**Status:** Active
**Type:** API Integration
**Source:** [Exa AI](https://exa.ai/)

| Requirement | Details |
|-------------|---------|
| MOD-EXA-001.1 | Semantic search for job postings |
| MOD-EXA-001.2 | Natural language queries ("senior react developer in NYC") |
| MOD-EXA-001.3 | Content retrieval and parsing |
| MOD-EXA-001.4 | Similar job recommendations |
| MOD-EXA-001.5 | Company discovery by industry |
| MOD-EXA-001.6 | Career page URL inference |
| MOD-EXA-001.7 | Filter by date posted |

---

### 16.8 Generic Company Site Module

#### MOD-DIRECT-001: AI-Powered Direct Apply
**Status:** Active
**Type:** Browser Automation with AI
**Source:** Built-in

| Requirement | Details |
|-------------|---------|
| MOD-DIRECT-001.1 | Use Claude Vision to analyze any career page |
| MOD-DIRECT-001.2 | Detect page type (listing, details, form, login) |
| MOD-DIRECT-001.3 | Identify form fields and their purposes |
| MOD-DIRECT-001.4 | Map profile data to form fields intelligently |
| MOD-DIRECT-001.5 | Handle unknown field types via AI inference |
| MOD-DIRECT-001.6 | Navigate multi-page application flows |
| MOD-DIRECT-001.7 | Detect success/confirmation pages |
| MOD-DIRECT-001.8 | Screenshot capture for debugging |

**AI Analysis Capabilities:**
- Visual screenshot analysis with Claude Vision
- HTML structure parsing
- Form field type detection
- Job-profile matching scoring
- Intelligent field value determination

---

### 16.9 Bot Detection Avoidance

Based on research into browser automation detection methods:

**Source:** [Playwright Stealth Guide](https://brightdata.com/blog/how-tos/avoid-bot-detection-with-playwright-stealth), [Detection Comparison](https://www.morelogin.com/blog/comparison-and-risk-analysis-of-automated-framework-detection)

| Requirement | Details |
|-------------|---------|
| MOD-STEALTH-001 | Remove navigator.webdriver property |
| MOD-STEALTH-002 | Remove "HeadlessChrome" from user-agent |
| MOD-STEALTH-003 | Disable automation flags (--disable-blink-features=AutomationControlled) |
| MOD-STEALTH-004 | Set realistic viewport dimensions |
| MOD-STEALTH-005 | Randomize typing speed (30-150ms per character) |
| MOD-STEALTH-006 | Add random delays between actions (200-500ms) |
| MOD-STEALTH-007 | Simulate mouse movements (not just clicks) |
| MOD-STEALTH-008 | Use playwright-stealth plugin evasion modules |
| MOD-STEALTH-009 | Rotate user-agent strings periodically |
| MOD-STEALTH-010 | Persist and reuse cookies/sessions |
| MOD-STEALTH-011 | Avoid CDP detection patterns |
| MOD-STEALTH-012 | Implement realistic scroll behavior |

**References:**
- [Making Playwright Undetectable](https://scrapeops.io/playwright-web-scraping-playbook/nodejs-playwright-make-playwright-undetectable/)
- [CDP Detection Avoidance](https://substack.thewebscraping.club/p/playwright-stealth-cdp)
- [Browserless Anti-Detection](https://www.browserless.io)

---

### 16.10 Rate Limiting Configuration

Default rate limits per module (admin-configurable):

| Module | Per Minute | Per Hour | Per Day | Delay (ms) |
|--------|------------|----------|---------|------------|
| LinkedIn | 10 | 50 | 200 | 2000-5000 |
| Indeed | 8 | 40 | 150 | 2000-5000 |
| Glassdoor | 6 | 30 | 100 | 3000-6000 |
| ZipRecruiter | 8 | 40 | 150 | 2000-5000 |
| Greenhouse | 15 | 100 | 500 | 1000-3000 |
| Lever | 15 | 100 | 500 | 1000-3000 |
| Workday | 10 | 60 | 300 | 2000-4000 |
| Company Sites | 5 | 30 | 100 | 3000-8000 |

---

### 16.11 Module Database Schema

```sql
-- Module Registry
CREATE TABLE modules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  version VARCHAR(20),
  platform VARCHAR(50),
  type ENUM('browser', 'api', 'hybrid'),
  status ENUM('enabled', 'disabled', 'beta', 'deprecated'),
  config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disabled_reason VARCHAR(50),
  disabled_at TIMESTAMP,
  disabled_by VARCHAR(50)
);

-- User Module Settings
CREATE TABLE user_modules (
  user_id VARCHAR(50),
  module_id VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  config JSON,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, module_id),
  FOREIGN KEY (module_id) REFERENCES modules(id)
);

-- Module Health Metrics
CREATE TABLE module_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('healthy', 'degraded', 'down'),
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_response_time INTEGER,
  error_types JSON,
  FOREIGN KEY (module_id) REFERENCES modules(id)
);

-- Module Audit Log
CREATE TABLE module_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id VARCHAR(50),
  action VARCHAR(50),
  actor_id VARCHAR(50),
  actor_type ENUM('admin', 'system', 'user'),
  details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id)
);
```

---

## 15. Testing Requirements

### 15.1 Unit Testing

| ID | Requirement | Details |
|----|-------------|---------|
| TEST-UNIT-001 | Utility Functions | Test all utility functions |
| TEST-UNIT-002 | Validators | Test all validation schemas |
| TEST-UNIT-003 | Formatters | Test all formatting functions |
| TEST-UNIT-004 | Skill Normalization | Test skill matching algorithms |
| TEST-UNIT-005 | Experience Parsing | Test experience year parsing |

### 15.2 Integration Testing

| ID | Requirement | Details |
|----|-------------|---------|
| TEST-INT-001 | API Endpoints | Test all tRPC endpoints |
| TEST-INT-002 | Database Operations | Test all CRUD operations |
| TEST-INT-003 | Auth Flow | Test authentication flows |
| TEST-INT-004 | AI Integration | Test Claude API integration |
| TEST-INT-005 | Job Discovery | Test Exa API integration |

### 15.3 End-to-End Testing

| ID | Requirement | Details |
|----|-------------|---------|
| TEST-E2E-001 | Navigation | Test page navigation flows |
| TEST-E2E-002 | Profile Workflow | Test profile creation and editing |
| TEST-E2E-003 | Hunt Flow | Test job hunt workflow |
| TEST-E2E-004 | Application Flow | Test application tracking |
| TEST-E2E-005 | Auth Flow | Test signin/signout |

### 15.4 Coverage Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| TEST-COV-001 | Critical Paths | 80% minimum coverage |
| TEST-COV-002 | API Endpoints | 90% minimum coverage |
| TEST-COV-003 | Utility Functions | 95% minimum coverage |

---

## 16. Acceptance Criteria

### 16.1 Authentication Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-AUTH-001 | Users can sign up with Google OAuth | Manual test |
| AC-AUTH-002 | Users can sign in with credentials | Manual test |
| AC-AUTH-003 | Sessions persist across page refreshes | Automated test |
| AC-AUTH-004 | Users can sign out completely | Manual test |
| AC-AUTH-005 | Demo mode only works in development | Environment test |

### 16.2 Profile Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-PROF-001 | Users can create a profile from scratch | Manual test |
| AC-PROF-002 | Resume upload parses and populates profile | Automated test |
| AC-PROF-003 | All profile fields can be edited | Manual test |
| AC-PROF-004 | Multiple profiles can be managed | Automated test |
| AC-PROF-005 | Profile duplication works correctly | Automated test |

### 16.3 Job Discovery Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-DISC-001 | Job search returns relevant results | Manual test |
| AC-DISC-002 | Filters work correctly | Automated test |
| AC-DISC-003 | Job details are fully extracted | Automated test |
| AC-DISC-004 | Easy-apply jobs are identified | Automated test |

### 16.4 Job Matching Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-MATCH-001 | Match scores are calculated for all jobs | Automated test |
| AC-MATCH-002 | Scores reflect actual compatibility | Manual review |
| AC-MATCH-003 | Fit categories are assigned correctly | Automated test |
| AC-MATCH-004 | Recommendations are actionable | Manual review |

### 16.5 Application Submission Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-SUB-001 | LinkedIn Easy Apply works end-to-end | E2E test |
| AC-SUB-002 | Indeed Quick Apply works end-to-end | E2E test |
| AC-SUB-003 | Form fields are filled correctly | E2E test |
| AC-SUB-004 | Resume upload works | E2E test |
| AC-SUB-005 | Cover letters are generated | Automated test |

### 16.6 Application Tracking Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-TRACK-001 | All applications are tracked | Automated test |
| AC-TRACK-002 | Status updates are reflected | Manual test |
| AC-TRACK-003 | Events are logged | Automated test |
| AC-TRACK-004 | Notes can be added | Manual test |

### 16.7 Analytics Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-ANAL-001 | Dashboard shows accurate metrics | Automated test |
| AC-ANAL-002 | Charts display correctly | Visual test |
| AC-ANAL-003 | Statistics are calculated correctly | Automated test |

### 16.8 Automation Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-AUTO-001 | Automation can be started/stopped | Manual test |
| AC-AUTO-002 | Rate limits are respected | Automated test |
| AC-AUTO-003 | Sessions are logged | Automated test |
| AC-AUTO-004 | Errors are captured | Automated test |

### 16.9 Security Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-SEC-001 | Credentials are encrypted | Code review |
| AC-SEC-002 | Sessions are secure | Security audit |
| AC-SEC-003 | No sensitive data in logs | Code review |
| AC-SEC-004 | Demo mode is disabled in production | Environment test |

### 16.10 Performance Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-PERF-001 | Pages load within 2 seconds | Performance test |
| AC-PERF-002 | API responses within 500ms | Performance test |
| AC-PERF-003 | No memory leaks | Load test |

### 16.11 CLI Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-CLI-001 | CLI commands execute correctly | Automated test |
| AC-CLI-002 | Help text is displayed for all commands | Manual test |
| AC-CLI-003 | Error messages are clear and actionable | Manual test |
| AC-CLI-004 | Configuration file is loaded correctly | Automated test |
| AC-CLI-005 | Output formats work correctly (JSON, table) | Automated test |

### 16.12 Data Export/Import Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-EXP-001 | Profile data exports as valid JSON | Automated test |
| AC-EXP-002 | Application history exports as valid CSV | Automated test |
| AC-EXP-003 | Exported data can be re-imported | Automated test |
| AC-EXP-004 | Import validates data before processing | Automated test |

### 16.13 Compliance Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-COMP-001 | Users can request data deletion | Manual test |
| AC-COMP-002 | Users can export all their data | Manual test |
| AC-COMP-003 | Privacy policy is accessible | Manual test |
| AC-COMP-004 | Cookie consent is implemented | Manual test |
| AC-COMP-005 | WCAG 2.1 AA compliance verified | Accessibility audit |

### 16.14 Deployment Acceptance

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-DEP-001 | Application builds successfully | CI/CD test |
| AC-DEP-002 | Docker container runs correctly | Automated test |
| AC-DEP-003 | Health checks return correct status | Automated test |
| AC-DEP-004 | Environment variables are validated | Automated test |
| AC-DEP-005 | Graceful shutdown works correctly | Manual test |

---

## 17. Future Roadmap

### 17.1 Planned Features (High Priority)

| ID | Feature | Description |
|----|---------|-------------|
| FUT-001 | WebSocket Hunt Tracking | Real-time progress updates via WebSocket |
| FUT-002 | Hunt History | Database storage for past hunt sessions |
| FUT-003 | Automation Sessions Table | Persistent automation session history |
| FUT-004 | Cover Letter Templates | Customizable cover letter templates |
| FUT-005 | Bulk Operations | Bulk status updates on applications |

### 17.2 Planned Features (Medium Priority)

| ID | Feature | Description |
|----|---------|-------------|
| FUT-006 | Job Recommendations | ML-based job recommendations |
| FUT-007 | Advanced Analytics | Deeper insights and predictions |
| FUT-008 | More Job Boards | Glassdoor, ZipRecruiter, etc. |
| FUT-009 | Email Notifications | Email alerts for application updates |
| FUT-010 | Calendar Integration | Interview scheduling integration |

### 17.3 Planned Features (Low Priority)

| ID | Feature | Description |
|----|---------|-------------|
| FUT-011 | Mobile App | iOS/Android mobile application |
| FUT-012 | Browser Extension | Quick apply from any job page |
| FUT-013 | Team Features | Recruiter/coach collaboration |
| FUT-014 | API Access | External API for integrations |
| FUT-015 | Custom Platforms | User-defined platform adapters |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Easy Apply | Simplified application process offered by LinkedIn |
| Quick Apply | Simplified application process offered by Indeed |
| Match Score | AI-calculated compatibility between job and profile (0-100) |
| Fit Category | Classification of match quality (excellent, good, moderate, stretch, unlikely) |
| Hunt | Automated job discovery and application workflow session |
| Profile | User's job seeker profile with experience and preferences |
| Platform | External job board (LinkedIn, Indeed, etc.) |
| Dry Run | Test mode that simulates but doesn't submit applications |
| tRPC | Type-safe RPC framework for TypeScript |
| Orchestrator | Core engine that coordinates job discovery, matching, and application |
| Browser Automation | Playwright-based system for controlling web browsers |
| Semantic Search | AI-powered search that understands meaning, not just keywords |
| Exa API | External service for semantic job discovery |
| Claude AI | Anthropic's AI model used for parsing, matching, and generation |
| OAuth | Open standard for access delegation (Google login) |
| Session | Authenticated user connection with stored state |
| Headless Mode | Browser operation without visible UI |
| Rate Limiting | Controlling request frequency to prevent overload/blocking |
| Exponential Backoff | Retry strategy with progressively longer delays |
| Monorepo | Single repository containing multiple related packages |
| pnpm Workspace | Package management for monorepo structure |

## Appendix B: Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| APP_MODE | Yes | Application mode (demo/production) |
| NEXTAUTH_SECRET | Yes | NextAuth session encryption key |
| NEXTAUTH_URL | Yes | Application URL |
| GOOGLE_CLIENT_ID | Production | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Production | Google OAuth client secret |
| ANTHROPIC_API_KEY | Yes | Claude API key |
| EXA_API_KEY | Yes | Exa API key |
| CREDENTIALS_ENCRYPTION_KEY | Yes | Credential encryption key (32 bytes) |     
| CREDENTIALS_ENCRYPTION_SALT | Yes | Credential encryption salt (16 bytes) |   
| DATABASE_PATH | No | SQLite database path |
| MAX_APPLICATIONS_PER_DAY | No | Daily application limit |
| MAX_APPLICATIONS_PER_HOUR | No | Hourly application limit |
| MIN_DELAY_BETWEEN_ACTIONS | No | Minimum delay between actions (ms) |
| MAX_DELAY_BETWEEN_ACTIONS | No | Maximum delay between actions (ms) |
| BROWSER_HEADLESS | No | Run browser in headless mode |
| DRY_RUN_MODE | No | Enable dry run mode |
| BROWSER_TIMEOUT | No | Browser operation timeout (default 30000 ms) |
| SCREENSHOT_ON_ERROR | No | Capture screenshots on automation errors |
| REQUIRE_CONFIRMATION | No | Require user confirmation for applications |      
| BLOCKED_COMPANIES | No | Comma-separated list of blocked companies |
| LOG_LEVEL | No | Logging level (debug, info, warn, error) |
| NEXT_PUBLIC_APP_MODE | No | Client-side app mode awareness |

---

## Appendix C: Package Structure

| Package | Purpose |
|---------|---------|
| `@job-applier/core` | Shared types, schemas, and utilities |
| `@job-applier/config` | Configuration and environment management |
| `@job-applier/database` | SQLite persistence layer with sql.js |
| `@job-applier/resume-parser` | Claude-powered resume parsing |
| `@job-applier/job-discovery` | Exa API job search integration |
| `@job-applier/browser-automation` | Playwright browser control |
| `@job-applier/platforms` | LinkedIn and Indeed adapters |
| `@job-applier/application-tracker` | Application history and analytics |
| `@job-applier/orchestrator` | Main job matching and application engine |
| `@job-applier/ai-job-hunter` | AI form filling and page analysis |
| `@job-applier/web` | Next.js frontend and tRPC backend |
| `@job-applier/cli` | Command-line interface |

---

## Appendix D: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | - | Initial comprehensive requirements document |

---

**Document End**
