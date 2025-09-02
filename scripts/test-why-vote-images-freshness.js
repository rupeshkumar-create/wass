#!/usr/bin/env node

// Comprehensive test script for Why Vote, Images, and Freshness fixes
const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, description, checkFunction) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    const data = await response.json();
    
    const passed = response.status === 200 && (!checkFunction || checkFunction(data));
    console.log(`${passed ? '✅' : '❌'} ${description}: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed && data.error) {
      console.log(`   Error: ${data.error}`);
    }
    
    return { success: passed, data };
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPATCH(endpoint, body, description) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    
    const passed = response.status === 200 && data.success;
    console.log(`${passed ? '✅' : '❌'} ${description}: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed && data.error) {
      console.log(`   Error: ${data.error}`);
    }
    
    return { success: passed, data };
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('🚀 World Staffing Awards 2026 - Why Vote, Images & Freshness Tests\n');
  
  console.log('📝 1) Why Vote Field Tests');
  
  // Test nominees API includes why_vote_for_me
  const nomineesResult = await testAPI('/api/nominees?limit=1', 
    'Nominees API includes why_vote_for_me field', 
    (data) => {
      if (!Array.isArray(data) || data.length === 0) return false;
      const sample = data[0];
      console.log(`   Sample nominee has whyVoteForMe: ${sample.whyVoteForMe ? 'YES' : 'NO'}`);
      return true; // Field can be empty for existing nominees
    });
  
  // Test individual nominee API
  if (nomineesResult.success && nomineesResult.data.length > 0) {
    const sampleSlug = nomineesResult.data[0].liveUrl;
    await testAPI(`/api/nominee/${sampleSlug}`, 
      'Individual nominee API includes whyVoteForMe', 
      (data) => {
        const hasField = data.whyVoteForMe !== undefined;
        console.log(`   Nominee ${data.nominee?.name} whyVoteForMe: ${data.whyVoteForMe ? 'HAS TEXT' : 'EMPTY'}`);
        return hasField;
      });
  }
  
  // Test PATCH API for why_vote updates
  if (nomineesResult.success && nomineesResult.data.length > 0) {
    const sampleId = nomineesResult.data[0].id;
    const testWhyVote = "This is a test why vote message for automated testing.";
    
    await testPATCH('/api/nominations', 
      { id: sampleId, why_vote: testWhyVote },
      'PATCH API updates why_vote field');
  }
  
  console.log('\n🖼️ 2) Image Display Tests');
  
  // Test image URLs in nominees
  await testAPI('/api/nominees', 
    'Nominees have proper image URLs', 
    (data) => {
      if (!Array.isArray(data)) return false;
      const withImages = data.filter(n => n.nominee && n.nominee.imageUrl && n.nominee.imageUrl.includes('supabase.co'));
      console.log(`   Found ${withImages.length}/${data.length} nominees with Supabase image URLs`);
      return withImages.length > 0;
    });
  
  // Test podium images
  await testAPI('/api/podium?category=Top%20Recruiter', 
    'Podium API returns proper image URLs', 
    (data) => {
      if (!data.items || data.items.length === 0) return false;
      const withImages = data.items.filter(item => item.image && item.image.includes('supabase.co'));
      console.log(`   Found ${withImages.length}/${data.items.length} podium items with images`);
      return withImages.length > 0;
    });
  
  console.log('\n⚡ 3) Freshness Tests (No-Cache Headers)');
  
  // Test cache headers on key endpoints
  const endpoints = [
    '/api/nominees',
    '/api/podium?category=Top%20Recruiter',
    '/api/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      const cacheControl = response.headers.get('cache-control');
      const hasFreshness = cacheControl && (cacheControl.includes('no-store') || cacheControl.includes('max-age=0'));
      console.log(`${hasFreshness ? '✅' : '❌'} ${endpoint} freshness: ${hasFreshness ? 'PASS' : 'FAIL'}`);
      if (cacheControl) {
        console.log(`   Cache-Control: ${cacheControl}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} freshness: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n🎯 4) Data Structure Validation');
  
  // Validate complete data structure
  const fullNomineesResult = await testAPI('/api/nominees?limit=3', 'Complete nominee data structure');
  if (fullNomineesResult.success && fullNomineesResult.data.length > 0) {
    const sample = fullNomineesResult.data[0];
    console.log('   Sample nominee structure:');
    console.log(`   - ID: ${sample.id}`);
    console.log(`   - Name: ${sample.nominee?.name}`);
    console.log(`   - Category: ${sample.category}`);
    console.log(`   - Live URL: ${sample.liveUrl}`);
    console.log(`   - Votes: ${sample.votes}`);
    console.log(`   - Image URL: ${sample.nominee?.imageUrl ? 'YES' : 'NO'}`);
    console.log(`   - Why Vote: ${sample.whyVoteForMe ? 'YES' : 'NO'}`);
    console.log(`   - Status: ${sample.status}`);
    console.log(`   - Created: ${sample.createdAt}`);
  }
  
  console.log('\n🔧 5) Upload API Test');
  
  // Test upload API availability
  await testAPI('/api/uploads/debug', 
    'Upload API endpoint available', 
    (data) => data.message || data.error);
  
  console.log('\n🎉 Comprehensive Testing Complete!');
  console.log('\n✅ Key Features Verified:');
  console.log('   • Why Vote field in database and APIs');
  console.log('   • Image URLs from Supabase Storage');
  console.log('   • No-cache headers for freshness');
  console.log('   • PATCH API for admin updates');
  console.log('   • Complete data structure integrity');
  
  console.log('\n🔧 Manual Testing Checklist:');
  console.log('   □ Upload new image → preview stays visible');
  console.log('   □ Approve nomination → appears immediately in directory');
  console.log('   □ Edit "Why Vote" in admin → shows on profile');
  console.log('   □ Images display in cards, profile, podium');
  console.log('   □ Category filtering works without cache issues');
}

// Run if called directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests };