# Architecture Review: Job-Applier

**Date:** 2025-12-20
**Reviewer:** System Architect
**Codebase:** C:/Users/joelf/job-applier
**Type:** Comprehensive Architecture Assessment

---

## Executive Summary

The job-applier codebase demonstrates a **well-structured monorepo architecture** with clear separation of concerns. The application successfully implements a modern TypeScript-based job application automation system with both CLI and web interfaces.

**Overall Assessment:** B+ (Good, with areas for improvement)

**Key Strengths:**
- Clean package separation with appropriate boundaries
- Comprehensive type safety with Zod schemas
- Repository pattern for data access
- Unified storage facade (DataStorage)
- Strong error handling hierarchy
- Environment-aware configuration with production/demo modes

**Critical Issues to Address:**
1. Missing authentication middleware in tRPC (all procedures are public)
2. Incomplete tRPC mutations (many TODOs in UI components)
3. Inconsistent state management patterns
4. Repository pattern implementation issues
5. Lack of API rate limiting
6. Missing data validation in some routers

---

## 1. Project Structure Analysis

### 1.1 Monorepo Organization

**Structure:**
```
job-applier/
├── packages/
│   ├── core/                    # Types, utilities, constants
│   ├── database/                # SQLite + repositories
│   ├── config/                  # Configuration management
│   ├── resume-parser/           # Resume extraction
│   ├── job-discovery/           # Job search
│   ├── browser-automation/      # Playwright wrapper
│   ├── platforms/               # LinkedIn, Indeed adapters
│   ├── application-tracker/     # Application state tracking
│   ├── orchestrator/            # Main workflow engine
│   ├── ai-job-hunter/           # AI-powered job hunting
│   ├── cli/                     # CLI interface
│   └── web/                     # Next.js web app
```

**Assessment:** ✅ Excellent

**Strengths:**
- Clear domain boundaries between packages
- Proper dependency hierarchy (core → database → orchestrator)
- Shared core types prevent duplication
- TypeScript path aliases (`@job-applier/*`) for clean imports

**Weaknesses:**
- `packages/web` is significantly larger than other packages (potential monolith-within-monorepo)
- Missing shared UI component library for potential future packages
- No clear documentation on package interdependencies

**Recommendation:**
- Extract `packages/web/src/components/ui` to `packages/ui-components` for reusability
- Create dependency graph documentation
- Consider feature-based slicing for web package

---

## 2. API Design (tRPC)

### 2.1 Router Organization

**Current Structure:**
```typescript
appRouter
├── auth          // Authentication
├── profile       // User profiles
├── jobs          // Job listings
├── applications  // Applications
├── hunt          // Job hunting
├── settings      // Settings
├── dashboard     // Dashboard stats
└── automation    // Automation control
```

**Assessment:** ✅ Good, with concerns

**Strengths:**
- Clean namespace separation
- Type-safe end-to-end with `AppRouter` type export
- Consistent use of Zod for input validation
- SuperJSON transformer for Date/Map/Set support
- Custom error formatter for Zod errors

### 2.2 Critical Issues

#### Issue 1: No Authentication Middleware (CRITICAL)

**Current Code:**
```typescript
// packages/web/src/server/trpc.ts
export const publicProcedure = t.procedure;
```

**All routers use `publicProcedure`** - no authentication enforcement!

**Example:**
```typescript
// packages/web/src/server/routers/profile.ts
getProfile: publicProcedure  // ❌ Should require auth
  .query(async ({ ctx }) => {
    return ctx.profileRepository.getDefault();
  }),
```

**Impact:** Any user can access any profile/job/application data.

**Fix Required:**
```typescript
// Add protected procedure
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Use in routers
getProfile: protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.profileRepository.getByUserId(userId);
  }),
```

**Priority:** 🔴 CRITICAL - Must fix before production

---

#### Issue 2: Inconsistent Error Handling

**Good Example:**
```typescript
// packages/web/src/server/routers/jobs.ts
getById: publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const job = ctx.jobRepository.findById(input.id);
    if (!job) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Job with ID ${input.id} not found`,
      });
    }
    return job;
  }),
```

**Bad Example:**
```typescript
// packages/web/src/server/routers/hunt.ts
startHunt: publicProcedure
  .input(/* schema */)
  .mutation(async ({ ctx, input }) => {
    const result = await ctx.orchestrator.hunt(input);
    // ❌ No error handling if hunt() throws
    return result;
  }),
```

**Recommendation:**
- Wrap all repository/orchestrator calls in try-catch
- Map domain errors to tRPC errors consistently
- Add error logging middleware

---

#### Issue 3: Missing Input Validation

**Problem:**
```typescript
// packages/web/src/server/routers/jobs.ts
search: publicProcedure
  .input(
    z.object({
      keywords: z.array(z.string()).optional(),
      // ... other fields
    })
  )
  .query(async ({ ctx, input }) => {
    return ctx.jobRepository.search(input as Partial<JobSearchQuery>);
    // ❌ Type assertion bypasses Zod validation
  }),
```

**Fix:**
- Define `JobSearchQuerySchema` in `@job-applier/core`
- Use `.extend()` to add tRPC-specific fields
- Remove type assertions

---

### 2.3 Response Format Consistency

**Assessment:** ✅ Good

**Observations:**
- Queries return data directly
- Mutations return `{ success: true }` or data
- Error responses use tRPC error codes

**Recommendation:**
- Document response patterns in API design guide
- Consider wrapping responses in standard envelope for mutations:
  ```typescript
  { success: true, data: T } | { success: false, error: string }
  ```

---

## 3. State Management

### 3.1 Client-Side State (Web)

**Current Strategy:**
- **Zustand** for local state (applications, automation)
- **tRPC/React Query** for server state
- **React Hook Form** for form state (assumed, not confirmed)

**Zustand Stores:**
1. `applications-store.ts` - Application state with filters/sorting
2. `automation-store.ts` - Automation status with persistence

**Assessment:** ⚠️ Mixed

**Strengths:**
- Clean Zustand store implementations with devtools
- Computed selectors (e.g., `getFilteredApplications`)
- Proper immutability in reducers
- Stats calculation is efficient

**Weaknesses:**

#### Issue 1: Overlapping Responsibilities

```typescript
// applications-store.ts
interface ApplicationsState {
  applications: Application[];  // ❌ Duplicates tRPC cache
  // ...
}
```

**Problem:** Applications are fetched via tRPC but also stored in Zustand.

**Solution:**
- Use tRPC query cache as source of truth
- Zustand should only manage UI state (filters, sorting, view mode)
- Use React Query's built-in features for optimistic updates

**Recommended Pattern:**
```typescript
// Just UI state
interface ApplicationsUIState {
  filters: ApplicationFilters;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'kanban';
  selectedId: string | null;
}

// Data comes from tRPC
const { data: applications } = trpc.applications.list.useQuery(filters);
```

---

#### Issue 2: Missing Optimistic Updates

```typescript
// Current: No optimistic updates for mutations
const updateStatus = trpc.applications.updateStatus.useMutation();

// Better: With optimistic updates
const updateStatus = trpc.applications.updateStatus.useMutation({
  onMutate: async (newStatus) => {
    await queryClient.cancelQueries(['applications']);
    const previous = queryClient.getQueryData(['applications']);
    queryClient.setQueryData(['applications'], (old) =>
      updateApplicationInList(old, newStatus)
    );
    return { previous };
  },
  onError: (err, newStatus, context) => {
    queryClient.setQueryData(['applications'], context.previous);
  },
});
```

---

### 3.2 Server State (tRPC Context)

**Context Structure:**
```typescript
export async function createContext() {
  return {
    session,
    userId: session?.user?.id ?? 'default',
    profileRepository,
    jobRepository,
    applicationRepository,
    configManager,
    orchestrator: new JobHunterOrchestrator(), // ❌ Creates new instance per request
  };
}
```

**Issue:** New `JobHunterOrchestrator` instance on every request

**Impact:**
- No state persistence between requests
- Cannot track long-running hunts
- Inefficient resource usage

**Fix:**
```typescript
// Create singleton or use dependency injection
let orchestratorInstance: JobHunterOrchestrator | null = null;

export async function createContext() {
  if (!orchestratorInstance) {
    orchestratorInstance = new JobHunterOrchestrator();
  }

  return {
    // ...
    orchestrator: orchestratorInstance,
  };
}
```

---

## 4. Database Design

### 4.1 Schema Design

**Assessment:** ✅ Excellent

**Strengths:**
- Normalized schema with proper foreign keys
- Indexes on commonly queried fields
- Triggers for automatic `updated_at` timestamps
- Soft deletes via status fields
- JSON columns for complex data (skills, experience)

**Schema Highlights:**
```sql
-- Good: Proper constraints
UNIQUE(platform, external_id)  -- Prevents duplicate jobs
FOREIGN KEY ON DELETE CASCADE  -- Cascading deletes

-- Good: Performance indexes
idx_jobs_posted_at
idx_applications_status
idx_matches_score
```

**Minor Issues:**

1. **Missing `user_id` in some tables:**
   ```sql
   -- Current: profiles table
   CREATE TABLE profiles (
     id TEXT PRIMARY KEY,
     user_id TEXT,  -- ❌ No NOT NULL, no index
   ```

   **Fix:** Make `user_id` NOT NULL and add index

2. **No composite indexes for common queries:**
   ```sql
   -- Add for user-specific queries
   CREATE INDEX idx_profiles_user_default
   ON profiles(user_id, is_default);

   CREATE INDEX idx_applications_user_status
   ON applications(profile_id, status, applied_at);
   ```

---

### 4.2 Repository Pattern

**Assessment:** ⚠️ Good Implementation, Misuse in Practice

**Repository Implementation:**
```typescript
// packages/database/src/repositories/job-repository.ts
export class JobRepository {
  upsert(job: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>): JobListing {
    const existing = this.findByExternalId(job.platform, job.externalId);
    if (existing) {
      return this.update(existing.id, job);
    }
    // ... create new
  }
}
```

**Strengths:**
- Clean CRUD operations
- Type-safe with Zod validation
- Proper error handling with custom errors
- Transaction support via `DataStorage.transaction()`

**Issues:**

#### Issue 1: Repositories Exposed Directly in Context

```typescript
// packages/web/src/lib/trpc/server.ts
export async function createContext() {
  return {
    profileRepository,  // ❌ Direct repository access
    jobRepository,
    applicationRepository,
  };
}
```

**Problem:** Routers can bypass business logic and directly manipulate data.

**Better Pattern:**
```typescript
// Create service layer
class ProfileService {
  constructor(private repo: ProfileRepository) {}

  async getProfile(userId: string) {
    const profile = await this.repo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    // Business logic here (validation, side effects, etc.)
    return this.repo.update(userId, updates);
  }
}

// In context
return {
  profileService: new ProfileService(profileRepository),
};
```

---

#### Issue 2: Missing Transaction Boundaries in Complex Operations

**Current:**
```typescript
// packages/web/src/server/routers/applications.ts
create: publicProcedure
  .mutation(async ({ ctx, input }) => {
    // ❌ No transaction - if second operation fails, first succeeds
    const application = ctx.applicationRepository.create(input);
    await ctx.statsRepository.incrementApplicationsSent();
    return application;
  }),
```

**Fix:**
```typescript
create: protectedProcedure
  .mutation(async ({ ctx, input }) => {
    return dataStorage.transaction(() => {
      const application = ctx.applicationRepository.create(input);
      ctx.statsRepository.incrementApplicationsSent();
      return application;
    });
  }),
```

---

### 4.3 Data Storage Facade

**Assessment:** ✅ Excellent Pattern

**Implementation:**
```typescript
// packages/database/src/data-storage.ts
class DataStorage {
  get profiles(): ProfileRepository { /* ... */ }
  get jobs(): JobRepository { /* ... */ }

  async initialize(config: DatabaseConfig): Promise<void> { /* ... */ }
  getHealth(): StorageHealth { /* ... */ }
  transaction<T>(fn: () => T): T { /* ... */ }
}

export const dataStorage = new DataStorage();
```

**Strengths:**
- Single initialization point
- Lazy loading of repositories
- Health checks and stats
- Transaction support
- Export/import utilities
- Cleanup methods

**This is a strong architectural decision** that should be maintained.

---

## 5. Component Architecture (Web)

### 5.1 Component Organization

**Structure:**
```
packages/web/src/components/
├── ui/              # shadcn/ui primitives (20+ components)
├── analytics/       # Dashboard analytics charts
├── applications/    # Application management
├── automation/      # Automation controls
├── dashboard/       # Dashboard widgets
├── hunt/            # Job hunting UI
├── jobs/            # Job browsing
├── layout/          # App layout (sidebar, header)
├── profile/         # Profile management
└── settings/        # Settings pages
```

**Assessment:** ✅ Good

**Strengths:**
- Feature-based organization
- Reusable UI primitives in `ui/`
- Consistent component patterns
- Good use of composition

**Areas for Improvement:**

1. **Large Components:**
   - `job-data-table.tsx` (350 lines) - consider splitting
   - `enhanced-application-manager.tsx` - could extract sub-components

2. **Missing Component Documentation:**
   - PropTypes are well-typed but lack JSDoc comments
   - No Storybook or component playground

3. **Inconsistent Prop Naming:**
   ```typescript
   // Some use onAction
   onViewJob: (job: Job) => void;

   // Others use handleAction
   handleSortClick: (field: JobSortField) => void;
   ```

   **Standardize to:** `onAction` for props, `handleAction` for internal

---

### 5.2 Layout Pattern

**Assessment:** ✅ Good

**Implementation:**
```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}
```

**Strengths:**
- Uses Next.js app router layouts
- Consistent layout across dashboard pages
- Responsive mobile navigation

---

### 5.3 Form Handling

**Assessment:** ⚠️ Incomplete Information

**Observed Patterns:**
- React Hook Form types imported in some components
- Zod schemas for validation
- Form components from shadcn/ui

**Recommendation:**
- Document standard form pattern
- Create reusable form wrapper component
- Add form-level error handling

---

## 6. Configuration Management

### 6.1 Environment Configuration

**Assessment:** ✅ Excellent

**Implementation:**
```typescript
// packages/config/src/schema.ts
export const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  EXA_API_KEY: z.string().min(1),
  // ...
});

// packages/core/src/utils/environment.ts
export type AppMode = 'production' | 'demo';

export function getAppMode(): AppMode {
  return process.env.APP_MODE?.toLowerCase() === 'demo'
    ? 'demo'
    : 'production';
}
```

**Strengths:**
- Zod validation for all environment variables
- Type-safe config with `z.infer`
- Clear production vs demo mode separation
- Security assertions (`assertNotProduction`)
- Environment validation at startup

**Best Practice Example:**
```typescript
// packages/core/src/utils/environment.ts
export function assertNotProduction(featureName: string): void {
  if (isProductionMode() && !allowDemoFeatures()) {
    throw new Error(
      `SECURITY: Demo feature "${featureName}" cannot be accessed in production mode.`
    );
  }
}
```

---

### 6.2 Feature Flags (APP_MODE)

**Assessment:** ✅ Good Pattern

**Usage:**
```typescript
// packages/web/src/lib/auth.ts
const isDemoMode = (): boolean => {
  return process.env.APP_MODE === 'demo';
};

const buildProviders = (): Provider[] => {
  const providers: Provider[] = [GoogleProvider({ /* ... */ })];

  if (isDemoMode()) {
    providers.push(CredentialsProvider({ /* demo login */ }));
  }

  return providers;
};
```

**Strengths:**
- Single environment variable controls feature set
- Safe default (production)
- Demo credentials only available in demo mode
- Clear documentation

**Recommendation:**
- Add more granular feature flags for A/B testing
- Consider runtime feature flag service (LaunchDarkly, etc.)

---

### 6.3 Build Configuration

**TypeScript Configuration:**
```json
// tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@job-applier/core": ["packages/core/src"],
      "@job-applier/database": ["packages/database/src"]
    }
  },
  "references": [
    { "path": "packages/core" },
    { "path": "packages/database" }
  ]
}
```

**Assessment:** ✅ Excellent

**Strengths:**
- TypeScript project references for incremental builds
- Path aliases for clean imports
- Consistent tsconfig.base.json
- Proper module resolution

---

## 7. Architectural Anti-Patterns Identified

### 7.1 Missing Abstractions

#### 1. No Service Layer

**Current:**
```
Router → Repository → Database
```

**Issue:** Business logic scattered in routers

**Better:**
```
Router → Service → Repository → Database
```

**Example:**
```typescript
// packages/web/src/services/application-service.ts
export class ApplicationService {
  constructor(
    private appRepo: ApplicationRepository,
    private jobRepo: JobRepository,
    private statsRepo: StatsRepository,
    private notificationService: NotificationService
  ) {}

  async createApplication(userId: string, jobId: string, data: CreateApplicationData) {
    return dataStorage.transaction(() => {
      // Validate job exists and user hasn't applied
      const job = this.jobRepo.findById(jobId);
      if (!job) throw new NotFoundError('Job not found');

      const hasApplied = this.appRepo.hasApplied(userId, jobId);
      if (hasApplied) throw new ConflictError('Already applied');

      // Create application
      const app = this.appRepo.create({ userId, jobId, ...data });

      // Update stats
      this.statsRepo.incrementApplicationsSent();

      // Send notification
      this.notificationService.sendApplicationConfirmation(userId, app);

      return app;
    });
  }
}
```

---

#### 2. No Domain Events

**Issue:** No way to react to domain events (application submitted, job discovered, etc.)

**Solution:**
```typescript
// packages/core/src/events/domain-events.ts
export interface DomainEvent {
  type: string;
  timestamp: Date;
  payload: unknown;
}

export class EventBus {
  private handlers = new Map<string, Array<(event: DomainEvent) => void>>();

  emit(event: DomainEvent): void {
    const handlers = this.handlers.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }

  on(eventType: string, handler: (event: DomainEvent) => void): void {
    // ...
  }
}

// Usage
eventBus.on('application.submitted', async (event) => {
  await notificationService.sendConfirmation(event.payload);
  await analyticsService.trackApplication(event.payload);
});
```

---

### 7.2 Inconsistent Patterns

#### 1. Mixed Error Handling

**Inconsistency:**
```typescript
// Pattern A: Throws domain errors
const job = jobRepository.findById(id);
if (!job) {
  throw new NotFoundError('Job not found');
}

// Pattern B: Returns null
const profile = profileRepository.findById(id);
// Caller checks for null

// Pattern C: Throws generic Error
throw new Error('Something went wrong');
```

**Standard:**
- Repositories return `null` for not found
- Services throw domain errors
- Controllers (routers) map to tRPC errors

---

#### 2. Repository Singleton vs Instance

**Inconsistency:**
```typescript
// Pattern A: Export singleton
export const jobRepository = new JobRepository();

// Pattern B: Export class
export { JobRepository };
export const jobRepository = new JobRepository();
```

**Standard:** Export both (current pattern is good)

---

### 7.3 Scalability Concerns

#### 1. No API Rate Limiting

**Missing:**
- Rate limiting on tRPC endpoints
- Request throttling
- DOS protection

**Add:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const identifier = ctx.userId || ctx.req?.ip || 'anonymous';
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
  }

  return next();
});

export const rateLimitedProcedure = publicProcedure.use(rateLimitMiddleware);
```

---

#### 2. No Pagination on Large Lists

**Issue:**
```typescript
// packages/web/src/server/routers/jobs.ts
list: publicProcedure
  .input(z.object({ limit: z.number().max(100) }))
  .query(async ({ ctx, input }) => {
    return ctx.jobRepository.getRecent(input.limit);
  }),
```

**Problem:** No cursor-based pagination for large datasets

**Better:**
```typescript
list: publicProcedure
  .input(z.object({
    limit: z.number().max(100).default(20),
    cursor: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const jobs = await ctx.jobRepository.paginate({
      limit: input.limit + 1,
      cursor: input.cursor,
    });

    let nextCursor: string | undefined = undefined;
    if (jobs.length > input.limit) {
      const nextItem = jobs.pop();
      nextCursor = nextItem.id;
    }

    return { jobs, nextCursor };
  }),
```

---

#### 3. SQLite Limitations

**Current:** Single-file SQLite database

**Concerns:**
- Write concurrency (single writer)
- No horizontal scaling
- File size limits (terabyte scale, but still)

**When to migrate:**
- \>1000 concurrent users
- \>10 writes/sec sustained
- Need for geographic distribution

**Migration path:**
- PostgreSQL for production
- Keep SQLite for local dev
- Abstract via repository pattern (already done ✅)

---

## 8. Suggested Improvements

### Priority 1: Security & Auth (CRITICAL)

1. **Add authentication middleware to tRPC**
   ```typescript
   export const protectedProcedure = publicProcedure.use(authMiddleware);
   ```

2. **Implement row-level security**
   - All queries filtered by `userId`
   - Prevent data leakage between users

3. **Add API rate limiting**
   - Per-user limits
   - Per-endpoint limits

4. **Implement CSRF protection**
   - NextAuth handles this, verify configuration

**Estimated Effort:** 2-3 days

---

### Priority 2: Complete Missing Features

1. **Implement TODOs in settings pages**
   - API key storage (encrypted)
   - Platform credentials (encrypted)
   - Settings persistence

2. **Complete hunt tracking**
   - Hunt history in database
   - Active hunt status
   - Hunt cancellation

3. **Add file upload for resumes**
   - S3/R2 integration
   - Virus scanning
   - Size limits

**Estimated Effort:** 3-4 days

---

### Priority 3: Add Service Layer

1. **Create service classes**
   ```
   packages/web/src/services/
   ├── application-service.ts
   ├── job-service.ts
   ├── profile-service.ts
   └── hunt-service.ts
   ```

2. **Move business logic from routers to services**

3. **Update context to use services instead of repositories**

**Estimated Effort:** 2-3 days

---

### Priority 4: Improve State Management

1. **Use tRPC cache for server state**
   - Remove duplicate state from Zustand
   - Add optimistic updates
   - Implement proper invalidation

2. **Add proper WebSocket support**
   - Real-time hunt progress
   - Application status updates
   - Notifications

3. **Document state management patterns**

**Estimated Effort:** 2-3 days

---

### Priority 5: Performance & Scalability

1. **Add pagination to all list endpoints**
   - Cursor-based for infinite scroll
   - Total count for UI

2. **Implement database indexes for common queries**
   - User-specific queries
   - Status filters
   - Date ranges

3. **Add caching layer**
   - Redis for session storage
   - CDN for static assets
   - Query result caching

4. **Database connection pooling**
   - Even for SQLite (better-sqlite3 modes)

**Estimated Effort:** 3-4 days

---

### Priority 6: Code Quality

1. **Add integration tests**
   - tRPC router tests
   - Repository tests
   - Service tests

2. **Add API documentation**
   - OpenAPI spec from tRPC
   - Interactive docs (tRPC Panel)

3. **Improve error messages**
   - User-friendly messages
   - Actionable error states
   - Error tracking (Sentry)

4. **Add logging**
   - Structured logging (Winston/Pino)
   - Request tracing
   - Performance monitoring

**Estimated Effort:** 4-5 days

---

## 9. Architecture Decision Records (Recommended)

### ADR-001: Use tRPC for API Layer

**Status:** Accepted

**Context:** Need type-safe API between Next.js frontend and backend.

**Decision:** Use tRPC with Zod for end-to-end type safety.

**Consequences:**
- Pros: Full TypeScript safety, no code generation, great DX
- Cons: Tied to TypeScript, learning curve, no REST fallback

---

### ADR-002: Repository Pattern for Data Access

**Status:** Accepted

**Decision:** Implement repository pattern to abstract database operations.

**Consequences:**
- Pros: Easy to swap databases, testable, clean separation
- Cons: Extra layer of abstraction, more code

---

### ADR-003: SQLite for Persistence

**Status:** Accepted (for MVP)

**Context:** Need simple, portable database for local development and small-scale deployments.

**Decision:** Use SQLite with sql.js for browser compatibility.

**Consequences:**
- Pros: Zero config, portable, fast for small scale
- Cons: Limited concurrency, not suitable for large scale
- Migration Path: PostgreSQL for production (repository pattern enables this)

---

### ADR-004: Monorepo with npm Workspaces

**Status:** Accepted

**Decision:** Use npm workspaces for package management.

**Consequences:**
- Pros: Shared dependencies, easy cross-package development
- Cons: Slower installs, potential version conflicts

---

### ADR-005: APP_MODE for Environment Control

**Status:** Accepted

**Decision:** Use single `APP_MODE` environment variable to control production vs demo behavior.

**Consequences:**
- Pros: Simple, safe default (production), clear documentation
- Cons: Binary choice, no gradual rollout

---

## 10. Security Considerations

### Current Security Posture

**Strengths:**
- Environment variable validation
- Production/demo mode separation
- Input validation with Zod
- SQL injection protection (parameterized queries)
- NextAuth for authentication

**Critical Gaps:**

1. **No authorization checks in tRPC routers** (CRITICAL)
2. **No data encryption for sensitive fields** (credentials, API keys)
3. **No rate limiting** (DoS risk)
4. **No audit logging** (compliance risk)
5. **Demo credentials in source code** (minor - only active in demo mode)

### Recommendations

1. **Add authorization middleware**
   ```typescript
   const requireOwnership = (resourceType: string) =>
     t.middleware(async ({ ctx, input, next }) => {
       const resource = await getResource(resourceType, input.id);
       if (resource.userId !== ctx.userId) {
         throw new TRPCError({ code: 'FORBIDDEN' });
       }
       return next();
     });
   ```

2. **Encrypt sensitive data at rest**
   ```typescript
   import { encrypt, decrypt } from './crypto';

   class CredentialsRepository {
     create(creds: PlatformCredentials) {
       return this.db.insert({
         ...creds,
         password: encrypt(creds.password),
         apiKey: encrypt(creds.apiKey),
       });
     }
   }
   ```

3. **Add security headers**
   ```typescript
   // next.config.js
   headers: async () => [{
     source: '/:path*',
     headers: [
       { key: 'X-Frame-Options', value: 'DENY' },
       { key: 'X-Content-Type-Options', value: 'nosniff' },
       { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
     ],
   }],
   ```

4. **Implement audit logging**
   ```typescript
   const auditMiddleware = t.middleware(async ({ ctx, path, type, next }) => {
     const result = await next();
     await auditLog.create({
       userId: ctx.userId,
       action: `${type}:${path}`,
       timestamp: new Date(),
       success: result.ok,
     });
     return result;
   });
   ```

---

## 11. Performance Analysis

### Database Performance

**Strengths:**
- Proper indexes on foreign keys
- Composite indexes for common queries
- Triggers minimize manual timestamp management

**Concerns:**
1. **No query optimization for complex joins**
2. **Missing indexes for user-specific queries**
3. **No query explain/analyze tooling**

**Recommendations:**
- Add `EXPLAIN QUERY PLAN` analysis for slow queries
- Consider materialized views for analytics
- Add query performance logging

### Frontend Performance

**Not fully assessed** (would require runtime analysis)

**Recommendations:**
- Add React Profiler for component rendering
- Implement virtual scrolling for large lists (job table)
- Code splitting for route-based chunks
- Lazy loading for heavy components

---

## 12. Documentation Gaps

**Missing Documentation:**
1. Architecture decision records (ADRs)
2. API documentation (OpenAPI spec)
3. Database schema documentation
4. Component library documentation (Storybook)
5. Deployment guide
6. Troubleshooting guide

**Existing Documentation:**
- README files in packages (good)
- Inline JSDoc comments (sparse)
- Type definitions (excellent via TypeScript)

---

## 13. Testing Strategy

**Current State:**
- Test files present in `__tests__` directories
- Vitest configured
- Test coverage unknown

**Recommendations:**

1. **Unit Tests:**
   - All repositories (with in-memory SQLite)
   - All services
   - All utilities

2. **Integration Tests:**
   - tRPC routers (with test database)
   - End-to-end workflows

3. **E2E Tests:**
   - Playwright tests for critical paths (observed in web/e2e)
   - Test production and demo modes separately

4. **Coverage Goals:**
   - 80% line coverage minimum
   - 100% coverage for critical paths (auth, payments, data modification)

---

## 14. Final Recommendations Summary

### Immediate Action (This Sprint)

1. ✅ **Add authentication middleware to tRPC** (CRITICAL)
2. ✅ **Implement row-level security** (CRITICAL)
3. ✅ **Add rate limiting** (HIGH)
4. ✅ **Fix repository direct access** (HIGH)

### Short Term (Next 2 Sprints)

5. ✅ **Create service layer**
6. ✅ **Complete TODO items in settings**
7. ✅ **Add pagination to lists**
8. ✅ **Implement hunt tracking**
9. ✅ **Add integration tests**

### Medium Term (Next Quarter)

10. ✅ **Migrate state management patterns**
11. ✅ **Add comprehensive logging**
12. ✅ **Implement audit logging**
13. ✅ **Create API documentation**
14. ✅ **Set up monitoring (Sentry, etc.)**

### Long Term (Future Consideration)

15. ⚠️ **Evaluate PostgreSQL migration**
16. ⚠️ **Add feature flagging system**
17. ⚠️ **Implement event sourcing for audit trail**
18. ⚠️ **Split web monolith into micro-frontends** (if needed)

---

## 15. Conclusion

The job-applier codebase demonstrates **solid architectural foundations** with a well-organized monorepo, clean separation of concerns, and strong type safety. The main areas requiring immediate attention are **security (authentication/authorization)** and **completion of half-implemented features**.

**Overall Grade: B+**

**Key Strengths:**
- Excellent package organization
- Strong type safety with TypeScript and Zod
- Clean repository pattern implementation
- Production/demo mode separation
- Comprehensive error handling hierarchy

**Critical Issues:**
- Missing authentication middleware (CRITICAL - must fix immediately)
- Incomplete feature implementations (TODOs)
- No service layer (business logic in routers)
- Missing rate limiting and authorization

**With the recommended improvements implemented, this codebase would easily achieve an A- or A rating.**

---

## Appendix A: File Structure Overview

```
C:/Users/joelf/job-applier/
├── package.json (root workspace)
├── tsconfig.json (root config with references)
├── vitest.config.ts
├── .env
└── packages/
    ├── core/                          # ✅ Clean, well-structured
    │   ├── src/
    │   │   ├── types/                 # All domain types
    │   │   ├── utils/                 # Utilities, validators, errors
    │   │   └── constants.ts
    │   └── package.json
    │
    ├── database/                      # ✅ Good repository pattern
    │   ├── src/
    │   │   ├── repositories/          # 8 repository classes
    │   │   ├── migrations/
    │   │   ├── schema.ts              # SQL schema definitions
    │   │   ├── connection.ts          # sql.js wrapper
    │   │   └── data-storage.ts        # ✅ Excellent facade
    │   └── package.json
    │
    ├── config/                        # ✅ Clean config management
    │   ├── src/
    │   │   ├── schema.ts              # Zod schemas
    │   │   ├── loader.ts              # Environment loading
    │   │   └── manager.ts             # Config singleton
    │   └── package.json
    │
    ├── orchestrator/                  # ⚠️ Could use service layer
    │   ├── src/
    │   │   ├── engine.ts              # Main workflow
    │   │   ├── matcher.ts             # Job matching
    │   │   └── cover-letter.ts        # AI generation
    │   └── package.json
    │
    ├── ai-job-hunter/                 # ✅ Clean AI integration
    │   ├── src/
    │   │   ├── job-hunter-orchestrator.ts
    │   │   ├── ai-page-analyzer.ts
    │   │   ├── ai-form-filler.ts
    │   │   └── web-job-discovery.ts
    │   └── package.json
    │
    ├── web/                           # ⚠️ Large, could split
    │   ├── src/
    │   │   ├── app/                   # Next.js app router
    │   │   ├── components/            # 100+ components
    │   │   ├── server/
    │   │   │   ├── routers/           # 8 tRPC routers
    │   │   │   └── trpc.ts            # ❌ Missing auth middleware
    │   │   ├── stores/                # Zustand stores
    │   │   ├── hooks/                 # Custom hooks
    │   │   ├── lib/                   # Utilities
    │   │   └── types/                 # Web-specific types
    │   ├── e2e/                       # Playwright tests
    │   └── package.json
    │
    └── (other packages: cli, browser-automation, platforms, etc.)
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-20
**Next Review:** After Priority 1 & 2 items completed
