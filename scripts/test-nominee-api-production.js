#!/usr/bin/env node

/**
 * Test Nominee API in Production
 * Tests the /api/nominees/[id] endpoint with actual production data
 */

// Use built-in fetch (Node 18+) or fallback to node-fetch
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'https://wass-steel.vercel.app';

async function testNomineeAPI() {
  console.log('🧪 Testing Nominee API in Production');
  console.log('=====================================');

  try {
    // Step 1: Get all nominees to find valid IDs
    console.log('\n1️⃣ Fetching all nominees...');
    const nomineesResponse = await fetch(`${BASE_URL}/api/nominees`);
    
    if (!nomineesResponse.ok) {
      throw new Error(`Failed to fetch nominees: ${nomineesResponse.status}`);
    }
    
    const nomineesResult = await nomineesResponse.json();
    
    if (!nomineesResult.success || !nomineesResult.data || nomineesResult.data.length === 0) {
      throw new Error('No nominees found in the system');
    }
    
    console.log(`✅ Found ${nomineesResult.data.length} nominees`);
    
    // Step 2: Test individual nominee lookup
    const testNominee = nomineesResult.data[0];
    console.log(`\n2️⃣ Testing individual nominee lookup for: ${testNominee.displayName || testNominee.name}`);
    console.log(`   ID: ${testNominee.id}`);
    
    const individualResponse = await fetch(`${BASE_URL}/api/nominees/${testNominee.id}`);
    
    if (!individualResponse.ok) {
      console.error(`❌ Individual lookup failed: ${individualResponse.status}`);
      const errorText = await individualResponse.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const individualResult = await individualResponse.json();
    
    if (!individualResult.success) {
      console.error('❌ Individual lookup returned error:', individualResult.error);
      return;
    }
    
    console.log('✅ Individual nominee lookup successful');
    console.log(`   Name: ${individualResult.data.displayName}`);
    console.log(`   Type: ${individualResult.data.type}`);
    console.log(`   Category: ${individualResult.data.category}`);
    console.log(`   Votes: ${individualResult.data.votes}`);
    
    // Step 3: Test the actual problematic URL
    const problematicId = '01c59007-141b-4058-8993-cb05e958fb5e';
    console.log(`\n3️⃣ Testing problematic ID: ${problematicId}`);
    
    const problematicResponse = await fetch(`${BASE_URL}/api/nominees/${problematicId}`);
    
    if (!problematicResponse.ok) {
      console.log(`⚠️  Problematic ID not found (${problematicResponse.status}) - this is expected if the ID doesn't exist`);
    } else {
      const problematicResult = await problematicResponse.json();
      if (problematicResult.success) {
        console.log('✅ Problematic ID found:', problematicResult.data.displayName);
      } else {
        console.log('⚠️  Problematic ID returned error:', problematicResult.error);
      }
    }
    
    // Step 4: Test frontend page access
    console.log(`\n4️⃣ Testing frontend page access...`);
    const pageResponse = await fetch(`${BASE_URL}/nominee/${testNominee.id}`);
    
    if (pageResponse.ok) {
      console.log('✅ Frontend page accessible');
    } else {
      console.log(`❌ Frontend page not accessible: ${pageResponse.status}`);
    }
    
    console.log('\n🎉 Testing complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Total nominees: ${nomineesResult.data.length}`);
    console.log(`   - API working: ✅`);
    console.log(`   - Individual lookup: ✅`);
    console.log(`   - Frontend routing: ${pageResponse.ok ? '✅' : '❌'}`);
    
    // Show first few nominee IDs for reference
    console.log('\n🔗 Available nominee IDs (first 5):');
    nomineesResult.data.slice(0, 5).forEach((nominee, index) => {
      console.log(`   ${index + 1}. ${nominee.id} - ${nominee.displayName || nominee.name}`);
      console.log(`      URL: ${BASE_URL}/nominee/${nominee.id}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testNomineeAPI();