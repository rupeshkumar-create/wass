# Security Implementation Guide

This document outlines the security hardening measures implemented for the World Staffing Awards platform.

## 🔒 Security Features Implemented

### 1. Admin Authentication System

**Old System (REMOVED):**
- Hardcoded passcodes (`admin123`, `wsa2026`)
- Client-side authentication
- Insecure headers (`X-Admin-Passcode`)

**New System (IMPLEMENTED):**
- JWT-based session authentication
- HttpOnly, Secure, SameSite cookies
- Server-side validation with bcrypt password hashing
- Proper login/logout endpoints

### 2. Middleware Protection

All admin routes are protected by `middleware.ts`:
- `/admin/*` - Admin dashboard pages
- `/api/admin/*` - Admin API endpoints  
- `/api/nomination/approve` - Nomination approval
- `/api/votes/*` - Vote management
- `/api/sync/hubspot/run` - Sync operations

### 3. Rate Limiting

Vote endpoint (`/api/vote`) includes:
- 10 votes per minute per IP
- 200 votes per day per IP
- Proper rate limit headers
- Graceful error responses

### 4. Secure File Uploads

**Old System (DEPRECATED):**
- Direct file writes to `public/uploads`
- Minimal validation
- Same-origin serving

**New System (IMPLEMENTED):**
- Signed upload URLs via Supabase Storage
- Server-side MIME type validation
- File size limits (10MB)
- Secure file paths with UUIDs
- No direct file serving from app origin

### 5. Security Headers

Implemented via middleware:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security` (production only)
- Content Security Policy for admin pages

### 6. PII Protection

- Admin endpoints return only required fields
- Email addresses redacted in logs
- Sensitive data filtered from client responses
- Database queries use explicit field selection

### 7. Repository Security

- All `.env` files properly ignored
- Pre-commit secret scanning ready
- Dependency vulnerability checking
- Security audit script included

## 🚀 Setup Instructions

### 1. Environment Variables

Create a `.env` file with these required variables:

```bash
# Admin Authentication (REQUIRED)
ADMIN_EMAILS=admin@yourcompany.com,admin2@yourcompany.com
ADMIN_PASSWORD_HASHES=your_bcrypt_hash_here,another_bcrypt_hash_here
SERVER_SESSION_SECRET=your-jwt-signing-secret-min-32-chars

# Sync Protection
SYNC_SECRET=your-strong-sync-secret-key
CRON_SECRET=your-cron-secret-key

# Existing variables...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
# ... etc
```

### 2. Generate Admin Credentials

```bash
# Generate secrets and password hashes
node scripts/generate-admin-hash.js

# Generate hash for specific password
node scripts/generate-admin-hash.js "your-secure-password"
```

### 3. Install Dependencies

```bash
npm install jose bcryptjs @types/bcryptjs
```

### 4. Setup Supabase Storage

Create a storage bucket named `wsa-uploads` in your Supabase project:

1. Go to Storage in Supabase dashboard
2. Create new bucket: `wsa-uploads`
3. Set appropriate RLS policies for your use case

### 5. Run Security Audit

```bash
node scripts/security-audit.js
```

## 🔧 API Changes

### Admin Authentication

**Before:**
```javascript
fetch('/api/admin/nominations', {
  headers: { 'X-Admin-Passcode': 'wsa2026' }
})
```

**After:**
```javascript
// Login first
await fetch('/api/admin/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// Then make authenticated requests (cookie automatically included)
fetch('/api/admin/nominations')
```

### File Uploads

**Before:**
```javascript
const formData = new FormData();
formData.append('file', file);
fetch('/api/upload', { method: 'POST', body: formData });
```

**After:**
```javascript
import { uploadFileSecurely } from '@/lib/secure-upload';

const result = await uploadFileSecurely(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png']
});
```

## 🛡️ Security Checklist

### Pre-Production Deployment

- [ ] All hardcoded secrets removed
- [ ] Environment variables properly configured
- [ ] Admin password hashes generated and set
- [ ] Security audit passes without critical issues
- [ ] Rate limiting tested
- [ ] File upload security validated
- [ ] HTTPS enabled in production
- [ ] Security headers verified

### Ongoing Security

- [ ] Regular dependency updates (`npm audit`)
- [ ] Monitor failed login attempts
- [ ] Review admin access logs
- [ ] Rotate secrets periodically
- [ ] Monitor rate limit violations

## 🚨 Incident Response

### If Credentials Are Compromised

1. **Immediate Actions:**
   ```bash
   # Rotate all secrets
   node scripts/generate-admin-hash.js
   # Update environment variables
   # Restart application
   ```

2. **Audit Actions:**
   ```bash
   # Run security audit
   node scripts/security-audit.js
   
   # Check for unauthorized access
   # Review admin action logs
   # Verify data integrity
   ```

### If Rate Limits Are Bypassed

1. Check IP-based blocking
2. Implement additional bot detection
3. Review vote patterns for anomalies
4. Consider implementing CAPTCHA

## 📞 Security Contacts

For security issues or questions:
- Review this documentation
- Run the security audit script
- Check middleware and authentication implementation
- Verify environment variable configuration

## 🔄 Migration from Old System

The old passcode-based system has been completely removed. If you're upgrading:

1. Remove any hardcoded `admin123` or `wsa2026` references
2. Update admin UI to use new login page
3. Configure environment variables for JWT authentication
4. Test admin login flow
5. Verify all protected endpoints require proper authentication

## 📋 Security Audit Results

Run `node scripts/security-audit.js` to get a comprehensive security report including:

- Hardcoded secret detection
- Authentication system validation
- File permission checks
- Dependency security analysis
- API endpoint protection verification

The audit will exit with code 1 if critical issues are found, making it suitable for CI/CD pipelines.