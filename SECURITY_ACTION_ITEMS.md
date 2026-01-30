# Security Action Items - Muraqqa Art Gallery

## Risk Level: MEDIUM

Last Updated: January 30, 2026 (Email Verification & Artist Approval Complete)

---

## Priority 1: Immediate (This Week)

- [x] **Add CAPTCHA Protection** - Integrate reCAPTCHA v3 on auth endpoints
  - File: `server/src/middleware/recaptcha.middleware.ts`
  - Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`

- [ ] **Strengthen Password Policy** - Require 12+ chars with complexity
  - File: `server/src/validators/auth.validator.ts`
  - Requirements: uppercase, lowercase, number, special character

- [ ] **Add Account Lockout** - Lock after 5 failed attempts for 30 mins
  - File: `server/src/middleware/accountLockout.middleware.ts`
  - Track failed attempts per email/IP

---

## Priority 2: Short-Term (2 Weeks)

- [ ] **Move JWT to httpOnly Cookies** - Prevents XSS token theft
  - Files: `server/src/controllers/auth.controller.ts`, `context/AuthContext.tsx`
  - Set `httpOnly`, `secure`, `sameSite` flags

- [ ] **Add CSRF Tokens** - Protect state-changing requests
  - Install: `csurf` package
  - Add to all POST/PUT/DELETE routes

- [ ] **Improve File Upload Validation** - Add magic bytes verification
  - File: `server/src/middleware/upload.middleware.ts`
  - Validate actual file content, not just MIME type

- [ ] **Configure CSP Headers** - Prevent inline script attacks
  - File: `server/src/app.ts`
  - Configure Helmet with strict Content-Security-Policy

---

## Priority 3: Medium-Term (1 Month)

- [ ] **Implement Refresh Tokens** - Short-lived access tokens (15 min)
  - File: `server/src/utils/jwt.ts`
  - Add refresh token rotation mechanism

- [ ] **Add Audit Logging** - Track sensitive operations
  - Create: `server/src/utils/auditLog.ts`
  - Log: login attempts, admin actions, payments, order changes

- [x] **Complete Email Verification** - Verify user emails before activation
  - File: `server/src/controllers/auth.controller.ts`
  - Implemented: verification token generation, email sending, token validation
  - Frontend: `pages/VerifyEmail.tsx` with loading/success/error states

- [x] **Artist Approval System** - Admin must approve artist accounts
  - Backend: `server/src/controllers/admin.controller.ts` (approve/reject endpoints)
  - Frontend: Admin Dashboard Users tab with PENDING subtab
  - Email notifications for approval/rejection

- [ ] **Add Session Management** - Track active sessions
  - Store sessions in database
  - Allow users to view/revoke sessions

---

## Priority 4: Long-Term (2+ Months)

- [ ] **Implement 2FA** - Two-factor authentication option
  - TOTP (Google Authenticator) or SMS

- [ ] **Add Security Monitoring** - Intrusion detection
  - Track unusual patterns
  - Alert on suspicious activities

- [ ] **Dependency Scanning** - Regular security audits
  - Integrate `npm audit` in CI/CD
  - Use Snyk or similar tool

- [ ] **Penetration Testing** - Professional security audit
  - OWASP ZAP automated scanning
  - Manual penetration testing

---

## Current Security Measures (Already Implemented)

- [x] Password hashing with bcryptjs (10 salt rounds)
- [x] JWT authentication
- [x] Rate limiting (100 req/15min API, 10 req/hour auth)
- [x] Zod input validation
- [x] Prisma ORM (SQL injection prevention)
- [x] File size limit (5MB)
- [x] CORS configuration
- [x] Basic Helmet security headers
- [x] .env in .gitignore
- [x] reCAPTCHA v3 on auth endpoints (login, register, forgot-password)
- [x] Email verification with 24-hour token expiry
- [x] Artist approval workflow (email verified → admin approval → active)
- [x] Admin dashboard for managing user approvals

---

## Critical Vulnerabilities Summary

| Vulnerability | Severity | Status | Notes |
|--------------|----------|--------|-------|
| No CAPTCHA | Critical | ✅ Fixed | reCAPTCHA v3 implemented |
| Weak Password Policy | High | ⏳ Pending | Min 6 chars only |
| JWT in localStorage | High | ⏳ Pending | XSS risk |
| No CSRF Protection | Medium | ⏳ Pending | State-changing requests |
| Insufficient File Validation | Medium | ⏳ Pending | MIME only |
| No Email Verification | Medium | ✅ Fixed | Full verification flow with token expiry |
| No Artist Approval | Medium | ✅ Fixed | Admin approval required for artists |
| No Account Lockout | Medium | ⏳ Pending | Brute force risk |
| No Audit Logging | Low | ⏳ Pending | Compliance risk |

---

## Environment Variables Required

```env
# reCAPTCHA v3
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here

# JWT (strengthen existing)
JWT_SECRET=use_a_32+_character_random_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (for verification)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## Testing Checklist

- [ ] Test CAPTCHA bypass attempts
- [ ] Test brute force protection
- [ ] Test XSS injection in all input fields
- [ ] Test CSRF on state-changing endpoints
- [ ] Test file upload with malicious files
- [ ] Test SQL injection (should be blocked by Prisma)
- [ ] Test rate limiting effectiveness
- [ ] Test JWT expiration and refresh

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [reCAPTCHA v3 Docs](https://developers.google.com/recaptcha/docs/v3)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)