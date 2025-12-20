# Architecture Documentation

**Project:** Job-Applier
**Location:** `C:/Users/joelf/job-applier`
**Last Updated:** 2025-12-20

---

## Overview

This directory contains comprehensive architecture documentation for the job-applier project, including design decisions, critical issues, and system diagrams.

---

## Documents

### 1. [Architecture Review](./ARCHITECTURE_REVIEW.md) ⭐ START HERE

**Complete analysis of the codebase architecture**

- Project structure assessment
- API design (tRPC routers)
- State management patterns
- Database design and repository pattern
- Component architecture
- Configuration management
- Identified anti-patterns
- Scalability concerns
- Suggested improvements with priorities
- Architecture decision records

**Overall Grade:** B+ (Good, with areas for improvement)

**Key Findings:**
- ✅ Excellent package organization
- ✅ Strong type safety
- ✅ Clean repository pattern
- ❌ Missing authentication middleware (CRITICAL)
- ❌ No authorization checks
- ❌ Incomplete features (TODOs)

---

### 2. [Critical Issues](./CRITICAL_ISSUES.md) 🔴 URGENT

**Must-fix issues before production deployment**

Five critical issues identified:

1. **Missing Authentication Middleware** (CRITICAL)
   - All tRPC endpoints use `publicProcedure`
   - No user verification
   - Data privacy violation

2. **No Row-Level Security** (CRITICAL)
   - Users can access other users' data
   - No ownership checks
   - Compliance risk

3. **No API Rate Limiting** (HIGH)
   - Vulnerable to DoS attacks
   - API abuse possible
   - Resource exhaustion

4. **Missing Service Layer** (MEDIUM-HIGH)
   - Business logic in routers
   - Hard to test and maintain
   - No transaction boundaries

5. **Incomplete Features (TODOs)** (MEDIUM)
   - Settings not persisted
   - File uploads not implemented
   - Many placeholder functions

**Estimated effort to fix all:** 2-3 weeks

---

### 3. [System Architecture](./SYSTEM_ARCHITECTURE.md) 📊 VISUAL

**Visual diagrams and architecture documentation**

Contains:
- High-level system architecture diagram
- Package dependency graph
- Data flow diagrams
- Component hierarchy
- State management layers
- Database schema
- API routes (tRPC)
- Security architecture
- Deployment options

**Use this for:**
- Understanding system structure
- Onboarding new developers
- Planning changes
- Communicating with stakeholders

---

## Quick Start

### For Developers

1. **Read [Architecture Review](./ARCHITECTURE_REVIEW.md)** to understand overall design
2. **Check [Critical Issues](./CRITICAL_ISSUES.md)** for what needs immediate attention
3. **Refer to [System Architecture](./SYSTEM_ARCHITECTURE.md)** for implementation details

### For Project Managers

1. **Review Critical Issues** - these block production deployment
2. **Estimated Timeline:**
   - Week 1: Authentication & Authorization
   - Week 2: Service Layer & Rate Limiting
   - Week 3: Complete TODOs & Testing

### For Security Auditors

1. **See Critical Issues #1 and #2** - authentication/authorization gaps
2. **Review Security Architecture section** in System Architecture
3. **Check environment configuration** in Architecture Review section 6

---

## Architecture Principles

This codebase follows these principles (mostly):

### 1. Separation of Concerns ✅
- Monorepo with clear package boundaries
- Core types separate from implementation
- Database layer abstracted via repositories

### 2. Type Safety ✅
- End-to-end TypeScript
- Zod schemas for runtime validation
- tRPC for type-safe API

### 3. Single Responsibility ✅
- Each package has one clear purpose
- Repository pattern for data access
- Component-based UI

### 4. DRY (Don't Repeat Yourself) ✅
- Shared core package
- Reusable UI components
- Utility functions centralized

### 5. KISS (Keep It Simple) ✅
- Simple SQLite for persistence
- Straightforward state management
- Minimal abstractions where appropriate

### 6. Security by Default ⚠️ NEEDS WORK
- Production/demo mode separation ✅
- Environment validation ✅
- **Missing:** Authentication middleware ❌
- **Missing:** Authorization checks ❌
- **Missing:** Rate limiting ❌

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand + tRPC/React Query
- **Forms:** React Hook Form + Zod
- **Auth:** NextAuth.js

### Backend
- **API:** tRPC
- **Runtime:** Node.js 18+
- **Database:** SQLite (sql.js)
- **ORM:** None (raw SQL via repositories)
- **Validation:** Zod

### AI/Automation
- **LLM:** Claude (Anthropic)
- **Search:** Exa API
- **Browser:** Playwright

### Development
- **Language:** TypeScript
- **Build:** npm workspaces
- **Testing:** Vitest + Playwright
- **Linting:** ESLint + TypeScript

---

## Package Overview

```
packages/
├── core                    # Shared types, utilities, errors
├── database               # SQLite + repositories + DataStorage facade
├── config                 # Configuration management with Zod validation
├── resume-parser          # Resume extraction with Claude
├── job-discovery          # Job search via Exa
├── browser-automation     # Playwright wrapper
├── platforms              # LinkedIn, Indeed adapters
├── application-tracker    # Application state tracking
├── orchestrator           # Main workflow engine
├── ai-job-hunter          # AI-powered job hunting
├── cli                    # Command-line interface
└── web                    # Next.js web application
```

**Dependencies flow:** core → database → orchestrator → cli/web

---

## Database Schema Summary

### Core Tables
- `users` - User accounts (Google OAuth or demo)
- `profiles` - User resumes/profiles (one-to-many with users)
- `jobs` - Job listings (discovered via Exa)
- `applications` - Job applications (many-to-many: profiles ↔ jobs)
- `job_matches` - AI-calculated job-profile matches
- `application_events` - Audit log for applications
- `platform_credentials` - LinkedIn, Indeed credentials (encrypted)
- `settings` - Key-value configuration store

### Relationships
```
users (1) ─────► (n) profiles
profiles (n) ───► (n) jobs (via applications)
jobs (1) ───────► (n) job_matches ◄─── (1) profiles
applications (1) ► (n) application_events
```

---

## API Structure (tRPC)

### Routers
```
appRouter
├── auth                   # Authentication
├── profile                # User profiles ⚠️ Needs auth
├── jobs                   # Job listings (public read, auth write)
├── applications           # Applications ⚠️ Needs auth + ownership
├── hunt                   # Job hunting ⚠️ Needs auth
├── settings               # Settings ⚠️ Needs auth
├── dashboard              # Dashboard stats ⚠️ Needs auth
└── automation             # Automation control ⚠️ Needs auth
```

**⚠️ WARNING:** Most routes missing authentication enforcement!

---

## State Management

### Server State (tRPC + React Query)
- Jobs data (cached, auto-refetch)
- Applications data (optimistic updates)
- Profile data (persistent)
- Settings (synced)

### Client State (Zustand)
- UI filters and sorting
- View modes (list/kanban/calendar)
- Automation status (persisted)
- Selected items

### Form State (React Hook Form)
- Profile editing
- Settings forms
- Application forms

### UI State (React useState)
- Modals open/closed
- Loading states
- Toast notifications

**⚠️ Issue:** Some duplication between tRPC cache and Zustand stores

---

## Security Considerations

### Current Security
- ✅ Input validation with Zod
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS prevention (React escaping)
- ✅ NextAuth for authentication
- ✅ Production/demo mode separation

### Security Gaps
- ❌ No authentication on tRPC endpoints
- ❌ No authorization/ownership checks
- ❌ No rate limiting
- ❌ No audit logging
- ❌ No encryption for sensitive data (API keys, credentials)

**Action Required:** See [Critical Issues](./CRITICAL_ISSUES.md)

---

## Performance Characteristics

### Current Performance
- ✅ Fast local SQLite queries
- ✅ React Query caching reduces network calls
- ✅ Static asset optimization (Next.js)
- ✅ Database indexes on foreign keys

### Known Bottlenecks
- ⚠️ No pagination on large lists (loads all jobs)
- ⚠️ Job table renders all rows (should virtualize)
- ⚠️ No caching layer (Redis)
- ⚠️ Browser automation is slow (Playwright)

### Scalability Limits
- **SQLite:** ~1,000 concurrent users max
- **Single server:** No horizontal scaling
- **File storage:** Local filesystem only

**Migration path:** PostgreSQL + Redis + S3 when needed

---

## Deployment Options

### Option 1: Vercel (Recommended)
- Zero config deployment
- CDN for static assets
- Edge functions for API
- Automatic scaling
- **Limitation:** SQLite not ideal (use Vercel Postgres)

### Option 2: Self-Hosted
- Full control
- SQLite works perfectly
- PM2 for process management
- Nginx for reverse proxy
- **Trade-off:** Manual scaling, maintenance

### Option 3: Docker
- Containerized deployment
- Portable across environments
- Easy local development
- **Limitation:** Requires container orchestration for scale

---

## Testing Strategy

### Current Tests
- Unit tests in `__tests__` directories
- E2E tests with Playwright (web package)
- Test coverage unknown

### Recommended Coverage
- 80% line coverage minimum
- 100% for critical paths (auth, data mutations)
- Integration tests for all tRPC routers
- E2E tests for user workflows

### Test Gaps
- Missing service layer tests (service layer doesn't exist yet)
- No repository integration tests with real DB
- No load testing

---

## Development Workflow

### Setup
```bash
npm install
npm run build
```

### Run Development Server
```bash
cd packages/web
npm run dev
```

### Run CLI
```bash
npm run cli -- search --keywords "typescript developer"
```

### Run Tests
```bash
npm test
```

### Type Check
```bash
npm run typecheck
```

---

## Roadmap

### Phase 1: Critical Fixes (2-3 weeks)
- [ ] Add authentication middleware to tRPC
- [ ] Implement row-level security
- [ ] Add API rate limiting
- [ ] Create service layer
- [ ] Complete TODO items in settings

### Phase 2: Feature Completion (1-2 months)
- [ ] File upload for resumes (S3/R2)
- [ ] Hunt tracking and history
- [ ] WebSocket for real-time updates
- [ ] Email notifications
- [ ] Enhanced analytics

### Phase 3: Scale & Polish (2-3 months)
- [ ] Migrate to PostgreSQL (if needed)
- [ ] Add Redis caching layer
- [ ] Implement comprehensive logging
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Performance optimization
- [ ] Mobile responsiveness improvements

---

## Contributing

### Before Making Changes

1. Read this architecture documentation
2. Check [Critical Issues](./CRITICAL_ISSUES.md) to avoid conflicts
3. Follow existing patterns (repository, service, router)
4. Add tests for new features
5. Update documentation

### Code Review Checklist

- [ ] Uses `protectedProcedure` for authenticated endpoints
- [ ] Validates input with Zod schemas
- [ ] Implements proper error handling
- [ ] Filters data by `userId` (row-level security)
- [ ] Includes unit tests
- [ ] Updates types if schema changes
- [ ] No hardcoded credentials or secrets

---

## Resources

### Internal Documentation
- [Architecture Review](./ARCHITECTURE_REVIEW.md) - Complete analysis
- [Critical Issues](./CRITICAL_ISSUES.md) - Urgent fixes needed
- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Diagrams and details

### External Resources
- [tRPC Documentation](https://trpc.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zod Documentation](https://zod.dev)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Playwright Documentation](https://playwright.dev)

---

## Contact

For questions about this architecture:
- Review existing documentation first
- Check [Critical Issues](./CRITICAL_ISSUES.md) for known problems
- Consult [System Architecture](./SYSTEM_ARCHITECTURE.md) for implementation details

---

**Last Updated:** 2025-12-20
**Next Review:** After critical issues resolved
