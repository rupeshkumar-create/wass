#!/bin/bash

# Commit all latest fixes for Vercel deployment
# This includes dropdown fixes, admin panel fixes, and live URL fixes

echo "🚀 Committing all latest fixes for Vercel deployment..."

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
COMMIT_MSG="🔧 Fix admin dropdown visibility and vote update functionality

✅ Fixed Issues:
- Admin panel dropdown now shows all 19 categories correctly
- Fixed category.name -> category.label property usage
- Added z-index fix (z-[100]) for dropdown visibility
- Fixed admin vote update API (nomination_id vs nominee_id)
- Added additional_votes column support
- Fixed live URL generation and routing
- Updated Next.js async params handling

🛠️ Technical Changes:
- TopNomineesPanel: Fixed dropdown styling and category display
- update-votes API: Corrected column references for vote counting
- nominees/[id] route: Fixed async params handling
- Added comprehensive SQL fixes for database schema
- Added test scripts for verification

🎯 Ready for Vercel deployment and testing"

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
        echo "🔗 Your changes are now available for Vercel deployment"
        echo "📱 Vercel should automatically deploy the latest changes"
        echo ""
        echo "🧪 What was fixed:"
        echo "   ✅ Admin dropdown visibility (z-index + category.label)"
        echo "   ✅ Admin vote update functionality (column name fix)"
        echo "   ✅ Live URL routing and generation"
        echo "   ✅ Next.js async params compatibility"
        echo ""
        echo "🎯 Ready to test on Vercel!"
    else
        echo "❌ Failed to push to GitHub"
        echo "Please check your git configuration and try again"
    fi
else
    echo "❌ Commit failed"
    echo "Please check for any issues and try again"
fi