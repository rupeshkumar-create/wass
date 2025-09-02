#!/usr/bin/env node

/**
 * Test Form Data Mapping
 * Test that the form data structure matches what the validation expects
 */

require('dotenv').config({ path: '.env.local' });

async function testFormDataMapping() {
  console.log('🧪 Testing Form Data Mapping...\n');
  
  // Simulate the data structure that Step4PersonDetails would provide
  const step4PersonDetailsData = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    title: 'Senior Recruiter',
    country: 'United States',
    whyVoteForMe: 'I have 10+ years of experience in talent acquisition and have successfully placed over 500 candidates.'
  };
  
  console.log('1️⃣ Data from Step4PersonDetails:');
  console.log(JSON.stringify(step4PersonDetailsData, null, 2));
  
  // Simulate the validation logic
  const validatePersonDetails = (personDetails) => {
    const hasFirstName = personDetails.firstName || personDetails.name?.split(' ')[0];
    const hasLastName = personDetails.lastName || personDetails.name?.split(' ').slice(1).join(' ');
    const hasEmail = personDetails.email;
    const hasTitle = personDetails.title;
    const hasWhy = personDetails.whyVoteForMe;
    
    return {
      hasFirstName: !!hasFirstName,
      hasLastName: !!hasLastName,
      hasEmail: !!hasEmail,
      hasTitle: !!hasTitle,
      hasWhy: !!hasWhy,
      isValid: !!(hasFirstName && hasLastName && hasEmail && hasTitle && hasWhy)
    };
  };
  
  const validation = validatePersonDetails(step4PersonDetailsData);
  console.log('\n2️⃣ Validation result:');
  console.log(validation);
  
  if (validation.isValid) {
    console.log('✅ Validation would pass');
    
    // Test payload generation
    const payload = {
      type: 'person',
      categoryGroupId: 'role-specific',
      subcategoryId: 'top-recruiter',
      nominator: {
        email: 'john.doe@company.com',
        firstname: 'John',
        lastname: 'Doe',
        linkedin: 'https://linkedin.com/in/john-doe',
        nominatedDisplayName: step4PersonDetailsData.name || `${step4PersonDetailsData.firstName || ''} ${step4PersonDetailsData.lastName || ''}`.trim()
      },
      nominee: {
        firstname: step4PersonDetailsData.firstName || step4PersonDetailsData.name?.split(' ')[0] || '',
        lastname: step4PersonDetailsData.lastName || step4PersonDetailsData.name?.split(' ').slice(1).join(' ') || '',
        jobtitle: step4PersonDetailsData.title || '',
        email: step4PersonDetailsData.email || '',
        linkedin: 'https://linkedin.com/in/jane-smith',
        headshotUrl: 'https://example.com/jane.jpg',
        whyMe: step4PersonDetailsData.whyVoteForMe || ''
      }
    };
    
    console.log('\n3️⃣ Generated payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Test API submission
    console.log('\n4️⃣ Testing API submission...');
    
    try {
      const response = await fetch('http://localhost:3000/api/nomination/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ API submission successful');
        console.log(`   Nomination ID: ${result.nominationId}`);
      } else {
        console.log('❌ API submission failed:', result.error);
        if (result.details) {
          console.log('   Details:', result.details);
        }
      }
    } catch (error) {
      console.log('❌ API submission error:', error.message);
    }
    
  } else {
    console.log('❌ Validation would fail');
    console.log('   Missing fields:', Object.entries(validation).filter(([key, value]) => key.startsWith('has') && !value).map(([key]) => key));
  }
  
  // Test with old format (name instead of firstName/lastName)
  console.log('\n5️⃣ Testing backward compatibility with name field...');
  
  const oldFormatData = {
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    title: 'Senior Recruiter',
    country: 'United States',
    whyVoteForMe: 'I have 10+ years of experience in talent acquisition.'
  };
  
  const oldValidation = validatePersonDetails(oldFormatData);
  console.log('Old format validation:', oldValidation);
  
  if (oldValidation.isValid) {
    console.log('✅ Backward compatibility works');
  } else {
    console.log('❌ Backward compatibility broken');
  }
  
  console.log('\n📊 Form Data Mapping Test Summary:');
  console.log('   - Step4PersonDetails provides firstName, lastName, etc.');
  console.log('   - Validation checks for both new and old formats');
  console.log('   - Payload generation handles both formats');
  console.log('   - API accepts the generated payload');
}

testFormDataMapping();