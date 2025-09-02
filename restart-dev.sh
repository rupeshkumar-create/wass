#!/bin/bash

# Simple script to restart the development server
echo "🔄 Restarting development server..."

# Kill existing Next.js processes
echo "Stopping existing processes..."
pkill -f "next dev" 2>/dev/null || echo "No existing processes found"

# Wait a moment
sleep 2

# Start fresh server
echo "Starting fresh development server..."
echo "🌐 Server will be available at: http://localhost:3000"
echo "🔧 Admin panel: http://localhost:3000/admin"
echo ""
echo "📝 Recent fixes applied:"
echo "   • Fixed URL generation to use localhost"
echo "   • Added nominee photos to admin panel" 
echo "   • Fixed Top 3 nominees display"
echo "   • Improved vote count consistency"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev