#!/usr/bin/env node

const { spawn } = require('child_process');
const fetch = require('node-fetch');

console.log('🚀 Starting fresh development server and testing admin access...\n');

// Start the development server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  cwd: process.cwd()
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Server:', output);
  
  if (output.includes('Ready') || output.includes('localhost:3000')) {
    serverReady = true;
    console.log('✅ Server is ready! Testing admin access...\n');
    setTimeout(testAdminAccess, 3000);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString());
});

async function testAdminAccess() {
  console.log('🔐 Testing Admin Panel Access...\n');
  
  try {
    // Test 1: Admin login page
    console.log('1. Testing Admin Login Page...');
    const loginResponse = await fetch('http://localhost:3000/admin/login');
    console.log(`   Status: ${loginResponse.status} ${loginResponse.ok ? '✅' : '❌'}`);
    
    if (loginResponse.ok) {
      const loginHtml = await loginResponse.text();
      console.log('   ✅ Login page loads successfully');
    }
    
    // Test 2: Admin panel (should redirect to login)
    console.log('\n2. Testing Admin Panel Protection...');
    const adminResponse = await fetch('http://localhost:3000/admin', {
      redirect: 'manual'
    });
    console.log(`   Status: ${adminResponse.status} ${adminResponse.status === 302 || adminResponse.status === 401 ? '✅' : '❌'} (Should redirect)`);
    
    // Test 3: Login API endpoint
    console.log('\n3. Testing Login API...');
    const loginApiResponse = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@worldstaffingawards.com',
        password: 'WSA2026Admin!Secure'
      })
    });
    
    console.log(`   Login API Status: ${loginApiResponse.status} ${loginApiResponse.ok ? '✅' : '❌'}`);
    
    if (loginApiResponse.ok) {
      const loginResult = await loginApiResponse.json();
      console.log('   ✅ Login API works correctly');
      console.log('   Response:', loginResult);
      
      // Get the session cookie
      const cookies = loginApiResponse.headers.get('set-cookie');
      console.log('   Cookies set:', cookies ? '✅' : '❌');
      
      if (cookies) {
        // Test 4: Access admin panel with session
        console.log('\n4. Testing Admin Panel with Session...');
        const sessionResponse = await fetch('http://localhost:3000/admin', {
          headers: {
            'Cookie': cookies
          }
        });
        console.log(`   Admin Panel Access: ${sessionResponse.status} ${sessionResponse.ok ? '✅' : '❌'}`);
      }
    } else {
      const errorResult = await loginApiResponse.json();
      console.log('   ❌ Login failed:', errorResult);
    }
    
    console.log('\n📋 Admin Access Summary:');
    console.log('   • Login Page: http://localhost:3000/admin/login');
    console.log('   • Admin Panel: http://localhost:3000/admin');
    console.log('   • Credentials: admin@worldstaffingawards.com / WSA2026Admin!Secure');
    console.log('\n🌐 Open your browser and navigate to:');
    console.log('   http://localhost:3000/admin/login');
    console.log('\n⚡ Server will continue running for manual testing...');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill();
  process.exit(0);
});