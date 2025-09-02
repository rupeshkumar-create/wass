#!/usr/bin/env node

/**
 * Debug script for specific nominee: tifox10992@besaies.com
 * Check if the nominee exists in database and HubSpot sync status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugSpecificNominee() {
  const targetEmail = 'tifox10992@besaies.com';
  
  console.log(`🔍 Debugging nominee: ${targetEmail}`);
  console.log('='.repeat(60));

  try {
    // 1. Check if nominee exists in database
    console.log('\n1. Checking database for nominee...');
    
    const { data: nominees, error: nomineeError } = await supabase
      .from('nominees')
      .select('*')
      .eq('person_email', targetEmail);

    if (nomineeError) {
      console.error('❌ Error querying nominees:', nomineeError);
      return;
    }

    if (!nominees || nominees.length === 0) {
      console.log('❌ Nominee not found in database');
      
      // Check if they might be a nominator instead
      const { data: nominators } = await supabase
        .from('nominators')
        .select('*')
        .eq('email', targetEmail);
        
      if (nominators && nominators.length > 0) {
        console.log('✅ Found as nominator:', nominators[0]);
      }
      return;
    }

    console.log(`✅ Found ${nominees.length} nominee(s) in database:`);
    nominees.forEach((nominee, index) => {
      console.log(`\nNominee ${index + 1}:`);
      console.log(`  ID: ${nominee.id}`);
      console.log(`  Type: ${nominee.type}`);
      console.log(`  Name: ${nominee.firstname} ${nominee.lastname}`);
      console.log(`  Email: ${nominee.person_email}`);
      console.log(`  Company: ${nominee.person_company}`);
      console.log(`  Created: ${nominee.created_at}`);
    });

    // 2. Check nominations for this nominee
    console.log('\n2. Checking nominations...');
    
    for (const nominee of nominees) {
      const { data: nominations, error: nominationError } = await supabase
        .from('nominations')
        .select(`
          *,
          nominators (
            id,
            email,
            firstname,
            lastname
          ),
          subcategories (
            id,
            name,
            category_groups (
              id,
              name
            )
          )
        `)
        .eq('nominee_id', nominee.id);

      if (nominationError) {
        console.error('❌ Error querying nominations:', nominationError);
        continue;
      }

      if (!nominations || nominations.length === 0) {
        console.log(`❌ No nominations found for nominee ${nominee.id}`);
        continue;
      }

      console.log(`✅ Found ${nominations.length} nomination(s) for nominee ${nominee.id}:`);
      nominations.forEach((nomination, index) => {
        console.log(`\nNomination ${index + 1}:`);
        console.log(`  ID: ${nomination.id}`);
        console.log(`  State: ${nomination.state}`);
        console.log(`  Category: ${nomination.subcategories?.category_groups?.name} > ${nomination.subcategories?.name}`);
        console.log(`  Nominator: ${nomination.nominators?.firstname} ${nomination.nominators?.lastname} (${nomination.nominators?.email})`);
        console.log(`  Created: ${nomination.created_at}`);
        console.log(`  Votes: ${nomination.votes}`);
      });
    }

    // 3. Check HubSpot outbox for sync attempts
    console.log('\n3. Checking HubSpot sync outbox...');
    
    const { data: outboxItems, error: outboxError } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .or(`payload->>nomineeEmail.eq.${targetEmail},payload->>nominee->>email.eq.${targetEmail}`)
      .order('created_at', { ascending: false });

    if (outboxError) {
      console.error('❌ Error querying HubSpot outbox:', outboxError);
    } else if (!outboxItems || outboxItems.length === 0) {
      console.log('❌ No HubSpot sync attempts found in outbox');
    } else {
      console.log(`✅ Found ${outboxItems.length} HubSpot sync attempt(s):`);
      outboxItems.forEach((item, index) => {
        console.log(`\nSync Attempt ${index + 1}:`);
        console.log(`  ID: ${item.id}`);
        console.log(`  Event: ${item.event_type}`);
        console.log(`  Status: ${item.status || 'pending'}`);
        console.log(`  Created: ${item.created_at}`);
        console.log(`  Processed: ${item.processed_at || 'not processed'}`);
        if (item.error_message) {
          console.log(`  Error: ${item.error_message}`);
        }
        console.log(`  Payload: ${JSON.stringify(item.payload, null, 2)}`);
      });
    }

    // 4. Test HubSpot sync for this specific nominee
    console.log('\n4. Testing HubSpot sync...');
    
    try {
      // Import the sync function
      const { syncNomineeToHubSpot } = require('../src/server/hubspot/realtime-sync.ts');
      
      const nominee = nominees[0];
      const nominations = await supabase
        .from('nominations')
        .select('*, subcategories(*)')
        .eq('nominee_id', nominee.id)
        .single();

      if (nominations.data) {
        const syncData = {
          type: nominee.type,
          subcategoryId: nominations.data.subcategory_id,
          nominationId: nominations.data.id,
          firstname: nominee.firstname,
          lastname: nominee.lastname,
          email: nominee.person_email,
          linkedin: nominee.person_linkedin,
          jobtitle: nominee.jobtitle,
          company: nominee.person_company,
          phone: nominee.person_phone,
          country: nominee.person_country,
        };

        console.log('🔄 Attempting HubSpot sync with data:', syncData);
        
        const syncResult = await syncNomineeToHubSpot(syncData);
        
        if (syncResult.success) {
          console.log(`✅ HubSpot sync successful! Contact ID: ${syncResult.contactId}`);
        } else {
          console.log(`❌ HubSpot sync failed: ${syncResult.error}`);
        }
      }
    } catch (syncError) {
      console.error('❌ Error testing HubSpot sync:', syncError);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugSpecificNominee().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});