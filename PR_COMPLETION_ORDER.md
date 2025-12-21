PR Completion Order (Breaking-First)

Goal: merge in a sequence that minimizes breaking changes and aligns dependencies.

Recommended order:
1) PR #46 - Security Audit: Comprehensive Rate Limiting, IDOR Prevention & Authentication Hardening
   - Action: fix breaking env/admin config before merge.
   - Status: in progress (another AI)
2) PR #85 - Security Hardening Review
   - Action: follow-up to #46; merge or close immediately after #46.
   - Status: merged (Codex)
3) PR #74 - Harden dashboard profile access checks
   - Aligns with ownership rules from #46/#85.
   - Status: merged (Codex)
4) PR #75 - Persist user general settings via tRPC and settings repository
   - Backend storage needed by later settings UIs.
   - Status: merged (Codex)
5) PR #76 - Connect General Settings UI to config via tRPC and add default preferences
   - Builds on #75.
6) PR #83 - Add localStorage persistence for general settings
   - Optional fallback once #75/#76 are in.
   - Status: merged (Codex)
7) PR #84 - Add localStorage error handling and reset functionality to general settings
   - Enhances #83; merge after #83 if keeping local storage.
8) PR #78 - Persist web settings to localStorage
   - Likely supersedes #77; choose one.
9) PR #77 - Persist appearance settings locally
   - Close if #78 is merged.
10) PR #88 - Implement platform credentials mutation
    - Backend needed for platform connection tests.
11) PR #89 - Implement Indeed Connection Test
    - Depends on #88 settings plumbing.
12) PR #87 - Implement Exa API key verification
    - Independent but fits after settings/test infra.
13) PR #79 - Populate dashboard overview with active hunt sessions
    - Feature add; low risk after access hardening.
14) PR #90 - Implement resume download and fix database build error
    - Feature + infra fix; can be moved earlier if build fix is urgent.
15) PR #81 - Fix avatar preview URL cleanup
    - Duplicate with #80; pick one.
16) PR #80 - Fix avatar preview URL cleanup in profile header
    - Duplicate with #81; close the other.
17) PR #70 - Review requirements and finish pull request
    - Docs-only; can be merged anytime.

Notes:
- Duplicates: #77 vs #78, and #80 vs #81. Pick one in each pair.
- Breaking risks flagged: #46 (env/admin config), #85 (profile ownership), #74 (profile ownership for dashboard).
