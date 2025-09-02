#!/bin/bash

# Complete Vercel Deployment Script
# This script helps deploy the World Staffing Awards app to Vercel

echo "🚀 World Staffing Awards - Vercel Deployment Helper"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if build passes
echo "🔍 Testing build..."
if npm run build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

# Check for required files
echo "🔍 Checking required files..."
required_files=("src/lib/supabase/server.ts" "next.config.ts" "package.json")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check git status
echo "🔍 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. Consider committing them first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "✅ Pre-deployment checks passed!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Set root directory to: world-staffing-awards"
echo "4. Add these environment variables:"
echo ""
echo "   REQUIRED:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY" 
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - ADMIN_EMAILS"
echo "   - ADMIN_PASSWORD_HASHES"
echo "   - SERVER_SESSION_SECRET"
echo ""
echo "   OPTIONAL:"
echo "   - HUBSPOT_ACCESS_TOKEN"
echo "   - LOOPS_API_KEY"
echo "   - CRON_SECRET"
echo "   - SYNC_SECRET"
echo ""
echo "5. Click Deploy!"
echo ""
echo "📖 For detailed instructions, see: VERCEL_DEPLOYMENT_COMPLETE_GUIDE.md"
echo ""
echo "🎉 Your app is ready for deployment!"