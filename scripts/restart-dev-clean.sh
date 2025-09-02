#!/bin/bash

echo "🔄 Restarting development server for final testing..."

# Kill any existing Next.js processes
echo "🛑 Killing existing Next.js processes..."
pkill -f "next dev" || true
pkill -f "node.*next" || true
pkill -f "npm.*dev" || true
pkill -f "yarn.*dev" || true

# Wait a moment for processes to fully terminate
sleep 2

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next || true

# Clear npm cache if needed
echo "🧹 Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Start fresh development server
echo "🚀 Starting fresh development server..."
echo "   Server will be available at: http://localhost:3000"
echo "   Admin panel: http://localhost:3000/admin"
echo ""
echo "✅ All admin panel fixes have been applied:"
echo "   - Photos now display instead of icons"
echo "   - Top 3 nominees show actual names"
echo "   - URLs use localhost:3000 in development"
echo "   - Preview Auto-Gen button generates correct URLs"
echo ""
echo "Press Ctrl+C to stop the server when done testing"
echo ""

npm run dev