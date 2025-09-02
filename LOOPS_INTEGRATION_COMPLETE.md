# Loops Integration - Complete Implementation

## Overview

The Loops integration for World Staffing Awards 2026 provides real-time contact syncing with proper tagging based on user actions. This implementation follows the exact workflow you specified.

## Workflow

### 1. Form Submission → Nominator Sync
- **Trigger**: When nomination form is submitted
- **Action**: Sync nominator to Loops
- **User Group**: `"Nominator"`
- **Data**: Full nominator profile (name, email, LinkedIn, company, etc.)

### 2. Admin Approval → Nominee Sync + Nominator Update
- **Trigger**: When admin approves a nomination
- **Actions**: 
  - Sync nominee to Loops with `"Nominess"` user group
  - Update nominator user group to `"Nominator Live"`
  - Add nominee live URL to nominator profile
- **Data**: Full nominee profile + live URL

### 3. Vote Casting → Voter Sync
- **Trigger**: When user casts a vote
- **Action**: Sync voter to Loops
- **User Group**: `"Voters"`
- **Data**: Voter profile + voting information

## Configuration

### Environment Variables
```bash
# Required
LOOPS_API_KEY=c20e5d6351d352a3b2201509fde7d3e3
LOOPS_SYNC_ENABLED=true

# Optional (for manual sync endpoint security)
CRON_SECRET=your-cron-secret-key
```

### API Key Setup
Your Loops API key is already configured: `c20e5d6351d352a3b2201509fde7d3e3`

## Implementation Details

### Real-time Sync
- **Nomination Submit**: `/api/nomination/submit` → Syncs nominator immediately
- **Nomination Approve**: `/api/nomination/approve` → Syncs nominee + updates nominator
- **Vote Cast**: `/api/vote` → Syncs voter immediately

### Backup Sync
- All events are logged to `loops_outbox` table for backup processing
- Manual sync endpoint: `/api/sync/loops/run`
- Automatic retry logic with exponential backoff

### Database Schema
```sql
-- Loops outbox table for backup sync
CREATE TABLE loops_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'nomination_submitted',
    'nomination_approved', 
    'vote_cast',
    'nominator_live_update'
  )),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','dead')),
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Contact User Groups in Loops

### Nominator Journey
1. **Initial**: `"Nominator"` (when form submitted)
2. **After Approval**: `"Nominator Live"` (when their nominee is approved)
   - Includes nominee name and live URL

### Nominee User Groups
- **User Group**: `"Nominess"` (when nomination approved)
- **Data**: Full profile + live URL

### Voter User Groups
- **User Group**: `"Voters"` (when vote cast)
- **Data**: Voting preferences and profile

## API Endpoints

### Manual Sync
```bash
POST /api/sync/loops/run
Authorization: Bearer {CRON_SECRET}
```

### Sync Status
```bash
GET /api/sync/loops/run
```

## Testing

### Run Complete Integration Test
```bash
cd world-staffing-awards
node scripts/test-loops-integration-complete.js
```

This test will:
1. Submit a test nomination (syncs nominator)
2. Approve the nomination (syncs nominee + updates nominator)
3. Cast a vote (syncs voter)
4. Verify all outbox entries
5. Run manual sync
6. Check final status

### Manual Verification
After running tests, check your Loops dashboard for:

1. **Nominator Contact**: `john.doe.loops.test@example.com`
   - Should have `"Nominator"` → `"Nominator Live"` user groups
   - Should include nominee live URL after approval

2. **Nominee Contact**: `jane.smith.loops.test@example.com`
   - Should have `"Nominess"` user group
   - Should include live URL

3. **Voter Contact**: `bob.wilson.loops.test@example.com`
   - Should have `"Voters"` user group
   - Should include voting information

## Error Handling

### Retry Logic
- Failed syncs are retried up to 3 times
- Exponential backoff with jitter
- Items marked as 'dead' after 3 failed attempts

### Rate Limiting
- Automatic rate limit detection and backoff
- Batch processing to avoid overwhelming API
- Graceful degradation (sync failures don't break app)

### Monitoring
- All sync attempts logged to console
- Outbox table tracks success/failure status
- Manual sync endpoint provides status overview

## GitHub Integration

The API key is already configured in your environment files:
- `.env.local` (for local development)
- Should be added to your deployment environment variables

For GitHub Actions/deployment, ensure `LOOPS_API_KEY` is set in your deployment environment.

## Supabase Schema Update

The Loops outbox table has been added to your schema. If you need to apply it manually:

```sql
-- Run this in your Supabase SQL Editor if the table doesn't exist
-- (The script should have already applied this)

CREATE TABLE IF NOT EXISTS public.loops_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('nomination_submitted','nomination_approved','vote_cast','nominator_live_update')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','dead')),
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loops_outbox_status_created ON public.loops_outbox(status, created_at);

DROP TRIGGER IF EXISTS trigger_loops_outbox_updated_at ON public.loops_outbox;
CREATE TRIGGER trigger_loops_outbox_updated_at
  BEFORE UPDATE ON public.loops_outbox
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

GRANT ALL ON public.loops_outbox TO service_role;
```

## Next Steps

1. **Test the Integration**:
   ```bash
   node scripts/test-loops-integration-complete.js
   ```

2. **Verify in Loops Dashboard**:
   - Check that test contacts are created
   - Verify tags are applied correctly
   - Confirm data is syncing properly

3. **Monitor in Production**:
   - Check `/api/sync/loops/run` status endpoint
   - Monitor outbox table for failed syncs
   - Set up periodic manual sync if needed

## Support

The integration is designed to be:
- **Non-blocking**: Sync failures won't break your app
- **Resilient**: Automatic retries and backup sync
- **Monitorable**: Full logging and status endpoints
- **Testable**: Comprehensive test suite

All sync operations happen in the background and won't affect user experience if Loops is temporarily unavailable.

## Summary

✅ **Complete Loops Integration Implemented**:
- Real-time sync on all user actions
- Proper tag management based on user journey
- Backup sync system with retry logic
- Comprehensive testing and monitoring
- GitHub-ready configuration
- Non-breaking error handling

The system is ready for production use and will automatically sync all user interactions to Loops with the correct tags and data as specified in your requirements.