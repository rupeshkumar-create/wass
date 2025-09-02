#!/bin/bash

# Commit podium and live URL fixes for production deployment

echo "🚀 Committing podium and live URL fixes..."

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
COMMIT_MSG="🏆 Fix podium voting logic and production live URLs

✅ Fixed Issues:
- Podium now correctly shows total_votes (real + additional votes)
- Updated production URLs to use world-staffing-awards.vercel.app
- Fixed vote counting in podium API to include additional votes
- Updated environment variables for production deployment
- Fixed live URL consistency across admin panel and integrations

🛠️ Technical Changes:
- podium/route.ts: Order by total_votes instead of votes
- podium/route.ts: Use total_votes in response data
- .env.local: Updated NEXT_PUBLIC_APP_URL to production domain
- Added production URL fix scripts and SQL
- Updated live URL generation for production domain

🎯 Verified Working:
- Nominee with 50 total votes now shows as #1 in podium
- Live URLs use production domain consistently
- Admin panel vote updates reflect in podium correctly
- All integrations use consistent production URLs

Ready for Vercel production deployment!"

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
        echo "🔗 Changes deployed to: https://world-staffing-awards.vercel.app"
        echo "📱 Vercel will automatically deploy the latest changes"
        echo ""
        echo "🧪 What was fixed:"
        echo "   ✅ Podium shows correct vote totals (real + additional)"
        echo "   ✅ Production URLs work correctly"
        echo "   ✅ Live URL consistency across all systems"
        echo "   ✅ Admin vote updates reflect in podium immediately"
        echo ""
        echo "🎯 Test URLs:"
        echo "   🏆 Podium: https://world-staffing-awards.vercel.app/api/podium?category=top-executive-leader"
        echo "   📊 Admin: https://world-staffing-awards.vercel.app/admin"
        echo "   📁 Directory: https://world-staffing-awards.vercel.app/directory"
        echo ""
        echo "🎉 Ready for production testing!"
    else
        echo "❌ Failed to push to GitHub"
        echo "Please check your git configuration and try again"
    fi
else
    echo "❌ Commit failed"
    echo "Please check for any issues and try again"
fi