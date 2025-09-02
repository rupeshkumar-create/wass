#!/usr/bin/env node

/**
 * Test Nomination Validation via API
 */

async function testNominationValidation() {
  console.log('🧪 Testing Nomination Validation via API...');
  
  try {
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
    
    const response = await fetch('http://localhost:3000/api/nominations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Validation passed!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.error('❌ Validation failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNominationValidation();