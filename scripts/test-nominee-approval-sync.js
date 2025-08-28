#!/usr/bin/env node

/**
 * Test nominee approval and HubSpot sync
 * This will approve pending nominations and verify they sync to HubSpot
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testNomineeApprovalSync() {
  console.log('🧪 Testing Nominee Approval and HubSpot Sync...\n');

  try {
    // 1. Find pending nominations
    console.log('1️⃣ Finding pending nominations...');
    
    const { data: pendingNominations, error: fetchError } = await supabase
      .from('nominations')
      .select(`
        id,
        nominee_id,
        subcategory_id,
        state,
        nominees (
          id,
          type,
          firstname,
          lastname,
          person_email,
          company_name,
          company_email
        )
      `)
      .eq('state', 'pending')
      .limit(3);

    if (fetchError) {
      throw new Error(`Failed to fetch nominations: ${fetchError.message}`);
    }

    console.log(`Found ${pendingNominations.length} pending nominations`);

    if (pendingNominations.length === 0) {
      console.log('⚠️ No pending nominations found. Let me check approved ones instead...');
      
      // Check approved nominations
      const { data: approvedNominations, error: approvedError } = await supabase
        .from('nominations')
        .select(`
          id,
          nominee_id,
          subcategory_id,
          state,
          nominees (
            id,
            type,
            firstname,
            lastname,
            person_email,
            company_name,
            company_email
          )
        `)
        .eq('state', 'approved')
        .limit(3);

      if (approvedError) {
        throw new Error(`Failed to fetch approved nominations: ${approvedError.message}`);
      }

      console.log(`Found ${approvedNominations.length} approved nominations`);
      
      // Test sync for already approved nominations
      for (let i = 0; i < Math.min(2, approvedNominations.length); i++) {
        const nomination = approvedNominations[i];
        const nominee = nomination.nominees;
        
        console.log(`\n📤 Testing sync for approved nomination ${i + 1}:`);
        console.log(`- Nomination ID: ${nomination.id}`);
        console.log(`- Nominee: ${nominee.type === 'person' ? `${nominee.firstname} ${nominee.lastname}` : nominee.company_name}`);
        console.log(`- Email: ${nominee.person_email || nominee.company_email}`);

        // Test direct nominee sync
        const nomineeSyncData = {
          type: nominee.type,
          subcategoryId: nomination.subcategory_id,
          nominationId: nomination.id,
          // Person fields
          firstname: nominee.firstname,
          lastname: nominee.lastname,
          email: nominee.person_email,
          linkedin: nominee.person_linkedin,
          jobtitle: nominee.jobtitle,
          company: nominee.person_company,
          phone: nominee.person_phone,
          country: nominee.person_country,
          // Company fields
          companyName: nominee.company_name,
          companyWebsite: nominee.company_website,
          companyLinkedin: nominee.company_linkedin,
          companyEmail: nominee.company_email,
          companyPhone: nominee.company_phone,
          companyCountry: nominee.company_country,
          companyIndustry: nominee.company_industry,
          companySize: nominee.company_size,
        };

        try {
          const syncResponse = await fetch(`${baseUrl}/api/sync/hubspot/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'sync_nominee',
              data: nomineeSyncData
            })
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log(`  ✅ Nominee synced: ${syncResult.contactId || 'success'}`);
          } else {
            const errorText = await syncResponse.text();
            console.log(`  ❌ Nominee sync failed: ${syncResponse.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`  ❌ Sync error: ${error.message}`);
        }
      }
    } else {
      // 2. Approve pending nominations
      for (let i = 0; i < Math.min(2, pendingNominations.length); i++) {
        const nomination = pendingNominations[i];
        const nominee = nomination.nominees;
        
        console.log(`\n📋 Approving nomination ${i + 1}:`);
        console.log(`- Nomination ID: ${nomination.id}`);
        console.log(`- Nominee: ${nominee.type === 'person' ? `${nominee.firstname} ${nominee.lastname}` : nominee.company_name}`);
        console.log(`- Email: ${nominee.person_email || nominee.company_email}`);

        try {
          const approvalResponse = await fetch(`${baseUrl}/api/nomination/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              nominationId: nomination.id,
              liveUrl: `https://worldstaffingawards.com/nominee/${nominee.type === 'person' ? 
                `${nominee.firstname}-${nominee.lastname}`.toLowerCase().replace(/\s+/g, '-') :
                nominee.company_name.toLowerCase().replace(/\s+/g, '-')
              }`
            })
          });

          if (approvalResponse.ok) {
            const approvalResult = await approvalResponse.json();
            console.log(`  ✅ Nomination approved: ${approvalResult.nominationId}`);
          } else {
            const errorText = await approvalResponse.text();
            console.log(`  ❌ Approval failed: ${approvalResponse.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`  ❌ Approval error: ${error.message}`);
        }

        // Wait a moment for sync to process
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 3. Verify HubSpot sync results
    console.log('\n3️⃣ Verifying HubSpot sync results...');
    
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    
    // Check for nominees in HubSpot
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
            operator: 'EQ',
            value: 'WSA 2026 Nominees'
          }]
        }],
        properties: [
          'email',
          'firstname',
          'lastname',
          'wsa_contact_tag',
          'wsa_role',
          'wsa_company_name',
          'createdate'
        ],
        limit: 20
      })
    });

    if (contactsResponse.ok) {
      const contactsData = await contactsResponse.json();
      const nominees = contactsData.results || [];
      
      console.log(`\n👥 Found ${nominees.length} nominees in HubSpot with "WSA 2026 Nominees" tag:`);
      nominees.forEach((nominee, i) => {
        const name = `${nominee.properties.firstname || ''} ${nominee.properties.lastname || ''}`.trim();
        const email = nominee.properties.email;
        const role = nominee.properties.wsa_role;
        const companyName = nominee.properties.wsa_company_name;
        const created = new Date(nominee.properties.createdate).toLocaleDateString();
        
        console.log(`  ${i + 1}. ${name || companyName} (${email}) - ${role} - Created: ${created}`);
      });
    } else {
      console.log('❌ Failed to fetch nominees from HubSpot');
    }

    // Check for companies
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
            operator: 'EQ',
            value: 'Nominator 2026'
          }]
        }],
        properties: [
          'name',
          'domain',
          'wsa_company_tag',
          'wsa_category',
          'createdate'
        ],
        limit: 10
      })
    });

    if (companiesResponse.ok) {
      const companiesData = await companiesResponse.json();
      const companies = companiesData.results || [];
      
      console.log(`\n🏢 Found ${companies.length} companies in HubSpot with "Nominator 2026" tag:`);
      companies.forEach((company, i) => {
        const name = company.properties.name;
        const tag = company.properties.wsa_company_tag;
        const category = company.properties.wsa_category;
        const created = new Date(company.properties.createdate).toLocaleDateString();
        
        console.log(`  ${i + 1}. ${name} - ${tag} (${category}) - Created: ${created}`);
      });
    }

    console.log('\n🎉 Nominee approval and sync test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testNomineeApprovalSync();