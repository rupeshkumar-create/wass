# Missing Environment Variables for Vercel 🔧

## ❌ Current Issue: HUBSPOT_TOKEN Missing

The deployment is still failing because some code expects `HUBSPOT_TOKEN` but you only set `HUBSPOT_ACCESS_TOKEN`.

## 🚀 Additional Environment Variables Needed

Add these **additional** environment variables to Vercel:

### 1. HUBSPOT_TOKEN (Alias)
```
HUBSPOT_TOKEN
Value: [USE_SAME_VALUE_AS_HUBSPOT_ACCESS_TOKEN]
Environment: Production, Preview, Development
```

### 2. HUBSPOT_SYNC_ENABLED
```
HUBSPOT_SYNC_ENABLED
Value: true
Environment: Production, Preview, Development
```

### 3. HUBSPOT_CONTACT_LINKEDIN_KEY
```
HUBSPOT_CONTACT_LINKEDIN_KEY
Value: linkedin
Environment: Production, Preview, Development
```

### 4. HUBSPOT_COMPANY_LINKEDIN_KEY
```
HUBSPOT_COMPANY_LINKEDIN_KEY
Value: linkedin_company_page
Environment: Production, Preview, Development
```

### 5. HUBSPOT_PIPELINE_ID
```
HUBSPOT_PIPELINE_ID
Value: test-pipeline
Environment: Production, Preview, Development
```

### 6. HUBSPOT_STAGE_SUBMITTED
```
HUBSPOT_STAGE_SUBMITTED
Value: test-submitted
Environment: Production, Preview, Development
```

### 7. HUBSPOT_STAGE_APPROVED
```
HUBSPOT_STAGE_APPROVED
Value: test-approved
Environment: Production, Preview, Development
```

## 📋 Complete Environment Variables List

Here's the **complete** list of all environment variables you need in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL = [YOUR_SUPABASE_URL]
SUPABASE_URL = [YOUR_SUPABASE_URL]
SUPABASE_SERVICE_ROLE_KEY = [YOUR_SUPABASE_SERVICE_KEY]
HUBSPOT_ACCESS_TOKEN = [YOUR_HUBSPOT_TOKEN]
HUBSPOT_TOKEN = [YOUR_HUBSPOT_TOKEN]
HUBSPOT_SYNC_ENABLED = true
HUBSPOT_CONTACT_LINKEDIN_KEY = linkedin
HUBSPOT_COMPANY_LINKEDIN_KEY = linkedin_company_page
HUBSPOT_PIPELINE_ID = test-pipeline
HUBSPOT_STAGE_SUBMITTED = test-submitted
HUBSPOT_STAGE_APPROVED = test-approved
LOOPS_API_KEY = [YOUR_LOOPS_API_KEY]
LOOPS_SYNC_ENABLED = true
CRON_SECRET = [YOUR_CRON_SECRET]
NEXT_PUBLIC_APP_URL = https://wass-git-main-rupesh-kumars-projects-8be3cf82.vercel.app
```

**Note**: Use the actual values from your `.env.local` file for the placeholders above.

## 🔄 After Adding Variables

1. Add all the missing environment variables above
2. Redeploy your application
3. Test the environment variables endpoint: `/api/test-env`

This should resolve the HUBSPOT_TOKEN error and allow your deployment to succeed! 🚀