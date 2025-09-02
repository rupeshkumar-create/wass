#!/usr/bin/env node

/**
 * Test Form Image Upload
 * Tests the FormData-based image upload that the form uses
 */

async function testFormImageUpload() {
  console.log('🧪 Testing Form Image Upload...');
  console.log('='.repeat(50));
  
  try {
    // Create a simple test image file
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    // Convert base64 to blob
    const response = await fetch(testImageData);
    const blob = await response.blob();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, 'test-headshot.png');
    formData.append('kind', 'headshot');
    formData.append('slug', 'test-nominee-form');
    
    console.log('📤 Uploading test image via FormData...');
    
    const uploadResponse = await fetch('http://localhost:3000/api/uploads/image', {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ Form image upload working!');
      console.log('   Result:', JSON.stringify(result, null, 2));
      
      // Test if the URL is accessible
      if (result.url) {
        console.log('\\n🔗 Testing image URL accessibility...');
        try {
          const imageResponse = await fetch(result.url);
          if (imageResponse.ok) {
            console.log('✅ Image URL is accessible');
          } else {
            console.log('❌ Image URL not accessible:', imageResponse.status);
          }
        } catch (error) {
          console.log('❌ Error accessing image URL:', error.message);
        }
      }
      
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Form image upload failed');
      console.log('   Status:', uploadResponse.status);
      console.log('   Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFormImageUpload();