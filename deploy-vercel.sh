#!/bin/bash

echo "🚀 Preparing for Vercel deployment..."

# Clean up any build artifacts
echo "🧹 Cleaning up..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run build to check for errors
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for Vercel deployment."
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Deploy on Vercel: Connect your GitHub repo"
    echo "3. Set environment variables in Vercel dashboard"
    echo ""
    echo "Required environment variables:"
    echo "- NEXT_PUBLIC_APP_URL"
    echo "- SUPABASE_URL"
    echo "- SUPABASE_SERVICE_ROLE_KEY"
    echo "- HUBSPOT_ACCESS_TOKEN"
    echo "- LOOPS_API_KEY"
    echo "- CRON_SECRET"
else
    echo "❌ Build failed. Please fix the errors above."
    exit 1
fi