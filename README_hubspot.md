# HubSpot Integration for World Staffing Awards 2026

This document explains how to set up and configure the HubSpot integration for the World Staffing Awards 2026 application.

## Overview

The HubSpot integration automatically syncs:
- **Approved Nominees** → HubSpot Contacts (person) or Companies (company)
- **Voters** → HubSpot Contacts with voting history
- **Associations** → Links between nominee contacts and their companies

## Prerequisites

1. **HubSpot Account**: You need a HubSpot account with CRM access
2. **Super Admin Access**: Required to create Private Apps and manage properties
3. **Node.js Environment**: For running the bootstrap script

## Setup Instructions

### Step 1: Create HubSpot Private App

1. Log into your HubSpot account
2. Go to **Settings** → **Integrations** → **Private Apps**
3. Click **Create a private app**
4. Fill in the app details:
   - **App name**: `World Staffing Awards 2026`
   - **Description**: `Integration for WSA 2026 nominee and voter sync`
5. Configure **Scopes** (toggle these on):
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.companies.read`
   - `crm.objects.companies.write`
   - `crm.schemas.contacts.read` (optional, for debugging)
   - `crm.schemas.companies.read` (optional, for debugging)
6. Click **Create app**
7. **Copy the access token** (you'll need this for the next step)

### Step 2: Configure Environment Variables

Add these variables to your `.env` file:

```bash
# HubSpot Integration
HUBSPOT_PRIVATE_APP_TOKEN=pat-na2-your-token-here
HUBSPOT_BASE_URL=https://api.hubapi.com
WSA_YEAR=2026

# This will be set by the bootstrap script
HUBSPOT_ASSOCIATION_TYPE_ID=1
```

### Step 3: Run Bootstrap Script

The bootstrap script will create all necessary properties, lists, and test data:

```bash
# Install dependencies if not already done
npm install

# Run the bootstrap script
npx tsx scripts/hubspot/bootstrap.ts
```

The script will:
- ✅ Create contact properties (wsa_year, wsa_segments, etc.)
- ✅ Create company properties
- ✅ Create active lists ("Nominees 2026", "Voters 2026")
- ✅ Find the contact↔company association type ID
- ✅ Create test contacts for verification

### Step 4: Update Environment with Association ID

After running the bootstrap script, add the association type ID to your `.env`:

```bash
HUBSPOT_ASSOCIATION_TYPE_ID=1  # Use the ID from bootstrap output
```

### Step 5: Verify Setup

1. **Check HubSpot Lists**:
   - Go to **Marketing** → **Lists**
   - Verify "Nominees 2026" and "Voters 2026" lists exist

2. **Check Test Contacts**:
   - Go to **Contacts** → **Contacts**
   - Search for "Test Nominee" and "Test Voter"
   - Verify they have WSA properties populated

3. **Check Properties**:
   - Go to **Settings** → **Properties** → **Contact Properties**
   - Verify WSA properties exist (wsa_year, wsa_segments, etc.)

## Property Reference

### Contact Properties

| Property Name | Type | Description |
|---------------|------|-------------|
| `wsa_year` | Number | Award year (2026) |
| `wsa_segments` | Multi-select | Nominees 2026, Voters 2026 |
| `wsa_category` | Text | Nomination/vote category |
| `wsa_linkedin_url` | Text | Normalized LinkedIn URL |
| `wsa_live_slug` | Text | Profile slug (e.g., "john-doe") |
| `wsa_nomination_id` | Text | App UUID for cross-reference |
| `wsa_vote_count` | Number | Total votes cast (voters only) |
| `wsa_last_voted_nominee` | Text | Last nominee voted for |
| `wsa_last_voted_category` | Text | Last category voted in |

### Company Properties

| Property Name | Type | Description |
|---------------|------|-------------|
| `wsa_year` | Number | Award year (2026) |
| `wsa_segments` | Multi-select | Nominees 2026 |
| `wsa_category` | Text | Nomination category |
| `wsa_linkedin_url` | Text | Company LinkedIn URL |
| `wsa_nomination_id` | Text | App UUID for cross-reference |

## Usage

### Automatic Sync

Once configured, the integration automatically syncs:

1. **When a nomination is approved**:
   - Creates/updates HubSpot contact or company
   - Adds "Nominees 2026" segment
   - Associates person nominees with companies (if applicable)

2. **When a vote is cast**:
   - Creates/updates voter contact
   - Adds "Voters 2026" segment
   - Increments vote count
   - Updates last voted nominee/category

### Manual Sync

Use the admin panel to manually sync data:

1. Go to **Admin Dashboard** → **HubSpot** tab
2. Check connection status
3. Click **Re-sync Everything** to backfill all data

### API Endpoints

- `GET /api/integrations/hubspot/stats` - Get sync statistics
- `GET /api/integrations/hubspot/events` - Get recent sync events
- `POST /api/integrations/hubspot/resync` - Trigger full resync

## Troubleshooting

### Common Issues

1. **"HubSpot integration not configured"**
   - Check that `HUBSPOT_PRIVATE_APP_TOKEN` is set in `.env`
   - Verify the token is valid and has correct scopes

2. **Rate limiting errors**
   - The integration includes automatic retry with exponential backoff
   - Large syncs are processed in batches to respect limits

3. **Properties not found**
   - Re-run the bootstrap script: `npx tsx scripts/hubspot/bootstrap.ts`
   - Check that your HubSpot account has the necessary permissions

4. **Association errors**
   - Verify `HUBSPOT_ASSOCIATION_TYPE_ID` is set correctly
   - Check that both contact and company exist before associating

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=hubspot:*
```

### Testing

Run the integration tests:

```bash
# Test HubSpot connection
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.hubapi.com/crm/v3/objects/contacts?limit=1"

# Test app integration
npm run test:hubspot
```

## Data Flow

```mermaid
graph TD
    A[Nomination Approved] --> B[Create HubSpot Contact/Company]
    B --> C[Add to "Nominees 2026" List]
    C --> D[Associate with Company if applicable]
    
    E[Vote Cast] --> F[Create/Update Voter Contact]
    F --> G[Add to "Voters 2026" List]
    G --> H[Increment Vote Count]
    H --> I[Update Last Voted Info]
```

## Security

- ✅ Private App token stored securely in environment variables
- ✅ Rate limiting and retry logic to prevent API abuse
- ✅ Error handling to prevent data loss
- ✅ Fire-and-forget sync to avoid blocking user actions

## File Structure

```
src/integrations/hubspot/
├── client.ts          # HubSpot API client with retry logic
├── mappers.ts         # Data transformation functions
├── sync.ts            # Sync orchestration and batch processing
└── hooks.ts           # Integration hooks for app events

src/app/api/integrations/hubspot/
├── stats/route.ts     # Get sync statistics
├── events/route.ts    # Get recent sync events
└── resync/route.ts    # Trigger full resync

src/components/dashboard/
└── HubSpotPanel.tsx   # Admin UI for managing integration

scripts/hubspot/
└── bootstrap.ts       # Setup script for properties and lists
```

## Support

For issues with the HubSpot integration:

1. Check the admin panel for connection status
2. Review the sync events for error details
3. Verify environment variables are set correctly
4. Re-run the bootstrap script if properties are missing
5. Check HubSpot API limits and quotas

## Next Steps

After setup, you can:

1. **Create Workflows**: Use HubSpot's workflow builder to automate follow-ups
2. **Build Reports**: Create custom reports on nominee and voter data
3. **Email Campaigns**: Target nominees and voters with personalized campaigns
4. **Lead Scoring**: Score contacts based on voting behavior and engagement