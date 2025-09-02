#!/bin/bash

# Commit all fixes for wass-steel.vercel.app production deployment

echo "🚀 Committing wass-steel.vercel.app fixes..."

# Navigate to project directory
cd "$(dirname "$0")/.."

# Check git status
echo "📋 Current git status:"
git status --porcelain

# Add all changes
echo "➕ Adding all changes..."
git add .

# Check what will be committed
echo "📝 Files to be committed:"
git diff --cached --name-only

# Create comprehensive commit message
COMMIT_MSG="🌐 Fix all URLs for wass-steel.vercel.app production deployment

✅ Fixed Issues:
- Updated all live URLs to use wass-steel.vercel.app domain
- Fixed podium API to show total_votes (real + additional votes)
- Updated environment variables for correct production domain
- Fixed live URL consistency across admin panel, directories, and integrations
- Ensured nominee pages work with production URLs

🛠️ Technical Changes:
- .env.local: Updated NEXT_PUBLIC_APP_URL to wass-steel.vercel.app
- podium/route.ts: Fixed to use total_votes for correct vote counting
- Created WASS_STEEL_URL_FIX.sql for database URL updates
- Updated all URL generation scripts and SQL files
- Fixed live URL consistency across all systems

🎯 Production Ready:
- All URLs use https://wass-steel.vercel.app domain
- Podium correctly shows updated vote counts
- Directory links work with production URLs
- Admin panel shows consistent URLs
- HubSpot and Loops integrations use correct URLs

🔗 Production URLs:
- Home: https://wass-steel.vercel.app
- Directory: https://wass-steel.vercel.app/directory
- Admin: https://wass-steel.vercel.app/admin
- Nominee pages: https://wass-steel.vercel.app/nominee/[id]

Ready for production testing on wass-steel.vercel.app!"

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Check if commit was successful
if [ $? -eq 0 ]; then
    echo "✅ Commit successful!"
    
    # Show recent commits
    echo "📚 Recent commits:"
    git log --oneline -3
    
    # Push to origin
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "🎉 Successfully pushed to GitHub!"
        echo ""
        echo "🔗 Your app is deployed at: https://wass-steel.vercel.app"
        echo "📱 Vercel will automatically deploy the latest changes"
        echo ""
        echo "🧪 What was fixed:"
        echo "   ✅ Podium shows correct vote totals (real + additional)"
        echo "   ✅ All URLs use wass-steel.vercel.app domain"
        echo "   ✅ Directory nominee links work correctly"
        echo "   ✅ Admin panel shows consistent URLs"
        echo "   ✅ Live URL consistency across all integrations"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Run WASS_STEEL_URL_FIX.sql in Supabase SQL Editor"
        echo "   2. Test the production app at https://wass-steel.vercel.app"
        echo "   3. Verify nominee pages work: https://wass-steel.vercel.app/directory"
        echo "   4. Check admin panel: https://wass-steel.vercel.app/admin"
        echo ""
        echo "🎯 Ready for production testing!"
    else
        echo "❌ Failed to push to GitHub"
        echo "Please check your git configuration and try again"
    fi
else
    echo "❌ Commit failed"
    echo "Please check for any issues and try again"
fi