#!/usr/bin/env node

/**
 * Test LinkedIn URL syncing to HubSpot for all categories
 */

const fs = require('fs');
const path = require('path');

// Test data with LinkedIn URLs
const testNomination = {
  id: 'test-linkedin-sync',
  type: 'person',
  category: 'Recruiter of the Year',
  nominee: {
    name: 'John LinkedIn Test',
    linkedin: 'https://linkedin.com/in/john-test',
    country: 'United States'
  },
  liveUrl: '/nominee/john-linkedin-test'
};

const testCompanyNomination = {
  id: 'test-company-linkedin-sync',
  type: 'company',
  category: 'Staffing Company of the Year',
  nominee: {
    name: 'Test Company Inc',
    linkedin: 'https://linkedin.com/company/test-company',
    website: 'https://testcompany.com',
    country: 'United States'
  },
  liveUrl: '/nominee/test-company-inc'
};

const testVote = {
  category: 'Recruiter of the Year',
  nomineeId: 'test-linkedin-sync'
};

const testVoter = {
  name: 'Jane Voter Test',
  email: 'jane.voter@test.com',
  linkedin: 'https://linkedin.com/in/jane-voter',
  title: 'HR Director',
  company: 'Test Corp'
};

console.log('🔍 Testing LinkedIn URL Mapping for HubSpot Sync\n');

// Test the mappers directly
try {
  // Import the mappers (we'll need to adjust the path)
  const mappersPath = path.join(__dirname, '../src/integrations/hubspot/mappers-basic.ts');
  
  console.log('📋 Testing Nominee (Person) LinkedIn Mapping:');
  console.log('Input LinkedIn:', testNomination.nominee.linkedin);
  
  // We can't directly import TS files in Node, so let's show what should be mapped
  console.log('Expected HubSpot fields:');
  console.log('  - website:', testNomination.nominee.linkedin);
  console.log('  - linkedin_url:', testNomination.nominee.linkedin);
  // Removed wsa_linkedin_url - now using standard linkedin_url field
  console.log('');

  console.log('📋 Testing Company Nominee LinkedIn Mapping:');
  console.log('Input LinkedIn:', testCompanyNomination.nominee.linkedin);
  console.log('Expected HubSpot fields:');
  console.log('  - linkedin_url:', testCompanyNomination.nominee.linkedin);
  // Removed wsa_linkedin_url - now using standard linkedin_company_page field
  console.log('');

  console.log('📋 Testing Voter LinkedIn Mapping:');
  console.log('Input LinkedIn:', testVoter.linkedin);
  console.log('Expected HubSpot fields:');
  console.log('  - website:', testVoter.linkedin);
  console.log('  - linkedin_url:', testVoter.linkedin);
  // Removed wsa_linkedin_url - now using standard linkedin_url field
  console.log('');

  // Check if the mapper files exist and show their LinkedIn handling
  const basicMappersPath = path.join(__dirname, '../src/integrations/hubspot/mappers-basic.ts');
  if (fs.existsSync(basicMappersPath)) {
    const mappersContent = fs.readFileSync(basicMappersPath, 'utf8');
    
    console.log('✅ Verified mappers-basic.ts exists');
    
    // Check for LinkedIn URL mappings
    const hasLinkedInUrl = mappersContent.includes('linkedin_url:');
    const hasWsaLinkedInUrl = false; // No longer using custom wsa_linkedin_url field
    const hasWebsiteLinkedIn = mappersContent.includes('website: nominee.linkedin') || mappersContent.includes('website: voter.linkedin');
    
    console.log('LinkedIn URL Mappings Found:');
    console.log('  ✅ linkedin_url field:', hasLinkedInUrl ? 'YES' : 'NO');
    console.log('  ✅ wsa_linkedin_url field:', hasWsaLinkedInUrl ? 'YES' : 'NO');
    console.log('  ✅ website field (fallback):', hasWebsiteLinkedIn ? 'YES' : 'NO');
    
    if (hasLinkedInUrl && hasWsaLinkedInUrl) {
      console.log('\n🎉 SUCCESS: LinkedIn URLs are properly mapped for HubSpot sync!');
      console.log('\nAll categories (Nominees, Companies, Voters) will have their LinkedIn URLs synced to:');
      console.log('  - linkedin_url (HubSpot standard field)');
      console.log('  - wsa_linkedin_url (Custom WSA field)');
      console.log('  - website (fallback for contacts)');
    } else {
      console.log('\n⚠️  WARNING: Some LinkedIn URL mappings may be missing');
    }
  } else {
    console.log('❌ mappers-basic.ts file not found');
  }

  // Check sync.ts to confirm it's using the basic mappers
  const syncPath = path.join(__dirname, '../src/integrations/hubspot/sync.ts');
  if (fs.existsSync(syncPath)) {
    const syncContent = fs.readFileSync(syncPath, 'utf8');
    
    const usesBasicMappers = syncContent.includes('mapNomineeToContactBasic') && 
                            syncContent.includes('mapCompanyNomineeToCompanyBasic') && 
                            syncContent.includes('mapVoterToContactBasic');
    
    console.log('\n📡 Sync Configuration:');
    console.log('  ✅ Using Basic Mappers:', usesBasicMappers ? 'YES' : 'NO');
    
    if (usesBasicMappers) {
      console.log('  ✅ All sync functions will include LinkedIn URLs');
    } else {
      console.log('  ⚠️  Sync may not be using the LinkedIn-enabled mappers');
    }
  }

} catch (error) {
  console.error('❌ Error testing LinkedIn mapping:', error.message);
}

console.log('\n🔍 LinkedIn URL Sync Test Complete');
console.log('\nTo verify in HubSpot:');
console.log('1. Check contacts for "LinkedIn URL" field');
console.log('2. Check companies for "LinkedIn URL" field');
console.log('3. Look for custom "WSA LinkedIn URL" field in both');
console.log('4. Verify website field contains LinkedIn URL for contacts');