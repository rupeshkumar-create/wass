#!/usr/bin/env node

/**
 * Test Form Validation
 * Test that the form properly validates data before submission
 */

require('dotenv').config({ path: '.env.local' });

async function testFormValidation() {
  console.log('🧪 Testing Form Validation Logic...\n');
  
  // Test the validation logic that should be in the form
  const validateFormData = (formData, isPersonFlow) => {
    const errors = [];
    
    if (!formData.category) {
      errors.push("Please select a category.");
    }

    if (!formData.nominator.email || !formData.nominator.firstName || !formData.nominator.lastName) {
      errors.push("Please fill out all nominator information.");
    }

    if (isPersonFlow) {
      if (!formData.personDetails.name || !formData.personDetails.email || !formData.personDetails.title || !formData.personDetails.whyVoteForMe) {
        errors.push("Please fill out all nominee information.");
      }
    } else {
      if (!formData.companyDetails.name || !formData.companyDetails.website || !formData.companyDetails.whyVoteForMe) {
        errors.push("Please fill out all company information.");
      }
    }
    
    return errors;
  };
  
  // Test 1: Empty form data
  console.log('1️⃣ Testing empty form data...');
  
  const emptyFormData = {
    nominator: {},
    category: null,
    personDetails: { name: "", email: "", title: "", whyVoteForMe: "" },
    personLinkedIn: { linkedin: "" },
    imageUrl: "",
    companyDetails: { name: "", website: "", whyVoteForMe: "" },
    companyLinkedIn: { linkedin: "" },
    companyImageUrl: ""
  };
  
  const emptyErrors = validateFormData(emptyFormData, true);
  console.log('Empty form errors:', emptyErrors);
  
  if (emptyErrors.length > 0) {
    console.log('✅ Empty form correctly rejected');
  } else {
    console.log('❌ Empty form should be rejected');
  }
  
  // Test 2: Partially filled form
  console.log('\n2️⃣ Testing partially filled form...');
  
  const partialFormData = {
    nominator: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    },
    category: 'Top Recruiter',
    personDetails: { 
      name: "Jane Smith", 
      email: "", // Missing email
      title: "Senior Recruiter", 
      whyVoteForMe: "" // Missing why
    },
    personLinkedIn: { linkedin: "" },
    imageUrl: ""
  };
  
  const partialErrors = validateFormData(partialFormData, true);
  console.log('Partial form errors:', partialErrors);
  
  if (partialErrors.length > 0) {
    console.log('✅ Partial form correctly rejected');
  } else {
    console.log('❌ Partial form should be rejected');
  }
  
  // Test 3: Complete form data
  console.log('\n3️⃣ Testing complete form data...');
  
  const completeFormData = {
    nominator: {
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      linkedin: 'https://linkedin.com/in/john-doe'
    },
    category: 'Top Recruiter',
    personDetails: { 
      name: "Jane Smith", 
      email: "jane.smith@company.com",
      title: "Senior Recruiter", 
      whyVoteForMe: "I have 10+ years of experience in talent acquisition."
    },
    personLinkedIn: { linkedin: "https://linkedin.com/in/jane-smith" },
    imageUrl: "https://example.com/jane.jpg"
  };
  
  const completeErrors = validateFormData(completeFormData, true);
  console.log('Complete form errors:', completeErrors);
  
  if (completeErrors.length === 0) {
    console.log('✅ Complete form correctly accepted');
    
    // Test actual API submission with complete data
    console.log('\n4️⃣ Testing API submission with complete data...');
    
    const payload = {
      type: 'person',
      categoryGroupId: 'role-specific',
      subcategoryId: 'top-recruiter',
      nominator: {
        email: completeFormData.nominator.email,
        firstname: completeFormData.nominator.firstName,
        lastname: completeFormData.nominator.lastName,
        linkedin: completeFormData.nominator.linkedin || '',
        nominatedDisplayName: completeFormData.personDetails.name
      },
      nominee: {
        firstname: completeFormData.personDetails.name.split(' ')[0],
        lastname: completeFormData.personDetails.name.split(' ').slice(1).join(' '),
        jobtitle: completeFormData.personDetails.title,
        email: completeFormData.personDetails.email,
        linkedin: completeFormData.personLinkedIn.linkedin,
        headshotUrl: completeFormData.imageUrl,
        whyMe: completeFormData.personDetails.whyVoteForMe
      }
    };
    
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
      }
    } catch (error) {
      console.log('❌ API submission error:', error.message);
    }
    
  } else {
    console.log('❌ Complete form should be accepted');
  }
  
  console.log('\n📊 Validation Test Summary:');
  console.log('   - Empty forms should be rejected');
  console.log('   - Partial forms should be rejected');
  console.log('   - Complete forms should be accepted');
  console.log('   - API should accept valid payloads');
}

testFormValidation();