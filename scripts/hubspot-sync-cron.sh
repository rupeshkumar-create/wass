#!/bin/bash

# HubSpot Sync Cron Job
# Runs every 5 minutes to process pending sync items

# Change to project directory
cd "$(dirname "$0")/.."

# Load environment variables
source .env.local 2>/dev/null || true

# Get the site URL (default to localhost for development)
SITE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-wsa2026-secure-cron-key}"

# Log file
LOG_FILE="logs/hubspot-sync-cron.log"
mkdir -p logs

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Starting HubSpot sync cron job"

# Call the sync API
RESPONSE=$(curl -s -X POST "$SITE_URL/api/sync/hubspot/run" \
  -H "Content-Type: application/json" \
  -H "x-cron-key: $CRON_SECRET" \
  -d '{}' \
  -w "HTTP_STATUS:%{http_code}")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$HTTP_STATUS" = "200" ]; then
    # Parse the response to get sync stats
    PROCESSED=$(echo "$RESPONSE_BODY" | grep -o '"processed":[0-9]*' | cut -d: -f2)
    SUCCEEDED=$(echo "$RESPONSE_BODY" | grep -o '"succeeded":[0-9]*' | cut -d: -f2)
    FAILED=$(echo "$RESPONSE_BODY" | grep -o '"failed":[0-9]*' | cut -d: -f2)
    
    if [ "$PROCESSED" -gt 0 ]; then
        log "Sync completed: $PROCESSED processed, $SUCCEEDED succeeded, $FAILED failed"
    else
        log "No items to sync"
    fi
else
    log "Sync failed with HTTP status: $HTTP_STATUS"
    log "Response: $RESPONSE_BODY"
fi

log "HubSpot sync cron job completed"
