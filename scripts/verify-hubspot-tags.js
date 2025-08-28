#!/usr/bin/env node

/**
 * Verify HubSpot tags are being applied correctly
 * Check specific contacts to see their tag values
 */

require('dotenv').config({ path: '.env.local' });

async function verifyHubSpotTags() {
  console.log('🔍 Verifying HubSpot Tags...\n');

  try {
    // Use HubSpot API directly
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      throw new Error('HUBSPOT_ACCESS_TOKEN not found');
    }

    // Search for contacts with WSA tags
    console.log('1️⃣ Searching for contacts with WSA tags...');
    
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'wsa_contact_tag',
            operator: 'HAS_PROPERTY'
          }]
        }],
        properties: [
          'email',
          'firstname',
          'lastname',
          'wsa_contact_tag',
          'wsa_role',
          'wsa_year',
          'wsa_source',
          'wsa_tags'
        ],
        limit: 20
      })
    });

    if (!contactsResponse.ok) {
      throw new Error(`HubSpot API error: ${contactsResponse.status} ${contactsResponse.statusText}`);
    }

    const contactsData = await contactsResponse.json();
    const contacts = contactsData.results || [];
    console.log(`Found ${contacts.length} contacts with WSA tags:`);

    // Group by tag type
    const tagGroups = {
      'WSA2026 Nominator': [],
      'WSA 2026 Nominees': [],
      'WSA 2026 Voters': []
    };

    contacts.forEach(contact => {
      const tag = contact.properties.wsa_contact_tag;
      const email = contact.properties.email;
      const name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim();
      const role = contact.properties.wsa_role;
      
      if (tagGroups[tag]) {
        tagGroups[tag].push({ email, name, role });
      }
    });

    // Display results
    console.log('\n📊 Tag Distribution:');
    Object.entries(tagGroups).forEach(([tag, contacts]) => {
      console.log(`\n${tag}: ${contacts.length} contacts`);
      contacts.forEach(contact => {
        console.log(`  - ${contact.name} (${contact.email}) - Role: ${contact.role}`);
      });
    });

    // 2. Check for company records
    console.log('\n2️⃣ Searching for companies with WSA tags...');
    
    const companiesResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'wsa_company_tag',
            operator: 'HAS_PROPERTY'
          }]
        }],
        properties: [
          'name',
          'domain',
          'wsa_company_tag',
          'wsa_year',
          'wsa_source',
          'wsa_category'
        ],
        limit: 20
      })
    });

    if (!companiesResponse.ok) {
      throw new Error(`HubSpot Companies API error: ${companiesResponse.status} ${companiesResponse.statusText}`);
    }

    const companiesData = await companiesResponse.json();
    const companies = companiesData.results || [];
    console.log(`Found ${companies.length} companies with WSA tags:`);

    companies.forEach(company => {
      const name = company.properties.name;
      const tag = company.properties.wsa_company_tag;
      const category = company.properties.wsa_category;
      console.log(`  - ${name} - Tag: ${tag} - Category: ${category}`);
    });

    // 3. Summary
    console.log('\n📋 Verification Summary:');
    console.log(`✅ Total contacts with tags: ${contacts.length}`);
    console.log(`✅ Nominators: ${tagGroups['WSA2026 Nominator'].length}`);
    console.log(`✅ Nominees: ${tagGroups['WSA 2026 Nominees'].length}`);
    console.log(`✅ Voters: ${tagGroups['WSA 2026 Voters'].length}`);
    console.log(`✅ Companies with tags: ${companies.length}`);

    if (contacts.length === 0) {
      console.log('\n⚠️ No contacts found with WSA tags. This could mean:');
      console.log('   - No sync has been performed yet');
      console.log('   - Tags are not being applied correctly');
      console.log('   - Property name mismatch');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
verifyHubSpotTags();