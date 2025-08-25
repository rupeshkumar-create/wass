#!/usr/bin/env node

/**
 * Test Validation Schema
 */

async function testValidation() {
  console.log('🧪 Testing Validation Schema...');
  
  try {
    // Import the validation schema
    const { NominationPersonSchema } = await import('../src/lib/validation.js');
    
    const testData = {
      category: 'Top Recruiter',
      nominator: {
        name: 'Test Nominator',
        email: 'test@example.com',
        phone: '+1-555-123-4567'
      },
      nominee: {
        name: 'Test Nominee',
        email: 'nominee@example.com',
        title: 'Senior Recruiter',
        country: 'United States',
        linkedin: 'https://linkedin.com/in/test-nominee',
        imageUrl: '/uploads/test-image.png'
      }
    };
    
    console.log('Testing data:', JSON.stringify(testData, null, 2));
    
    const result = NominationPersonSchema.parse(testData);
    console.log('✅ Validation passed!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    if (error.errors) {
      console.error('Errors:', JSON.stringify(error.errors, null, 2));
    }
  }
}

testValidation();