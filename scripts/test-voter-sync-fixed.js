#!/usr/bin/env node

/**
 * Test Voter Sync with Fixed Tag
 */

async function testVoterSync() {
  try {
    console.log('🧪 Testing voter sync with fixed "WSA 2026 Voters" tag...');

    // Load environment variables
    require('dotenv').config();
    
    // Import the sync function
    const { syncVoterToHubSpot } = require('../src/server/hubspot/realtime-sync.ts');
    
    const testVoterData = {
      firstname: 'Test',
      lastname: 'Voter',
      email: 'test.voter.fixed@example.com',
      linkedin: 'https://linkedin.com/in/testvoter',
      company: 'Test Company',
      jobTitle: 'Test Role',
      country: 'United States',
      votedFor: 'Test Nominee',
      subcategoryId: 'test-category',
    };

    console.log('📤 Syncing test voter:', testVoterData.email);

    const syncResult = await syncVoterToHubSpot(testVoterData);
    
    if (syncResult.success) {
      console.log(`✅ Voter sync successful!`);
      console.log(`📋 Contact ID: ${syncResult.contactId}`);
      console.log('🏷️ Voter should be tagged as "WSA 2026 Voters"');
      
      // Verify the contact was created with correct tag
      const hubspotToken = process.env.HUBSPOT_TOKEN;
      const headers = {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      };

      const contactResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${syncResult.contactId}?properties=wsa_contact_tag,wsa_role,wsa_year`, {
        headers
      });

      if (contactResponse.ok) {
        const contactData = await contactResponse.json();
        console.log('\n📊 Contact verification:');
        console.log(`  • WSA Contact Tag: ${contactData.properties.wsa_contact_tag || 'Not set'}`);
        console.log(`  • WSA Role: ${contactData.properties.wsa_role || 'Not set'}`);
        console.log(`  • WSA Year: ${contactData.properties.wsa_year || 'Not set'}`);
        
        if (contactData.properties.wsa_contact_tag === 'WSA 2026 Voters') {
          console.log('🎉 SUCCESS: Voter is correctly tagged as "WSA 2026 Voters"!');
        } else {
          console.log('❌ ERROR: Voter tag is incorrect');
        }
      }
    } else {
      console.error(`❌ Voter sync failed: ${syncResult.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testVoterSync().catch(console.error);