#!/usr/bin/env npx tsx

/**
 * Basic HubSpot Sync Test
 * 
 * Tests basic contact/company creation without custom properties
 */

import 'dotenv/config';

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const HUBSPOT_BASE_URL = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';

if (!HUBSPOT_TOKEN) {
  console.error('❌ HUBSPOT_PRIVATE_APP_TOKEN not configured');
  process.exit(1);
}

async function makeRequest(url: string, options: any = {}) {
  const response = await fetch(`${HUBSPOT_BASE_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function testBasicSync() {
  console.log('🚀 Testing Basic HubSpot Sync');
  console.log('='.repeat(40));

  try {
    // Test 1: Create a basic contact
    console.log('\\n👤 Creating test contact...');
    const contactData = {
      properties: {
        firstname: 'Test',
        lastname: 'Nominee WSA 2026',
        email: `test-nominee-${Date.now()}@worldstaffingawards.com`,
        jobtitle: 'Senior Recruiter at Test Company',
        // Using standard properties only
      }
    };

    const contact = await makeRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });

    console.log(`✅ Created contact: ${contact.id} (${contactData.properties.email})`);

    // Test 2: Create a basic company
    console.log('\\n🏢 Creating test company...');
    const companyData = {
      properties: {
        name: `Test Company WSA 2026 - ${Date.now()}`,
        domain: 'testcompany.com',
        website: 'https://testcompany.com',
      }
    };

    const company = await makeRequest('/crm/v3/objects/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });

    console.log(`✅ Created company: ${company.id} (${companyData.properties.name})`);

    // Test 3: Associate contact with company
    console.log('\\n🔗 Creating association...');
    const associationData = {
      inputs: [{
        from: { id: contact.id },
        to: { id: company.id },
        type: 'contact_to_company'
      }]
    };

    await makeRequest('/crm/v3/associations/contacts/companies/batch/create', {
      method: 'POST',
      body: JSON.stringify(associationData),
    });

    console.log(`✅ Associated contact ${contact.id} with company ${company.id}`);

    // Test 4: Update contact (simulate vote count)
    console.log('\\n📊 Updating contact...');
    const updateData = {
      properties: {
        jobtitle: 'Senior Recruiter at Test Company (Updated)',
        // We'll add custom properties later when scopes are fixed
      }
    };

    await makeRequest(`/crm/v3/objects/contacts/${contact.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    console.log(`✅ Updated contact ${contact.id}`);

    console.log('\\n🎉 Basic sync test completed successfully!');
    console.log('\\n📋 Next Steps:');
    console.log('1. Add these scopes to your HubSpot Private App:');
    console.log('   - crm.schemas.contacts.write');
    console.log('   - crm.schemas.companies.write');
    console.log('   - crm.lists.write');
    console.log('2. Re-run the bootstrap script');
    console.log('3. Test the full integration');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testBasicSync();