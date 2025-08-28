#!/usr/bin/env node

/**
 * Test Fixed Form Submission
 * Test the form submission with the corrected payload structure
 */

require('dotenv').config({ path: '.env.local' });

async function testFixedFormSubmission() {
  console.log('🧪 Testing Fixed Form Submission...\n');
  
  // Test 1: Simulate form data as it would be filled out
  console.log('1️⃣ Testing with realistic form data...');
  
  const formData = {
    category: 'Top Recruiter', // Old category format
    nominator: {
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      linkedin: 'https://linkedin.com/in/john-doe'
    },
    personDetails: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      title: 'Senior Recruiter',
      whyVoteForMe: 'I have 10+ years of experience in talent acquisition.'
    },
    personLinkedIn: {
      linkedin: 'https://linkedin.com/in/jane-smith'
    },
    imageUrl: 'https://example.com/jane.jpg'
  };
  
  // Map old category to new format (same logic as in the form)
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
  
  const payload = {
    type: 'person',
    categoryGroupId: 'role-specific', // Top Recruiter is in role-specific group
    subcategoryId,
    nominator: {
      email: formData.nominator.email,
      firstname: formData.nominator.firstName,
      lastname: formData.nominator.lastName,
      linkedin: formData.nominator.linkedin,
      nominatedDisplayName: formData.personDetails.name
    },
    nominee: {
      firstname: formData.personDetails.name.split(' ')[0],
      lastname: formData.personDetails.name.split(' ').slice(1).join(' '),
      jobtitle: formData.personDetails.title,
      email: formData.personDetails.email,
      linkedin: formData.personLinkedIn.linkedin,
      headshotUrl: formData.imageUrl,
      whyMe: formData.personDetails.whyVoteForMe
    }
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Form submission successful!');
      console.log(`   Nomination ID: ${result.nominationId}`);
      console.log(`   State: ${result.state}`);
    } else {
      console.log('❌ Form submission failed:');
      console.log('   Status:', response.status);
      console.log('   Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('❌ Form submission error:', error.message);
  }
  
  // Test 2: Test company nomination
  console.log('\n2️⃣ Testing company nomination...');
  
  const companyFormData = {
    category: 'Top AI-Driven Staffing Platform',
    nominator: {
      email: 'nominator@company.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      linkedin: 'https://linkedin.com/in/alice-johnson'
    },
    companyDetails: {
      name: 'TechStaff Solutions',
      website: 'https://techstaff.com',
      whyVoteForMe: 'We revolutionized recruitment with AI technology.'
    },
    companyLinkedIn: {
      linkedin: 'https://linkedin.com/company/techstaff-solutions'
    },
    companyImageUrl: 'https://example.com/techstaff-logo.jpg'
  };
  
  const companySubcategoryId = categoryMap[companyFormData.category] || '';
  
  const companyPayload = {
    type: 'company',
    categoryGroupId: 'innovation-tech',
    subcategoryId: companySubcategoryId,
    nominator: {
      email: companyFormData.nominator.email,
      firstname: companyFormData.nominator.firstName,
      lastname: companyFormData.nominator.lastName,
      linkedin: companyFormData.nominator.linkedin,
      nominatedDisplayName: companyFormData.companyDetails.name
    },
    nominee: {
      name: companyFormData.companyDetails.name,
      website: companyFormData.companyDetails.website,
      linkedin: companyFormData.companyLinkedIn.linkedin,
      logoUrl: companyFormData.companyImageUrl,
      whyUs: companyFormData.companyDetails.whyVoteForMe
    }
  };
  
  console.log('Company payload:', JSON.stringify(companyPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyPayload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Company nomination successful!');
      console.log(`   Nomination ID: ${result.nominationId}`);
      console.log(`   State: ${result.state}`);
    } else {
      console.log('❌ Company nomination failed:');
      console.log('   Status:', response.status);
      console.log('   Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('❌ Company nomination error:', error.message);
  }
  
  console.log('\n📊 Fixed Form Test Summary:');
  console.log('   - Proper category mapping from old to new format');
  console.log('   - Correct payload structure with all required fields');
  console.log('   - Both person and company nomination flows');
}

testFixedFormSubmission();