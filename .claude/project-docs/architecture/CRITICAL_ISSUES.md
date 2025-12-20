# Critical Architecture Issues - Action Required

**Priority:** 🔴 HIGH
**Status:** MUST FIX BEFORE PRODUCTION
**Date:** 2025-12-20

---

## Issue #1: Missing Authentication Middleware ⚠️ CRITICAL

### Current State
All tRPC procedures use `publicProcedure` - **no authentication enforcement**.

### Impact
- Any user can access any profile/job/application data
- No user isolation
- Data privacy violation
- Security vulnerability

### Location
```
C:/Users/joelf/job-applier/packages/web/src/server/trpc.ts
```

### Current Code
```typescript
export const publicProcedure = t.procedure;
```

### Required Fix
```typescript
// Add protected procedure with auth check
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be signed in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
```

### Update All Routers
```typescript
// Before (INSECURE)
getProfile: publicProcedure
  .query(async ({ ctx }) => {
    return ctx.profileRepository.getDefault();
  }),

// After (SECURE)
getProfile: protectedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.profileRepository.getByUserId(userId);
  }),
```

### Files to Update
- `packages/web/src/server/trpc.ts` - Add `protectedProcedure`
- `packages/web/src/server/routers/profile.ts` - Use `protectedProcedure`
- `packages/web/src/server/routers/applications.ts` - Use `protectedProcedure`
- `packages/web/src/server/routers/jobs.ts` - Use `protectedProcedure` for mutations
- `packages/web/src/server/routers/hunt.ts` - Use `protectedProcedure`
- `packages/web/src/server/routers/settings.ts` - Use `protectedProcedure`
- `packages/web/src/server/routers/automation.ts` - Use `protectedProcedure`

### Estimated Effort
4-6 hours

### Acceptance Criteria
- [ ] `protectedProcedure` middleware created
- [ ] All sensitive endpoints use `protectedProcedure`
- [ ] User can only access their own data
- [ ] Unauthorized requests return 401 error
- [ ] Tests verify authentication enforcement

---

## Issue #2: No Row-Level Security ⚠️ CRITICAL

### Current State
Queries don't filter by `userId` - users can access other users' data if they know the IDs.

### Impact
- Data leakage between users
- Privacy violation
- Compliance risk (GDPR, etc.)

### Example Vulnerability
```typescript
// Current (VULNERABLE)
getApplicationById: publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    // ❌ No user check - anyone can access any application
    return ctx.applicationRepository.findById(input.id);
  }),
```

### Required Fix
```typescript
// Secure
getApplicationById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const application = ctx.applicationRepository.findById(input.id);

    if (!application) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    // ✅ Verify ownership
    const profile = ctx.profileRepository.findById(application.profileId);
    if (profile?.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return application;
  }),
```

### Better Pattern: Repository-Level Filtering
```typescript
// Update repository methods to require userId
class ApplicationRepository {
  findByIdForUser(id: string, userId: string): Application | null {
    const app = this.findById(id);
    if (!app) return null;

    const profile = profileRepository.findById(app.profileId);
    if (profile?.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return app;
  }

  listForUser(userId: string): Application[] {
    const profiles = profileRepository.findByUserId(userId);
    const profileIds = profiles.map(p => p.id);
    return this.findByProfileIds(profileIds);
  }
}
```

### Estimated Effort
8-12 hours (requires updating all repositories and routers)

### Acceptance Criteria
- [ ] All queries filtered by userId
- [ ] Users cannot access other users' data
- [ ] Proper 403 errors for unauthorized access
- [ ] Tests verify isolation between users

---

## Issue #3: No API Rate Limiting ⚠️ HIGH

### Current State
No rate limiting on any endpoints.

### Impact
- Vulnerable to DoS attacks
- API abuse possible
- Resource exhaustion
- High costs if using paid services (Claude API, etc.)

### Required Fix
```typescript
// Option 1: Simple in-memory rate limiting (development)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Option 2: Production-grade with Redis (recommended)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const identifier = ctx.session?.user?.id || ctx.req?.ip || 'anonymous';
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
    });
  }

  return next();
});

export const rateLimitedProcedure = publicProcedure.use(rateLimitMiddleware);
```

### Rate Limit Strategy
```typescript
// Different limits for different endpoints
export const limiterConfig = {
  // Authentication endpoints - strict
  auth: { requests: 5, window: '15m' },

  // Read endpoints - moderate
  read: { requests: 100, window: '1m' },

  // Write endpoints - conservative
  write: { requests: 20, window: '1m' },

  // Expensive operations (AI, search) - very conservative
  expensive: { requests: 10, window: '1m' },
};
```

### Estimated Effort
4-6 hours (with Upstash Redis setup)

### Acceptance Criteria
- [ ] Rate limiting implemented on all endpoints
- [ ] Different limits for different endpoint types
- [ ] Proper error messages with retry-after headers
- [ ] Monitoring/alerting for rate limit hits
- [ ] Tests verify rate limiting works

---

## Issue #4: Missing Service Layer ⚠️ MEDIUM-HIGH

### Current State
Business logic in tRPC routers, repositories accessed directly.

### Impact
- Business logic scattered across routers
- Hard to test
- Difficult to maintain
- Cannot reuse logic between CLI and Web
- Transaction boundaries unclear

### Current Pattern (ANTI-PATTERN)
```typescript
// packages/web/src/server/routers/applications.ts
create: publicProcedure
  .mutation(async ({ ctx, input }) => {
    // ❌ Business logic in router
    const application = ctx.applicationRepository.create(input);
    await ctx.statsRepository.incrementApplicationsSent();
    // ❌ No transaction - if second fails, first succeeds
    return application;
  }),
```

### Required Pattern
```typescript
// packages/web/src/services/application-service.ts
export class ApplicationService {
  constructor(
    private appRepo: ApplicationRepository,
    private jobRepo: JobRepository,
    private statsRepo: StatsRepository,
    private emailService: EmailService
  ) {}

  async createApplication(
    userId: string,
    jobId: string,
    data: CreateApplicationInput
  ): Promise<Application> {
    // ✅ All business logic in one place
    return dataStorage.transaction(() => {
      // Validate
      const job = this.jobRepo.findById(jobId);
      if (!job) {
        throw new NotFoundError('Job not found');
      }

      const hasApplied = this.appRepo.hasApplied(userId, jobId);
      if (hasApplied) {
        throw new ConflictError('Already applied to this job');
      }

      // Create application
      const app = this.appRepo.create({
        userId,
        jobId,
        ...data,
      });

      // Update stats
      this.statsRepo.incrementApplicationsSent();

      // Send notification
      this.emailService.sendApplicationConfirmation(userId, app);

      return app;
    });
  }
}

// Router becomes thin
create: protectedProcedure
  .input(CreateApplicationSchema)
  .mutation(async ({ ctx, input }) => {
    return ctx.applicationService.createApplication(
      ctx.session.user.id,
      input.jobId,
      input
    );
  }),
```

### Files to Create
```
packages/web/src/services/
├── application-service.ts
├── job-service.ts
├── profile-service.ts
├── hunt-service.ts
├── settings-service.ts
└── index.ts
```

### Estimated Effort
2-3 days (requires refactoring all routers)

### Acceptance Criteria
- [ ] Service classes created for each domain
- [ ] Business logic moved from routers to services
- [ ] Services use transactions for multi-step operations
- [ ] Routers become thin wrappers
- [ ] Services are testable in isolation
- [ ] Services shared between CLI and Web

---

## Issue #5: Incomplete Features (TODOs) ⚠️ MEDIUM - PARTIALLY RESOLVED

### Current State
Many settings pages have placeholder TODO comments.

### Impact
- Users cannot configure platform credentials
- ~~API keys not saveable~~ ✅ FIXED
- Settings changes not persisted
- Poor user experience

### Affected Files
```
packages/web/src/components/settings/platform-settings.tsx (3 TODOs)
packages/web/src/components/settings/api-keys-settings.tsx (3 TODOs) ✅ FIXED - PR pending
packages/web/src/components/settings/general-settings.tsx (1 TODO)
packages/web/src/components/settings/notification-settings.tsx (1 TODO)
packages/web/src/components/settings/data-privacy-settings.tsx (4 TODOs)
packages/web/src/components/settings/appearance-settings.tsx (1 TODO)
packages/web/src/components/profile/resume-manager.tsx (3 TODOs)
packages/web/src/server/routers/hunt.ts (3 TODOs)
packages/web/src/server/routers/dashboard.ts (1 TODO)
```

### Recent Progress
- **2025-12-20**: API key management implemented (testApiKey, updateApiKeys, getApiKeyStatus mutations)
  - Branch: `claude/fix-pending-issue-DSGMq`
  - Status: PR pending merge

### Required Actions

#### 1. Settings Router
```typescript
// packages/web/src/server/routers/settings.ts
export const settingsRouter = router({
  // Add missing mutations
  updateGeneral: protectedProcedure
    .input(GeneralSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.settingsService.updateGeneral(ctx.session.user.id, input);
    }),

  updateApiKeys: protectedProcedure
    .input(ApiKeysSchema)
    .mutation(async ({ ctx, input }) => {
      // ✅ Encrypt before storage
      return ctx.settingsService.updateApiKeys(ctx.session.user.id, input);
    }),

  updatePlatformCredentials: protectedProcedure
    .input(PlatformCredentialsSchema)
    .mutation(async ({ ctx, input }) => {
      // ✅ Encrypt before storage
      return ctx.credentialsService.update(ctx.session.user.id, input);
    }),

  testApiKey: protectedProcedure
    .input(z.object({ provider: z.enum(['claude', 'exa']), apiKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.settingsService.testApiKey(input.provider, input.apiKey);
    }),
});
```

#### 2. File Upload Service
```typescript
// packages/web/src/services/upload-service.ts
export class UploadService {
  async uploadResume(userId: string, file: File): Promise<UploadResult> {
    // Validate file
    if (!file.type.includes('pdf')) {
      throw new ValidationError('Only PDF files allowed');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new ValidationError('File too large (max 10MB)');
    }

    // Upload to S3/R2
    const key = `resumes/${userId}/${Date.now()}-${file.name}`;
    await s3.upload(key, file);

    // Save to database
    return {
      path: key,
      url: getSignedUrl(key),
    };
  }
}
```

### Estimated Effort
3-4 days

### Acceptance Criteria
- [ ] All TODO items resolved or tracked as issues
- [ ] Settings mutations implemented and tested
- [ ] File upload working with proper validation
- [ ] API key storage encrypted
- [ ] Platform credentials encrypted
- [ ] All settings persisted to database

---

## Quick Fix Priority Order

### Week 1 (CRITICAL)
1. **Day 1-2:** Add authentication middleware (#1)
2. **Day 3-4:** Implement row-level security (#2)
3. **Day 5:** Add basic rate limiting (#3)

### Week 2 (HIGH)
4. **Day 1-3:** Create service layer (#4)
5. **Day 4-5:** Begin implementing TODOs (#5)

### Week 3 (MEDIUM)
6. Complete TODO implementations
7. Add comprehensive tests
8. Security audit
9. Performance testing

---

## Testing Checklist

Before deploying to production, verify:

- [ ] **Authentication:** Unauthenticated requests return 401
- [ ] **Authorization:** Users cannot access other users' data
- [ ] **Rate Limiting:** Excessive requests are blocked
- [ ] **Input Validation:** Invalid inputs are rejected
- [ ] **Error Handling:** Errors don't leak sensitive info
- [ ] **SQL Injection:** All queries use parameterized statements
- [ ] **XSS Prevention:** All user input is sanitized
- [ ] **CSRF Protection:** NextAuth CSRF tokens working
- [ ] **Data Encryption:** Sensitive fields encrypted at rest
- [ ] **API Keys:** Stored encrypted, never logged
- [ ] **Session Security:** Secure, httpOnly cookies
- [ ] **Password Storage:** Not storing passwords (OAuth only in prod)

---

## Monitoring & Alerting

Set up alerts for:

- [ ] Failed authentication attempts (>5 in 5 min)
- [ ] Rate limit hits (>100 in 1 hour)
- [ ] 500 errors (any occurrence)
- [ ] Database errors (any occurrence)
- [ ] Slow queries (>1 second)
- [ ] High memory usage (>80%)
- [ ] Unauthorized access attempts

---

**REMEMBER:** These are blocking issues for production deployment. Do not deploy without addressing at least Issues #1, #2, and #3.

**Next Review:** After Week 1 fixes completed
