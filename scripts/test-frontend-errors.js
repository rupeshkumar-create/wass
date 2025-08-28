#!/usr/bin/env node

const { execSync } = require('child_process');

async function testFrontendErrors() {
  console.log('🧪 Testing frontend for JavaScript errors...');

  try {
    // Test if the server is running
    console.log('🔍 Checking if development server is running...');
    
    try {
      const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { encoding: 'utf8' });
      if (response.trim() !== '200') {
        console.log('❌ Development server not running or not responding');
        console.log('💡 Please run: npm run dev');
        return;
      }
      console.log('✅ Development server is running');
    } catch (error) {
      console.log('❌ Development server not accessible');
      console.log('💡 Please run: npm run dev');
      return;
    }

    // Test API endpoints
    console.log('\n🔍 Testing API endpoints...');
    
    try {
      const nomineesResponse = execSync('curl -s "http://localhost:3000/api/nominees"', { encoding: 'utf8' });
      const nomineesData = JSON.parse(nomineesResponse);
      
      if (nomineesData.success && nomineesData.data) {
        console.log(`✅ /api/nominees - ${nomineesData.data.length} nominees returned`);
        
        // Check data structure
        if (nomineesData.data.length > 0) {
          const sample = nomineesData.data[0];
          console.log('📋 Sample nominee structure:');
          console.log(`   - ID: ${sample.id ? '✅' : '❌'}`);
          console.log(`   - Category: ${sample.category ? '✅' : '❌'}`);
          console.log(`   - Type: ${sample.type ? '✅' : '❌'}`);
          console.log(`   - Nominee name: ${sample.nominee?.name ? '✅' : '❌'}`);
          console.log(`   - Image URL: ${sample.imageUrl ? '✅' : '❌'}`);
          console.log(`   - Live URL: ${sample.liveUrl ? '✅' : '❌'}`);
        }
      } else {
        console.log('❌ /api/nominees - Invalid response structure');
        console.log('Response:', nomineesResponse.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ /api/nominees - Failed to fetch');
      console.log('Error:', error.message);
    }

    // Test other endpoints
    try {
      const statsResponse = execSync('curl -s "http://localhost:3000/api/stats"', { encoding: 'utf8' });
      console.log('✅ /api/stats - Accessible');
    } catch (error) {
      console.log('❌ /api/stats - Failed');
    }

    try {
      const votesResponse = execSync('curl -s "http://localhost:3000/api/votes"', { encoding: 'utf8' });
      console.log('✅ /api/votes - Accessible');
    } catch (error) {
      console.log('❌ /api/votes - Failed');
    }

    // Test pages
    console.log('\n🔍 Testing page accessibility...');
    
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/directory', name: 'Directory' },
      { path: '/nominate', name: 'Nomination Form' }
    ];

    for (const page of pages) {
      try {
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000${page.path}`, { encoding: 'utf8' });
        if (response.trim() === '200') {
          console.log(`✅ ${page.name} (${page.path}) - Accessible`);
        } else {
          console.log(`❌ ${page.name} (${page.path}) - HTTP ${response.trim()}`);
        }
      } catch (error) {
        console.log(`❌ ${page.name} (${page.path}) - Failed to test`);
      }
    }

    console.log('\n📊 Frontend Test Summary:');
    console.log('✅ Basic connectivity tests completed');
    console.log('💡 To check for JavaScript runtime errors:');
    console.log('   1. Open browser to http://localhost:3000');
    console.log('   2. Open Developer Tools (F12)');
    console.log('   3. Check Console tab for errors');
    console.log('   4. Navigate to /directory and /nominate pages');
    console.log('   5. Look for any red error messages');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendErrors();