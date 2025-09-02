#!/bin/bash

# Restart and Test Script for World Staffing Awards
# This script kills the dev server, starts a new one, and runs comprehensive tests

echo "🔄 Restarting Development Server and Running Tests"
echo "=================================================="

# Kill existing dev server processes
echo "1. Killing existing dev server processes..."
pkill -f "next dev" || echo "No existing Next.js processes found"
pkill -f "npm run dev" || echo "No existing npm dev processes found"
pkill -f "yarn dev" || echo "No existing yarn dev processes found"

# Wait a moment for processes to fully terminate
sleep 2

# Start new dev server in background
echo "2. Starting new development server..."
cd "$(dirname "$0")/.."
npm run dev &
DEV_SERVER_PID=$!

echo "Dev server started with PID: $DEV_SERVER_PID"

# Wait for server to be ready
echo "3. Waiting for server to be ready..."
sleep 10

# Function to check if server is ready
check_server() {
    curl -s http://localhost:3000/api/test-env > /dev/null 2>&1
    return $?
}

# Wait up to 30 seconds for server to be ready
COUNTER=0
while [ $COUNTER -lt 30 ]; do
    if check_server; then
        echo "✅ Server is ready!"
        break
    fi
    echo "Waiting for server... ($COUNTER/30)"
    sleep 1
    COUNTER=$((COUNTER + 1))
done

if [ $COUNTER -eq 30 ]; then
    echo "❌ Server failed to start within 30 seconds"
    kill $DEV_SERVER_PID 2>/dev/null
    exit 1
fi

# Run comprehensive tests
echo "4. Running comprehensive tests..."
echo ""

echo "🧪 Test 1: Complete Approval Workflow with Loops Sync"
echo "----------------------------------------------------"
node scripts/test-complete-approval-loops-sync.js

echo ""
echo "🧪 Test 2: Live URL Functionality"
echo "--------------------------------"
node scripts/test-live-url-complete.js

echo ""
echo "🧪 Test 3: Admin Panel Functionality"
echo "-----------------------------------"
curl -s http://localhost:3000/api/admin/nominations | jq '.success' || echo "Admin API test failed"

echo ""
echo "🧪 Test 4: Environment Variables Check"
echo "-------------------------------------"
curl -s http://localhost:3000/api/test-env | jq '.' || echo "Environment test failed"

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📋 Manual Testing Checklist:"
echo "• Open http://localhost:3000/admin in browser"
echo "• Verify admin panel loads correctly"
echo "• Check that approved nominations show live URLs (not placeholders)"
echo "• Test approval workflow with ApprovalDialog"
echo "• Verify orange buttons are visible"
echo "• Check that live URLs are assigned and displayed"
echo ""
echo "🔄 Dev server is running with PID: $DEV_SERVER_PID"
echo "Use 'kill $DEV_SERVER_PID' to stop the server when done testing"