# Vercel Environment Variables - Complete Setup Guide 🚀

## 🎯 Required Environment Variables for Vercel

### 1. Supabase Configuration (CRITICAL)
```bash
# Primary variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Compatibility aliases (add these to fix build errors)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabaseKey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. HubSpot Integration
```bash
HUBSPOT_ACCESS_TOKEN=pat-na1-your-token-here
HUBSPOT_TOKEN=pat-na1-your-token-here
HUBSPOT_SYNC_ENABLED=true

# Optional (will use defaults if not set)
HUBSPOT_CONTACT_LINKEDIN_KEY=linkedin
HUBSPOT_COMPANY_LINKEDIN_KEY=linkedin_company_page
HUBSPOT_PIPELINE_ID=default-pipeline
HUBSPOT_STAGE_SUBMITTED=submitted
HUBSPOT_STAGE_APPROVED=approved
```

### 3. Loops Integration
```bash
LOOPS_API_KEY=your-loops-api-key
LOOPS_SYNC_ENABLED=true
```

### 4. Security & Cron
```bash
CRON_SECRET=your-secure-random-string
```

## 🔧 How to Add in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the following settings:
   - **Environment**: Production, Preview, Development (all)
   - **Value**: Copy the exact value from your local `.env.local`

## ✅ Verification Steps

### Step 1: Deploy with New Variables
After adding all variables, trigger a new deployment:
```bash
git commit -m "Update environment variable compatibility"
git push origin main
```

### Step 2: Test Environment Endpoint
Once deployed, visit:
```
https://your-app.vercel.app/api/test-env
```

Expected response should show:
```json
{
  "message": "Environment variables check - Updated for Vercel compatibility",
  "env": {
    "supabase_url_available": true,
    "supabase_key_available": true,
    "HUBSPOT_ACCESS_TOKEN": true,
    "LOOPS_API_KEY": true
  }
}
```

### Step 3: Test Core Functionality
- Visit homepage: `https://your-app.vercel.app`
- Test nomination form: `https://your-app.vercel.app/nominate`
- Check admin panel: `https://your-app.vercel.app/admin`

## 🚨 Common Issues & Solutions

### Issue: "supabaseKey is required"
**Solution**: Add all three Supabase key aliases:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_KEY`
- `supabaseKey`

### Issue: Build fails with HubSpot errors
**Solution**: Ensure `HUBSPOT_ACCESS_TOKEN` is set, or set `HUBSPOT_SYNC_ENABLED=false`

### Issue: Loops integration errors
**Solution**: Set `LOOPS_SYNC_ENABLED=false` if not using Loops

## 📋 Environment Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_KEY` (compatibility)
- [ ] `supabaseKey` (compatibility)
- [ ] `HUBSPOT_ACCESS_TOKEN`
- [ ] `HUBSPOT_TOKEN` (alias)
- [ ] `LOOPS_API_KEY`
- [ ] `CRON_SECRET`

## 🎉 Success Indicators

✅ **Build Successful**: No environment variable errors in build logs
✅ **Homepage Loads**: Main page displays without errors
✅ **API Endpoints Work**: `/api/test-env` returns valid response
✅ **Database Connected**: Nominations and votes can be created
✅ **Integrations Active**: HubSpot and Loops sync working (if enabled)

Your World Staffing Awards application should now be fully deployed and operational on Vercel! 🚀