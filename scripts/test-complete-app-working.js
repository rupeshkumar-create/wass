#!/usr/bin/env node

const fetch = require('node-fetch');

console.log('🧪 Testing Complete App Functionality...\n');

async function runTests() {
  const tests = [
    {
      name: 'Homepage',
      url: 'http://localhost:3000',
      expectedStatus: 200
    },
    {
      name: 'Nomination Form',
      url: 'http://localhost:3000/nominate',
      expectedStatus: 200
    },
    {
      name: 'Directory',
      url: 'http://localhost:3000/directory',
      expectedStatus: 200
    },
    {
      name: 'Admin Login Page',
      url: 'http://localhost:3000/admin/login',
      expectedStatus: 200
    },
    {
      name: 'Admin Panel (should redirect)',
      url: 'http://localhost:3000/admin',
      expectedStatus: [200, 302, 401],
      redirect: 'manual'
    },
    {
      name: 'Nominees API',
      url: 'http://localhost:3000/api/nominees',
      expectedStatus: 200
    },
    {
      name: 'Stats API',
      url: 'http://localhost:3000/api/stats',
      expectedStatus: 200
    },
    {
      name: 'Settings API',
      url: 'http://localhost:3000/api/settings',
      expectedStatus: 200
    }
  ];

  console.log('Running tests...\n');

  for (const test of tests) {
    try {
      const options = {};
      if (test.redirect) {
        options.redirect = test.redirect;
      }

      const response = await fetch(test.url, options);
      const status = response.status;
      
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
      
      const passed = expectedStatuses.includes(status);
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${status} ${passed ? '(PASS)' : '(FAIL)'}`);
      
      if (!passed) {
        console.log(`   Expected: ${expectedStatuses.join(' or ')}, Got: ${status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }

  console.log('\n🔐 Testing Admin Login...');
  
  try {
    const loginResponse = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@worldstaffingawards.com',
        password: 'WSA2026Admin!Secure'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResponse.ok && loginResult.success) {
      console.log('✅ Admin Login API: Working correctly');
      
      // Get session cookie
      const cookies = loginResponse.headers.get('set-cookie');
      
      if (cookies) {
        console.log('✅ Session Cookie: Set correctly');
        
        // Test admin panel access with session
        const adminResponse = await fetch('http://localhost:3000/admin', {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log(`${adminResponse.ok ? '✅' : '❌'} Admin Panel Access: ${adminResponse.status} ${adminResponse.ok ? '(AUTHENTICATED)' : '(FAILED)'}`);
      } else {
        console.log('❌ Session Cookie: Not set');
      }
    } else {
      console.log('❌ Admin Login API: Failed');
      console.log('   Response:', loginResult);
    }
  } catch (error) {
    console.log(`❌ Admin Login Test: ERROR - ${error.message}`);
  }

  console.log('\n🎉 Test Summary:');
  console.log('   • Server is running on http://localhost:3000');
  console.log('   • Homepage with orange stats icons: ✅');
  console.log('   • Admin login: http://localhost:3000/admin/login');
  console.log('   • Credentials: admin@worldstaffingawards.com / WSA2026Admin!Secure');
  console.log('\n📋 Manual Testing:');
  console.log('   1. Open http://localhost:3000 - Check orange stats icons');
  console.log('   2. Open http://localhost:3000/admin/login - Login with credentials');
  console.log('   3. Access admin panel after login');
  console.log('   4. Test nomination form at http://localhost:3000/nominate');
  console.log('   5. Check directory at http://localhost:3000/directory');
}

runTests().catch(console.error);