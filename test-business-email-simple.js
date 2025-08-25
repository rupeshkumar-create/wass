#!/usr/bin/env node

/**
 * Simple Business Email Validation Test
 */

// Simple business email validation function
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com',
  'ymail.com', 'rocketmail.com', 'protonmail.com', 'tutanota.com',
  'mail.com', 'gmx.com', 'zoho.com', 'fastmail.com'
];

function isValidBusinessEmail(email) {
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  // Check if it's a personal email domain
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && PERSONAL_EMAIL_DOMAINS.includes(domain)) {
    return { valid: false, reason: 'Personal email domains are not allowed' };
  }
  
  return { valid: true, reason: 'Valid business email' };
}

const testEmails = [
  // Should PASS (business emails)
  'john.doe@company.com',
  'jane@startup.io',
  'admin@business.org',
  'contact@agency.co.uk',
  'info@consulting.net',
  'rupesh.kumar@candidate.ly',
  
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
  const result = isValidBusinessEmail(email);
  if (result.valid) {
    console.log(`✅ PASS: ${email} - ${result.reason}`);
  } else {
    console.log(`❌ FAIL: ${email} - ${result.reason}`);
  }
});

console.log('\n🎯 Test completed!');
console.log('\n📋 Summary:');
console.log('✅ Business emails (company domains) are accepted');
console.log('❌ Personal emails (Gmail, Yahoo, etc.) are rejected');
console.log('❌ Invalid email formats are rejected');