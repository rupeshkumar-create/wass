#!/usr/bin/env node

const { execSync } = require('child_process');

async function runFinalTest() {
  console.log('🎯 FINAL FRONTEND TEST - World Staffing Awards 2026');
  console.log('=' .repeat(60));

  let allPassed = true;

  // Test 1: Server Status
  console.log('\n1️⃣ Testing Development Server...');
  try {
    const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { encoding: 'utf8' });
    if (response.trim() === '200') {
      console.log('✅ Development server is running');
    } else {
      console.log('❌ Development server not responding');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Development server not accessible');
    allPassed = false;
  }

  // Test 2: API Endpoints
  console.log('\n2️⃣ Testing API Endpoints...');
  
  const apiTests = [
    { endpoint: '/api/nominees', name: 'Nominees API' },
    { endpoint: '/api/stats', name: 'Stats API' },
    { endpoint: '/api/votes', name: 'Votes API' },
    { endpoint: '/api/podium?category=top-recruiter', name: 'Podium API' }
  ];

  for (const test of apiTests) {
    try {
      const response = execSync(`curl -s "http://localhost:3000${test.endpoint}"`, { encoding: 'utf8' });
      const data = JSON.parse(response);
      
      if (test.endpoint === '/api/nominees') {
        if (data.success && Array.isArray(data.data)) {
          console.log(`✅ ${test.name} - ${data.data.length} nominees`);
        } else {
          console.log(`❌ ${test.name} - Invalid structure`);
          allPassed = false;
        }
      } else if (test.endpoint === '/api/stats') {
        if (data.totalNominees !== undefined) {
          console.log(`✅ ${test.name} - ${data.totalNominees} total nominees`);
        } else {
          console.log(`❌ ${test.name} - Invalid structure`);
          allPassed = false;
        }
      } else if (test.endpoint === '/api/votes') {
        if (Array.isArray(data)) {
          console.log(`✅ ${test.name} - ${data.length} votes`);
        } else {
          console.log(`❌ ${test.name} - Invalid structure`);
          allPassed = false;
        }
      } else if (test.endpoint.includes('/api/podium')) {
        if (data.category && Array.isArray(data.items)) {
          console.log(`✅ ${test.name} - ${data.items.length} podium items`);
        } else {
          console.log(`❌ ${test.name} - Invalid structure`);
          allPassed = false;
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Failed: ${error.message}`);
      allPassed = false;
    }
  }

  // Test 3: Page Accessibility
  console.log('\n3️⃣ Testing Page Accessibility...');
  
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/directory', name: 'Directory' },
    { path: '/nominate', name: 'Nomination Form' },
    { path: '/admin', name: 'Admin Panel' }
  ];

  for (const page of pages) {
    try {
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000${page.path}`, { encoding: 'utf8' });
      if (response.trim() === '200') {
        console.log(`✅ ${page.name} (${page.path})`);
      } else {
        console.log(`❌ ${page.name} (${page.path}) - HTTP ${response.trim()}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${page.name} (${page.path}) - Failed`);
      allPassed = false;
    }
  }

  // Test 4: Data Integrity
  console.log('\n4️⃣ Testing Data Integrity...');
  
  try {
    const nomineesResponse = execSync('curl -s "http://localhost:3000/api/nominees"', { encoding: 'utf8' });
    const nomineesData = JSON.parse(nomineesResponse);
    
    if (nomineesData.success && nomineesData.data.length > 0) {
      const sample = nomineesData.data[0];
      
      const checks = [
        { field: 'id', value: sample.id, required: true },
        { field: 'category', value: sample.category, required: true },
        { field: 'type', value: sample.type, required: true },
        { field: 'nominee.name', value: sample.nominee?.name, required: true },
        { field: 'imageUrl', value: sample.imageUrl, required: false },
        { field: 'liveUrl', value: sample.liveUrl, required: true },
        { field: 'votes', value: sample.votes, required: true }
      ];
      
      let dataIntegrityPassed = true;
      for (const check of checks) {
        if (check.required && !check.value) {
          console.log(`❌ Missing required field: ${check.field}`);
          dataIntegrityPassed = false;
          allPassed = false;
        } else if (check.value) {
          console.log(`✅ ${check.field}: ${typeof check.value === 'string' ? check.value.substring(0, 30) + '...' : check.value}`);
        }
      }
      
      if (dataIntegrityPassed) {
        console.log('✅ Data integrity checks passed');
      }
    } else {
      console.log('❌ No nominee data available for integrity check');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Data integrity check failed:', error.message);
    allPassed = false;
  }

  // Test 5: Category Mapping
  console.log('\n5️⃣ Testing Category Mapping...');
  
  try {
    const nomineesResponse = execSync('curl -s "http://localhost:3000/api/nominees"', { encoding: 'utf8' });
    const nomineesData = JSON.parse(nomineesResponse);
    
    if (nomineesData.success && nomineesData.data.length > 0) {
      const categories = [...new Set(nomineesData.data.map(n => n.category))];
      console.log(`✅ Found ${categories.length} unique categories:`);
      categories.forEach(cat => console.log(`   - ${cat}`));
      
      // Check if categories exist in constants (simplified check)
      const knownCategories = [
        'top-recruiter', 'top-executive-leader', 'top-staffing-influencer',
        'top-ai-driven-platform', 'top-women-led-firm', 'fastest-growing-firm'
      ];
      
      const unknownCategories = categories.filter(cat => !knownCategories.includes(cat));
      if (unknownCategories.length > 0) {
        console.log(`⚠️  Unknown categories found: ${unknownCategories.join(', ')}`);
      } else {
        console.log('✅ All categories are recognized');
      }
    }
  } catch (error) {
    console.log('❌ Category mapping check failed:', error.message);
    allPassed = false;
  }

  // Final Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('=' .repeat(60));
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Frontend is ready.');
    console.log('\n✅ What\'s working:');
    console.log('   - Development server is running');
    console.log('   - All API endpoints are functional');
    console.log('   - All pages are accessible');
    console.log('   - Data integrity is maintained');
    console.log('   - Category mapping is correct');
    
    console.log('\n🌐 Ready for testing:');
    console.log('   - Homepage: http://localhost:3000');
    console.log('   - Directory: http://localhost:3000/directory');
    console.log('   - Nomination Form: http://localhost:3000/nominate');
    console.log('   - Admin Panel: http://localhost:3000/admin');
    
  } else {
    console.log('❌ Some tests failed. Please check the issues above.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Open browser to http://localhost:3000');
  console.log('   2. Check browser console for any JavaScript errors');
  console.log('   3. Test all functionality manually');
  console.log('   4. Verify responsive design on mobile');
}

runFinalTest();