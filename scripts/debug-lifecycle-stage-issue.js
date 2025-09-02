#!/usr/bin/env node

/**
 * Debug lifecycle stage issue for specific email
 * Check current HubSpot contact and fix lifecycle stage
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

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

async function debugLifecycleStage() {
  try {
    const email = 'kibenaf740@besaies.com';
    
    console.log(`🔍 Checking contact: ${email}`);
    
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
    console.log('- Created:', contact.properties.createdate);
    
    // Check if lifecycle stage is not 'lead'
    if (contact.properties.lifecyclestage !== 'lead') {
      console.log(`\n🔧 Fixing lifecycle stage from '${contact.properties.lifecyclestage}' to 'lead'`);
      
      const response = await hubFetch(`/crm/v3/objects/contacts/${contact.id}`, {
        method: 'PATCH',
        body: {
          properties: {
            lifecyclestage: 'lead'
          }
        }
      });
      
      console.log('✅ Updated lifecycle stage to lead');
      console.log('📋 Updated properties:');
      console.log('- Lifecycle Stage:', response.properties.lifecyclestage);
    } else {
      console.log('✅ Lifecycle stage is already set to lead');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugLifecycleStage();