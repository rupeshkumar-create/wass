# HubSpot Integration Guide

This document explains the HubSpot integration for the World Staffing Awards 2026 application.

## Overview

The WSA 2026 app integrates with HubSpot to automatically sync:
- **Voters** → HubSpot Contacts
- **Nominators** → HubSpot Contacts  
- **Nominees** → HubSpot Contacts (persons) or Companies
- **Nominations** → HubSpot Tickets for review workflow

## Architecture

### Data Flow
1. **Local First**: All data is stored locally in IndexedDB/localStorage
2. **Background Sync**: HubSpot sync happens immediately after local operations
3. **Non-Blocking**: Sync failures don't break the user experience
4. **Idempotent**: All operations can be safely retried

### Security
- ✅ HubSpot token never exposed to browser
- ✅ All sensitive operations happen server-side
- ✅ PII is redacted from logs
- ✅ Environment variables properly secured

## Setup

### 1. HubSpot Configuration

#### Create Private App
1. Go to HubSpot Settings → Integrations → Private Apps
2. Create new private app with these scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.companies.read`
   - `crm.objects.companies.write`
   - `crm.objects.tickets.read`
   - `crm.objects.tickets.write`
   - `crm.schemas.contacts.read`
   - `crm.schemas.companies.read`
   - `crm.schemas.tickets.read`

#### Create Custom Properties

**Contact Properties:**
```
wsa_year (Number) - 2026
wsa_role (Single-select) - Nominator, Voter, Nominee_Person
wsa_nominated_display_name (Text)
wsa_nominator_status (Single-select) - submitted, approved, rejected
wsa_voted_for_display_name (Text)
wsa_voted_subcategory_id (Text)
wsa_vote_timestamp (DateTime)
wsa_live_url (URL)
```

**Company Properties:**
```
wsa_year (Number) - 2026
wsa_role (Single-select) - Nominee_Company
wsa_live_url (URL)
```

**Ticket Properties:**
```
wsa_year (Number) - 2026
wsa_type (Single-select) - person, company
wsa_category_group (Text)
wsa_subcategory_id (Text)
wsa_nominee_display_name (Text)
wsa_nominee_linkedin_url (URL)
wsa_image_url (URL)
wsa_nominator_email (Text)
wsa_live_url (URL)
wsa_approval_timestamp (DateTime)
```

#### Create Pipeline
1. Go to Settings → Objects → Tickets
2. Create pipeline "WSA 2026 Nominations"
3. Create stages:
   - Submitted
   - Under Review
   - Approved
   - Rejected

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# HubSpot Private App Token
HUBSPOT_TOKEN=pat-na1-your-token-here

# Property Keys (use your existing LinkedIn properties)
HUBSPOT_CONTACT_LINKEDIN_KEY=linkedin
HUBSPOT_COMPANY_LINKEDIN_KEY=linkedin_company_page

# Pipeline Configuration
HUBSPOT_PIPELINE_ID=your-pipeline-id
HUBSPOT_STAGE_SUBMITTED=stage-id-1
HUBSPOT_STAGE_APPROVED=stage-id-2
HUBSPOT_STAGE_REJECTED=stage-id-3

# Enable sync
HUBSPOT_SYNC_ENABLED=true
```

### 3. GitHub Secrets

For CI/CD, add these secrets to your GitHub repository:

**Staging:**
- `HUBSPOT_TOKEN_STAGING`
- `HUBSPOT_PIPELINE_ID_STAGING`

**Production:**
- `HUBSPOT_TOKEN_PRODUCTION`
- `HUBSPOT_PIPELINE_ID_PRODUCTION`

**Common:**
- `HUBSPOT_CONTACT_LINKEDIN_KEY`
- `HUBSPOT_COMPANY_LINKEDIN_KEY`
- `HUBSPOT_STAGE_SUBMITTED`
- `HUBSPOT_STAGE_APPROVED`
- `HUBSPOT_STAGE_REJECTED`

## Sync Operations

### Vote Sync
**Trigger:** Immediately after vote is cast locally
**Creates/Updates:**
- Contact with voter information
- Associates voter with nominee

### Nomination Submit Sync
**Trigger:** Immediately after nomination is submitted locally
**Creates/Updates:**
- Nominator contact
- Nominee contact/company
- Nomination ticket
- Associations between all objects

### Nomination Approval Sync
**Trigger:** When admin approves nomination
**Updates:**
- Ticket stage to "Approved"
- Nominee record with live URL
- Nominator status to "approved"

## API Endpoints

### POST /api/sync/hubspot/vote
Sync voter information to HubSpot.

**Request:**
```json
{
  "voter": {
    "email": "voter@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Example Corp",
    "linkedin": "https://linkedin.com/in/johndoe"
  },
  "nominee": {
    "id": "nominee-123",
    "name": "Jane Smith",
    "type": "person",
    "linkedin": "https://linkedin.com/in/janesmith",
    "email": "jane@example.com"
  },
  "category": "top-recruiter",
  "subcategoryId": "top-recruiter"
}
```

### POST /api/sync/hubspot/nomination-submit
Sync nomination submission to HubSpot.

### POST /api/sync/hubspot/nomination-approve
Sync nomination approval to HubSpot.

### GET /api/sync/hubspot/test
Test HubSpot connection and authentication.

## Usage in Code

### Basic Usage
```typescript
import { useNominationsWithSync, useVotesWithSync } from '@/lib/hooks/use-data-with-sync';

// Nominations with automatic HubSpot sync
const { createNomination, updateNomination } = useNominationsWithSync();

// Votes with automatic HubSpot sync
const { createVote } = useVotesWithSync();

// Create nomination (syncs to HubSpot automatically)
const nomination = await createNomination(nominationData);

// Approve nomination (syncs to HubSpot automatically)
const approved = await updateNomination(id, { status: 'approved' });
```

### Manual Sync
```typescript
import { useHubSpotSync } from '@/lib/hooks/use-data-with-sync';

const { testConnection, syncVote, syncNominationSubmit } = useHubSpotSync();

// Test connection
const result = await testConnection();

// Manual sync operations
await syncVote(vote, nomination);
await syncNominationSubmit(nomination);
```

## Admin Panel

Access the HubSpot sync panel at `/admin` → HubSpot tab:

- **Connection Status**: Test HubSpot API connection
- **Sync Statistics**: View synced data counts
- **Testing Panel**: Run sync tests with sample data
- **Configuration**: View current settings

## Error Handling

### Retry Logic
- **Rate Limits (429)**: Exponential backoff with jitter
- **Server Errors (5xx)**: Automatic retry up to 6 attempts
- **Client Errors (4xx)**: No retry, logged for investigation

### Logging
- All operations logged with request IDs
- PII automatically redacted from logs
- Error details captured without exposing sensitive data

### Graceful Degradation
- Sync failures don't block user operations
- Local data remains authoritative
- Background sync can be retried later

## Monitoring

### Health Checks
```bash
# Test HubSpot connection
curl https://your-app.com/api/sync/hubspot/test

# Expected response
{
  "success": true,
  "accountId": "12345678"
}
```

### Logs to Monitor
- `HubSpot connection test successful`
- `Vote synced to HubSpot successfully`
- `Nomination submit synced to HubSpot successfully`
- `Failed to sync [operation] to HubSpot: [error]`

## Troubleshooting

### Common Issues

**"HUBSPOT_TOKEN environment variable is required"**
- Ensure `.env.local` has `HUBSPOT_TOKEN` set
- Verify token is valid in HubSpot

**"Invalid status: 401"**
- Check HubSpot token permissions
- Verify token hasn't expired

**"Property [property_name] does not exist"**
- Create missing custom properties in HubSpot
- Check property names match environment variables

**"Pipeline stage not found"**
- Verify pipeline and stage IDs in HubSpot
- Update environment variables with correct IDs

### Debug Mode
Set `NODE_ENV=development` for detailed logging:
```bash
NODE_ENV=development npm run dev
```

## Data Mapping

### Contact Fields
| Local Field | HubSpot Property | Notes |
|-------------|------------------|-------|
| email | email | Primary key |
| firstName | firstname | |
| lastName | lastname | |
| company | company | |
| linkedin | [HUBSPOT_CONTACT_LINKEDIN_KEY] | Configurable |

### Company Fields
| Local Field | HubSpot Property | Notes |
|-------------|------------------|-------|
| name | name | Primary key |
| website | website | |
| domain | domain | Auto-extracted |
| linkedin | [HUBSPOT_COMPANY_LINKEDIN_KEY] | Configurable |

### Ticket Fields
| Local Field | HubSpot Property | Notes |
|-------------|------------------|-------|
| nominee.name | wsa_nominee_display_name | |
| category | wsa_subcategory_id | |
| nominator.email | wsa_nominator_email | |
| liveUrl | wsa_live_url | Set on approval |

## Performance

### Optimization
- Batch operations where possible
- Idempotency keys prevent duplicates
- Background processing doesn't block UI
- Connection pooling and retries

### Rate Limits
- HubSpot: 100 requests/10 seconds
- Built-in backoff and retry logic
- Request queuing for high-volume operations

## Security Checklist

- ✅ HubSpot token stored server-side only
- ✅ No credentials in client-side code
- ✅ PII redacted from logs
- ✅ HTTPS for all API calls
- ✅ Input validation on all endpoints
- ✅ Idempotency keys for safety
- ✅ Environment variables properly secured
- ✅ GitHub secrets for CI/CD

## Support

For issues with the HubSpot integration:

1. Check the admin panel connection status
2. Review application logs for errors
3. Verify HubSpot configuration
4. Test with sample data using admin panel
5. Check GitHub Actions for deployment issues