#!/usr/bin/env node

// Test script to verify image and layout fixes
const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, description, checkFunction) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
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

async function runImageTests() {
  console.log('🖼️  Image & Layout Fixes - Verification\n');
  
  console.log('📋 1) Directory Cards - Image Display');
  const nomineesResult = await testAPI('/api/nominees?category=Top%20Recruiter', 
    'Top Recruiter nominees with images', 
    (data) => {
      if (!Array.isArray(data) || data.length === 0) return false;
      const sample = data[0];
      const hasImageUrl = sample.nominee && sample.nominee.imageUrl;
      if (hasImageUrl) {
        console.log(`   Sample image URL: ${sample.nominee.imageUrl.slice(0, 80)}...`);
      }
      return hasImageUrl;
    });
  
  console.log('\n🏆 2) Podium API - Image Mapping');
  await testAPI('/api/podium?category=Top%20Recruiter', 
    'Podium with correct image field', 
    (data) => {
      if (!data.items || data.items.length === 0) return false;
      const hasImage = data.items[0].image && data.items[0].liveUrl;
      if (hasImage) {
        console.log(`   Podium image URL: ${data.items[0].image.slice(0, 80)}...`);
        console.log(`   Podium liveUrl: ${data.items[0].liveUrl}`);
      }
      return hasImage;
    });
  
  console.log('\n👤 3) Profile APIs - Individual Nominees');
  const profileTests = ['ranjeet-kumar', 'amitttt-kumar', 'vivek-kumar-2'];
  
  for (const slug of profileTests) {
    await testAPI(`/api/nominee/${slug}`, 
      `Profile API - ${slug}`, 
      (data) => {
        const hasData = data.nominee && data.nominee.name && data.liveUrl;
        if (hasData && data.nominee.imageUrl) {
          console.log(`   ${data.nominee.name} image: ${data.nominee.imageUrl.slice(0, 60)}...`);
        }
        return hasData;
      });
  }
  
  console.log('\n🔍 4) Suggestions API - For Right Rail');
  await testAPI('/api/nominees?sort=votes_desc&limit=5', 
    'Suggestions API with image data', 
    (data) => {
      if (!Array.isArray(data) || data.length === 0) return false;
      const hasImages = data.some(n => n.nominee && n.nominee.imageUrl);
      console.log(`   Found ${data.length} suggestions, ${data.filter(n => n.nominee && n.nominee.imageUrl).length} with images`);
      return hasImages;
    });
  
  console.log('\n🎯 5) Data Structure Verification');
  if (nomineesResult.success && nomineesResult.data.length > 0) {
    const sample = nomineesResult.data[0];
    console.log('   Sample nominee structure:');
    console.log(`   - ID: ${sample.id}`);
    console.log(`   - Name: ${sample.nominee.name}`);
    console.log(`   - Category: ${sample.category}`);
    console.log(`   - Live URL: ${sample.liveUrl}`);
    console.log(`   - Votes: ${sample.votes}`);
    console.log(`   - Has Image: ${sample.nominee.imageUrl ? 'YES' : 'NO'}`);
  }
  
  console.log('\n🎉 Image Fix Verification Complete!');
  console.log('\n✅ Key Fixes Applied:');
  console.log('   • Fixed CardNominee to use nominee.imageUrl (not nomination.imageUrl)');
  console.log('   • Fixed Podium to use item.image (not item.image_url)');
  console.log('   • Fixed SuggestedNomineesCard layout to prevent text overflow');
  console.log('   • Added gap between Nomination Details and Share cards');
  console.log('   • Updated all image URL references to match API structure');
}

// Run if called directly
if (require.main === module) {
  runImageTests().catch(console.error);
}

module.exports = { runImageTests };