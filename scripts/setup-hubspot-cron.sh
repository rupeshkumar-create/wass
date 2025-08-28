#!/bin/bash

# Setup HubSpot Sync Cron Job for World Staffing Awards 2026
# This script sets up a cron job to process HubSpot sync every 5 minutes

echo "🚀 Setting up HubSpot Sync Cron Job"
echo "=================================="

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Project directory: $PROJECT_DIR"

# Create the cron script
CRON_SCRIPT="$PROJECT_DIR/scripts/hubspot-sync-cron.sh"

cat > "$CRON_SCRIPT" << 'EOF'
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
EOF

# Make the cron script executable
chmod +x "$CRON_SCRIPT"

echo "✅ Created cron script: $CRON_SCRIPT"

# Create a sample crontab entry
CRONTAB_ENTRY="*/5 * * * * $CRON_SCRIPT"

echo ""
echo "📋 To enable automatic HubSpot sync, add this to your crontab:"
echo ""
echo "$CRONTAB_ENTRY"
echo ""
echo "To edit your crontab, run:"
echo "crontab -e"
echo ""
echo "Or to add it automatically (be careful!):"
echo "(crontab -l 2>/dev/null; echo \"$CRONTAB_ENTRY\") | crontab -"
echo ""

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

echo "✅ Setup complete!"
echo ""
echo "The cron job will:"
echo "• Run every 5 minutes"
echo "• Process any pending HubSpot sync items"
echo "• Log results to logs/hubspot-sync-cron.log"
echo "• Ensure no nominations are missed"
echo ""
echo "For production deployment, make sure to:"
echo "1. Update NEXT_PUBLIC_APP_URL in .env.local"
echo "2. Set up the cron job on your server"
echo "3. Monitor the logs regularly"