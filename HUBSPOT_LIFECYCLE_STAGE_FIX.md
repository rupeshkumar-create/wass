# HubSpot Lifecycle Stage Fix 🔧

## Issue Identified
Nominee contacts (like `kibenaf740@besaies.com`) are syncing to HubSpot with lifecycle stage "customer" instead of "lead".

## Root Cause Analysis
After investigation, we found that:
1. ✅ Our code correctly sets `lifecyclestage: 'lead'` in all contact mappings
2. ✅ The API call successfully sends the lifecycle stage property
3. ❌ **HubSpot automation rules are overriding our setting**

## Evidence
- Contact ID: `151366146830` (kibenaf740@besaies.com)
- Our API calls set `lifecyclestage: 'lead'`
- HubSpot immediately changes it back to `customer`
- This happens even with direct PATCH requests

## Code Changes Applied ✅

### 1. Updated Contact Mapping (`src/server/hubspot/map.ts`)
```typescript
export function contactProps(input: ContactInput): Record<string, unknown> {
  const props: Record<string, unknown> = {
    email: input.email,
    source: 'WSA26',
    source_detail: 'WSS26',
    wsa_year: 2026,
    lifecyclestage: 'lead', // ✅ Always set as lead for WSA contacts
    ...input.extras,
  };
  // ... rest of mapping
}
```

### 2. Updated Company Mapping
```typescript
export function companyProps(input: CompanyInput): Record<string, unknown> {
  const props: Record<string, unknown> = {
    name: input.name,
    source: 'WSA26',
    source_detail: 'WSS26',
    wsa_year: 2026,
    wsa_role: 'Nominee_Company',
    lifecyclestage: 'lead', // ✅ Always set as lead for WSA companies
    ...input.extras,
  };
  // ... rest of mapping
}
```

### 3. Enhanced Contact Upsert Logic (`src/server/hubspot/contacts.ts`)
```typescript
// Always ensure lifecycle stage is set to lead for WSA contacts
updateProps.lifecyclestage = 'lead';

// Remove empty/undefined values to avoid overwriting existing data
Object.keys(updateProps).forEach(key => {
  if (updateProps[key] === undefined || updateProps[key] === null || updateProps[key] === '') {
    delete updateProps[key];
  }
});

// But keep lifecyclestage even if it was empty
updateProps.lifecyclestage = 'lead';
```

## HubSpot Automation Override Issue ⚠️

**The Problem**: HubSpot has automation rules that automatically change lifecycle stages based on:
- Contact properties
- Engagement history  
- Deal associations
- Custom workflows
- Lead scoring

**The Evidence**: Even direct API calls to set `lifecyclestage: 'lead'` are immediately overridden back to `customer`.

## Solutions & Recommendations 🎯

### Option 1: HubSpot Admin Configuration (Recommended)
**You need to check your HubSpot settings:**

1. **Go to Settings > Automation > Workflows**
   - Look for workflows that change lifecycle stages
   - Disable or modify rules affecting WSA contacts

2. **Check Settings > Properties > Contact Properties > Lifecycle Stage**
   - Look for automatic lifecycle stage rules
   - Modify to exclude WSA contacts (source = 'WSA26')

3. **Review Lead Scoring Rules**
   - Check if lead scoring is automatically promoting contacts
   - Exclude WSA contacts from automatic promotion

### Option 2: Use Custom Property (Alternative)
Instead of relying on HubSpot's `lifecyclestage`, we could:
- Create a custom property `wsa_lifecycle_stage`
- Always set it to "lead" for WSA contacts
- Use this for reporting instead of the standard lifecycle stage

### Option 3: Workflow Override (Technical)
Create a HubSpot workflow that:
- Triggers when `source = 'WSA26'`
- Sets `lifecyclestage = 'lead'`
- Runs after our API sync

## Current Status ✅

- ✅ **Code Fixed**: All contact/company mappings now set `lifecyclestage: 'lead'`
- ✅ **API Calls Working**: Properties are sent correctly to HubSpot
- ✅ **GitHub Updated**: All changes committed and pushed
- ⚠️ **HubSpot Override**: Automation rules are changing lifecycle stage back to "customer"

## Next Steps for You 🚀

1. **Check HubSpot Automation Settings** (most important)
   - Review workflows that modify lifecycle stages
   - Look for automatic lead scoring rules
   - Check property automation settings

2. **Test After HubSpot Changes**
   - Once you disable the automation, test with a new contact
   - Or re-sync the existing contact: `kibenaf740@besaies.com`

3. **Alternative: Use Custom Property**
   - If you can't modify HubSpot automation
   - We can create a custom `wsa_lifecycle_stage` property instead

## Testing Commands 🧪

To test the fix after HubSpot configuration changes:
```bash
# Test specific contact
node scripts/fix-specific-contact-lifecycle.js

# Check current status
node scripts/debug-lifecycle-stage-issue.js
```

## Summary
Our code is correctly setting lifecycle stage to "lead", but HubSpot automation is overriding it. The fix requires HubSpot admin configuration changes to prevent automatic lifecycle stage changes for WSA contacts.