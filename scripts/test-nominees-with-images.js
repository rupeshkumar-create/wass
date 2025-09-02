#!/usr/bin/env node

/**
 * Test the nominees API to verify images are being returned correctly
 */

require('dotenv').config({ path: '.env.local' });

async function testNomineesAPI() {
  try {
    console.log('🧪 Testing nominees API with images...\n');

    // Test 1: Get all approved nominees
    console.log('1️⃣ Getting all approved nominees...');
    
    const response = await fetch('http://localhost:3000/api/nominees');
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log(`✅ Found ${result.count} approved nominees`);
      
      // Check if any have images
      const nomineesWithImages = result.data.filter(nominee => nominee.imageUrl);
      const nomineesWithoutImages = result.data.filter(nominee => !nominee.imageUrl);
      
      console.log(`   📸 ${nomineesWithImages.length} nominees have images`);
      console.log(`   🚫 ${nomineesWithoutImages.length} nominees missing images`);
      
      // Show sample nominee data
      if (result.data.length > 0) {
        const sample = result.data[0];
        console.log('\n📋 Sample nominee:');
        console.log(`   Name: ${sample.name}`);
        console.log(`   Type: ${sample.type}`);
        console.log(`   Category: ${sample.category}`);
        console.log(`   Votes: ${sample.votes}`);
        console.log(`   Image URL: ${sample.imageUrl || 'None'}`);
        console.log(`   Live URL: ${sample.liveUrl || 'None'}`);
        
        if (sample.imageUrl) {
          console.log('\n🔗 Testing image URL accessibility...');
          try {
            const imageResponse = await fetch(sample.imageUrl, { method: 'HEAD' });
            if (imageResponse.ok) {
              console.log('✅ Image URL is accessible');
              console.log(`   Content-Type: ${imageResponse.headers.get('content-type')}`);
              console.log(`   Content-Length: ${imageResponse.headers.get('content-length')} bytes`);
            } else {
              console.log(`❌ Image URL returned ${imageResponse.status}`);
            }
          } catch (imageError) {
            console.log(`❌ Image URL not accessible: ${imageError.message}`);
          }
        }
      }
      
    } else {
      console.log('❌ Failed to get nominees');
      console.log('   Response:', result);
    }

    // Test 2: Get nominees for specific category
    console.log('\n2️⃣ Getting nominees for specific category...');
    
    const categoryResponse = await fetch('http://localhost:3000/api/nominees?subcategoryId=top-recruiter');
    const categoryResult = await categoryResponse.json();
    
    if (categoryResult.success) {
      console.log(`✅ Found ${categoryResult.count} nominees in 'top-recruiter' category`);
      
      if (categoryResult.data.length > 0) {
        const withImages = categoryResult.data.filter(n => n.imageUrl).length;
        console.log(`   📸 ${withImages} have images`);
      }
    } else {
      console.log('❌ Failed to get category nominees');
      console.log('   Response:', categoryResult);
    }

    console.log('\n✅ Nominees API testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNomineesAPI();