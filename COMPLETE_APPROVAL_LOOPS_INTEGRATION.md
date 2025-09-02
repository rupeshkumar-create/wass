# Complete Approval & Loops Integration

## Overview
This document outlines the complete approval workflow with Loops integration and live URL assignment for the World Staffing Awards 2026 system.

## Approval Workflow

### 1. Admin Approval Process
When an admin approves a nomination through the admin panel:

1. **ApprovalDialog Opens**
   - Shows nominee details
   - Allows URL assignment (auto-generate or manual)
   - Provides approval summary

2. **API Call to `/api/nomination/approve`**
   - Stores live URL in `nominations.live_url`
   - Updates nomination state to 'approved'
   - Triggers real-time sync to HubSpot and Loops

3. **Database Updates**
   - `nominations.state` → 'approved'
   - `nominations.live_url` → assigned URL
   - `nominations.approved_at` → timestamp
   - `nominators.status` → 'approved'

### 2. Loops Integration

#### Nominee Sync ("Nominess" User Group)
When approved, the nominee is synced to Loops with:
- **User Group**: "Nominess"
- **Live URL**: Included in contact data
- **Contact Data**: All nominee details
- **Custom Properties**: Category, nomination ID, etc.

#### Nominator Update ("Nominator Live" User Group)
The nominator is updated with:
- **User Group**: "Nominator Live" (upgraded from "Nominator")
- **Nominee Live URL**: Added to contact data
- **Nominee Name**: Added to contact data
- **Approval Date**: Timestamp added

### 3. Live URL Generation
- **Format**: `https://worldstaffingawards.com/nominee/{slug}`
- **Slug Creation**: Name → lowercase → remove special chars → hyphens
- **Examples**:
  - "John Smith" → `john-smith`
  - "ABC Company Ltd." → `abc-company-ltd`

## Technical Implementation

### Database Schema
```sql
-- Nominations table includes live_url
ALTER TABLE nominations ADD COLUMN live_url TEXT;

-- Admin view includes live URLs
CREATE VIEW admin_nominations AS
SELECT 
  n.live_url as nominee_live_url,
  -- ... other fields
FROM nominations n
JOIN nominees ne ON n.nominee_id = ne.id;
```

### API Endpoints

#### Approval API (`/api/nomination/approve`)
```typescript
// Stores live URL during approval
updateData.live_url = validatedData.liveUrl;

// Triggers Loops sync
const nomineeLoopsData = {
  liveUrl: validatedData.liveUrl,
  // ... other nominee data
};
await syncNomineeToLoops(nomineeLoopsData);

// Updates nominator
await updateNominatorToLive(nominatorEmail, {
  name: nomineeName,
  liveUrl: validatedData.liveUrl
});
```

#### Admin API (`/api/admin/nominations`)
```typescript
// Returns live URLs in response
liveUrl: nom.nominee_live_url,
```

### Loops Sync Functions

#### `syncNomineeToLoops()`
- Creates/updates nominee contact
- Sets user group to "Nominess"
- Includes live URL in contact data
- Adds category and nomination metadata

#### `updateNominatorToLive()`
- Updates existing nominator contact
- Changes user group to "Nominator Live"
- Adds nominee name and live URL
- Sets approval timestamp

### Frontend Components

#### ApprovalDialog
- Orange-themed approval interface
- Auto-generates live URLs
- Shows approval summary
- Displays assigned URL on success

#### EnhancedEditDialog
- Orange "Save Changes" button
- Displays live URLs (not placeholders)
- Allows live URL editing

## Environment Configuration

### Required Variables
```bash
# Loops Integration
LOOPS_SYNC_ENABLED=true
LOOPS_API_KEY=your_loops_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# HubSpot (optional)
HUBSPOT_ACCESS_TOKEN=your_hubspot_token
```

## Testing & Verification

### Automated Tests
```bash
# Verify current state
node scripts/verify-current-state.js

# Test complete approval workflow
node scripts/test-complete-approval-loops-sync.js

# Test live URL functionality
node scripts/test-live-url-complete.js

# Restart server and run all tests
./scripts/restart-and-test.sh
```

### Manual Testing Checklist
1. **Admin Panel**
   - [ ] Load admin panel at `/admin`
   - [ ] Verify approved nominations show live URLs
   - [ ] Check buttons are visible and orange-themed

2. **Approval Workflow**
   - [ ] Click "Approve" on a nomination
   - [ ] Verify ApprovalDialog opens
   - [ ] Test auto-generate URL feature
   - [ ] Confirm approval shows assigned URL

3. **Database Verification**
   - [ ] Check `nominations.live_url` is populated
   - [ ] Verify `admin_nominations` view includes URLs
   - [ ] Confirm outbox entries for sync

4. **Loops Integration**
   - [ ] Check Loops dashboard for "Nominess" contacts
   - [ ] Verify "Nominator Live" user group updates
   - [ ] Confirm live URLs in contact data

## Expected Results

### Before Approval
- Nomination state: "submitted"
- Live URL: `null`
- Nominator user group: "Nominator"
- Nominee: Not in Loops

### After Approval
- Nomination state: "approved"
- Live URL: `https://worldstaffingawards.com/nominee/john-smith`
- Nominator user group: "Nominator Live"
- Nominee user group: "Nominess"
- Both contacts have live URL data

## Troubleshooting

### Common Issues
1. **Placeholder URLs**: Run database fix SQL
2. **Missing Buttons**: Check CSS and component styling
3. **Loops Sync Fails**: Verify API key and environment variables
4. **Database Errors**: Ensure schema is up to date

### Debug Commands
```bash
# Check database structure
psql -c "SELECT column_name FROM information_schema.columns WHERE table_name='nominations';"

# Test Loops API
curl -X POST https://app.loops.so/api/v1/contacts/create \
  -H "Authorization: Bearer $LOOPS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check server logs
tail -f .next/server.log
```

## Success Metrics
- ✅ Live URLs assigned to all approved nominees
- ✅ Admin panel shows actual URLs (not placeholders)
- ✅ Loops contacts properly segmented by user groups
- ✅ Nominators receive nominee live URLs
- ✅ Orange-themed UI components working
- ✅ Real-time sync operational

The complete approval and Loops integration system is now fully operational with live URL support!