#!/usr/bin/env node

/**
 * HubSpot Bootstrap Script for World Staffing Awards 2026
 *
 * This script sets up all required HubSpot properties, lists, and configurations
 * for the WSA 2026 integration.
 *
 * Prerequisites:
 * 1. Create a Private App in HubSpot with required scopes
 * 2. Set HUBSPOT_PRIVATE_APP_TOKEN in your environment
 *
 * Usage:
 * npm run hubspot:bootstrap
 * or
 * npx tsx scripts/hubspot/bootstrap.ts
 */

import { config } from 'dotenv';

// Load environment variables
config();

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const HUBSPOT_BASE_URL = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';

if (!HUBSPOT_TOKEN) {
  console.error('❌ HUBSPOT_PRIVATE_APP_TOKEN is required');
  console.error('Please create a Private App in HubSpot and set the token in your .env file');
  process.exit(1);
}

// Utility function for API calls with retry logic
async function hubspotAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${HUBSPOT_BASE_URL}${endpoint}`;
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2');
        console.log(`⏳ Rate limited, waiting ${retryAfter}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        attempt++;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Contact Properties Configuration
const CONTACT_PROPERTIES = [
  {
    name: 'wsa_year',
    label: 'WSA Year',
    type: 'number',
    fieldType: 'number',
    description: 'Award year for WSA segmentation, e.g. 2026',
    groupName: 'contactinformation',
  },
  {
    name: 'wsa_segments',
    label: 'WSA Segments',
    type: 'enumeration',
    description: 'WSA participation segments',
    groupName: 'contactinformation',
    options: [
      // Labels updated to match HubSpot UI naming; values remain stable keys.
      { label: 'Nominees 2026', value: 'nominees_2026' },
      { label: 'Voters 2026', value: 'voters_2026' },
      // New option for nominators (Contacts only)
      { label: 'Nominators 2026', value: 'nominators_2026' },
    ],
    fieldType: 'checkbox',
  },
  {
    name: 'wsa_category',
    label: 'WSA Category',
    type: 'string',
    fieldType: 'text',
    description: 'The nomination/vote category (e.g., "Top Recruiter")',
    groupName: 'contactinformation',
  },
  {
    name: 'wsa_linkedin_url',
    label: 'WSA LinkedIn URL',
    type: 'string',
    fieldType: 'text',
    description: 'Normalized LinkedIn URL',
    groupName: 'contactinformation',
  },
  {
    name: 'wsa_live_slug',
    label: 'WSA Live Slug',
    type: 'string',
    fieldType: 'text',
    description: 'Live profile path slug (e.g., "ranjeet-kumar")',
    groupName: 'contactinformation',
  },
  {
    name: 'wsa_nomination_id',
    label: 'WSA Nomination ID',
    type: 'string',
    fieldType: 'text',
    description: 'App UUID for cross-reference',
    groupName: 'contactinformation',
  },
  {
    name: 'wsa_vote_count',
    label: 'WSA Vote Count',
    type: 'number',
    fieldType: 'number',
    description: 'Total votes this person has cast (for voters)',
    groupName: 'contactinformation',
  },
  {
    name: 'wsa_last_voted_nominee',
    label: 'WSA Last Voted Nominee',
    type: 'string',
    fieldType: 'text',
    description: 'Last nominee slug the contact voted for',
    groupName: 'contactinformation',
  },
  {
    name: 'wsa_last_voted_category',
    label: 'WSA Last Voted Category',
    type: 'string',
    fieldType: 'text',
    description: 'Last category the contact voted in',
    groupName: 'contactinformation',
  },
];

// Company Properties Configuration
const COMPANY_PROPERTIES = [
  {
    name: 'wsa_year',
    label: 'WSA Year',
    type: 'number',
    fieldType: 'number',
    description: 'Award year for WSA segmentation, e.g. 2026',
    groupName: 'companyinformation',
  },
  {
    name: 'wsa_segments',
    label: 'WSA Segments',
    type: 'enumeration',
    description: 'WSA participation segments',
    groupName: 'companyinformation',
    options: [
      // Labels updated to match HubSpot UI naming; values remain stable keys.
      { label: 'Nominees 2026', value: 'nominees_2026' },
      { label: 'Voters 2026', value: 'voters_2026' },
    ],
    fieldType: 'checkbox',
  },
  {
    name: 'wsa_category',
    label: 'WSA Category',
    type: 'string',
    fieldType: 'text',
    description: 'The nomination category',
    groupName: 'companyinformation',
  },
  {
    name: 'wsa_linkedin_url',
    label: 'WSA LinkedIn URL',
    type: 'string',
    fieldType: 'text',
    description: 'Normalized LinkedIn URL',
    groupName: 'companyinformation',
  },
  {
    name: 'wsa_nomination_id',
    label: 'WSA Nomination ID',
    type: 'string',
    fieldType: 'text',
    description: 'App UUID for cross-reference',
    groupName: 'companyinformation',
  },
];

async function createProperty(objectType: 'contacts' | 'companies', property: any) {
  try {
    console.log(`📝 Creating ${objectType} property: ${property.name}`);

    // First check if property already exists
    try {
      await hubspotAPI(`/crm/v3/properties/${objectType}/${property.name}`);
      console.log(`ℹ️  Property ${property.name} already exists for ${objectType}`);
      return;
    } catch (error) {
      // Property doesn't exist, continue with creation
    }

    const payload = {
      name: property.name,
      label: property.label,
      type: property.type,
      fieldType: property.fieldType || 'text', // Always include fieldType
      description: property.description,
      groupName: property.groupName,
      ...(property.options && {
        options: property.options,
      }),
    };

    await hubspotAPI(`/crm/v3/properties/${objectType}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log(`✅ Created ${objectType} property: ${property.name}`);
  } catch (error: any) {
    if (error.message.includes('PROPERTY_DOESNT_EXIST') || error.message.includes('already exists')) {
      console.log(`ℹ️  Property ${property.name} already exists for ${objectType}`);
    } else {
      console.error(`❌ Failed to create ${objectType} property ${property.name}:`, error.message);
    }
  }
}

async function createActiveList(name: string, filterProperty: string, filterValue: string) {
  try {
    console.log(`📋 Creating active list: ${name}`);

    const payload = {
      name: name,
      processingType: 'DYNAMIC',
      objectTypeId: '0-1', // Contacts
      filterBranch: {
        filterBranchType: 'OR',
        filters: [
          {
            filterType: 'PROPERTY',
            property: filterProperty,
            // Use enumeration operator for checkbox options
            operation: {
              operationType: 'ENUMERATION',
              operator: 'IN',
              values: [filterValue], // e.g., 'nominees_2026'
            },
          },
        ],
      },
    };

    await hubspotAPI('/crm/v3/lists', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log(`✅ Created active list: ${name}`);
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('DUPLICATE')) {
      console.log(`ℹ️  List "${name}" already exists`);
    } else {
      console.error(`❌ Failed to create list "${name}":`, error.message);
    }
  }
}

async function getAssociationTypeId() {
  try {
    console.log('🔗 Fetching CONTACT↔COMPANY association type ID...');

    const response = await hubspotAPI('/crm/v4/associations/contacts/companies/labels');

    // Find the default association type
    const defaultAssociation = response.results.find((assoc: any) =>
      assoc.label === 'Primary' || assoc.label === 'Employee' || assoc.typeId === 1
    );

    if (defaultAssociation) {
      console.log(`✅ Found association type ID: ${defaultAssociation.typeId} (${defaultAssociation.label})`);
      return defaultAssociation.typeId;
    } else {
      console.log('ℹ️  Using default association type ID: 1');
      return 1;
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch association type ID:', error.message);
    console.log('ℹ️  Using default association type ID: 1');
    return 1;
  }
}

async function createTestContacts(associationTypeId: number) {
  try {
    console.log('👤 Creating test contacts...');

    // Create test nominee contact
    const nomineePayload = {
      properties: {
        firstname: 'Test',
        lastname: 'Nominee',
        email: 'test.nominee@worldstaffingawards.com',
        wsa_year: 2026, // numeric
        wsa_segments: 'nominees_2026',
        wsa_category: 'Top Recruiter',
        wsa_linkedin_url: 'https://www.linkedin.com/in/test-nominee',
        wsa_live_slug: 'test-nominee',
        wsa_nomination_id: 'test-nominee-uuid-123',
      },
    };

    const nomineeResponse = await hubspotAPI('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify(nomineePayload),
    });

    console.log(`✅ Created test nominee contact: ${nomineeResponse.id}`);

    // Create test voter contact
    const voterPayload = {
      properties: {
        firstname: 'Test',
        lastname: 'Voter',
        email: 'test.voter@worldstaffingawards.com',
        wsa_year: 2026, // numeric
        wsa_segments: 'voters_2026',
        wsa_vote_count: 2,
        wsa_last_voted_nominee: 'test-nominee',
        wsa_last_voted_category: 'Top Recruiter',
      },
    };

    const voterResponse = await hubspotAPI('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify(voterPayload),
    });

    console.log(`✅ Created test voter contact: ${voterResponse.id}`);

    // Create test nominator contact (NEW)
    const nominatorPayload = {
      properties: {
        firstname: 'Test',
        lastname: 'Nominator',
        email: 'test.nominator@worldstaffingawards.com',
        wsa_year: 2026, // numeric
        wsa_segments: 'nominators_2026',
        wsa_nomination_id: 'test-person-nomination-uuid-789',
      },
    };

    const nominatorResponse = await hubspotAPI('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify(nominatorPayload),
    });

    console.log(`✅ Created test nominator contact: ${nominatorResponse.id}`);

    // Create test company
    const companyPayload = {
      properties: {
        name: 'Test Staffing Company',
        domain: 'teststaffing.com',
        wsa_year: 2026, // numeric
        wsa_segments: 'nominees_2026',
        wsa_category: 'Top Staffing Company',
        wsa_linkedin_url: 'https://www.linkedin.com/company/test-staffing',
        wsa_nomination_id: 'test-company-uuid-456',
      },
    };

    const companyResponse = await hubspotAPI('/crm/v3/objects/companies', {
      method: 'POST',
      body: JSON.stringify(companyPayload),
    });

    console.log(`✅ Created test company: ${companyResponse.id}`);

    // Associate nominee contact with company
    const associationPayload = {
      inputs: [
        {
          from: { id: nomineeResponse.id },
          to: { id: companyResponse.id },
          type: { associationTypeId: associationTypeId },
        },
      ],
    };

    await hubspotAPI('/crm/v4/associations/contacts/companies/batch/create', {
      method: 'POST',
      body: JSON.stringify(associationPayload),
    });

    console.log(`✅ Associated contact ${nomineeResponse.id} with company ${companyResponse.id}`);

    return {
      nomineeId: nomineeResponse.id,
      voterId: voterResponse.id,
      nominatorId: nominatorResponse.id,
      companyId: companyResponse.id,
    };
  } catch (error: any) {
    if (error.message.includes('CONTACT_EXISTS') || error.message.includes('already exists')) {
      console.log('ℹ️  Test contacts already exist');
    } else {
      console.error('❌ Failed to create test contacts:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting HubSpot Bootstrap for World Staffing Awards 2026\n');

  try {
    // Test API connection
    console.log('🔌 Testing HubSpot API connection...');
    await hubspotAPI('/crm/v3/objects/contacts?limit=1');
    console.log('✅ HubSpot API connection successful\n');

    // Create contact properties
    console.log('📝 Creating contact properties...');
    for (const property of CONTACT_PROPERTIES) {
      await createProperty('contacts', property);
    }
    console.log('');

    // Create company properties
    console.log('📝 Creating company properties...');
    for (const property of COMPANY_PROPERTIES) {
      await createProperty('companies', property);
    }
    console.log('');

    // Create active lists (names match HubSpot UI you provided)
    console.log('📋 Creating active lists...');
    await createActiveList('Nominess 2026', 'wsa_segments', 'nominees_2026');
    await createActiveList('Voter 2026', 'wsa_segments', 'voters_2026');
    await createActiveList('Nominators 2026', 'wsa_segments', 'nominators_2026'); // NEW
    console.log('');

    // Get association type ID
    const associationTypeId = await getAssociationTypeId();
    console.log('');

    // Create test contacts
    console.log('👤 Creating test contacts...');
    const testResults = await createTestContacts(associationTypeId);
    console.log('');

    // Success summary
    console.log('🎉 HubSpot Bootstrap Complete!\n');
    console.log('📋 CONFIGURATION SUMMARY:');
    console.log('========================');
    console.log(`✅ Contact Properties: ${CONTACT_PROPERTIES.length} created/verified`);
    console.log(`✅ Company Properties: ${COMPANY_PROPERTIES.length} created/verified`);
    console.log('✅ Active Lists: 3 created/verified');
    console.log(`✅ Association Type ID: ${associationTypeId}`);
    console.log('✅ Test Contacts: Created/verified');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('==============');
    console.log('1. Add this to your .env file:');
    console.log(`   HUBSPOT_ASSOCIATION_TYPE_ID=${associationTypeId}`);
    console.log('2. Verify the lists in HubSpot: Marketing > Lists');
    console.log('3. Check test contacts in HubSpot: Contacts > Contacts');
    console.log('4. Run the app integration tests');
    console.log('');
    console.log('🎯 PROPERTY KEYS FOR REFERENCE:');
    console.log('===============================');
    console.log('Contact Properties:');
    CONTACT_PROPERTIES.forEach(prop => console.log(`  - ${prop.name}`));
    console.log('Company Properties:');
    COMPANY_PROPERTIES.forEach(prop => console.log(`  - ${prop.name}`));

  } catch (error: any) {
    console.error('❌ Bootstrap failed:', error.message);
    process.exit(1);
  }
}

// Run the bootstrap
main().catch(console.error);
