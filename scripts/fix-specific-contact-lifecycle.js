#!/usr/bin/env node

/**
 * Fix specific contact lifecycle stage using our updated sync logic
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Create properties directly
function createContactProps() {
  return {
    lifecyclestage: 'lead',
    source: 'WSA26',
    source_detail: 'WSS26',
    wsa_year: 2026,
    wsa_role: 'Nominee_Person'
  };
}

// Direct HubSpot API calls
async function hubFetch(endpoint, options = {}) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_TOKEN;
  if (!token) {
    throw new Error('HubSpot token not found');
  }

  const url = `https://api.hubapi.com${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...(options.body && { body: JSON.stringify(options.body) })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot API error: ${response.status} ${error}`);
  }

  return response.json();
}

async function searchContactByEmail(email) {
  try {
    const response = await hubFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: ['email', 'firstname', 'lastname', 'lifecyclestage', 'source', 'wsa_role', 'createdate'],
        limit: 1
      }
    });

    return response.results?.[0] || null;
  } catch (error) {
    console.error(`Error searching for contact ${email}:`, error);
    return null;
  }
}

async function fixContactLifecycle() {
  try {
    const email = 'kibenaf740@besaies.com';
    
    console.log(`🔍 Fixing contact lifecycle: ${email}`);
    
    // Search for the contact
    const contact = await searchContactByEmail(email);
    
    if (!contact) {
      console.log('❌ Contact not found');
      return;
    }
    
    console.log('📋 Current contact properties:');
    console.log('- ID:', contact.id);
    console.log('- Email:', contact.properties.email);
    console.log('- Lifecycle Stage:', contact.properties.lifecyclestage);
    console.log('- Source:', contact.properties.source);
    console.log('- WSA Role:', contact.properties.wsa_role);
    
    // Create updated properties directly
    const updatedProps = createContactProps();
    
    console.log('\n🔧 Updating with new properties:');
    console.log('- Lifecycle Stage:', updatedProps.lifecyclestage);
    console.log('- Source:', updatedProps.source);
    console.log('- Source Detail:', updatedProps.source_detail);
    console.log('- WSA Year:', updatedProps.wsa_year);
    
    // Update the contact with our mapping
    const response = await hubFetch(`/crm/v3/objects/contacts/${contact.id}`, {
      method: 'PATCH',
      body: {
        properties: updatedProps
      }
    });
    
    console.log('\n✅ Updated contact successfully');
    console.log('📋 New properties:');
    console.log('- Lifecycle Stage:', response.properties.lifecyclestage);
    console.log('- Source:', response.properties.source);
    console.log('- Source Detail:', response.properties.source_detail);
    
    // Wait a moment and check again
    console.log('\n⏳ Waiting 3 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalCheck = await searchContactByEmail(email);
    console.log('\n📋 Final check:');
    console.log('- Lifecycle Stage:', finalCheck.properties.lifecyclestage);
    console.log('- Source:', finalCheck.properties.source);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

fixContactLifecycle();