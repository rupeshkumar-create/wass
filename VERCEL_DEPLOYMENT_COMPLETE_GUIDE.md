# Complete Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Code Status
- ✅ All `createClient` usage removed and centralized
- ✅ Build passes successfully (`npm run build`)
- ✅ All API routes use centralized Supabase client
- ✅ No import/export errors
- ✅ Code pushed to GitHub

### 2. Required Environment Variables

Copy these to your Vercel project settings:

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app

# Admin Authentication (REQUIRED)
ADMIN_EMAILS=admin@yourcompany.com
ADMIN_PASSWORD_HASHES=your_bcrypt_hash_here
SERVER_SESSION_SECRET=your-jwt-signing-secret-min-32-chars

# HubSpot Integration (Optional)
HUBSPOT_ACCESS_TOKEN=your_hubspot_access_token_here

# Loops Integration (Optional)
LOOPS_API_KEY=your_loops_api_key_here
LOOPS_SYNC_ENABLED=true

# Security
CRON_SECRET=your-cron-secret-key
SYNC_SECRET=your-strong-sync-secret-key
```

## 🚀 Deployment Steps

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `world-staffing-awards` folder as root directory

### Step 2: Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `world-staffing-awards`
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### Step 3: Add Environment Variables
In Vercel dashboard → Settings → Environment Variables, add all the variables from above.

### Step 4: Deploy
Click "Deploy" and wait for the build to complete.

## 🔧 Post-Deployment Configuration

### 1. Update NEXT_PUBLIC_APP_URL
After deployment, update this environment variable with your actual Vercel URL:
```bash
NEXT_PUBLIC_APP_URL=https://your-actual-vercel-url.vercel.app
```

### 2. Test Critical Endpoints
- `/api/nominees` - Should return nominees data
- `/api/stats` - Should return statistics
- `/admin` - Should show admin login
- `/` - Should show home page

### 3. Database Setup
Ensure your Supabase database has the required tables and views:
- `public_nominees` view
- `nominations` table
- `app_settings` table
- All required columns exist

## 🐛 Common Issues & Solutions

### Build Errors
- **"createClient is not defined"**: All instances should be fixed in this commit
- **"Module not found"**: Check import paths are correct
- **"Environment variable missing"**: Ensure all required env vars are set

### Runtime Errors
- **Database connection issues**: Verify Supabase credentials
- **API 500 errors**: Check Vercel function logs
- **Admin login issues**: Verify admin password hashes

### Performance Issues
- **Slow API responses**: Check Supabase query performance
- **Build timeouts**: Optimize dependencies if needed

## 📝 Environment Variable Generation

### Generate Admin Password Hash
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));"
```

### Generate Secrets
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```

## 🔍 Verification Steps

After deployment, verify:
1. ✅ Home page loads without errors
2. ✅ Directory page shows nominees
3. ✅ Admin login works
4. ✅ API endpoints respond correctly
5. ✅ No console errors in browser
6. ✅ Database queries work

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints directly
4. Check Supabase logs
5. Review browser console for client-side errors

---

**Status**: ✅ Ready for deployment
**Last Updated**: $(date)
**Build Status**: Passing