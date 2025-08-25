# Manual Testing Guide - Complete Integration Testing

## Overview
This guide provides step-by-step instructions for manually testing all integrations including HubSpot, Loops, and the complete nomination/voting flow.

## Prerequisites

### Environment Variables Required
```bash
# HubSpot Integration
HUBSPOT_PRIVATE_APP_TOKEN=[HUBSPOT_ACCESS_TOKEN]
HUBSPOT_CLIENT_SECRET=[HUBSPOT_CLIENT_SECRET]
HUBSPOT_BASE_URL=https://api.hubapi.com
WSA_YEAR=2026
HUBSPOT_ASSOCIATION_TYPE_ID=1

# Loops Integration
LOOPS_API_KEY=your_loops_api_key
LOOPS_SYNC_ENABLED=true

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Test Accounts Needed
- **HubSpot Account**: Access to view contacts/companies
- **Loops Account**: Access to view lists and contacts
- **Test Email Addresses**: For nomination and voting testing

## Testing Sequence

### Phase 1: Integration Health Checks

#### 1.1 HubSpot Connection Test
```bash
# Run HubSpot credentials test
node scripts/test-hubspot-new-credentials.js
```

**Expected Results:**
- ✅ All 6 tests should pass
- ✅ Contact and company creation successful
- ✅ API connection verified

#### 1.2 Loops Connection Test
```bash
# Test Loops integration
node scripts/test-loops-integration.js
```

**Expected Results:**
- ✅ All integration tests pass
- ✅ List IDs properly configured
- ✅ User groups and lists verified

#### 1.3 Development API Tests
```bash
# Start the development server
npm run dev

# Test HubSpot API (in another terminal)
curl -X GET http://localhost:3000/api/dev/loops-test

# Test Loops API
curl -X POST http://localhost:3000/api/dev/loops-test \
  -H "Content-Type: application/json" \
  -d '{"action": "test-all-lists", "email": "test@example.com"}'
```

### Phase 2: Nomination Flow Testing

#### 2.1 Submit Test Nomination (Person)
1. **Navigate to**: `http://localhost:3000/nominate`
2. **Fill out form with test data**:
   ```
   Nominator Details:
   - Name: John Nominator
   - Email: john.nominator@test.com
   - LinkedIn: https://linkedin.com/in/john-nominator
   
   Nominee Details:
   - Name: Jane Nominee
   - Email: jane.nominee@test.com
   - Category: Top Recruiter
   - LinkedIn: https://linkedin.com/in/jane-nominee
   - Why Vote: Test nomination for integration testing
   ```
3. **Submit nomination**
4. **Check logs** for sync messages:
   ```
   ✅ HubSpot: Nominator synced john.nominator@test.com
   ✅ Successfully synced nominator to Loops and added to Nominators list
   ✅ Successfully sent nomination event to Loops
   ```

#### 2.2 Verify Nominator Sync
**HubSpot Check:**
1. Go to HubSpot → Contacts
2. Search for "john.nominator@test.com"
3. Verify contact exists with:
   - ✅ WSA Year: 2026
   - ✅ WSA Segments: nominators_2026
   - ✅ LinkedIn URL populated

**Loops Check:**
1. Go to Loops → Contacts
2. Search for "john.nominator@test.com"
3. Verify contact exists with:
   - ✅ User Group: Nominator 2026
   - ✅ Added to Nominators list (cmegxuqag0jth0h334yy17csd)

#### 2.3 Approve Test Nomination
1. **Navigate to**: `http://localhost:3000/admin`
2. **Find the test nomination**
3. **Click "Approve"**
4. **Check logs** for nominee sync:
   ```
   ✅ HubSpot: Person nomination synced (Jane Nominee)
   ✅ Successfully synced nominee to Loops and added to Nominees list
   ✅ Successfully sent nomination approved event to Loops
   ```

#### 2.4 Verify Nominee Sync
**HubSpot Check:**
1. Search for "jane.nominee@test.com"
2. Verify contact exists with:
   - ✅ WSA Year: 2026
   - ✅ WSA Segments: Nominess 2026
   - ✅ WSA Category: Top Recruiter
   - ✅ WSA Live Slug: jane-nominee

**Loops Check:**
1. Search for "jane.nominee@test.com"
2. Verify contact exists with:
   - ✅ User Group: Nominees 2026
   - ✅ Added to Nominees list (cmegxubbj0jr60h33ahctgicr)

### Phase 3: Voting Flow Testing

#### 3.1 Cast Test Vote
1. **Navigate to**: `http://localhost:3000/directory`
2. **Find the approved nominee**
3. **Click "Vote"**
4. **Fill voter details**:
   ```
   - Name: Bob Voter
   - Email: bob.voter@test.com
   - LinkedIn: https://linkedin.com/in/bob-voter
   ```
5. **Submit vote**
6. **Check logs**:
   ```
   ✅ Successfully synced voter to Loops and added to Voters list
   ✅ Successfully sent vote event to Loops
   ✅ HubSpot: Voter synced bob.voter@test.com
   ```

#### 3.2 Verify Voter Sync
**HubSpot Check:**
1. Search for "bob.voter@test.com"
2. Verify contact exists with:
   - ✅ WSA Year: 2026
   - ✅ WSA Segments: Voter 2026
   - ✅ WSA Last Voted Nominee: jane-nominee
   - ✅ WSA Last Voted Category: Top Recruiter

**Loops Check:**
1. Search for "bob.voter@test.com"
2. Verify contact exists with:
   - ✅ User Group: Voter 2026
   - ✅ Added to Voters list (cmegxu1fc0gw70i1d7g35gqb0)

### Phase 4: Company Nomination Testing

#### 4.1 Submit Company Nomination
1. **Navigate to**: `http://localhost:3000/nominate`
2. **Select company category**: "Top Staffing Company"
3. **Fill details**:
   ```
   Nominator: Same as before (john.nominator@test.com)
   Company Name: Test Staffing Corp
   Website: https://teststaffing.com
   LinkedIn: https://linkedin.com/company/test-staffing
   ```
4. **Submit and approve**

#### 4.2 Verify Company Sync
**HubSpot Check:**
1. Go to Companies
2. Search for "Test Staffing Corp"
3. Verify company exists with:
   - ✅ WSA Year: 2026
   - ✅ WSA Segments: Nominess 2026
   - ✅ Domain: teststaffing.com

### Phase 5: Error Handling Testing

#### 5.1 Test Duplicate Voting
1. **Try to vote again** with same email for same category
2. **Expected**: Blocked with "ALREADY_VOTED_IN_CATEGORY" message
3. **Verify**: No duplicate sync calls made

#### 5.2 Test Invalid Data
1. **Submit nomination** with invalid LinkedIn URL
2. **Expected**: Validation error returned
3. **Verify**: No sync calls made for invalid data

#### 5.3 Test Integration Failures
1. **Temporarily disable** HubSpot (set token to empty)
2. **Submit nomination**
3. **Expected**: Nomination succeeds, HubSpot sync fails gracefully
4. **Verify**: Loops sync still works

### Phase 6: List Verification

#### 6.1 Loops Lists Check
1. **Go to Loops Dashboard**
2. **Check each list**:
   - **Voters List** (cmegxu1fc0gw70i1d7g35gqb0): Should contain bob.voter@test.com
   - **Nominees List** (cmegxubbj0jr60h33ahctgicr): Should contain jane.nominee@test.com
   - **Nominators List** (cmegxuqag0jth0h334yy17csd): Should contain john.nominator@test.com

#### 6.2 HubSpot Segments Check
1. **Go to HubSpot → Lists**
2. **Check active lists** (if created):
   - Nominees 2026
   - Voters 2026
   - Nominators 2026

### Phase 7: Event Tracking Verification

#### 7.1 Loops Events Check
1. **Go to Loops → Events**
2. **Verify events were sent**:
   - ✅ nomination_submitted (for nominator)
   - ✅ nomination_approved (for nominee)
   - ✅ vote_cast (for voter)

#### 7.2 Admin Dashboard Check
1. **Navigate to**: `http://localhost:3000/admin`
2. **Check integration status**:
   - ✅ HubSpot connection: Connected
   - ✅ Recent sync events visible
   - ✅ No error messages

## Troubleshooting

### Common Issues

#### HubSpot Sync Failures
```bash
# Check HubSpot connection
node scripts/test-hubspot-new-credentials.js

# Verify environment variables
echo $HUBSPOT_PRIVATE_APP_TOKEN
```

#### Loops Sync Failures
```bash
# Test Loops connection
curl -X GET http://localhost:3000/api/dev/loops-test

# Check API key
echo $LOOPS_API_KEY
```

#### Database Issues
```bash
# Check Supabase connection
npm run test:db
```

### Log Monitoring
**Watch logs during testing**:
```bash
# In development
npm run dev

# Look for these success messages:
✅ HubSpot: [Type] synced [email]
✅ Successfully synced [type] to Loops and added to [list] list
✅ Successfully sent [event] event to Loops
```

### Cleanup After Testing
```bash
# Remove test data from HubSpot (optional)
# Go to HubSpot and delete test contacts/companies

# Remove test data from Loops (optional)
# Go to Loops and remove test contacts from lists

# Clear test nominations from database
# Use admin panel to delete test nominations
```

## Success Criteria

### All Tests Pass When:
- ✅ **Nominations**: Successfully submitted and synced to both HubSpot and Loops
- ✅ **Approvals**: Nominees synced to both platforms with correct segments/lists
- ✅ **Voting**: Voters synced to both platforms with voting history
- ✅ **Events**: All events tracked in Loops
- ✅ **Error Handling**: Graceful failures don't break main functionality
- ✅ **Lists**: Contacts appear in correct Loops lists
- ✅ **Segments**: Contacts have correct HubSpot segments

### Performance Checks:
- ✅ **Response Times**: API calls complete within 5 seconds
- ✅ **Non-blocking**: Sync failures don't delay user responses
- ✅ **Retry Logic**: Failed syncs are retried appropriately

## Final Verification

After completing all tests:

1. **Check HubSpot**: 3 test contacts with proper WSA properties
2. **Check Loops**: 3 test contacts in appropriate lists
3. **Check Events**: All events logged in Loops
4. **Check Logs**: No error messages in application logs
5. **Check Admin**: Integration status shows "Connected"

## Status: Ready for Production

When all manual tests pass, the integrations are ready for production deployment with confidence in:
- Complete HubSpot sync functionality
- Full Loops integration with list management
- Robust error handling and retry logic
- Comprehensive event tracking
- Proper data validation and security