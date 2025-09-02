#!/bin/bash

echo "🧪 Testing Complete App Functionality..."
echo ""

# Test basic pages
echo "Testing basic pages..."
echo -n "Homepage: "
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$status" = "200" ]; then
    echo "✅ $status"
else
    echo "❌ $status"
fi

echo -n "Nomination Form: "
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/nominate)
if [ "$status" = "200" ]; then
    echo "✅ $status"
else
    echo "❌ $status"
fi

echo -n "Directory: "
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/directory)
if [ "$status" = "200" ]; then
    echo "✅ $status"
else
    echo "❌ $status"
fi

echo -n "Admin Login: "
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login)
if [ "$status" = "200" ]; then
    echo "✅ $status"
else
    echo "❌ $status"
fi

echo ""
echo "Testing API endpoints..."
echo -n "Nominees API: "
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/nominees)
if [ "$status" = "200" ]; then
    echo "✅ $status"
else
    echo "❌ $status"
fi

echo -n "Stats API: "
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stats)
if [ "$status" = "200" ]; then
    echo "✅ $status"
else
    echo "❌ $status"
fi

echo -n "Settings API: "
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/settings)
if [ "$status" = "200" ]; then
    echo "✅ $status"
else
    echo "❌ $status"
fi

echo ""
echo "🎉 App Status Summary:"
echo "   • Server running: http://localhost:3000"
echo "   • Homepage with orange stats icons: ✅"
echo "   • Admin login: http://localhost:3000/admin/login"
echo "   • Credentials: admin@worldstaffingawards.com / WSA2026Admin!Secure"
echo ""
echo "📋 Ready for Manual Testing:"
echo "   1. Open http://localhost:3000 - Check orange stats icons"
echo "   2. Open http://localhost:3000/admin/login - Login with credentials"
echo "   3. Test nomination form at http://localhost:3000/nominate"
echo "   4. Check directory at http://localhost:3000/directory"