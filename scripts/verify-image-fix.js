#!/usr/bin/env node

/**
 * Script to verify image visibility fix is working
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function verifyImageFix() {
  console.log('🔍 Verifying Image Visibility Fix...\n');

  try {
    // Test 1: Check nominees API for images
    console.log('1️⃣ Testing nominees API for image visibility...');
    const nomineeResponse = await fetch(`${BASE_URL}/api/nominees`);
    
    if (!nomineeResponse.ok) {
      console.log('❌ Nominees API failed:', nomineeResponse.status);
      return;
    }

    const nomineeData = await nomineeResponse.json();
    
    if (nomineeData.success && nomineeData.data.length > 0) {
      const nomineesWithImages = nomineeData.data.filter(n => n.imageUrl || n.image_url);
      const totalNominees = nomineeData.data.length;
      
      console.log('✅ Nominees API working');
      console.log(`   - Total nominees: ${totalNominees}`);
      console.log(`   - Nominees with images: ${nomineesWithImages.length}`);
      console.log(`   - Nominees without images: ${totalNominees - nomineesWithImages.length}`);
      
      // Show sample image URLs
      if (nomineesWithImages.length > 0) {
        console.log('\n📸 Sample image URLs:');
        nomineesWithImages.slice(0, 3).forEach((nominee, index) => {
          const imageUrl = nominee.imageUrl || nominee.image_url;
          console.log(`   ${index + 1}. ${nominee.displayName || nominee.display_name}: ${imageUrl}`);
        });
      }
    } else {
      console.log('⚠️  No nominees found or API error');
    }

    // Test 2: Check admin nominations API for images
    console.log('\n2️⃣ Testing admin nominations API for image visibility...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/nominations-improved`);
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      
      if (adminData.success && adminData.data.length > 0) {
        const adminNomineesWithImages = adminData.data.filter(n => 
          n.imageUrl || n.headshotUrl || n.headshot_url || n.logoUrl || n.logo_url
        );
        
        console.log('✅ Admin nominations API working');
        console.log(`   - Total nominations: ${adminData.data.length}`);
        console.log(`   - Nominations with images: ${adminNomineesWithImages.length}`);
        
        // Show sample admin image data
        if (adminNomineesWithImages.length > 0) {
          console.log('\n📸 Sample admin image data:');
          adminNomineesWithImages.slice(0, 3).forEach((nom, index) => {
            const imageUrl = nom.imageUrl || nom.headshotUrl || nom.headshot_url || nom.logoUrl || nom.logo_url;
            console.log(`   ${index + 1}. ${nom.displayName || 'Unknown'} (${nom.type}): ${imageUrl}`);
          });
        }
      }
    } else {
      console.log('⚠️  Admin API not accessible (expected if not authenticated)');
    }

    // Test 3: Check specific image URL accessibility
    console.log('\n3️⃣ Testing image URL accessibility...');
    
    if (nomineeData.success && nomineeData.data.length > 0) {
      const nomineeWithImage = nomineeData.data.find(n => n.imageUrl || n.image_url);
      
      if (nomineeWithImage) {
        const imageUrl = nomineeWithImage.imageUrl || nomineeWithImage.image_url;
        console.log(`   Testing image: ${imageUrl}`);
        
        try {
          const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
          if (imageResponse.ok) {
            console.log('✅ Image URL accessible');
          } else {
            console.log(`⚠️  Image URL returned status: ${imageResponse.status}`);
          }
        } catch (error) {
          console.log('⚠️  Image URL fetch error:', error.message);
        }
      } else {
        console.log('⚠️  No nominees with images found to test');
      }
    }

    console.log('\n🎉 Image visibility verification completed!');
    console.log('\n📋 What the SQL fix does:');
    console.log('   ✅ Updates public_nominees view with proper image_url field');
    console.log('   ✅ Updates admin_nominations view with nominee_image_url field');
    console.log('   ✅ Handles both person (headshot_url) and company (logo_url) images');
    console.log('   ✅ Filters out empty/null image URLs');
    console.log('   ✅ Creates proper indexes for performance');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyImageFix();