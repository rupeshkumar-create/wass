#!/usr/bin/env node

/**
 * Setup HubSpot Custom Properties for World Staffing Awards 2026
 * JavaScript version that can run directly with Node.js
 */

require('dotenv').config();

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

if (!HUBSPOT_TOKEN) {
  console.error('❌ HUBSPOT_TOKEN environment variable is required');
  process.exit(1);
}

// HubSpot API client
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

    const response = await fetch(url, requestOptions);
    
    if (response.ok) {
      return response.status === 204 ? null : await response.json();
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HubSpot API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }
}

async function testConnection(client) {
  console.log('🔍 Testing HubSpot connection...');
  
  try {
    const accountInfo = await client.hubFetch('/account-info/v3/details');
    console.log('✅ HubSpot connection successful');
    console.log('Account Portal ID:', accountInfo?.portalId);
    return accountInfo;
  } catch (error) {
    console.error('❌ HubSpot connection failed:', error.message);
    throw error;
  }
}

async function setupCustomProperties(client) {
  console.log('\n🔧 Creating custom properties...');
  
  const requiredProperties = [
    { name: 'wsa_role', label: 'WSA Role', type: 'enumeration', options: ['Nominator', 'Voter', 'Nominee_Person', 'Nominee_Company'] },
    { name: 'wsa_year', label: 'WSA Year', type: 'string' },
    { name: 'wsa_source', label: 'WSA Source', type: 'string' },
    { name: 'wsa_tags', label: 'WSA Tags', type: 'string' },
    { name: 'wsa_linkedin', label: 'WSA LinkedIn', type: 'string' },
    { name: 'wsa_company', label: 'WSA Company', type: 'string' },
    { name: 'wsa_job_title', label: 'WSA Job Title', type: 'string' },
    { name: 'wsa_phone', label: 'WSA Phone', type: 'string' },
    { name: 'wsa_country', label: 'WSA Country', type: 'string' },
    { name: 'wsa_category', label: 'WSA Category', type: 'string' },
    { name: 'wsa_nomination_id', label: 'WSA Nomination ID', type: 'string' },
    { name: 'wsa_nominee_type', label: 'WSA Nominee Type', type: 'enumeration', options: ['person', 'company'] },
    { name: 'wsa_nominee_status', label: 'WSA Nominee Status', type: 'enumeration', options: ['submitted', 'approved', 'rejected'] },
    { name: 'wsa_nominator_status', label: 'WSA Nominator Status', type: 'enumeration', options: ['submitted', 'approved', 'rejected'] },
    { name: 'wsa_voter_status', label: 'WSA Voter Status', type: 'enumeration', options: ['active', 'inactive'] },
    { name: 'wsa_submission_date', label: 'WSA Submission Date', type: 'string' },
    { name: 'wsa_approval_date', label: 'WSA Approval Date', type: 'string' },
    { name: 'wsa_last_vote_date', label: 'WSA Last Vote Date', type: 'string' },
    { name: 'wsa_voted_for', label: 'WSA Voted For', type: 'string' },
    { name: 'wsa_vote_category', label: 'WSA Vote Category', type: 'string' },
    { name: 'wsa_company_name', label: 'WSA Company Name', type: 'string' },
    { name: 'wsa_website', label: 'WSA Website', type: 'string' },
  ];

  const created = [];

  for (const property of requiredProperties) {
    try {
      const propertyData = {
        name: property.name,
        label: property.label,
        type: property.type,
        fieldType: property.type === 'enumeration' ? 'select' : 'text',
        groupName: 'contactinformation',
      };

      if (property.options) {
        propertyData.options = property.options.map(option => ({
          label: option,
          value: option,
        }));
      }

      await client.hubFetch('/crm/v3/properties/contacts', {
        method: 'POST',
        body: propertyData,
      });

      created.push(property.name);
      console.log(`✅ Created custom property: ${property.name}`);
    } catch (error) {
      if (error.message.includes('409')) {
        console.log(`ℹ️ Property already exists: ${property.name}`);
      } else {
        console.warn(`⚠️ Failed to create property ${property.name}:`, error.message);
      }
    }
  }

  return { success: true, created };
}

async function main() {
  console.log('🚀 Setting up HubSpot Custom Properties for WSA 2026');
  console.log('====================================================');

  try {
    const client = new HubSpotClient();
    
    // Test connection
    await testConnection(client);
    
    // Setup custom properties
    const result = await setupCustomProperties(client);

    if (result.success) {
      console.log('✅ Custom properties setup completed successfully!');
      
      if (result.created.length > 0) {
        console.log('\n📝 Created properties:');
        result.created.forEach(prop => {
          console.log(`  - ${prop}`);
        });
      } else {
        console.log('\nℹ️ All properties already existed');
      }

      console.log('\n🎯 HubSpot is now ready for real-time sync!');
      console.log('\nNext steps:');
      console.log('1. Start the dev server: npm run dev');
      console.log('2. Test the integration with: npm run test:hubspot');
      console.log('3. Submit a test nomination to verify nominator sync');
      console.log('4. Approve a nomination to verify nominee sync');
      console.log('5. Cast a vote to verify voter sync');

    } else {
      console.error('❌ Custom properties setup failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

main();