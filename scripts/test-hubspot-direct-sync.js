#!/usr/bin/env node

/**
 * Test HubSpot Direct Sync with Detailed Error Logging
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

if (!HUBSPOT_TOKEN) {
  console.error('❌ HUBSPOT_TOKEN environment variable is required');
  process.exit(1);
}

// HubSpot API client with detailed error logging
class HubSpotClient {
  constructor() {
    this.baseUrl = 'https://api.hubapi.com';
    this.token = HUBSPOT_TOKEN;
  }

  async hubFetch(path, options = {}) {
    const { method = 'GET', body, headers = {} } = options;
    
    const url = `${this.baseUrl}${path}`;
    
    const requestHeaders = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'WSA-2026-App/1.0',
      ...headers,
    };

    const requestOptions = {
      method,
      headers: requestHeaders,
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`🔍 ${method} ${url}`);
    if (body) {
      console.log('📤 Request body:', JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, requestOptions);
    
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = response.status === 204 ? null : await response.json();
      if (data) {
        console.log('✅ Response data:', JSON.stringify(data, null, 2));
      }
      return data;
    }

    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Error response:', JSON.stringify(errorData, null, 2));
    throw new Error(`HubSpot API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }
}

async function testNominatorSync() {
  console.log('\n🔍 Testing Nominator Sync...\n');
  
  const client = new HubSpotClient();
  
  const nominatorData = {
    email: '0a5m7@powerscrews.com',
    firstname: 'Rupesh',
    lastname: 'Nominator',
    lifecyclestage: 'lead',
    
    // Custom WSA properties
    wsa_role: 'Nominator',
    wsa_year: '2026',
    wsa_source: 'World Staffing Awards',
    wsa_nominator_status: 'submitted',
    wsa_submission_date: new Date().toISOString(),
    wsa_linkedin: 'https://linkedin.com/in/test',
    wsa_company: 'Test Company',
    wsa_job_title: 'Test Role',
    wsa_phone: '+1-555-0123',
    wsa_country: 'United States'
  };

  try {
    // First, try to search for existing contact
    console.log('🔍 Searching for existing contact...');
    const searchResult = await client.hubFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: nominatorData.email
          }]
        }],
        properties: ['email', 'firstname', 'lastname', 'wsa_role']
      }
    });

    if (searchResult.results && searchResult.results.length > 0) {
      const existingContact = searchResult.results[0];
      console.log(`✅ Found existing contact: ${existingContact.id}`);
      
      // Update existing contact
      console.log('\n🔄 Updating existing contact...');
      const updateResult = await client.hubFetch(`/crm/v3/objects/contacts/${existingContact.id}`, {
        method: 'PATCH',
        body: { properties: nominatorData }
      });
      
      console.log('✅ Contact updated successfully');
      return updateResult;
    } else {
      console.log('❌ No existing contact found');
      
      // Create new contact
      console.log('\n➕ Creating new contact...');
      const createResult = await client.hubFetch('/crm/v3/objects/contacts', {
        method: 'POST',
        body: { properties: nominatorData }
      });
      
      console.log('✅ Contact created successfully');
      return createResult;
    }
  } catch (error) {
    console.error('❌ Nominator sync failed:', error.message);
    throw error;
  }
}

async function testVoterSync() {
  console.log('\n🔍 Testing Voter Sync...\n');
  
  const client = new HubSpotClient();
  
  const voterData = {
    email: 'fowl36104@mailshan.com',
    firstname: 'Vivek',
    lastname: 'Voter',
    lifecyclestage: 'lead',
    
    // Custom WSA properties
    wsa_role: 'Voter',
    wsa_year: '2026',
    wsa_source: 'World Staffing Awards',
    wsa_voter_status: 'active',
    wsa_last_vote_date: new Date().toISOString(),
    wsa_voted_for: 'Vineet Nominess',
    wsa_vote_category: 'best-recruiter'
  };

  try {
    // Search for existing contact
    console.log('🔍 Searching for existing voter contact...');
    const searchResult = await client.hubFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: voterData.email
          }]
        }],
        properties: ['email', 'firstname', 'lastname', 'wsa_role']
      }
    });

    if (searchResult.results && searchResult.results.length > 0) {
      const existingContact = searchResult.results[0];
      console.log(`✅ Found existing voter contact: ${existingContact.id}`);
      
      // Update existing contact
      console.log('\n🔄 Updating existing voter contact...');
      const updateResult = await client.hubFetch(`/crm/v3/objects/contacts/${existingContact.id}`, {
        method: 'PATCH',
        body: { properties: voterData }
      });
      
      console.log('✅ Voter contact updated successfully');
      return updateResult;
    } else {
      console.log('❌ No existing voter contact found');
      
      // Create new contact
      console.log('\n➕ Creating new voter contact...');
      const createResult = await client.hubFetch('/crm/v3/objects/contacts', {
        method: 'POST',
        body: { properties: voterData }
      });
      
      console.log('✅ Voter contact created successfully');
      return createResult;
    }
  } catch (error) {
    console.error('❌ Voter sync failed:', error.message);
    throw error;
  }
}

async function testNomineeSync() {
  console.log('\n🔍 Testing Nominee Sync...\n');
  
  const client = new HubSpotClient();
  
  const nomineeData = {
    email: 'paxibaf121@ahanim.com',
    firstname: 'Vineet',
    lastname: 'Nominess',
    lifecyclestage: 'customer',
    
    // Custom WSA properties
    wsa_role: 'Nominee_Person',
    wsa_year: '2026',
    wsa_source: 'World Staffing Awards',
    wsa_nominee_type: 'person',
    wsa_nominee_status: 'approved',
    wsa_approval_date: new Date().toISOString(),
    wsa_category: 'best-recruiter',
    wsa_nomination_id: '5078d34c-053b-47fe-b238-83a08362ec94'
  };

  try {
    // Search for existing contact
    console.log('🔍 Searching for existing nominee contact...');
    const searchResult = await client.hubFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: nomineeData.email
          }]
        }],
        properties: ['email', 'firstname', 'lastname', 'wsa_role']
      }
    });

    if (searchResult.results && searchResult.results.length > 0) {
      const existingContact = searchResult.results[0];
      console.log(`✅ Found existing nominee contact: ${existingContact.id}`);
      
      // Update existing contact
      console.log('\n🔄 Updating existing nominee contact...');
      const updateResult = await client.hubFetch(`/crm/v3/objects/contacts/${existingContact.id}`, {
        method: 'PATCH',
        body: { properties: nomineeData }
      });
      
      console.log('✅ Nominee contact updated successfully');
      return updateResult;
    } else {
      console.log('❌ No existing nominee contact found');
      
      // Create new contact
      console.log('\n➕ Creating new nominee contact...');
      const createResult = await client.hubFetch('/crm/v3/objects/contacts', {
        method: 'POST',
        body: { properties: nomineeData }
      });
      
      console.log('✅ Nominee contact created successfully');
      return createResult;
    }
  } catch (error) {
    console.error('❌ Nominee sync failed:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 HubSpot Direct Sync Test');
  console.log('===========================');

  try {
    // Test nominator sync
    await testNominatorSync();
    
    // Test voter sync
    await testVoterSync();
    
    // Test nominee sync
    await testNomineeSync();
    
    console.log('\n🎉 All direct sync tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Direct sync test failed:', error.message);
    process.exit(1);
  }
}

main();