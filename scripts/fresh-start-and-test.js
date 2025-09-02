#!/usr/bin/env node

const { spawn } = require('child_process');
const fetch = require('node-fetch');

console.log('🚀 Starting fresh development server and comprehensive testing...\n');

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
    console.log('✅ Server is ready! Starting tests...\n');
    setTimeout(runTests, 2000);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString());
});

async function runTests() {
  console.log('🧪 Running comprehensive app tests...\n');
  
  try {
    // Test 1: Homepage
    console.log('1. Testing Homepage...');
    const homeResponse = await fetch('http://localhost:3000');
    console.log(`   Status: ${homeResponse.status} ${homeResponse.ok ? '✅' : '❌'}`);
    
    // Test 2: Nomination form
    console.log('2. Testing Nomination Form...');
    const nominateResponse = await fetch('http://localhost:3000/nominate');
    console.log(`   Status: ${nominateResponse.status} ${nominateResponse.ok ? '✅' : '❌'}`);
    
    // Test 3: Directory
    console.log('3. Testing Directory...');
    const directoryResponse = await fetch('http://localhost:3000/directory');
    console.log(`   Status: ${directoryResponse.status} ${directoryResponse.ok ? '✅' : '❌'}`);
    
    // Test 4: Admin login page
    console.log('4. Testing Admin Login...');
    const adminResponse = await fetch('http://localhost:3000/admin/login');
    console.log(`   Status: ${adminResponse.status} ${adminResponse.ok ? '✅' : '❌'}`);
    
    // Test 5: API endpoints
    console.log('5. Testing API Endpoints...');
    
    const nomineesApi = await fetch('http://localhost:3000/api/nominees');
    console.log(`   Nominees API: ${nomineesApi.status} ${nomineesApi.ok ? '✅' : '❌'}`);
    
    const statsApi = await fetch('http://localhost:3000/api/stats');
    console.log(`   Stats API: ${statsApi.status} ${statsApi.ok ? '✅' : '❌'}`);
    
    const settingsApi = await fetch('http://localhost:3000/api/settings');
    console.log(`   Settings API: ${settingsApi.status} ${settingsApi.ok ? '✅' : '❌'}`);
    
    // Test 6: Security endpoints
    console.log('6. Testing Security...');
    const adminProtected = await fetch('http://localhost:3000/admin');
    console.log(`   Admin Protection: ${adminProtected.status === 401 || adminProtected.status === 302 ? '✅' : '❌'} (Should redirect/block)`);
    
    console.log('\n🎉 Basic tests complete! Server is running at http://localhost:3000');
    console.log('\n📋 Manual Testing Checklist:');
    console.log('   • Visit http://localhost:3000 - Homepage');
    console.log('   • Visit http://localhost:3000/nominate - Nomination Form');
    console.log('   • Visit http://localhost:3000/directory - Nominees Directory');
    console.log('   • Visit http://localhost:3000/admin/login - Admin Login');
    console.log('   • Test admin login with: admin@worldstaffingawards.com / WSA2026Admin!Secure');
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