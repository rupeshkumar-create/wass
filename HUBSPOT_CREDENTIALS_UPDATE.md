# HubSpot Credentials Update - Instructions

## New HubSpot Credentials

**Access Token**: `[HUBSPOT_ACCESS_TOKEN]`
**Client Secret**: `[HUBSPOT_CLIENT_SECRET]`

## Environment Variable Updates

Update your `.env` file with the new credentials:

```bash
# HubSpot Integration - Updated Credentials
HUBSPOT_PRIVATE_APP_TOKEN=[HUBSPOT_ACCESS_TOKEN]
HUBSPOT_CLIENT_SECRET=[HUBSPOT_CLIENT_SECRET]
HUBSPOT_BASE_URL=https://api.hubapi.com
WSA_YEAR=2026
```

## Production Environment Variables

For production deployment (Netlify/Vercel), set these environment variables:

```bash
HUBSPOT_PRIVATE_APP_TOKEN=[HUBSPOT_ACCESS_TOKEN]
HUBSPOT_CLIENT_SECRET=[HUBSPOT_CLIENT_SECRET]
HUBSPOT_BASE_URL=https://api.hubapi.com
WSA_YEAR=2026
```

## Testing the New Credentials

Run the test script to verify the new credentials work:

```bash
node scripts/test-hubspot-new-credentials.js
```

## What Changed

1. **Access Token**: Updated from old token to `[HUBSPOT_ACCESS_TOKEN]`
2. **Client Secret**: Added new client secret `[HUBSPOT_CLIENT_SECRET]`
3. **Region**: Token indicates NA1 region (North America)

## Verification Steps

1. Update environment variables
2. Run the test script
3. Check HubSpot connection in admin panel
4. Test a nomination submission to verify sync
5. Test a vote to verify voter sync

## Rollback Plan

If issues occur, you can temporarily disable HubSpot sync by setting:

```bash
HUBSPOT_PRIVATE_APP_TOKEN=""
```

The application will continue to work without HubSpot integration.