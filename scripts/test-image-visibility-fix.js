#!/usr/bin/env node

/**
 * Test script to verify image visibility fixes
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testImageVisibilityFix() {
  console.log('🧪 Testing Image Visibility Fixes...\n');

  try {
    // Test 1: Check nominees API for image data
    console.log('1️⃣ Testing nominees API image data...');
    const nomineesResponse = await fetch(`${BASE_URL}/api/nominees`);
    
    if (!nomineesResponse.ok) {
      console.log('❌ Nominees API failed:', nomineesResponse.status);
      return;
    }

    const nomineesData = await nomineesResponse.json();
    
    if (nomineesData.success && nomineesData.data.length > 0) {
      console.log('✅ Nominees API working');
      console.log(`📊 Found ${nomineesData.data.length} nominees`);
      
      let nomineesWithImages = 0;
      let nomineesWithoutImages = 0;
      
      nomineesData.data.forEach((nominee, index) => {
        const hasImage = nominee.imageUrl || 
                        nominee.nominee?.imageUrl || 
                        nominee.nominee?.headshotUrl || 
                        nominee.nominee?.logoUrl;
        
        if (hasImage) {
          nomineesWithImages++;
          console.log(`✅ ${nominee.displayName || nominee.name} - HAS IMAGE`);
          console.log(`   📸 Image URL: ${hasImage}`);
        } else {
          nomineesWithoutImages++;
          console.log(`❌ ${nominee.displayName || nominee.name} - NO IMAGE`);
        }
      });
      
      console.log(`\n📊 Image Statistics:`);
      console.log(`   ✅ With images: ${nomineesWithImages}`);
      console.log(`   ❌ Without images: ${nomineesWithoutImages}`);
      console.log(`   📈 Image coverage: ${((nomineesWithImages / nomineesData.data.length) * 100).toFixed(1)}%`);
      
    } else {
      console.log('⚠️  No nominees found');
    }

    // Test 2: Check admin nominations API
    console.log('\n2️⃣ Testing admin nominations API image data...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/nominations-improved`);
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      
      if (adminData.success && adminData.data.length > 0) {
        console.log('✅ Admin nominations API working');
        
        let adminImagesCount = 0;
        adminData.data.forEach((nomination) => {
          const hasImage = nomination.imageUrl || 
                          nomination.headshotUrl || 
                          nomination.headshot_url || 
                          nomination.logoUrl || 
                          nomination.logo_url;
          
          if (hasImage) {
            adminImagesCount++;
          }
        });
        
        console.log(`📊 Admin images: ${adminImagesCount}/${adminData.data.length}`);
      }
    } else {
      console.log('⚠️  Admin API not accessible (authentication required)');
    }

    // Test 3: Test directory page functionality
    console.log('\n3️⃣ Testing directory page...');
    const directoryResponse = await fetch(`${BASE_URL}/directory`);
    
    if (directoryResponse.ok) {
      console.log('✅ Directory page accessible');
    } else {
      console.log('❌ Directory page failed:', directoryResponse.status);
    }

    // Test 4: Test individual nominee page
    if (nomineesData.success && nomineesData.data.length > 0) {
      const firstNominee = nomineesData.data[0];
      console.log(`\n4️⃣ Testing individual nominee page: ${firstNominee.displayName}`);
      
      const nomineePageResponse = await fetch(`${BASE_URL}/nominee/${firstNominee.id}`);
      
      if (nomineePageResponse.ok) {
        console.log('✅ Individual nominee page accessible');
      } else {
        console.log('❌ Individual nominee page failed:', nomineePageResponse.status);
      }
    }

    console.log('\n🎉 Image visibility test completed!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('   ✅ Updated database views to properly expose image URLs');
    console.log('   ✅ Enhanced nominees API to map image fields correctly');
    console.log('   ✅ Improved image utility with better fallback logic');
    console.log('   ✅ Added debug logging for development');
    console.log('   ✅ Fixed CardNominee component image handling');

    console.log('\n🔧 Next steps if images still not showing:');
    console.log('   1. Run the IMAGE_VISIBILITY_FIX.sql in Supabase');
    console.log('   2. Check if image URLs in database are valid');
    console.log('   3. Verify image upload functionality is working');
    console.log('   4. Check browser console for image loading errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testImageVisibilityFix();