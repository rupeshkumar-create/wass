# 🔧 HubSpot Sync Fix Guide

## 🎯 **Issue Identified**

The HubSpot sync for nominees and nominators is not working because:

1. **❌ Invalid/Expired Token**: The current HubSpot token is expired or invalid
2. **⚠️ Missing Custom Properties**: Some required custom properties may not exist in HubSpot

## ✅ **Complete Solution**

### Step 1: Get a New HubSpot Token

1. **Go to your HubSpot account**
2. **Navigate to**: Settings → Integrations → Private Apps
3. **Create a new Private App** or update existing one
4. **Configure the following scopes**:
   - ✅ `crm.objects.contacts.read`
   - ✅ `crm.objects.contacts.write`
   - ✅ `crm.objects.companies.read`
   - ✅ `crm.objects.companies.write`
   - ✅ `crm.schemas.contacts.read`
   - ✅ `crm.schemas.companies.read`

5. **Copy the generated token**
6. **Update your `.env.local` file**:
   ```bash
   HUBSPOT_PRIVATE_APP_TOKEN="your-new-token-here"
   ```

### Step 2: Create Required Custom Properties in HubSpot

#### **Contact Properties** (Go to Settings → Properties → Contact Properties)

1. **wsa_year**
   - Type: Single-line text
   - Internal name: `wsa_year`

2. **wsa_segments** ⭐ **MOST IMPORTANT**
   - Type: Multi-select dropdown
   - Internal name: `wsa_segments`
   - Options:
     - Label: "Nominees 2026", Value: `nominees_2026`
     - Label: "Voters 2026", Value: `voters_2026`
     - Label: "Nominators 2026", Value: `nominators_2026`

3. **wsa_category**
   - Type: Single-line text
   - Internal name: `wsa_category`

4. **wsa_linkedin_url**
   - Type: Single-line text
   - Internal name: `wsa_linkedin_url`

5. **wsa_last_voted_nominee**
   - Type: Single-line text
   - Internal name: `wsa_last_voted_nominee`

6. **wsa_last_voted_category**
   - Type: Single-line text
   - Internal name: `wsa_last_voted_category`

7. **wsa_nomination_id**
   - Type: Single-line text
   - Internal name: `wsa_nomination_id`

8. **wsa_live_slug**
   - Type: Single-line text
   - Internal name: `wsa_live_slug`

#### **Company Properties** (Go to Settings → Properties → Company Properties)

1. **wsa_year**
   - Type: Single-line text
   - Internal name: `wsa_year`

2. **wsa_segments**
   - Type: Multi-select dropdown
   - Internal name: `wsa_segments`
   - Same options as contact property

3. **wsa_category**
   - Type: Single-line text
   - Internal name: `wsa_category`

4. **wsa_linkedin_url**
   - Type: Single-line text
   - Internal name: `wsa_linkedin_url`

5. **wsa_nomination_id**
   - Type: Single-line text
   - Internal name: `wsa_nomination_id`

### Step 3: Test the Fix

After updating the token and creating properties:

```bash
# Run the fix script to verify everything works
node scripts/fix-hubspot-sync.js
```

### Step 4: Test with Real Data

1. **Submit a test nomination** through your app
2. **Check HubSpot** for the nominator contact
3. **Approve the nomination**
4. **Check HubSpot** for the nominee contact
5. **Submit a test vote**
6. **Check HubSpot** for the voter contact

## 🔍 **How the Sync Works**

### **Nominator Sync** (On nomination submission)
- ✅ Creates contact in HubSpot
- ✅ Sets `wsa_segments` to `nominators_2026`
- ✅ Adds WSA year, LinkedIn URL, etc.

### **Nominee Sync** (On nomination approval)
- ✅ Creates contact in HubSpot
- ✅ Sets `wsa_segments` to `nominees_2026`
- ✅ Adds category, LinkedIn URL, etc.

### **Voter Sync** (On vote submission)
- ✅ Creates contact in HubSpot
- ✅ Sets `wsa_segments` to `voters_2026`
- ✅ Adds vote metadata, LinkedIn URL, etc.

## 🚀 **Verification Steps**

After the fix:

1. **Check HubSpot Dashboard**:
   - Go to Contacts
   - Search for test emails
   - Verify contacts have correct WSA segments
   - Check all custom properties are populated

2. **Check Sync Logs**:
   - Look for success messages in server logs
   - Verify no error messages

3. **Test All Flows**:
   - Nomination → Nominator sync
   - Approval → Nominee sync
   - Voting → Voter sync

## 🔧 **Troubleshooting**

### If sync still doesn't work:

1. **Check Token Permissions**:
   - Ensure all required scopes are enabled
   - Verify token is not expired

2. **Verify Custom Properties**:
   - All properties must exist with exact internal names
   - Multi-select dropdown must have exact values

3. **Check Server Logs**:
   - Look for detailed error messages
   - Verify API calls are being made

4. **Test API Directly**:
   ```bash
   # Test HubSpot API connection
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        "https://api.h