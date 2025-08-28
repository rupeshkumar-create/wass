#!/usr/bin/env node

/**
 * Test the form validation logic to see what might be preventing submission
 */

console.log('🧪 Testing form validation logic...\n');

// Simulate the validation logic from the form
function testFormValidation() {
  console.log('1️⃣ Testing validation scenarios:\n');

  // Test case 1: Complete person nomination
  const completePersonForm = {
    category: "Top Recruiter",
    nominator: {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      linkedin: "https://linkedin.com/in/john-doe"
    },
    personDetails: {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@company.com",
      title: "Senior Recruiter",
      whyVoteForMe: "Excellent performance"
    },
    personLinkedIn: {
      linkedin: "https://linkedin.com/in/jane-smith"
    },
    imageUrl: "https://example.com/headshot.jpg"
  };

  console.log('✅ Complete person form validation:');
  const personValidation = validateForm(completePersonForm, true);
  console.log('   Result:', personValidation);

  // Test case 2: Person nomination without headshot
  const personWithoutHeadshot = {
    ...completePersonForm,
    imageUrl: ""
  };

  console.log('\n❌ Person form without headshot:');
  const noHeadshotValidation = validateForm(personWithoutHeadshot, true);
  console.log('   Result:', noHeadshotValidation);

  // Test case 3: Person nomination with missing fields
  const incompletePersonForm = {
    ...completePersonForm,
    personDetails: {
      firstName: "Jane",
      // lastName missing
      email: "jane@company.com",
      title: "Senior Recruiter"
      // whyVoteForMe missing
    }
  };

  console.log('\n❌ Incomplete person form:');
  const incompleteValidation = validateForm(incompletePersonForm, true);
  console.log('   Result:', incompleteValidation);

  // Test case 4: Complete company nomination
  const completeCompanyForm = {
    category: "Top Staffing Company - USA",
    nominator: {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      linkedin: "https://linkedin.com/in/john-doe"
    },
    companyDetails: {
      name: "TechStaff Inc",
      website: "https://techstaff.com",
      whyVoteForMe: "Leading company in tech recruitment"
    },
    companyLinkedIn: {
      linkedin: "https://linkedin.com/company/techstaff"
    },
    companyImageUrl: "https://example.com/logo.jpg"
  };

  console.log('\n✅ Complete company form validation:');
  const companyValidation = validateForm(completeCompanyForm, false);
  console.log('   Result:', companyValidation);
}

function validateForm(formData, isPersonFlow) {
  const errors = [];

  // Category validation
  if (!formData.category) {
    errors.push("Please select a category.");
  }

  // Nominator validation
  if (!formData.nominator.email || !formData.nominator.firstName || !formData.nominator.lastName) {
    errors.push("Please fill out all nominator information.");
  }

  if (isPersonFlow) {
    // Person validation
    const hasFirstName = formData.personDetails?.firstName || formData.personDetails?.name?.split(' ')[0];
    const hasLastName = formData.personDetails?.lastName || formData.personDetails?.name?.split(' ').slice(1).join(' ');
    const hasEmail = formData.personDetails?.email;
    const hasTitle = formData.personDetails?.title;
    const hasWhy = formData.personDetails?.whyVoteForMe;
    
    if (!hasFirstName || !hasLastName || !hasEmail || !hasTitle || !hasWhy) {
      errors.push("Please fill out all nominee information.");
    }

    // Headshot validation (this is the key one!)
    if (!formData.imageUrl) {
      errors.push("Professional headshot is required for person nominations.");
    }
  } else {
    // Company validation
    if (!formData.companyDetails?.name || !formData.companyDetails?.website || !formData.companyDetails?.whyVoteForMe) {
      errors.push("Please fill out all company information.");
    }

    // Logo validation
    if (!formData.companyImageUrl) {
      errors.push("Company logo is required for company nominations.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

testFormValidation();

console.log('\n🔍 Key validation points:');
console.log('• Category must be selected');
console.log('• Nominator email, firstName, lastName required');
console.log('• For persons: firstName, lastName, email, title, whyVoteForMe, imageUrl required');
console.log('• For companies: name, website, whyVoteForMe, companyImageUrl required');

console.log('\n🚨 Most likely issue: Missing headshot/logo image');
console.log('The form requires imageUrl (for persons) or companyImageUrl (for companies) to be set.');
console.log('This happens in Step 6 (person headshot) or Step 9 (company logo).');

console.log('\n🔧 To debug in browser:');
console.log('1. Fill out the form completely');
console.log('2. Before clicking submit, open console and type:');
console.log('   console.log("Form data:", window.formData || "not available");');
console.log('3. Check if imageUrl or companyImageUrl is set');
console.log('4. If not set, the image upload step may have failed');

console.log('\n📝 Next steps:');
console.log('1. Use the browser debugging script provided earlier');
console.log('2. Pay special attention to the image upload step');
console.log('3. Check if the image upload completes successfully');
console.log('4. Verify the imageUrl is stored in form state');