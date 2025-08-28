#!/usr/bin/env node

/**
 * Debug Real Form Data
 * Test with the exact data structure the form would have
 */

require('dotenv').config({ path: '.env.local' });

async function debugRealFormData() {
  console.log('🔍 Debugging Real Form Data Structure...\n');
  
  // Simulate the exact formData structure as it would be in the form
  const formData = {
    nominator: {
      // These might be undefined or have different property names
      email: undefined,
      firstName: undefined,
      lastName: undefined,
      linkedin: undefined
    },
    category: 'Top Recruiter', // This should be set
    personDetails: {
      name: '', // This might be empty
      email: '',
      title: '',
      whyVoteForMe: ''
    },
    personLinkedIn: {
      linkedin: ''
    },
    imageUrl: ''
  };
  
  console.log('1️⃣ Testing with empty form data (as it might be initially)...');
  console.log('Form data structure:', JSON.stringify(formData, null, 2));
  
  // Apply the same logic as the form
  const categoryMap = {
    "Top Recruiter": "top-recruiter",
    "Top Executive Leader": "top-executive-leader",
    "Top Staffing Influencer": "top-staffing-influencer",
    "Rising Star (Under 30)": "rising-star-under-30",
    "Top AI-Driven Staffing Platform": "top-ai-driven-staffing-platform",
    "Top Digital Experience for Clients": "top-digital-experience-for-clients",
    "Top Women-Led Staffing Firm": "top-women-led-staffing-firm",
    "Fastest Growing Staffing Firm": "fastest-growing-staffing-firm",
    "Best Staffing Process at Scale": "top-ai-driven-staffing-platform",
    "Thought Leadership & Influence": "top-thought-leader",
    "Top Staffing Company - USA": "top-staffing-company-usa",
    "Top Recruiting Leader - USA": "top-recruiting-leader-usa",
    "Top AI-Driven Staffing Platform - USA": "top-ai-driven-platform-usa",
    "Top Staffing Company - Europe": "top-staffing-company-europe",
    "Top Recruiting Leader - Europe": "top-recruiting-leader-europe",
    "Top AI-Driven Staffing Platform - Europe": "top-ai-driven-platform-europe",
    "Top Global Recruiter": "top-global-recruiter",
    "Top Global Staffing Leader": "top-global-staffing-leader",
    "Special Recognition": "rising-star-under-30"
  };
  
  const subcategoryId = categoryMap[formData.category] || '';
  const categoryGroupId = 'role-specific'; // Top Recruiter is in role-specific
  
  const payload = {
    type: 'person',
    categoryGroupId,
    subcategoryId,
    nominator: {
      email: formData.nominator.email || '',
      firstname: formData.nominator.firstName || '',
      lastname: formData.nominator.lastName || '',
      linkedin: formData.nominator.linkedin || '',
      nominatedDisplayName: formData.personDetails.name || ''
    },
    nominee: {
      firstname: formData.personDetails.name.split(' ')[0] || '',
      lastname: formData.personDetails.name.split(' ').slice(1).join(' ') || '',
      jobtitle: formData.personDetails.title || '',
      email: formData.personDetails.email || '',
      linkedin: formData.personLinkedIn.linkedin || '',
      headshotUrl: formData.imageUrl || '',
      whyMe: formData.personDetails.whyVoteForMe || ''
    }
  };
  
  console.log('Generated payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Would show success');
    } else {
      console.log('❌ Would show error:', result.error);
      console.log('   Details:', result.details);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  // Test 2: With realistic filled data
  console.log('\n2️⃣ Testing with realistic filled form data...');
  
  const filledFormData = {
    nominator: {
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      linkedin: 'https://linkedin.com/in/john-doe'
    },
    category: 'Top Recruiter',
    personDetails: {
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      title: 'Senior Recruiter',
      whyVoteForMe: 'I have 10+ years of experience in talent acquisition and have successfully placed over 500 candidates in various industries.'
    },
    personLinkedIn: {
      linkedin: 'https://linkedin.com/in/jane-smith'
    },
    imageUrl: 'https://example.com/jane-smith.jpg'
  };
  
  const filledPayload = {
    type: 'person',
    categoryGroupId: 'role-specific',
    subcategoryId: 'top-recruiter',
    nominator: {
      email: filledFormData.nominator.email || '',
      firstname: filledFormData.nominator.firstName || '',
      lastname: filledFormData.nominator.lastName || '',
      linkedin: filledFormData.nominator.linkedin || '',
      nominatedDisplayName: filledFormData.personDetails.name || ''
    },
    nominee: {
      firstname: filledFormData.personDetails.name.split(' ')[0] || '',
      lastname: filledFormData.personDetails.name.split(' ').slice(1).join(' ') || '',
      jobtitle: filledFormData.personDetails.title || '',
      email: filledFormData.personDetails.email || '',
      linkedin: filledFormData.personLinkedIn.linkedin || '',
      headshotUrl: filledFormData.imageUrl || '',
      whyMe: filledFormData.personDetails.whyVoteForMe || ''
    }
  };
  
  console.log('Filled payload:', JSON.stringify(filledPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filledPayload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Filled form would succeed');
      console.log('   Nomination ID:', result.nominationId);
    } else {
      console.log('❌ Filled form would fail:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Filled form network error:', error.message);
  }
  
  console.log('\n📊 Debug Summary:');
  console.log('   - Check if form data is properly populated');
  console.log('   - Verify required fields have values');
  console.log('   - Look for validation errors in API response');
}

debugRealFormData();