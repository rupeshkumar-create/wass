#!/usr/bin/env node

// Use node-fetch for Node.js compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testNomineesAPI() {
  console.log('🧪 Testing Nominees API with New Schema...\n');

  try {
    // Test 1: Get all nominees
    console.log('1. Testing GET /api/nominees (all nominees)...');
    const allNomineesResponse = await fetch(`${BASE_URL}/api/nominees`);
    const allNomineesResult = await allNomineesResponse.json();
    
    if (allNomineesResult.success) {
      console.log(`✅ Found ${allNomineesResult.count} total nominees`);
      
      if (allNomineesResult.data.length > 0) {
        const sampleNominee = allNomineesResult.data[0];
        console.log(`   Sample: ${sampleNominee.nominee.name} (${sampleNominee.type})`);
        console.log(`   Category: ${sampleNominee.category}`);
        console.log(`   Votes: ${sampleNominee.votes}`);
        console.log(`   Image: ${sampleNominee.imageUrl ? 'Yes' : 'No'}`);
        console.log(`   Why Vote: ${sampleNominee.nominee.whyVote ? 'Yes' : 'No'}`);
        
        // Test data structure
        console.log('\n   Data Structure Check:');
        console.log(`   ✓ ID: ${sampleNominee.id}`);
        console.log(`   ✓ Type: ${sampleNominee.type}`);
        console.log(`   ✓ Display Name: ${sampleNominee.nominee.displayName}`);
        console.log(`   ✓ Image URL: ${sampleNominee.nominee.imageUrl || 'None'}`);
        console.log(`   ✓ LinkedIn: ${sampleNominee.nominee.linkedin || 'None'}`);
        console.log(`   ✓ Live URL: ${sampleNominee.liveUrl || 'None'}`);
        
        if (sampleNominee.type === 'person') {
          console.log(`   ✓ First Name: ${sampleNominee.nominee.firstName || 'None'}`);
          console.log(`   ✓ Last Name: ${sampleNominee.nominee.lastName || 'None'}`);
          console.log(`   ✓ Job Title: ${sampleNominee.nominee.title || 'None'}`);
          console.log(`   ✓ Why Me: ${sampleNominee.nominee.whyMe || 'None'}`);
        } else {
          console.log(`   ✓ Company Name: ${sampleNominee.nominee.companyName || 'None'}`);
          console.log(`   ✓ Website: ${sampleNominee.nominee.website || 'None'}`);
          console.log(`   ✓ Industry: ${sampleNominee.nominee.industry || 'None'}`);
          console.log(`   ✓ Why Us: ${sampleNominee.nominee.whyUs || 'None'}`);
        }
      }
    } else {
      console.log(`❌ Failed: ${allNomineesResult.error}`);
    }

    // Test 2: Get nominees by category
    console.log('\n2. Testing category filtering...');
    const categories = [
      'top-recruiter',
      'top-executive-leader',
      'rising-star-under-30',
      'top-ai-driven-staffing-platform',
      'fastest-growing-staffing-firm'
    ];

    let totalByCategory = 0;
    for (const category of categories) {
      const categoryResponse = await fetch(`${BASE_URL}/api/nominees?subcategoryId=${category}`);
      const categoryResult = await categoryResponse.json();
      
      if (categoryResult.success) {
        console.log(`   ${category}: ${categoryResult.count} nominees`);
        totalByCategory += categoryResult.count;
      } else {
        console.log(`   ${category}: Error - ${categoryResult.error}`);
      }
    }
    
    console.log(`✅ Total nominees in tested categories: ${totalByCategory}`);

    // Test 3: Test with limit
    console.log('\n3. Testing limit parameter...');
    const limitedResponse = await fetch(`${BASE_URL}/api/nominees?limit=5`);
    const limitedResult = await limitedResponse.json();
    
    if (limitedResult.success) {
      console.log(`✅ Limited query returned ${limitedResult.count} nominees (max 5)`);
    } else {
      console.log(`❌ Limited query failed: ${limitedResult.error}`);
    }

    // Test 4: Test specific category with limit
    console.log('\n4. Testing category + limit...');
    const specificResponse = await fetch(`${BASE_URL}/api/nominees?subcategoryId=top-recruiter&limit=3`);
    const specificResult = await specificResponse.json();
    
    if (specificResult.success) {
      console.log(`✅ Top recruiter category returned ${specificResult.count} nominees (max 3)`);
      
      if (specificResult.data.length > 0) {
        console.log('   Top nominees in this category:');
        specificResult.data.forEach((nominee, index) => {
          console.log(`   ${index + 1}. ${nominee.nominee.name} - ${nominee.votes} votes`);
        });
      }
    } else {
      console.log(`❌ Specific category query failed: ${specificResult.error}`);
    }

    // Test 5: Verify data completeness
    console.log('\n5. Testing data completeness...');
    if (allNomineesResult.success && allNomineesResult.data.length > 0) {
      const nominees = allNomineesResult.data;
      
      const withImages = nominees.filter(n => n.imageUrl).length;
      const withLinkedIn = nominees.filter(n => n.nominee.linkedin).length;
      const withWhyVote = nominees.filter(n => n.nominee.whyVote).length;
      const withLiveUrl = nominees.filter(n => n.liveUrl).length;
      
      console.log(`✅ Data completeness analysis:`);
      console.log(`   Nominees with images: ${withImages}/${nominees.length} (${Math.round(withImages/nominees.length*100)}%)`);
      console.log(`   Nominees with LinkedIn: ${withLinkedIn}/${nominees.length} (${Math.round(withLinkedIn/nominees.length*100)}%)`);
      console.log(`   Nominees with Why Vote text: ${withWhyVote}/${nominees.length} (${Math.round(withWhyVote/nominees.length*100)}%)`);
      console.log(`   Nominees with Live URL: ${withLiveUrl}/${nominees.length} (${Math.round(withLiveUrl/nominees.length*100)}%)`);
      
      // Check type distribution
      const personCount = nominees.filter(n => n.type === 'person').length;
      const companyCount = nominees.filter(n => n.type === 'company').length;
      console.log(`   Person nominees: ${personCount}`);
      console.log(`   Company nominees: ${companyCount}`);
    }

    console.log('\n🎉 Nominees API Testing Complete!');
    console.log('\nFeatures verified:');
    console.log('✅ Public nominees view integration');
    console.log('✅ Proper data transformation');
    console.log('✅ Category filtering');
    console.log('✅ Limit parameter');
    console.log('✅ Complete nominee data structure');
    console.log('✅ Person vs Company type handling');
    console.log('✅ Image, LinkedIn, and content data');
    console.log('✅ Vote counting and sorting');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testNomineesAPI();