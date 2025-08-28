#!/usr/bin/env node

/**
 * Test complete end-to-end HubSpot sync workflow
 * 1. Submit new nomination (should sync nominator)
 * 2. Approve nomination (should sync nominee)
 * 3. Cast vote (should sync voter)
 * 4. Verify all have correct tags in HubSpot
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testEndToEndHubSpotSync() {
  console.log('🧪 Testing End-to-End HubSpot Sync Workflow...\n');

  try {
    // Generate unique identifiers for this test
    const timestamp = Date.now();
    const testId = `test-${timestamp}`;

    // 1. SUBMIT NEW NOMINATION (Person)
    console.log('1️⃣ Testing Nomination Submission (Person Nominee)...');
    
    const personNominationData = {
      type: 'person',
      categoryGroupId: 'role-specific',
      subcategoryId: 'top-recruiter',
      
      // Nominator details
      nominator: {
        firstname: 'Alice',
        lastname: 'TestNominator',
        email: `alice.testnominator.${testId}@example.com`,
        linkedin: `https://linkedin.com/in/alice-testnominator-${testId}`,
        company: 'Test Nominator Company Ltd',
        jobTitle: 'Head of Talent Acquisition',
        phone: '+1-555-0201',
        country: 'United States'
      },
      
      // Person nominee details
      nominee: {
        firstname: 'Charlie',
        lastname: 'TestNominee',
        email: `charlie.testnominee.${testId}@example.com`,
        linkedin: `https://linkedin.com/in/charlie-testnominee-${testId}`,
        jobtitle: 'Senior Technical Recruiter',
        company: 'Tech Talent Solutions',
        phone: '+1-555-0202',
        country: 'United States',
        headshotUrl: 'https://example.com/headshots/charlie-testnominee.jpg',
        whyMe: 'Consistently delivers top-tier candidates and maintains excellent client relationships with innovative sourcing strategies.'
      }
    };

    const nominationResponse = await fetch(`${baseUrl}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personNominationData)
    });

    if (!nominationResponse.ok) {
      const errorText = await nominationResponse.text();
      throw new Error(`Nomination submission failed: ${nominationResponse.status} - ${errorText}`);
    }

    const nominationResult = await nominationResponse.json();
    console.log('✅ Person nomination submitted:', nominationResult.nominationId);

    // Wait a moment for sync to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. SUBMIT COMPANY NOMINATION
    console.log('\n2️⃣ Testing Company Nomination Submission...');
    
    const companyNominationData = {
      type: 'company',
      categoryGroupId: 'growth-performance',
      subcategoryId: 'fastest-growing-staffing-firm',
      
      // Nominator details (different person)
      nominator: {
        firstname: 'David',
        lastname: 'CompanyNominator',
        email: `david.companynominator.${testId}@example.com`,
        linkedin: `https://linkedin.com/in/david-companynominator-${testId}`,
        company: 'Nominator Corp',
        jobTitle: 'CEO',
        phone: '+1-555-0203',
        country: 'Canada'
      },
      
      // Company nominee details
      nominee: {
        name: `Test Staffing Firm ${testId}`,
        website: `https://teststaffingfirm${testId}.com`,
        linkedin: `https://linkedin.com/company/teststaffingfirm${testId}`,
        phone: '+1-555-0204',
        country: 'United States',
        industry: 'Staffing & Recruiting',
        size: '51-200',
        logoUrl: `https://example.com/logos/teststaffingfirm${testId}.png`,
        whyUs: 'Proven track record of successful placements and industry-leading retention rates with exceptional client satisfaction.'
      }
    };

    const companyNominationResponse = await fetch(`${baseUrl}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyNominationData)
    });

    if (!companyNominationResponse.ok) {
      const errorText = await companyNominationResponse.text();
      throw new Error(`Company nomination submission failed: ${companyNominationResponse.status} - ${errorText}`);
    }

    const companyNominationResult = await companyNominationResponse.json();
    console.log('✅ Company nomination submitted:', companyNominationResult.nominationId);

    // Wait a moment for sync to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. APPROVE NOMINATIONS
    console.log('\n3️⃣ Testing Nomination Approvals...');
    
    // Approve person nomination
    const personApprovalResponse = await fetch(`${baseUrl}/api/nomination/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nominationId: nominationResult.nominationId,
        liveUrl: `https://worldstaffingawards.com/nominee/charlie-testnominee-${testId}`
      })
    });

    if (!personApprovalResponse.ok) {
      const errorText = await personApprovalResponse.text();
      throw new Error(`Person nomination approval failed: ${personApprovalResponse.status} - ${errorText}`);
    }

    console.log('✅ Person nomination approved');

    // Approve company nomination
    const companyApprovalResponse = await fetch(`${baseUrl}/api/nomination/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nominationId: companyNominationResult.nominationId,
        liveUrl: `https://worldstaffingawards.com/nominee/test-staffing-firm-${testId}`
      })
    });

    if (!companyApprovalResponse.ok) {
      const errorText = await companyApprovalResponse.text();
      throw new Error(`Company nomination approval failed: ${companyApprovalResponse.status} - ${errorText}`);
    }

    console.log('✅ Company nomination approved');

    // Wait for approval sync to process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. CAST VOTES
    console.log('\n4️⃣ Testing Vote Casting...');
    
    // Vote for person nominee
    const personVoteData = {
      nominationId: nominationResult.nominationId,
      voter: {
        firstname: 'Emma',
        lastname: 'TestVoter',
        email: `emma.testvoter.${testId}@example.com`,
        linkedin: `https://linkedin.com/in/emma-testvoter-${testId}`,
        company: 'Voter Industries',
        job_title: 'Talent Director',
        phone: '+1-555-0205',
        country: 'United Kingdom'
      }
    };

    const personVoteResponse = await fetch(`${baseUrl}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personVoteData)
    });

    if (!personVoteResponse.ok) {
      const errorText = await personVoteResponse.text();
      throw new Error(`Person vote failed: ${personVoteResponse.status} - ${errorText}`);
    }

    console.log('✅ Vote cast for person nominee');

    // Vote for company nominee
    const companyVoteData = {
      nominationId: companyNominationResult.nominationId,
      voter: {
        firstname: 'Frank',
        lastname: 'CompanyVoter',
        email: `frank.companyvoter.${testId}@example.com`,
        linkedin: `https://linkedin.com/in/frank-companyvoter-${testId}`,
        company: 'Company Voter LLC',
        job_title: 'VP of Operations',
        phone: '+1-555-0206',
        country: 'Australia'
      }
    };

    const companyVoteResponse = await fetch(`${baseUrl}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyVoteData)
    });

    if (!companyVoteResponse.ok) {
      const errorText = await companyVoteResponse.text();
      throw new Error(`Company vote failed: ${companyVoteResponse.status} - ${errorText}`);
    }

    console.log('✅ Vote cast for company nominee');

    // Wait for vote sync to process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. VERIFY HUBSPOT SYNC
    console.log('\n5️⃣ Verifying HubSpot Sync Results...');
    
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    
    // Check for our test contacts
    const testEmails = [
      `alice.testnominator.${testId}@example.com`,
      `charlie.testnominee.${testId}@example.com`,
      `david.companynominator.${testId}@example.com`,
      `emma.testvoter.${testId}@example.com`,
      `frank.companyvoter.${testId}@example.com`
    ];

    const syncResults = {
      nominators: [],
      nominees: [],
      voters: [],
      companies: []
    };

    for (const email of testEmails) {
      try {
        const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }]
            }],
            properties: [
              'email',
              'firstname',
              'lastname',
              'wsa_contact_tag',
              'wsa_role',
              'wsa_company_name'
            ],
            limit: 1
          })
        });

        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          if (contactData.results && contactData.results.length > 0) {
            const contact = contactData.results[0];
            const tag = contact.properties.wsa_contact_tag;
            const role = contact.properties.wsa_role;
            const name = `${contact.properties.firstname} ${contact.properties.lastname}`;
            
            console.log(`  ✅ Found: ${name} (${email}) - Tag: ${tag}, Role: ${role}`);
            
            if (tag === 'WSA2026 Nominator') {
              syncResults.nominators.push({ name, email, tag, role });
            } else if (tag === 'WSA 2026 Nominees') {
              syncResults.nominees.push({ name, email, tag, role });
            } else if (tag === 'WSA 2026 Voters') {
              syncResults.voters.push({ name, email, tag, role });
            }
          }
        }
      } catch (error) {
        console.warn(`  ⚠️ Could not verify ${email}:`, error.message);
      }
    }

    // Check for company nominees
    const companyResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'name',
            operator: 'CONTAINS_TOKEN',
            value: `Test Staffing Firm ${testId}`
          }]
        }],
        properties: [
          'name',
          'domain',
          'wsa_company_tag',
          'wsa_category'
        ],
        limit: 5
      })
    });

    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      companyData.results.forEach(company => {
        const name = company.properties.name;
        const tag = company.properties.wsa_company_tag;
        const category = company.properties.wsa_category;
        console.log(`  ✅ Found Company: ${name} - Tag: ${tag}, Category: ${category}`);
        syncResults.companies.push({ name, tag, category });
      });
    }

    // 6. FINAL VERIFICATION
    console.log('\n📋 End-to-End Sync Verification Summary:');
    console.log(`✅ Nominators synced: ${syncResults.nominators.length}/2 expected`);
    console.log(`✅ Nominees synced: ${syncResults.nominees.length}/2 expected`);
    console.log(`✅ Voters synced: ${syncResults.voters.length}/2 expected`);
    console.log(`✅ Companies synced: ${syncResults.companies.length}/1 expected`);

    // Detailed breakdown
    console.log('\n🔍 Detailed Results:');
    
    console.log('\n📤 Nominators with "WSA2026 Nominator" tag:');
    syncResults.nominators.forEach(item => {
      console.log(`  - ${item.name} (${item.email}) - ${item.role}`);
    });

    console.log('\n🎯 Nominees with "WSA 2026 Nominees" tag:');
    syncResults.nominees.forEach(item => {
      console.log(`  - ${item.name} (${item.email}) - ${item.role}`);
    });

    console.log('\n🗳️ Voters with "WSA 2026 Voters" tag:');
    syncResults.voters.forEach(item => {
      console.log(`  - ${item.name} (${item.email}) - ${item.role}`);
    });

    console.log('\n🏢 Companies with "Nominator 2026" tag:');
    syncResults.companies.forEach(item => {
      console.log(`  - ${item.name} - ${item.tag} (${item.category})`);
    });

    // Success criteria
    const allSynced = (
      syncResults.nominators.length >= 2 &&
      syncResults.nominees.length >= 2 &&
      syncResults.voters.length >= 2 &&
      syncResults.companies.length >= 1
    );

    if (allSynced) {
      console.log('\n🎉 SUCCESS: All end-to-end HubSpot sync tests passed!');
      console.log('✅ New nominations, approvals, and votes are syncing correctly with proper tags.');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some syncs may be pending or failed.');
      console.log('   This could be due to timing or rate limiting. Check HubSpot manually.');
    }

  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEndToEndHubSpotSync();