#!/usr/bin/env node

/**
 * Debug Form Data Structure
 * Check what the actual form data structure looks like
 */

console.log('🔍 Debugging Form Data Structure...\n');

// Let's check what the form components are expecting
console.log('1️⃣ Expected form data structure based on interface:');

const expectedFormData = {
  // Step 2
  nominator: {
    // What properties does this actually have?
    email: "string",
    firstName: "string", // or firstname?
    lastName: "string",  // or lastname?
    linkedin: "string"
  },
  
  // Step 3
  category: "Category | null",
  
  // Step 4 (Person)
  personDetails: {
    name: "string",
    email: "string",
    title: "string", // or jobtitle?
    country: "string",
    whyVoteForMe: "string" // or whyMe?
  },
  
  // Step 6 (Person)
  personLinkedIn: {
    linkedin: "string"
  },
  
  // Step 7 (Person)
  imageUrl: "string",
  
  // Step 8 (Company)
  companyDetails: {
    name: "string",
    website: "string",
    country: "string",
    whyVoteForMe: "string" // or whyUs?
  },
  
  // Step 9 (Company)
  companyLinkedIn: {
    linkedin: "string"
  },
  
  // Step 10 (Company)
  companyImageUrl: "string"
};

console.log(JSON.stringify(expectedFormData, null, 2));

console.log('\n2️⃣ Checking validation logic:');
console.log('The form is checking:');
console.log('- formData.nominator.firstName (but might be firstname)');
console.log('- formData.nominator.lastName (but might be lastname)');
console.log('- formData.personDetails.title (but might be jobtitle)');
console.log('- formData.personDetails.whyVoteForMe (but might be whyMe)');

console.log('\n3️⃣ Potential issues:');
console.log('- Property name mismatch between form components and validation');
console.log('- Form components might use different property names');
console.log('- Need to check what Step2Nominator actually sets');
console.log('- Need to check what Step4PersonDetails actually sets');

console.log('\n4️⃣ Solution:');
console.log('- Check form component implementations');
console.log('- Align validation with actual property names');
console.log('- Add debug logging to see actual form data');
console.log('- Test with console.log in handleSubmit');

console.log('\n💡 Next steps:');
console.log('1. Check Step2Nominator component to see what properties it sets');
console.log('2. Check Step4PersonDetails component to see what properties it sets');
console.log('3. Add console.log in handleSubmit to see actual formData');
console.log('4. Fix validation to match actual property names');