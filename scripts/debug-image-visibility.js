#!/usr/bin/env node

/**
 * Debug script to check image visibility issues
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function debugImageVisibility() {
  console.log('🔍 Debugging Image Visibility Issues...\n');

  try {
    // Test 1: Check nominees API response
    console.log('1️⃣ Checking nominees API response...');
    const nomineesResponse = await fetch(`${BASE_URL}/api/nominees`);
    
    if (!nomineesResponse.ok) {
      console.log('❌ Nominees API failed:', nomineesResponse.status);
      return;
    }

    const nomineesData = await nomineesResponse.json();
    
    if (nomineesData.success && nomineesData.data.length > 0) {
      console.log('✅ Nominees API working');
      console.log(`📊 Found ${nomineesData.data.length} nominees`);
      
      // Check image data for each nominee
      nomineesData.data.forEach((nominee, index) => {
        console.log(`\n📸 Nominee ${index + 1}: ${nominee.displayName || nominee.name}`);
        console.log(`   - Type: ${nominee.type}`);
        console.log(`   - Image URL: ${nominee.imageUrl || 'None'}`);
        console.log(`   - Nominee Image URL: ${nominee.nominee?.imageUrl || 'None'}`);
        
        if (nominee.type === 'person') {
          console.log(`   - Headshot URL: ${nominee.nominee?.headshotUrl || 'None'}`);
        } else {
          console.log(`   - Logo URL: ${nominee.nominee?.logoUrl || 'None'}`);
        }
      });
    } else {
      console.log('⚠️  No nominees found or API error');
    }

    // Test 2: Check admin nominations API
    console.log('\n2️⃣ Checking admin nominations API...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/nominations-improved`);
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      
      if (adminData.success && adminData.data.length > 0) {
        console.log('✅ Admin nominations API working');
        console.log(`📊 Found ${adminData.data.length} nominations in admin`);
        
        // Check image data in admin
        adminData.data.forEach((nomination, index) => {
          console.log(`\n🔧 Admin Nomination ${index + 1}: ${nomination.displayName}`);
          console.log(`   - Type: ${nomination.type}`);
          console.log(`   - Image URL: ${nomination.imageUrl || 'None'}`);
          console.log(`   - Headshot URL: ${nomination.headshotUrl || nomination.headshot_url || 'None'}`);
          console.log(`   - Logo URL: ${nomination.logoUrl || nomination.logo_url || 'None'}`);
        });
      }
    } else {
      console.log('⚠️  Admin API not accessible (expected if not authenticated)');
    }

    // Test 3: Check specific nominee page
    if (nomineesData.success && nomineesData.data.length > 0) {
      const firstNominee = nomineesData.data[0];
      console.log(`\n3️⃣ Checking individual nominee page for: ${firstNominee.displayName}`);
      
      const nomineePageResponse = await fetch(`${BASE_URL}/api/nominees/${firstNominee.id}`);
      
      if (nomineePageResponse.ok) {
        const nomineePageData = await nomineePageResponse.json();
        
        if (nomineePageData.success) {
          console.log('✅ Individual nominee API working');
          console.log(`📸 Individual nominee image data:`);
          console.log(`   - Image URL: ${nomineePageData.data?.imageUrl || 'None'}`);
          console.log(`   - Nominee Image URL: ${nomineePageData.data?.nominee?.imageUrl || 'None'}`);
        }
      } else {
        console.log('⚠️  Individual nominee API failed');
      }
    }

    console.log('\n🎯 Image Visibility Analysis:');
    console.log('   - Check if imageUrl fields are populated in API responses');
    console.log('   - Verify image URLs are accessible');
    console.log('   - Ensure frontend components are using correct image fields');
    console.log('   - Check database views include image_url fields');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugImageVisibility();