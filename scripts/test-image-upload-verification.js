#!/usr/bin/env node

/**
 * Image Upload Verification Test
 * Tests that image uploads work end-to-end
 */

async function testImageUpload() {
  console.log('🖼️  Testing Image Upload Flow...');
  
  try {
    // Test 1: Check if server is running
    const healthCheck = await fetch('http://localhost:3010/api/stats');
    if (!healthCheck.ok) {
      console.error('❌ Server not running on port 3010');
      return;
    }
    
    console.log('✅ Server is running');
    
    // Test 2: Upload a test image
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    // Convert base64 to blob
    const response = await fetch(testImageBase64);
    const blob = await response.blob();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, 'test.png');
    formData.append('slug', 'image-test-verification');
    formData.append('kind', 'headshot');
    
    const uploadResponse = await fetch('http://localhost:3010/api/uploads/image', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('❌ Image upload failed:', error);
      return;
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Image uploaded successfully:', uploadResult.url);
    
    // Test 3: Verify image exists in storage
    const debugResponse = await fetch('http://localhost:3010/api/uploads/debug?slug=image-test-verification');
    const debugData = await debugResponse.json();
    
    if (debugData.files?.headshot?.exists) {
      console.log('✅ Image file exists in storage');
    } else {
      console.log('❌ Image file not found in storage');
    }
    
    console.log('\n🎉 Image upload test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageUpload();
