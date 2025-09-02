#!/usr/bin/env node

/**
 * Debug the new nominee sync issue for tifox10992@besaies.com
 * Check if this nominee exists and sync status
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugNewNomineeSync() {
  console.log('🔍 Debugging New Nominee Sync for tifox10992@besaies.com...\n');

  const targetEmail = 'tifox10992@besaies.com';

  try {
    // 1. Check if this nominee exists in database
    console.log('1️⃣ Checking database for tifox10992@besaies.com...\n');

    const { data: nominees, error: nomineesError } = await supabase
      .from('nominees')
      .select('*')
      .or(`person_email.eq.${targetEmail},company_email.eq.${targetEmail}`);

    if (nomineesError) {
      console.log(`❌ Error checking nominees: ${nomineesError.message}`);
    } else if (nominees.length > 0) {
      console.log(`✅ Found ${nominees.length} nominees in database:`);
      nominees.forEach((nominee, i) => {
        console.log(`\nNominee ${i + 1}:`);
        console.log(`  - ID: ${nominee.id}`);
        console.log(`  - Type: ${nominee.type}`);
        console.log(`  - Name: ${nominee.firstname} ${nominee.lastname} ${nominee.company_name || ''}`);
        console.log(`  - Email: ${nominee.person_email || nominee.company_email}`);
        console.log(`  - Created: ${nominee.created_at}`);
      });

      // Check nominations for this nominee
      for (const nominee of nominees) {
        console.log(`\n🔍 Checking nominations for nominee ${nominee.id}:`);
        
        const { data: nominations, error: nominationsError } = await supabase
          .from('nominations')
          .select('*')
          .eq('nominee_id', nominee.id);

        if (nominationsError) {
          console.log(`  ❌ Error checking nominations: ${nominationsError.message}`);
        } else {
          console.log(`  📋 Found ${nominations.length} nominations:`);
          nominations.forEach((nom, i) => {
            console.log(`    ${i + 1}. ID: ${nom.id}`);
            console.log(`       State: ${nom.state}`);
            console.log(`       Category: ${nom.subcategory_id}`);
            console.log(`       Created: ${nom.created_at}`);
          });

          // If there are nominations, try to sync the nominee manually
          if (nominations.length > 0) {
            console.log(`\n📤 Testing manual sync for nominee...`);
            
            const nomination = nominations[0];
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
                console.log(`    ✅ Manual sync successful: ${JSON.stringify(syncResult, null, 2)}`);
              } else {
                const errorText = await syncResponse.text();
                console.log(`    ❌ Manual sync failed: ${syncResponse.status} - ${errorText}`);
              }
            } catch (error) {
              console.log(`    ❌ Manual sync error: ${error.message}`);
            }
          }
        }
      }
    } else {
      console.log(`⚠️ No nominees found in database for ${targetEmail}`);
      console.log('This suggests the nomination form submission may have failed or the email was different.');
    }

    // 2. Check HubSpot for this email
    console.log('\n2️⃣ Checking HubSpot for tifox10992@besaies.com...\n');
    
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    
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
              value: targetEmail
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
          console.log(`✅ Found in HubSpot:`);
          console.log(`  - Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
          console.log(`  - Email: ${contact.properties.email}`);
          console.log(`  - Tag: ${contact.properties.wsa_contact_tag}`);
          console.log(`  - Role: ${contact.properties.wsa_role}`);
          console.log(`  - Created: ${new Date(contact.properties.createdate).toLocaleString()}`);
        } else {
          console.log(`❌ NOT found in HubSpot`);
        }
      } else {
        console.log(`❌ HubSpot search failed: ${searchResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ HubSpot search error: ${error.message}`);
    }

    // 3. Check recent hubspot_outbox entries
    console.log('\n3️⃣ Checking recent HubSpot outbox entries...\n');
    
    const { data: outboxItems, error: outboxError } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

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
        if (item.payload) {
          const nomineeEmail = item.payload.nominee?.person_email || item.payload.nominee?.company_email;
          const nominatorEmail = item.payload.nominator?.email;
          console.log(`  - Nominator Email: ${nominatorEmail}`);
          console.log(`  - Nominee Email: ${nomineeEmail}`);
          
          if (nomineeEmail === targetEmail || nominatorEmail === targetEmail) {
            console.log(`  🎯 MATCH FOUND! This outbox item relates to ${targetEmail}`);
          }
        }
      });
    }

    console.log('\n🎉 Debug analysis completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. If nominee exists in database but not HubSpot, the sync failed');
    console.log('2. If nominee doesn\'t exist in database, the form submission failed');
    console.log('3. Check the outbox for any pending sync items');
    console.log('4. The updated nomination submission should now sync nominees immediately');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

// Run the debug
debugNewNomineeSync();