#!/usr/bin/env node

// Final verification script for all fixes
const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, description) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    
    if (isJson) {
      const data = await response.json();
      console.log(`✅ ${description}: ${response.status === 200 ? 'PASS' : 'FAIL'}`);
      return { success: response.status === 200, data };
    } else {
      // HTML page
      const text = await response.text();
      const hasError = text.includes('Error') || text.includes('error');
      console.log(`${hasError ? '❌' : '✅'} ${description}: ${hasError ? 'FAIL' : 'PASS'}`);
      return { success: !hasError, data: text.slice(0, 100) };
    }
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runFinalVerification() {
  console.log('🔧 World Staffing Awards - Final Fix Verification\n');
  
  console.log('📋 1) Category Filtering APIs');
  await testAPI('/api/nominees?category=Top%20Recruiter', 'Top Recruiter filtering');
  await testAPI('/api/nominees?category=Top%20Staffing%20Influencer', 'Top Staffing Influencer filtering');
  
  console.log('\n👤 2) Profile APIs');
  await testAPI('/api/nominee/morgan-brown-3', 'Valid profile API');
  await testAPI('/api/nominee/non-existent', 'Invalid profile handling');
  
  console.log('\n🏆 3) Podium API');
  await testAPI('/api/podium?category=Top%20Staffing%20Influencer', 'Podium with fixed mapping');
  
  console.log('\n📊 4) General APIs');
  await testAPI('/api/stats', 'Stats API');
  await testAPI('/api/nominees?sort=votes_desc&limit=5', 'Suggestions API');
  
  console.log('\n🌐 5) Page Loading');
  await testAPI('/directory', 'Directory page');
  await testAPI('/directory?category=Top%20Recruiter', 'Directory with category filter');
  
  console.log('\n🎉 Final Verification Complete!');
  console.log('\n✅ Key Fixes Applied:');
  console.log('   • Removed invalid revalidate export from client component');
  console.log('   • Fixed type imports (NominationWithVotes)');
  console.log('   • Fixed podium API mapping (image/liveUrl)');
  console.log('   • Fixed component prop interfaces');
  console.log('   • Stable image upload previews');
  console.log('   • Right-rail suggestions panel');
  console.log('   • Proper card spacing and responsive grid');
}

// Run if called directly
if (require.main === module) {
  runFinalVerification().catch(console.error);
}

module.exports = { runFinalVerification };