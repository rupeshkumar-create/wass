# Vercel Environment Variables Setup 🔧

## ❌ Current Issue: Missing Supabase Configuration

The deployment is failing because environment variables are not set in Vercel. Here's how to fix it:

## 🚀 Step-by-Step Fix

### 1. Go to Vercel Dashboard
- Visit [vercel.com/dashboard](https://vercel.com/dashboard)
- Find your project: `wass-git-main-rupesh-kumars-projects-8be3cf82.vercel.app`
- Click on the project

### 2. Navigate to Environment Variables
- Click on "Settings" tab
- Click on "Environment Variables" in the sidebar

### 3. Add Required Environment Variables

**CRITICAL - Add these exact variables:**

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co
Environment: Production, Preview, Development
```

```
SUPABASE_URL  
Value: https://your-project.supabase.co
Environment: Production, Preview, Development
```

```
SUPABASE_SERVICE_ROLE_KEY
Value: your_service_role_key_here
Environment: Production, Preview, Development
```

```
HUBSPOT_ACCESS_TOKEN
Value: your_hubspot_token_here
Environment: Production, Preview, Development
```

```
LOOPS_API_KEY
Value: your_loops_api_key_here
Environment: Production, Preview, Development
```

```
LOOPS_SYNC_ENABLED
Value: true
Environment: Production, Preview, Development
```

```
CRON_SECRET
Value: your_secure_random_string
Environment: Production, Preview, Development
```

### 4. Get Your Supabase Credentials

**To find your Supabase credentials:**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → Use for both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **Service Role Key** → Use for `SUPABASE_SERVICE_ROLE_KEY`

### 5. Redeploy After Setting Variables

After adding all environment variables:
1. Go to "Deployments" tab in Vercel
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

## 🧪 Test Environment Variables

After deployment, visit:
```
https://your-app.vercel.app/api/test-env
```

This will show which environment variables are properly set.

## ✅ Expected Response

You should see:
```json
{
  "message": "Environment variables check",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "HUBSPOT_ACCESS_TOKEN": true,
    "LOOPS_API_KEY": true,
    "LOOPS_SYNC_ENABLED": "true",
    "NODE_ENV": "production"
  }
}
```

## 🔍 Common Issues

### Issue 1: "Missing Supabase configuration"
- **Cause**: Environment variables not set in Vercel
- **Fix**: Follow steps above to add all required variables

### Issue 2: "Build Failed"
- **Cause**: Missing environment variables during build
- **Fix**: Ensure all variables are set for "Production, Preview, Development"

### Issue 3: API Routes Return 500 Errors
- **Cause**: Database connection fails
- **Fix**: Verify Supabase credentials are correct

## 📋 Environment Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_URL` - Same as above (backup)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- [ ] `HUBSPOT_ACCESS_TOKEN` - Your HubSpot private app token
- [ ] `LOOPS_API_KEY` - Your Loops.so API key
- [ ] `LOOPS_SYNC_ENABLED` - Set to "true"
- [ ] `CRON_SECRET` - Any secure random string

## 🎯 After Setup

Once environment variables are set and you redeploy:

1. **Homepage** should load with stats and animations
2. **API test endpoint** `/api/test-env` should show all variables as `true`
3. **Nomination form** should work end-to-end
4. **Admin panel** should be accessible
5. **Database operations** should work properly

Your app will be fully functional! 🚀