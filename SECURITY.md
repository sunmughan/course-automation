# Platform Security Audit & Hardening Matrix

This document outlines the security architecture, threat model, vulnerability remediations, and defensive controls implemented across the **SkillForge Platform**.

---

## 1. Security Threat Model & Protections

| Vulnerability Vector | Threat Scenario | Platform Defensive Control | Implementation |
|---|---|---|---|
| **AI API Key Exposure** | Leakage of Gemini / OpenAI keys to clients or logs | Server-side routing via `aiRouter.executeWithFallback`; automated secret masking in `SecurityGuard.maskSecrets` | `src/lib/security/guard.ts`, `src/lib/ai/router.ts` |
| **Arbitrary Code Execution / Sandbox Escape** | Malicious user code attempting to access OS filesystem | Process timeouts, isolated execution sandboxes, language syntax filters | `src/lib/execution/multi-lang-sandbox.ts`, `src/lib/execution/sandbox.ts` |
| **Cross-Tenant Data Access** | User in Org A querying records from Org B | Explicit `organizationId` & `userId` database constraints; `verifyOrgAccess` RBAC validation | `src/lib/organizations/org-service.ts` |
| **RBAC Bypass** | Student accessing instructor or admin endpoints | Strict middleware & `apiHandler` role enforcement (`requireAuth`, `requireInstructor`, `requireAdmin`) | `src/lib/api-handler.ts`, `src/middleware.ts` |
| **Prompt Injection** | User overriding LLM instructions (`Ignore prior instructions`) | Pattern matching & input sanitization via `SecurityGuard.inspectPromptInjection` | `src/lib/security/guard.ts` |
| **Cross-Site Scripting (XSS)** | Injected malicious HTML/JS payloads in playground/chat | HTML sanitization via `SecurityGuard.sanitizeHtml`; React JSX default escaping | `src/lib/security/guard.ts` |
| **CSRF & Session Hijacking** | Unauthorized cross-site requests | Secure HTTP-only cookies, SameSite enforcement, session tokens in `Session` table | `src/lib/auth.ts`, `src/middleware.ts` |
| **SQL Injection** | Malicious SQL payload in inputs | 100% Parameterized queries via Prisma ORM | `src/lib/db.ts` |
| **Command Injection & Path Traversal** | Manipulated file paths (`../../etc/passwd`) | Path normalization and traversal guards in `SecurityGuard.sanitizeFilePath` | `src/lib/security/guard.ts` |
| **File Upload Exploits** | Upload of executable shell scripts or oversize binaries | Allowed extension whitelist and 5MB size validation via `SecurityGuard.validateUpload` | `src/lib/security/guard.ts` |
| **Brute Force / DDoS** | Rapid API spamming | Tiered sliding-window rate limiting backed by Redis / memory fallback | `src/lib/infra/rate-limiter.ts` |
| **Security Audit Logging** | Unmonitored security incidents | Automated audit trail logging with secret redaction | `src/lib/security/audit.ts` |

---

## 2. Zero-Trust Access Policies
1. **Never Trust User-Supplied IDs**: All update and delete operations in APIs explicitly verify that `record.userId === authenticatedUser.id` or that the user holds an administrative role in the parent organization.
2. **Deterministic Fallbacks**: In the event of upstream AI or cache outages, failover routes are strictly read-only and never bypass authorization checks.
3. **Audit Trail**: All failed authentications and privilege violations are recorded in `AuditLog` for incident triage.
