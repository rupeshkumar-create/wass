#!/usr/bin/env node

/**
 * Test the required headshot functionality
 */

require('dotenv').config({ path: '.env.local' });

async function testRequiredHeadshot() {
  try {
    console.log('🧪 Testing required headshot functionality...\n');

    // Test 1: Try to submit nomination without headshot (should fail)
    console.log('1️⃣ Testing nomination without headshot (should fail)...');
    
    const nominationWithoutHeadshot = {
      type: 'person',
      categoryGroupId: 'individual-awards',
      subcategoryId: 'recruiter-of-the-year',
      nominator: {
        email: 'test@example.com',
        firstname: 'Test',
        lastname: 'Nominator',
        linkedin: 'https://linkedin.com/in/test-nominator',
        nominatedDisplayName: 'Jane Doe'
      },
      nominee: {
        firstname: 'Jane',
        lastname: 'Doe',
        jobtitle: 'Senior Recruiter',
        email: 'jane@company.com',
        linkedin: 'https://linkedin.com/in/jane-doe',
        // headshotUrl: missing - should cause validation error
        whyMe: 'Outstanding performance in recruiting'
      }
    };

    const response1 = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nominationWithoutHeadshot)
    });

    const result1 = await response1.json();
    
    if (response1.status === 400 && result1.error === 'Invalid nomination data') {
      console.log('✅ Validation correctly rejected nomination without headshot');
      console.log('   Error details:', result1.details?.find(d => d.path.includes('headshotUrl'))?.message);
    } else {
      console.log('❌ Expected validation error for missing headshot');
      console.log('   Response:', result1);
    }

    // Test 2: Upload a test image
    console.log('\n2️⃣ Testing image upload to Supabase...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-headshot.png');
    formData.append('kind', 'headshot');
    formData.append('slug', 'test-required-headshot');

    const uploadResponse = await fetch('http://localhost:3000/api/uploads/image', {
      method: 'POST',
      body: formData
    });

    const uploadResult = await uploadResponse.json();
    
    if (uploadResult.ok && uploadResult.url) {
      console.log('✅ Image uploaded successfully to Supabase');
      console.log('   URL:', uploadResult.url);
      console.log('   Path:', uploadResult.path);
      
      // Test 3: Submit nomination with headshot (should succeed)
      console.log('\n3️⃣ Testing nomination with headshot (should succeed)...');
      
      const nominationWithHeadshot = {
        ...nominationWithoutHeadshot,
        nominee: {
          ...nominationWithoutHeadshot.nominee,
          headshotUrl: uploadResult.url
        }
      };

      const response3 = await fetch('http://localhost:3000/api/nomination/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nominationWithHeadshot)
      });

      const result3 = await response3.json();
      
      if (response3.status === 201 && result3.nominationId) {
        console.log('✅ Nomination with headshot submitted successfully');
        console.log('   Nomination ID:', result3.nominationId);
        console.log('   State:', result3.state);
      } else {
        console.log('❌ Failed to submit nomination with headshot');
        console.log('   Response:', result3);
      }
      
    } else {
      console.log('❌ Image upload failed');
      console.log('   Response:', uploadResult);
    }

    console.log('\n✅ Required headshot testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testRequiredHeadshot();