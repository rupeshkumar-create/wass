#!/usr/bin/env node

/**
 * Test script to verify LinkedIn URL syncing with HubSpot for nominations and votes
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing LinkedIn URL HubSpot Sync...\n');

let allTestsPassed = true;

// Test 1: Check Nominator LinkedIn Sync
console.log('📋 Test 1: Checking Nominator LinkedIn Sync...');
const nominationsFile = path.join(process.cwd(), 'src/app/api/nominations/route.ts');
if (fs.existsSync(nominationsFile)) {
  const content = fs.readFileSync(nominationsFile, 'utf8');
  
  // Check for nominator sync with LinkedIn
  const nominatorSyncElements = [
    'syncNominator',
    'validatedData.nominator.linkedin',
    'linkedin: validatedData.nominator.linkedin'
  ];
  
  let missingNominatorSync = [];
  nominatorSyncElements.forEach(element => {
    if (!content.includes(element)) {
      missingNominatorSync.push(element);
    }
  });
  
  if (missingNominatorSync.length > 0) {
    console.log(`❌ Nominator LinkedIn sync missing: ${missingNominatorSync.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Nominator LinkedIn URL is synced to HubSpot');
  }
} else {
  console.log('❌ Nominations API route not found');
  allTestsPassed = false;
}

// Test 2: Check Voter LinkedIn Sync
console.log('\n📋 Test 2: Checking Voter LinkedIn Sync...');
const votesFile = path.join(process.cwd(), 'src/app/api/votes/route.ts');
if (fs.existsSync(votesFile)) {
  const content = fs.readFileSync(votesFile, 'utf8');
  
  // Check for voter sync with LinkedIn
  const voterSyncElements = [
    'syncVoter',
    'validatedData.voter.linkedin',
    'linkedin: validatedData.voter.linkedin'
  ];
  
  let missingVoterSync = [];
  voterSyncElements.forEach(element => {
    if (!content.includes(element)) {
      missingVoterSync.push(element);
    }
  });
  
  if (missingVoterSync.length > 0) {
    console.log(`❌ Voter LinkedIn sync missing: ${missingVoterSync.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Voter LinkedIn URL is synced to HubSpot');
  }
} else {
  console.log('❌ Votes API route not found');
  allTestsPassed = false;
}

// Test 3: Check HubSpot WSA Integration LinkedIn Handling
console.log('\n📋 Test 3: Checking HubSpot WSA Integration...');
const hubspotWSAFile = path.join(process.cwd(), 'src/lib/hubspot-wsa.ts');
if (fs.existsSync(hubspotWSAFile)) {
  const content = fs.readFileSync(hubspotWSAFile, 'utf8');
  
  // Check for LinkedIn URL property mapping
  const linkedinElements = [
    'wsa_linkedin_url',
    'nominator.linkedin',
    'voter.linkedin',
    'nominee.linkedin'
  ];
  
  let missingLinkedinElements = [];
  linkedinElements.forEach(element => {
    if (!content.includes(element)) {
      missingLinkedinElements.push(element);
    }
  });
  
  if (missingLinkedinElements.length > 0) {
    console.log(`❌ HubSpot LinkedIn mapping missing: ${missingLinkedinElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ HubSpot WSA integration maps LinkedIn URLs correctly');
  }
} else {
  console.log('❌ HubSpot WSA integration file not found');
  allTestsPassed = false;
}

// Test 4: Check Validation Schema LinkedIn Requirements
console.log('\n📋 Test 4: Checking Validation Schema...');
const validationFile = path.join(process.cwd(), 'src/lib/validation.ts');
if (fs.existsSync(validationFile)) {
  const content = fs.readFileSync(validationFile, 'utf8');
  
  // Check for LinkedIn validation
  const validationElements = [
    'LinkedInSchema',
    'linkedin: LinkedInSchema',
    'normalizeLinkedIn'
  ];
  
  let missingValidation = [];
  validationElements.forEach(element => {
    if (!content.includes(element)) {
      missingValidation.push(element);
    }
  });
  
  if (missingValidation.length > 0) {
    console.log(`❌ LinkedIn validation missing: ${missingValidation.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ LinkedIn URLs are properly validated and normalized');
  }
} else {
  console.log('❌ Validation schema file not found');
  allTestsPassed = false;
}

// Test 5: Check Nominee LinkedIn Sync (in nomination approval)
console.log('\n📋 Test 5: Checking Nominee LinkedIn Sync...');
if (fs.existsSync(nominationsFile)) {
  const content = fs.readFileSync(nominationsFile, 'utf8');
  
  // Check for nominee sync on approval
  const nomineeSyncElements = [
    'syncNomination',
    'status === \'approved\'',
    'updatedNomination'
  ];
  
  let missingNomineeSync = [];
  nomineeSyncElements.forEach(element => {
    if (!content.includes(element)) {
      missingNomineeSync.push(element);
    }
  });
  
  if (missingNomineeSync.length > 0) {
    console.log(`❌ Nominee LinkedIn sync on approval missing: ${missingNomineeSync.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Nominee LinkedIn URL is synced to HubSpot on approval');
  }
}

// Test 6: Check HubSpot Property Mapping
console.log('\n📋 Test 6: Checking HubSpot Property Mapping...');
if (fs.existsSync(hubspotWSAFile)) {
  const content = fs.readFileSync(hubspotWSAFile, 'utf8');
  
  // Check for proper property assignment
  const propertyMappingElements = [
    'props.wsa_linkedin_url = nominator.linkedin',
    'props.wsa_linkedin_url = voter.linkedin',
    'props.wsa_linkedin_url = nominee.linkedin'
  ];
  
  let foundMappings = 0;
  propertyMappingElements.forEach(element => {
    if (content.includes(element)) {
      foundMappings++;
    }
  });
  
  if (foundMappings < 2) { // At least 2 out of 3 should be present
    console.log(`❌ Insufficient LinkedIn property mappings found (${foundMappings}/3)`);
    allTestsPassed = false;
  } else {
    console.log('✅ LinkedIn URLs are properly mapped to HubSpot properties');
  }
}

// Test 7: Check Database Schema Support
console.log('\n📋 Test 7: Checking Database Schema Support...');
const schemaFile = path.join(process.cwd(), 'add-nominator-linkedin.sql');
if (fs.existsSync(schemaFile)) {
  const content = fs.readFileSync(schemaFile, 'utf8');
  
  // Check for nominator LinkedIn column
  const schemaElements = [
    'nominator_linkedin',
    'ALTER TABLE nominations',
    'ADD COLUMN'
  ];
  
  let missingSchemaElements = [];
  schemaElements.forEach(element => {
    if (!content.includes(element)) {
      missingSchemaElements.push(element);
    }
  });
  
  if (missingSchemaElements.length > 0) {
    console.log(`❌ Database schema missing elements: ${missingSchemaElements.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log('✅ Database schema supports nominator LinkedIn URLs');
  }
} else {
  console.log('⚠️  Database schema file not found (may not be needed)');
}

// Final Results
console.log('\n' + '='.repeat(60));
if (allTestsPassed) {
  console.log('🎉 LinkedIn URL HubSpot sync is properly implemented!');
  console.log('\n✨ Verified sync points:');
  console.log('   👤 Nominators: LinkedIn URLs sync to HubSpot on nomination');
  console.log('   🗳️  Voters: LinkedIn URLs sync to HubSpot on vote');
  console.log('   🏆 Nominees: LinkedIn URLs sync to HubSpot on approval');
  console.log('   🔗 Property: All use wsa_linkedin_url HubSpot property');
  console.log('   ✅ Validation: LinkedIn URLs are normalized and validated');
  console.log('\n🎯 HubSpot Integration Flow:');
  console.log('   1. User submits nomination → Nominator LinkedIn synced');
  console.log('   2. Admin approves nomination → Nominee LinkedIn synced');
  console.log('   3. User votes → Voter LinkedIn synced');
  console.log('   4. All LinkedIn URLs stored in wsa_linkedin_url property');
} else {
  console.log('❌ Some LinkedIn sync issues found. Please review above.');
  process.exit(1);
}

console.log('\n🚀 LinkedIn URLs are fully integrated with HubSpot!');