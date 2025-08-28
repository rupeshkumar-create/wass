#!/usr/bin/env node

/**
 * Create Missing HubSpot Properties
 * Creates the wsa_industry and wsa_company_size properties
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const hubspotToken = process.env.HUBSPOT_TOKEN;

if (!hubspotToken) {
  console.error('❌ Missing HubSpot token');
  process.exit(1);
}

async function createMissingProperties() {
  console.log('🔧 Creating Missing HubSpot Properties');
  console.log('=====================================');

  const missingProperties = [
    {
      name: 'wsa_industry',
      label: 'WSA Industry',
      type: 'string',
      fieldType: 'text',
      description: 'Industry of the company nominee',
      groupName: 'contactinformation'
    },
    {
      name: 'wsa_company_size',
      label: 'WSA Company Size',
      type: 'string',
      fieldType: 'text',
      description: 'Size of the company nominee',
      groupName: 'contactinformation'
    }
  ];

  for (const property of missingProperties) {
    try {
      console.log(`\n🔧 Creating property: ${property.name}`);
      
      const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(property)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Created property: ${property.name}`);
        console.log(`   Property ID: ${data.name}`);
      } else {
        const error = await response.json();
        if (response.status === 409) {
          console.log(`ℹ️ Property already exists: ${property.name}`);
        } else {
          console.error(`❌ Failed to create property ${property.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating property ${property.name}:`, error.message);
    }
  }

  console.log('\n✅ Missing properties creation completed');
}

createMissingProperties().catch(error => {
  console.error('💥 Failed to create properties:', error);
  process.exit(1);
});