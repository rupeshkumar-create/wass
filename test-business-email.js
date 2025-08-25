#!/usr/bin/env node

/**
 * Test Business Email Validation
 */

// Import the validation schema
const { BusinessEmailSchema } = require('./src/lib/validation.ts');

const testEmails = [
  // Should PASS (business emails)
  'john.doe@company.com',
  'jane@startup.io',
  'admin@business.org',
  'contact@agency.co.uk',
  'info@consulting.net',
  
  // Should FAIL (personal emails)
  'user@gmail.com',
  'test@yahoo.com',
  'person@hotmail.com',
  'someone@outlook.com',
  'user@icloud.com',
  'test@protonmail.com',
  
  // Should FAIL (invalid emails)
  'invalid-email',
  'no-at-symbol.com',
  '@domain.com',
  'user@',
];

console.log('🧪 Testing Business Email Validation...\n');

testEmails.forEach(email => {
  try {
    BusinessEmailSchema.parse(email);
    console.log(`✅ PASS: ${email}`);
  } catch (error) {
    console.log(`❌ FAIL: ${email} - ${error.errors?.[0]?.message || error.message}`);
  }
});

console.log('\n🎯 Test completed!');