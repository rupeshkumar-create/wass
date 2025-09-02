#!/usr/bin/env node

/**
 * Test company nominee sync specifically
 */

require('dotenv').config({ path: '.env.local' });

async function testCompanyNomineeSync() {
  console.log('🧪 Testing Company Nominee Sync...\n');

  try {
    // Test company nominee sync
    const companyNomineeData = {
      type: 'company',
      companyName: 'Test Company Nominee Direct',
      companyWebsite: 'https://testcompanynomineedirect.com',
      companyLinkedin: 'https://linkedin.com/company/testcompanynomineedirect',
      companyEmail: 'contact@testcompanynomineedirect.com',
      companyPhone: '+1-555-0199',
      companyCountry: 'United States',
      companyIndustry: 'Staffing & Recruiting',
      companySize: '51-200',
      subcategoryId: 'best-staffing-firm',
      nominationId: 'test-nomination-company-direct-001'
    };

    console.log('📤 Syncing company nominee:', companyNomineeData.companyName);

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'sync_nominee',
        data: companyNomineeData
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Company nominee sync failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Company nominee sync result:', JSON.stringify(result, null, 2));

    // Now verify it was created in both contacts and companies
    console.log('\n🔍 Verifying sync results...');

    // Check HubSpot directly
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    
    // 1. Check contacts
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'wsa_company_name',
            operator: 'EQ',
            value: companyNomineeData.companyName
          }]
        }],
        properties: [
          'email',
          'firstname',
          'lastname',
          'wsa_contact_tag',
          'wsa_company_name',
          'wsa_role'
        ],
        limit: 5
      })
    });

    if (contactsResponse.ok) {
      const contactsData = await contactsResponse.json();
      console.log(`📞 Found ${contactsData.results.length} contacts for company:`, companyNomineeData.companyName);
      contactsData.results.forEach(contact => {
        console.log(`  - ${contact.properties.firstname} ${contact.properties.lastname} (${contact.properties.email})`);
        console.log(`    Tag: ${contact.properties.wsa_contact_tag}, Role: ${contact.properties.wsa_role}`);
      });
    }

    // 2. Check companies - search by domain instead of exact name
    const companiesResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'domain',
            operator: 'EQ',
            value: 'testcompanynomineedirect.com'
          }]
        }],
        properties: [
          'name',
          'domain',
          'website',
          'wsa_company_tag',
          'wsa_year',
          'wsa_category'
        ],
        limit: 5
      })
    });

    if (companiesResponse.ok) {
      const companiesData = await companiesResponse.json();
      console.log(`🏢 Found ${companiesData.results.length} companies:`, companyNomineeData.companyName);
      companiesData.results.forEach(company => {
        console.log(`  - ${company.properties.name} (${company.properties.domain})`);
        console.log(`    Tag: ${company.properties.wsa_company_tag}, Category: ${company.properties.wsa_category}`);
      });
    }

    console.log('\n🎉 Company nominee sync test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCompanyNomineeSync();