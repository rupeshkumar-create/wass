#!/usr/bin/env node

/**
 * Fix HubSpot Voter Tag - Update WSA Contact Tag property to include "WSA 2026 Voters"
 */

async function fixVoterTag() {
  try {
    console.log('🔄 Updating HubSpot WSA Contact Tag property...');

    // Load environment variables
    require('dotenv').config();
    
    // Import the HubSpot client
    const hubspotToken = process.env.HUBSPOT_TOKEN;
    
    if (!hubspotToken) {
      throw new Error('HUBSPOT_TOKEN environment variable is required');
    }

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

    const headers = {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json'
    };

    try {
      // Try to update the existing property
      const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/properties/contacts/wsa_contact_tag`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(propertyData),
      });

      if (updateResponse.ok) {
        console.log('✅ Updated existing WSA Contact Tag property');
      } else {
        throw new Error(`Update failed: ${updateResponse.status}`);
      }
    } catch (updateError) {
      console.log('ℹ️ Could not update existing property, trying to create new one...');
      
      // If update fails, try to create the property
      const createResponse = await fetch(`https://api.hubapi.com/crm/v3/properties/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(propertyData),
      });

      if (createResponse.ok) {
        console.log('✅ Created new WSA Contact Tag property');
      } else {
        const errorData = await createResponse.json();
        if (createResponse.status === 409) {
          console.log('ℹ️ Property already exists with correct configuration');
        } else {
          throw new Error(`Create failed: ${createResponse.status} - ${JSON.stringify(errorData)}`);
        }
      }
    }

    console.log('\n🎉 HubSpot voter tag fix completed!');
    console.log('📋 Summary:');
    console.log('  • Updated WSA Contact Tag property options');
    console.log('  • Voters will now be tagged as "WSA 2026 Voters"');
    console.log('  • Next voter sync will use the correct tag');

  } catch (error) {
    console.error('❌ Failed to fix voter tag:', error);
    process.exit(1);
  }
}

// Run the fix
fixVoterTag().catch(console.error);