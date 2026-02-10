# Muraqqa Security Issues & Remediation Guide

## Document Information
- **Application**: Muraqqa Art Gallery
- **Audit Date**: February 9, 2026
- **Security Score**: 6.5/10
- **Total Issues**: 16

---

## 🔴 CRITICAL SEVERITY (Fix Immediately)

### Issue #1: JWT Secret Weakness
**Risk Level**: 🔴 Critical  
**CVSS Score**: 9.1/10

**Description**:  
The JWT_SECRET environment variable only requires a minimum of 12 characters through Zod validation. This is insufficient for cryptographic security and can be brute-forced.

**Location**: 
- `server/src/config/env.ts:10`

**Current Code**:
```typescript
JWT_SECRET: z.string().min(12),
```

**Vulnerability Impact**:
- Attackers can brute-force weak JWT secrets
- Complete authentication bypass
- Session hijacking
- Unauthorized admin access

**Remediation**:
```typescript
JWT_SECRET: z.string()
  .min(32, 'JWT_SECRET must be at least 32 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    'JWT_SECRET must contain uppercase, lowercase, numbers, and special characters'),
```

**Implementation Steps**:
1. Update env.ts validation schema
2. Add JWT secret generation script
3. Document secret rotation procedure
4. Test all authenticated endpoints

**Status**: 🔧 To Be Implemented

---

### Issue #2: Missing CSRF Protection
**Risk Level**: 🔴 Critical  
**CVSS Score**: 8.8/10

**Description**:  
No CSRF (Cross-Site Request Forgery) tokens are implemented for state-changing operations. Attackers can trick authenticated users into performing unwanted actions.

**Location**: 
- All POST/PUT/DELETE endpoints
- `server/src/app.ts` (middleware configuration)

**Vulnerability Impact**:
- Unauthorized order creation
- Profile modifications
- Cart manipulation
- Admin actions via victim's session

**Remediation Options**:

**Option A: Double Submit Cookie Pattern**
```typescript
// server/src/middleware/csrf.middleware.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip for GET/HEAD/OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Set CSRF token cookie for GET requests
    if (!req.cookies[CSRF_COOKIE_NAME]) {
      res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), {
        httpOnly: false, // Must be accessible by JavaScript
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
    return next();
  }
  
  // Validate CSRF token for state-changing requests
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()];
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ message: 'Invalid or missing CSRF token' });
    return;
  }
  
  next();
};
```

**Option B: CSRF Token with Session**
```typescript
// Store token in session/database
export const csrfTokenGenerator = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return next(new Error('Session required for CSRF protection'));
  }
  
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  
  res.locals.csrfToken = req.session.csrfToken;
  next();
};
```

**Frontend Implementation**:
```typescript
// services/api.ts - Add to authFetch
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
    ...options.headers,
  };
  
  // ... rest of implementation
};
```

**Status**: 🔧 To Be Implemented

---

### Issue #3: Open Redirect Vulnerability
**Risk Level**: 🔴 Critical  
**CVSS Score**: 8.2/10

**Description**:  
Social authentication callbacks redirect users with JWT tokens in URL parameters. This can be exploited to steal tokens via malicious redirects.

**Location**: 
- `server/src/controllers/social-auth.controller.ts:93, 111`

**Current Code**:
```typescript
res.redirect(`${env.CLIENT_URL}/auth/social-callback?token=${token}`);
```

**Vulnerability Impact**:
- Token theft via malicious redirect
- Account takeover
- Session hijacking

**Remediation**:

```typescript
// server/src/controllers/social-auth.controller.ts
const VALID_REDIRECT_PATHS = ['/auth/social-callback'];

const isValidRedirectPath = (path: string): boolean => {
  return VALID_REDIRECT_PATHS.some(validPath => 
    path === validPath || path.startsWith(`${validPath}?`)
  );
};

// In callback handlers, use POST-redirect-GET pattern or validate URL
export const googleCallback = (req: Request, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.redirect(`${env.CLIENT_URL}/auth?error=google_failed`);
    return;
  }

  const token = generateToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });

  // Set token in secure, httpOnly cookie instead of URL
  res.cookie('auth_token_temp', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 5 * 60 * 1000 // 5 minutes only
  });

  // Redirect without token in URL
  res.redirect(`${env.CLIENT_URL}/auth/social-callback`);
};
```

**Alternative Frontend-Fetch Approach**:
```typescript
// Frontend fetches token from secure endpoint
export const getSocialAuthToken = async (req: Request, res: Response): Promise<void> => {
  const tempToken = req.cookies.auth_token_temp;
  if (!tempToken) {
    res.status(401).json({ message: 'No authentication token found' });
    return;
  }
  
  // Clear temporary cookie
  res.clearCookie('auth_token_temp');
  
  // Return token in response body (not URL)
  res.json({ token: tempToken });
};
```

**Status**: 🔧 To Be Implemented

---

### Issue #4: IDOR - Insecure Direct Object Reference
**Risk Level**: 🔴 Critical  
**CVSS Score**: 8.5/10

**Description**:  
The `updateOrderNotes` endpoint doesn't verify if the requesting user has admin role before allowing note updates.

**Location**: 
- `server/src/controllers/order.controller.ts:780-798`

**Current Code**:
```typescript
export const updateOrderNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.id as string;
    const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { adminNotes: notes }
    });
    // ...
  }
};
```

**Vulnerability Impact**:
- Any authenticated user can modify order notes
- Data integrity compromise
- Potential business logic bypass

**Remediation**:

```typescript
export const updateOrderNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.id as string;
    const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // CRITICAL FIX: Verify admin role
    if (userRole !== 'ADMIN') {
      res.status(StatusCodes.FORBIDDEN).json({ 
        message: 'Only administrators can update order notes' 
      });
      return;
    }

    // Verify order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Order not found' });
      return;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { adminNotes: notes }
    });

    res.status(StatusCodes.OK).json({
      message: 'Order notes updated',
      order: { id: order.id, adminNotes: order.adminNotes }
    });
  } catch (error) {
    console.error('Update order notes error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: 'Failed to update order notes' 
    });
  }
};
```

**Status**: 🔧 To Be Implemented

---

## 🟠 HIGH SEVERITY (Fix Within 1 Week)

### Issue #5: Missing Security Headers
**Risk Level**: 🟠 High  
**CVSS Score**: 7.5/10

**Description**:  
Several important security headers are missing from HTTP responses, making the application vulnerable to clickjacking, MIME-type sniffing attacks, and downgrade attacks.

**Location**: 
- `server/src/app.ts:35-53`

**Missing Headers**:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy`

**Remediation**:

```typescript
// server/src/app.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://www.google.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.google.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Allow embedded resources
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
```

**Status**: 🔧 To Be Implemented

---

### Issue #6: Stored XSS via Unsanitized User Input
**Risk Level**: 🟠 High  
**CVSS Score**: 7.8/10

**Description**:  
User-generated content (order notes, artwork descriptions) is not sanitized before being stored or displayed, enabling Stored XSS attacks.

**Location**: 
- `server/src/controllers/order.controller.ts` (adminNotes)
- `server/src/controllers/artwork.controller.ts` (description)

**Remediation**:

```typescript
// server/src/utils/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

export const sanitizePlainText = (dirty: string): string => {
  return dirty.replace(/[<>]/g, '');
};
```

**Usage**:
```typescript
// In controllers
import { sanitizeHtml, sanitizePlainText } from '../utils/sanitizer';

// For plain text fields
const sanitizedNotes = sanitizePlainText(req.body.notes);

// For rich text fields (if supported)
const sanitizedDescription = sanitizeHtml(req.body.description);
```

**Status**: 🔧 To Be Implemented

---

### Issue #7: Weak Password Policy
**Risk Level**: 🟠 High  
**CVSS Score**: 6.5/10

**Description**:  
Current password policy only requires 6 characters with no complexity requirements, making accounts vulnerable to brute force attacks.

**Location**: 
- `server/src/validators/auth.validator.ts:7`

**Current Code**:
```typescript
password: z.string().min(6, 'Password must be at least 6 characters'),
```

**Remediation**:

```typescript
// server/src/validators/auth.validator.ts
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['USER', 'ARTIST']).default('USER'),
  phoneNumber: z.preprocess(emptyToUndefined, z.string().optional()),
  address: z.preprocess(emptyToUndefined, z.string().min(5, 'Address is too short').optional()),
  city: z.preprocess(emptyToUndefined, z.string().min(2, 'City is required').optional()),
  country: z.string().default('Pakistan'),
  zipCode: z.preprocess(emptyToUndefined, z.string().optional()),
  recaptchaToken: z.any().optional(),
});
```

**Status**: 🔧 To Be Implemented

---

### Issue #8: Insecure File Upload Validation
**Risk Level**: 🟠 High  
**CVSS Score**: 7.2/10

**Description**:  
File upload validation only checks MIME type which can be easily spoofed. No verification of actual file content, magic numbers, or file dimensions.

**Location**: 
- `server/src/middleware/upload.middleware.ts`

**Remediation**:

```typescript
// server/src/middleware/upload.middleware.ts
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

// Validate file type using magic numbers
const validateFileType = async (buffer: Buffer): Promise<boolean> => {
  const type = await fileTypeFromBuffer(buffer);
  if (!type) return false;
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return allowedTypes.includes(type.mime);
};

// File filter with content validation
const fileFilter = async (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type first
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'));
    return;
  }
  
  // Additional validation will happen in upload controller
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
});

// Additional validation middleware
export const validateImageUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) {
    next();
    return;
  }

  try {
    // Validate magic numbers
    const isValidType = await validateFileType(req.file.buffer);
    if (!isValidType) {
      res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' });
      return;
    }

    // Check image dimensions
    const sizeOf = require('image-size');
    const dimensions = sizeOf(req.file.buffer);
    
    const MAX_WIDTH = 8000;
    const MAX_HEIGHT = 8000;
    
    if (dimensions.width > MAX_WIDTH || dimensions.height > MAX_HEIGHT) {
      res.status(400).json({ 
        message: `Image dimensions too large. Maximum: ${MAX_WIDTH}x${MAX_HEIGHT}` 
      });
      return;
    }

    next();
  } catch (error) {
    res.status(400).json({ message: 'Failed to validate image' });
  }
};
```

**Status**: 🔧 To Be Implemented

---

## 🟡 MEDIUM SEVERITY (Fix Within 2 Weeks)

### Issue #9: Missing Request Size Limits
**Risk Level**: 🟡 Medium  
**CVSS Score**: 5.3/10

**Description**:  
No global request body size limits are configured beyond multer's 5MB for file uploads, enabling DoS attacks via large JSON payloads.

**Remediation**:

```typescript
// server/src/app.ts
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
```

**Status**: 🔧 To Be Implemented

---

### Issue #10: Information Disclosure in Error Messages
**Risk Level**: 🟡 Medium  
**CVSS Score**: 5.0/10

**Description**:  
Error responses expose internal implementation details in development mode that could aid attackers.

**Location**: 
- Multiple controllers

**Remediation**:

```typescript
// server/src/utils/error-handler.ts
export const sanitizeError = (error: any, isDevelopment: boolean): string => {
  if (isDevelopment) {
    return error.message;
  }
  // In production, return generic messages
  if (error.name === 'ValidationError') return 'Invalid input provided';
  if (error.name === 'UnauthorizedError') return 'Authentication required';
  return 'An error occurred. Please try again later.';
};
```

**Status**: 🔧 To Be Implemented

---

### Issue #11: Missing Audit Logging
**Risk Level**: 🟡 Medium  
**CVSS Score**: 5.5/10

**Description**:  
No audit trail exists for sensitive operations like user deletion, role changes, or order modifications.

**Remediation**:

```typescript
// server/src/utils/audit-logger.ts
import prisma from '../config/database';

export enum AuditAction {
  USER_CREATED = 'USER_CREATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ARTWORK_CREATED = 'ARTWORK_CREATED',
  ARTWORK_DELETED = 'ARTWORK_DELETED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
}

export const logAuditEvent = async ({
  action,
  userId,
  targetId,
  details,
  ipAddress,
  userAgent
}: {
  action: AuditAction;
  userId: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        targetId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
```

**Status**: 🔧 To Be Implemented

---

### Issue #12: Rate Limiting Bypass Risk
**Risk Level**: 🟡 Medium  
**CVSS Score**: 5.0/10

**Description**:  
Rate limiting is completely disabled in development environment, which could accidentally be enabled in production.

**Location**: 
- `server/src/middleware/rateLimiter.ts:17`

**Remediation**:

```typescript
// server/src/middleware/rateLimiter.ts
// NEVER skip rate limiting based on environment
// Instead, use different limits for development

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    // Different limits for different environments
    if (process.env.TESTING_PHASE === 'true') {
      return 500; // Higher limit for testing
    }
    return 100; // Standard production limit
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  // Remove the 'skip' option entirely
});
```

**Status**: 🔧 To Be Implemented

---

### Issue #13: Email Enumeration via Timing Attack
**Risk Level**: 🟡 Medium  
**CVSS Score**: 4.3/10

**Description**:  
Login endpoint may be vulnerable to timing attacks that reveal whether an email exists in the system.

**Remediation**:

```typescript
// server/src/controllers/auth.controller.ts
export const login = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // ... existing validation code ...
    
    // Always perform bcrypt comparison even if user not found
    // to prevent timing attacks
    const dummyHash = '$2a$10$dummyhashfordummyuserpurposesonly';
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    const hashToCompare = user?.passwordHash || dummyHash;
    const isPasswordValid = await bcrypt.compare(validatedData.password, hashToCompare);
    
    if (!user || !isPasswordValid) {
      // Add artificial delay to normalize response time
      const elapsed = Date.now() - startTime;
      if (elapsed < 200) {
        await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
      }
      
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
      return;
    }
    
    // ... rest of login logic ...
  }
};
```

**Status**: 🔧 To Be Implemented

---

### Issue #14: No Account Lockout Mechanism
**Risk Level**: 🟡 Medium  
**CVSS Score**: 5.3/10

**Description**:  
No protection against brute force password attacks beyond basic rate limiting.

**Remediation**:

```typescript
// server/src/utils/account-lockout.ts
import prisma from '../config/database';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export const recordFailedLogin = async (email: string): Promise<void> => {
  await prisma.failedLoginAttempt.create({
    data: {
      email,
      attemptedAt: new Date()
    }
  });
};

export const isAccountLocked = async (email: string): Promise<boolean> => {
  const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);
  
  const recentAttempts = await prisma.failedLoginAttempt.count({
    where: {
      email,
      attemptedAt: {
        gte: lockoutTime
      }
    }
  });
  
  return recentAttempts >= MAX_FAILED_ATTEMPTS;
};

export const clearFailedLogins = async (email: string): Promise<void> => {
  await prisma.failedLoginAttempt.deleteMany({
    where: { email }
  });
};
```

**Status**: 🔧 To Be Implemented

---

## 🟢 LOW SEVERITY (Fix When Possible)

### Issue #15: Missing API Versioning
**Risk Level**: 🟢 Low  
**CVSS Score**: 3.0/10

**Description**:  
No API versioning strategy makes it difficult to introduce breaking changes safely.

**Remediation**: 
Add `/api/v1/` prefix to all routes

**Status**: 📋 Planned

---

### Issue #16: Missing Content Security Policy Refinement
**Risk Level**: 🟢 Low  
**CVSS Score**: 3.5/10

**Description**:  
CSP allows `unsafe-inline` for scripts and styles, reducing effectiveness against XSS.

**Remediation**:
Generate nonce-based CSP headers

**Status**: 📋 Planned

---

## 📊 Implementation Checklist

### Week 1: Critical Fixes
- [ ] Issue #1: Strengthen JWT_SECRET validation
- [ ] Issue #2: Implement CSRF protection
- [ ] Issue #3: Fix open redirect vulnerability
- [ ] Issue #4: Add admin verification to updateOrderNotes

### Week 2: High Priority
- [ ] Issue #5: Add security headers (HSTS, X-Frame-Options)
- [ ] Issue #6: Implement XSS sanitization
- [ ] Issue #7: Strengthen password policy
- [ ] Issue #8: Improve file upload validation

### Week 3-4: Medium Priority
- [ ] Issue #9: Add request size limits
- [ ] Issue #10: Sanitize error messages
- [ ] Issue #11: Implement audit logging
- [ ] Issue #12: Fix rate limiting bypass
- [ ] Issue #13: Prevent email enumeration
- [ ] Issue #14: Add account lockout

### Future: Low Priority
- [ ] Issue #15: Implement API versioning
- [ ] Issue #16: Refine CSP policy

---

## 🔧 Testing Procedures

After implementing fixes:

1. **JWT Security Test**:
   ```bash
   # Verify strong secret requirement
   JWT_SECRET=weak node server/dist/server.js
   # Should fail to start
   ```

2. **CSRF Test**:
   ```bash
   curl -X POST http://localhost:5000/api/cart \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"artworkId": "123", "quantity": 1}'
   # Should return 403 without CSRF token
   ```

3. **Open Redirect Test**:
   ```bash
   # Verify tokens not in URL
   curl -I "http://localhost:5000/api/auth/google/callback"
   # Should redirect without token parameter
   ```

4. **XSS Test**:
   ```bash
   curl -X POST http://localhost:5000/api/orders/123/notes \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -d '{"notes": "<script>alert(1)</script>"}'
   # Script tags should be stripped
   ```

---

## 📞 Security Contacts

- **Security Lead**: security@muraqqa.art
- **Emergency**: +92-XXX-XXXXXXX
- **Bug Bounty**: https://muraqqa.art/security

---

## 📚 References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated**: February 9, 2026  
**Next Review**: March 9, 2026  
**Document Owner**: Security Team
