#!/usr/bin/env node

/**
 * Debug specific nominee sync issue
 * Check why leledik933@cavoyar.com is not syncing to HubSpot
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugSpecificNomineeSync() {
  console.log('🔍 Debugging Specific Nominee Sync Issue...\n');

  const targetEmails = [
    'bdtbe@powerscrews.com',      // Voter
    'yastezedro@necub.com',       // Nominator  
    'leledik933@cavoyar.com'      // Nominee (not syncing)
  ];

  try {
    // 1. Check if these emails exist in database
    console.log('1️⃣ Checking database for these emails...\n');

    // Check nominees table
    for (const email of targetEmails) {
      console.log(`🔍 Searching for ${email}:`);
      
      // Check in nominees table
      const { data: nominees, error: nomineesError } = await supabase
        .from('nominees')
        .select('*')
        .or(`person_email.eq.${email},company_email.eq.${email}`);

      if (nomineesError) {
        console.log(`  ❌ Error checking nominees: ${nomineesError.message}`);
      } else if (nominees.length > 0) {
        console.log(`  ✅ Found in nominees table:`);
        nominees.forEach(nominee => {
          console.log(`    - ID: ${nominee.id}`);
          console.log(`    - Type: ${nominee.type}`);
          console.log(`    - Name: ${nominee.firstname} ${nominee.lastname} ${nominee.company_name || ''}`);
          console.log(`    - Email: ${nominee.person_email || nominee.company_email}`);
        });
      } else {
        console.log(`  ⚠️ Not found in nominees table`);
      }

      // Check in nominators table
      const { data: nominators, error: nominatorsError } = await supabase
        .from('nominators')
        .select('*')
        .eq('email', email);

      if (nominatorsError) {
        console.log(`  ❌ Error checking nominators: ${nominatorsError.message}`);
      } else if (nominators.length > 0) {
        console.log(`  ✅ Found in nominators table:`);
        nominators.forEach(nominator => {
          console.log(`    - ID: ${nominator.id}`);
          console.log(`    - Name: ${nominator.firstname} ${nominator.lastname}`);
          console.log(`    - Status: ${nominator.status}`);
        });
      } else {
        console.log(`  ⚠️ Not found in nominators table`);
      }

      // Check in votes table
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_email', email);

      if (votesError) {
        console.log(`  ❌ Error checking votes: ${votesError.message}`);
      } else if (votes.length > 0) {
        console.log(`  ✅ Found in votes table:`);
        votes.forEach(vote => {
          console.log(`    - ID: ${vote.id}`);
          console.log(`    - Voter: ${vote.voter_firstname} ${vote.voter_lastname}`);
          console.log(`    - Voted for: ${vote.voted_for_display_name}`);
        });
      } else {
        console.log(`  ⚠️ Not found in votes table`);
      }

      console.log('');
    }

    // 2. Check nominations for the nominee email
    console.log('2️⃣ Checking nominations for leledik933@cavoyar.com...\n');
    
    const { data: nominations, error: nominationsError } = await supabase
      .from('nominations')
      .select(`
        id,
        state,
        subcategory_id,
        nominee_id,
        created_at,
        approved_at,
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
      .eq('nominees.person_email', 'leledik933@cavoyar.com')
      .or('nominees.company_email.eq.leledik933@cavoyar.com', { foreignTable: 'nominees' });

    if (nominationsError) {
      console.log(`❌ Error checking nominations: ${nominationsError.message}`);
    } else if (nominations.length > 0) {
      console.log(`✅ Found ${nominations.length} nominations for leledik933@cavoyar.com:`);
      nominations.forEach((nomination, i) => {
        console.log(`\nNomination ${i + 1}:`);
        console.log(`  - ID: ${nomination.id}`);
        console.log(`  - State: ${nomination.state}`);
        console.log(`  - Subcategory: ${nomination.subcategory_id}`);
        console.log(`  - Created: ${nomination.created_at}`);
        console.log(`  - Approved: ${nomination.approved_at}`);
        if (nomination.nominees) {
          console.log(`  - Nominee: ${nomination.nominees.firstname} ${nomination.nominees.lastname} ${nomination.nominees.company_name || ''}`);
          console.log(`  - Nominee Email: ${nomination.nominees.person_email || nomination.nominees.company_email}`);
        }
      });

      // 3. If approved, try to sync manually
      const approvedNominations = nominations.filter(n => n.state === 'approved');
      if (approvedNominations.length > 0) {
        console.log(`\n3️⃣ Found ${approvedNominations.length} approved nominations. Testing manual sync...\n`);
        
        for (const nomination of approvedNominations) {
          const nominee = nomination.nominees;
          
          console.log(`📤 Testing sync for nomination ${nomination.id}:`);
          
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

          console.log('Sync data:', JSON.stringify(nomineeSyncData, null, 2));

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
              console.log(`  ✅ Manual sync successful: ${JSON.stringify(syncResult, null, 2)}`);
            } else {
              const errorText = await syncResponse.text();
              console.log(`  ❌ Manual sync failed: ${syncResponse.status} - ${errorText}`);
            }
          } catch (error) {
            console.log(`  ❌ Manual sync error: ${error.message}`);
          }
        }
      } else {
        console.log(`\n⚠️ No approved nominations found for leledik933@cavoyar.com`);
        console.log('This nominee needs to be approved first before syncing to HubSpot.');
      }
    } else {
      console.log(`⚠️ No nominations found for leledik933@cavoyar.com`);
    }

    // 4. Check HubSpot for all three emails
    console.log('\n4️⃣ Checking HubSpot for all three emails...\n');
    
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    
    for (const email of targetEmails) {
      console.log(`🔍 Searching HubSpot for ${email}:`);
      
      try {
        const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
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
              'createdate'
            ],
            limit: 1
          })
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const contacts = searchData.results || [];
          
          if (contacts.length > 0) {
            const contact = contacts[0];
            console.log(`  ✅ Found in HubSpot:`);
            console.log(`    - Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
            console.log(`    - Tag: ${contact.properties.wsa_contact_tag}`);
            console.log(`    - Role: ${contact.properties.wsa_role}`);
            console.log(`    - Created: ${new Date(contact.properties.createdate).toLocaleString()}`);
          } else {
            console.log(`  ❌ NOT found in HubSpot`);
          }
        } else {
          console.log(`  ❌ HubSpot search failed: ${searchResponse.status}`);
        }
      } catch (error) {
        console.log(`  ❌ HubSpot search error: ${error.message}`);
      }
      
      console.log('');
    }

    // 5. Check hubspot_outbox for any pending syncs
    console.log('5️⃣ Checking hubspot_outbox for pending syncs...\n');
    
    const { data: outboxItems, error: outboxError } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (outboxError) {
      console.log(`❌ Error checking outbox: ${outboxError.message}`);
    } else {
      console.log(`📦 Found ${outboxItems.length} recent outbox items:`);
      outboxItems.forEach((item, i) => {
        console.log(`\nOutbox Item ${i + 1}:`);
        console.log(`  - Event: ${item.event_type}`);
        console.log(`  - Status: ${item.status}`);
        console.log(`  - Created: ${item.created_at}`);
        console.log(`  - Attempts: ${item.attempt_count}`);
        if (item.last_error) {
          console.log(`  - Error: ${item.last_error}`);
        }
        if (item.payload && item.payload.nominee) {
          const nominee = item.payload.nominee;
          const email = nominee.person_email || nominee.company_email;
          console.log(`  - Nominee Email: ${email}`);
        }
      });
    }

    console.log('\n🎉 Debug analysis completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

// Run the debug
debugSpecificNomineeSync();