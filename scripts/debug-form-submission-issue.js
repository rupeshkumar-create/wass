#!/usr/bin/env node

/**
 * Debug form submission issues
 * This script helps identify what's going wrong with form submissions
 */

require('dotenv').config({ path: '.env.local' });

async function debugFormSubmission() {
  try {
    console.log('🔍 Debugging form submission issues...\n');

    // Test 1: Check if server is running
    console.log('1️⃣ Checking server status...');
    try {
      const response = await fetch('http://localhost:3000/api/nominees');
      if (response.ok) {
        console.log('✅ Server is running');
      } else {
        console.log(`❌ Server returned status: ${response.status}`);
        return;
      }
    } catch (error) {
      console.log('❌ Server is not accessible. Make sure to run: npm run dev');
      return;
    }

    // Test 2: Check nomination submit endpoint
    console.log('\n2️⃣ Testing nomination submit endpoint...');
    try {
      const testPayload = {
        type: 'person',
        categoryGroupId: 'individual-awards',
        subcategoryId: 'recruiter-of-the-year',
        nominator: {
          email: 'debug@test.com',
          firstname: 'Debug',
          lastname: 'Test',
          linkedin: 'https://linkedin.com/in/debug-test',
          nominatedDisplayName: 'Debug Nominee'
        },
        nominee: {
          firstname: 'Debug',
          lastname: 'Nominee',
          jobtitle: 'Test Role',
          email: 'debug.nominee@test.com',
          linkedin: 'https://linkedin.com/in/debug-nominee',
          headshotUrl: 'https://example.com/test.jpg',
          whyMe: 'This is a debug test submission'
        }
      };

      const response = await fetch('http://localhost:3000/api/nomination/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('Response body:', JSON.stringify(result, null, 2));

      if (response.ok) {
        console.log('✅ Nomination submit endpoint is working');
      } else {
        console.log('❌ Nomination submit endpoint has issues');
      }
    } catch (error) {
      console.log('❌ Error testing nomination submit endpoint:', error.message);
    }

    // Test 3: Check image upload endpoint
    console.log('\n3️⃣ Testing image upload endpoint...');
    try {
      // Create a simple test image
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
      formData.append('file', blob, 'debug-test.png');
      formData.append('kind', 'headshot');
      formData.append('slug', 'debug-test');

      const uploadResponse = await fetch('http://localhost:3000/api/uploads/image', {
        method: 'POST',
        body: formData
      });

      console.log(`Upload response status: ${uploadResponse.status}`);
      const uploadResult = await uploadResponse.json();
      console.log('Upload response body:', JSON.stringify(uploadResult, null, 2));

      if (uploadResult.ok) {
        console.log('✅ Image upload endpoint is working');
      } else {
        console.log('❌ Image upload endpoint has issues');
      }
    } catch (error) {
      console.log('❌ Error testing image upload endpoint:', error.message);
    }

    // Test 4: Check browser console errors
    console.log('\n4️⃣ Browser debugging instructions:');
    console.log('To debug form submission in the browser:');
    console.log('1. Open browser developer tools (F12)');
    console.log('2. Go to the Console tab');
    console.log('3. Go to the Network tab');
    console.log('4. Try submitting the form');
    console.log('5. Look for:');
    console.log('   - JavaScript errors in Console');
    console.log('   - Failed network requests in Network tab');
    console.log('   - Check if POST requests to /api/nomination/submit are being made');
    console.log('   - Check response status and body of any failed requests');

    // Test 5: Check common issues
    console.log('\n5️⃣ Common issues to check:');
    console.log('• Form validation preventing submission');
    console.log('• Missing required fields (especially headshot for person nominations)');
    console.log('• JavaScript errors preventing form submission');
    console.log('• Network connectivity issues');
    console.log('• CORS issues (unlikely in development)');
    console.log('• Server-side validation errors');

    console.log('\n6️⃣ Next steps:');
    console.log('1. Check the browser console for errors when submitting');
    console.log('2. Check the Network tab to see if requests are being made');
    console.log('3. If no requests are made, it\'s likely a client-side issue');
    console.log('4. If requests are made but fail, check the response for error details');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugFormSubmission();