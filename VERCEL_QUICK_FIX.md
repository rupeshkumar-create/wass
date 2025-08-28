# Quick Fix for Vercel Deployment ⚡

## ❌ Current Error: `HUBSPOT_TOKEN environment variable is required`

## ✅ Quick Solution

Add these **7 additional** environment variables to Vercel:

1. **HUBSPOT_TOKEN** = `[SAME_VALUE_AS_HUBSPOT_ACCESS_TOKEN]`
2. **HUBSPOT_SYNC_ENABLED** = `true`
3. **HUBSPOT_CONTACT_LINKEDIN_KEY** = `linkedin`
4. **HUBSPOT_COMPANY_LINKEDIN_KEY** = `linkedin_company_page`
5. **HUBSPOT_PIPELINE_ID** = `test-pipeline`
6. **HUBSPOT_STAGE_SUBMITTED** = `test-submitted`
7. **HUBSPOT_STAGE_APPROVED** = `test-approved`

## 🚀 Steps:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable above (set for Production, Preview, Development)
3. Click "Redeploy" on your latest deployment

## ✅ After Fix:

Your deployment will succeed and show the complete World Staffing Awards application!

**Repository Status**: ✅ All code fixes pushed to GitHub (commit: `bed7f03`)