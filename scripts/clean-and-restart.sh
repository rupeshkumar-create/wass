#!/bin/bash

# Clean and Restart Development Server
# This script kills the dev server, clears caches, and starts fresh

echo "🧹 Cleaning Development Environment..."

# Kill any existing Next.js processes
echo "🔪 Killing existing development servers..."
pkill -f "next dev" || true
pkill -f "npm run dev" || true
pkill -f "yarn dev" || true

# Wait a moment for processes to terminate
sleep 2

# Clear Next.js cache
echo "🗑️ Clearing Next.js cache..."
rm -rf .next || true

# Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force || true

# Clear node_modules cache (optional - uncomment if needed)
# echo "🗑️ Clearing node_modules..."
# rm -rf node_modules
# npm install

# Clear browser cache instructions
echo "🌐 Please clear your browser cache manually:"
echo "   - Chrome: Ctrl+Shift+R or Cmd+Shift+R"
echo "   - Firefox: Ctrl+F5 or Cmd+Shift+R"
echo "   - Safari: Cmd+Option+R"

echo ""
echo "✅ Environment cleaned successfully!"
echo ""
echo "🚀 Starting fresh development server..."

# Start the development server
npm run dev