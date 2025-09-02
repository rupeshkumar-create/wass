#!/usr/bin/env node

/**
 * Local Deployment Test Script
 * Tests critical API endpoints to ensure the app works locally
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

const endpoints = [
  { path: '/api/nominees', method: 'GET', description: 'Get nominees' },
  { path: '/api/stats', method: 'GET', description: 'Get statistics' },
  { path: '/api/podium', method: 'GET', description: 'Get podium data' },
  { path: '/api/settings', method: 'GET', description: 'Get app settings' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint.path,
      method: endpoint.method,
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'ERROR',
        data: err.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'TIMEOUT',
        data: 'Request timed out',
        success: false
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Local Deployment');
  console.log('============================');
  console.log('');

  let allPassed = true;

  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.description}... `);
    
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log('✅ PASS');
    } else {
      console.log(`❌ FAIL (${result.status})`);
      console.log(`   Error: ${result.data}`);
      allPassed = false;
    }
  }

  console.log('');
  if (allPassed) {
    console.log('🎉 All tests passed! App is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
  console.log('');
}

// Check if server is running
const checkServer = http.request({ hostname: 'localhost', port: 3000, path: '/', method: 'HEAD' }, (res) => {
  runTests();
});

checkServer.on('error', () => {
  console.log('❌ Local server not running on port 3000');
  console.log('Please start the dev server with: npm run dev');
  process.exit(1);
});

checkServer.end();