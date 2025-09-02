# Security Deployment Checklist

## 🚨 Pre-Deployment Security Checklist

### 1. Credential Rotation (CRITICAL)
- [ ] **Rotate Supabase Service Role Key**
  - Generate new service role key in Supabase dashboard
  - Update `SUPABASE_SERVICE_ROLE_KEY` in production environment
  
- [ ] **Rotate Supabase Anon Key** 
  - Generate new anon key in Supabase dashboard
  - Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in production environment
  
- [ ] **Rotate HubSpot Access Token**
  - Generate new private app token in HubSpot
  - Update `HUBSPOT_ACCESS_TOKEN` in production environment
  
- [ ] **Rotate Loops API Key**
  - Generate new API key in Loops dashboard
  - Update `LOOPS_API_KEY` in production environment
  
- [ ] **Generate New Secrets**
  ```bash
  node scripts/generate-admin-hash.js
  # Copy the generated secrets to production environment
  ```

### 2. Admin Authentication Setup (CRITICAL)
- [ ] **Set Admin Credentials**
  ```bash
  # Generate password hash
  node scripts/generate-admin-hash.js "your-secure-production-password"
  
  # Set in production environment:
  ADMIN_EMAILS=admin@yourcompany.com
  ADMIN_PASSWORD_HASHES=generated_hash_here
  SERVER_SESSION_SECRET=generated_secret_here
  ```

- [ ] **Test Admin Login**
  - Deploy to staging first
  - Test login at `/admin/login`
  - Verify JWT session works
  - Test logout functionality

### 3. Environment Variables (CRITICAL)
Ensure all these are set in production:

```bash
# Admin Authentication (REQUIRED)
ADMIN_EMAILS=admin@yourcompany.com
ADMIN_PASSWORD_HASHES=your_bcrypt_hash_here
SERVER_SESSION_SECRET=your-jwt-signing-secret-min-32-chars

# Sync Protection (REQUIRED)
SYNC_SECRET=your-strong-sync-secret-key
CRON_SECRET=your-cron-secret-key

# Database (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_NEW_service_role_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_NEW_anon_key_here

# Integrations (REQUIRED)
HUBSPOT_ACCESS_TOKEN=your_NEW_hubspot_token_here
LOOPS_API_KEY=your_NEW_loops_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### 4. Supabase Storage Setup (REQUIRED)
- [ ] **Create Storage Bucket**
  1. Go to Supabase Dashboard → Storage
  2. Create new bucket: `wsa-uploads`
  3. Set public access if needed for file serving
  
- [ ] **Configure RLS Policies**
  ```sql
  -- Example policy for authenticated uploads
  CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
  -- Example policy for public read access
  CREATE POLICY "Public can view uploaded files" ON storage.objects
  FOR SELECT USING (bucket_id = 'wsa-uploads');
  ```

### 5. Security Verification (CRITICAL)
- [ ] **Run Security Audit**
  ```bash
  node scripts/security-audit.js
  # Must pass with 0 critical issues
  ```

- [ ] **Verify Security Headers**
  - Test with online security header checker
  - Verify CSP, HSTS, X-Frame-Options are set
  
- [ ] **Test Rate Limiting**
  - Make multiple rapid requests to `/api/vote`
  - Verify rate limiting kicks in
  
- [ ] **Test File Upload Security**
  - Try uploading non-image files
  - Try uploading oversized files
  - Verify proper error handling

### 6. Access Control Verification (CRITICAL)
- [ ] **Test Admin Routes Protection**
  ```bash
  # These should redirect to login or return 401:
  curl https://your-domain.com/admin
  curl https://your-domain.com/api/admin/nominations
  curl https://your-domain.com/api/nomination/approve
  ```

- [ ] **Test Authenticated Access**
  - Login as admin
  - Verify access to admin dashboard
  - Test nomination approval workflow
  - Test bulk upload functionality

### 7. Production Environment Security
- [ ] **HTTPS Configuration**
  - Verify SSL certificate is valid
  - Test HTTPS redirect
  - Verify HSTS header is set
  
- [ ] **Domain Security**
  - Configure proper CORS if needed
  - Verify domain restrictions
  - Test from different origins

### 8. Monitoring Setup (RECOMMENDED)
- [ ] **Error Monitoring**
  - Set up error tracking (Sentry, etc.)
  - Monitor failed login attempts
  - Track rate limit violations
  
- [ ] **Security Monitoring**
  - Monitor admin login patterns
  - Set up alerts for suspicious activity
  - Log security-related events

## 🔄 Post-Deployment Verification

### Immediate Checks (Within 1 hour)
- [ ] Admin login works correctly
- [ ] All protected routes require authentication
- [ ] File uploads work with new system
- [ ] Rate limiting is functional
- [ ] Security headers are present

### Daily Checks (First week)
- [ ] Monitor error logs for security issues
- [ ] Check for failed login attempts
- [ ] Verify no hardcoded secrets in logs
- [ ] Monitor file upload activity

### Weekly Checks (Ongoing)
- [ ] Run security audit script
- [ ] Check for dependency vulnerabilities
- [ ] Review admin access logs
- [ ] Verify backup and recovery procedures

## 🚨 Emergency Procedures

### If Credentials Are Compromised
1. **Immediate Actions**
   - Rotate all API keys and secrets
   - Force logout all admin sessions
   - Review access logs for unauthorized activity
   
2. **Investigation**
   - Check git history for leaked secrets
   - Review server logs for suspicious activity
   - Audit database for unauthorized changes

### If Security Breach Detected
1. **Containment**
   - Disable affected admin accounts
   - Block suspicious IP addresses
   - Take affected systems offline if necessary
   
2. **Assessment**
   - Determine scope of breach
   - Identify compromised data
   - Document timeline of events

## 📞 Security Contacts

- **Technical Lead**: [Your contact info]
- **Security Team**: [Security team contact]
- **Emergency Contact**: [24/7 emergency contact]

## 📋 Deployment Sign-off

- [ ] **Security Team Approval**: _________________ Date: _______
- [ ] **Technical Lead Approval**: _________________ Date: _______
- [ ] **All Critical Items Completed**: _____________ Date: _______

**Deployment Authorization**: ___________________ Date: __________

---

**⚠️ DO NOT DEPLOY TO PRODUCTION UNTIL ALL CRITICAL ITEMS ARE COMPLETED AND VERIFIED**