#!/usr/bin/env node

/**
 * Fix HubSpot Voter Tag - Update WSA Contact Tag property to include "WSA 2026 Voters"
 */

const { hubspotClient } = require('../src/server/hubspot/client.ts');

async function fixVoterTag() {
  try {
    console.log('🔄 Updating HubSpot WSA Contact Tag property...');

    // Update the wsa_contact_tag property to include the correct voter tag
    const propertyData = {
      name: 'wsa_contact_tag',
      label: 'WSA Contact Tag',
      type: 'enumeration',
      fieldType: 'select',
      groupName: 'contactinformation',
      options: [
        { label: 'WSA2026 Nominator', value: 'WSA2026 Nominator' },
        { label: 'WSA 2026 Nominees', value: 'WSA 2026 Nominees' },
        { label: 'WSA 2026 Voters', value: 'WSA 2026 Voters' }
      ]
    };

    try {
      // Try to update the existing property
      await hubspotClient.hubFetch('/crm/v3/properties/contacts/wsa_contact_tag', {
        method: 'PATCH',
        body: propertyData,
      });
      console.log('✅ Updated existing WSA Contact Tag property');
    } catch (updateError) {
      console.log('ℹ️ Could not update existing property, trying to create new one...');
      
      // If update fails, try to create the property
      await hubspotClient.hubFetch('/crm/v3/properties/contacts', {
        method: 'POST',
        body: propertyData,
      });
      console.log('✅ Created new WSA Contact Tag property');
    }

    // Test the sync with a sample voter
    console.log('🧪 Testing voter sync with updated tag...');
    
    const { syncVoterToHubSpot } = require('../src/server/hubspot/realtime-sync.ts');
    
    const testVoterData = {
      firstname: 'Test',
      lastname: 'Voter',
      email: 'test.voter@example.com',
      linkedin: 'https://linkedin.com/in/testvoter',
      company: 'Test Company',
      jobTitle: 'Test Role',
      country: 'United States',
      votedFor: 'Test Nominee',
      subcategoryId: 'test-category',
    };

    const syncResult = await syncVoterToHubSpot(testVoterData);
    
    if (syncResult.success) {
      console.log(`✅ Test voter sync successful: Contact ID ${syncResult.contactId}`);
      console.log('🏷️ Voter should now be tagged as "WSA 2026 Voters"');
    } else {
      console.error(`❌ Test voter sync failed: ${syncResult.error}`);
    }

    console.log('\n🎉 HubSpot voter tag fix completed!');
    console.log('📋 Summary:');
    console.log('  • Updated WSA Contact Tag property options');
    console.log('  • Voters will now be tagged as "WSA 2026 Voters"');
    console.log('  • Tested sync functionality');

  } catch (error) {
    console.error('❌ Failed to fix voter tag:', error);
    process.exit(1);
  }
}

// Run the fix
fixVoterTag().catch(console.error);