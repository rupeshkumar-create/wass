#!/usr/bin/env node

/**
 * Simple debug script for nominee: tifox10992@besaies.com
 * Check database and trigger HubSpot sync
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

async function debugAndFixSync() {
  const targetEmail = 'tifox10992@besaies.com';
  
  console.log(`🔍 Debugging and fixing sync for: ${targetEmail}`);
  console.log('='.repeat(60));

  try {
    // 1. Find the nominee
    console.log('\n1. Finding nominee in database...');
    
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
      return;
    }

    const nominee = nominees[0];
    console.log('✅ Found nominee:', {
      id: nominee.id,
      name: `${nominee.firstname} ${nominee.lastname}`,
      email: nominee.person_email,
      type: nominee.type,
      created: nominee.created_at
    });

    // 2. Find nominations for this nominee
    console.log('\n2. Finding nominations...');
    
    const { data: nominations, error: nominationError } = await supabase
      .from('nominations')
      .select(`
        *,
        nominators (
          id,
          email,
          firstname,
          lastname
        )
      `)
      .eq('nominee_id', nominee.id);

    if (nominationError) {
      console.error('❌ Error querying nominations:', nominationError);
      return;
    }

    if (!nominations || nominations.length === 0) {
      console.log('❌ No nominations found for this nominee');
      return;
    }

    const nomination = nominations[0];
    console.log('✅ Found nomination:', {
      id: nomination.id,
      state: nomination.state,
      subcategory: nomination.subcategory_id,
      nominator: `${nomination.nominators.firstname} ${nomination.nominators.lastname}`,
      created: nomination.created_at
    });

    // 3. Check HubSpot outbox
    console.log('\n3. Checking HubSpot outbox...');
    
    const { data: outboxItems, error: outboxError } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (outboxError) {
      console.error('❌ Error querying HubSpot outbox:', outboxError);
    } else {
      console.log(`✅ Found ${outboxItems.length} recent outbox items`);
      outboxItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.event_type} - ${item.status} (${item.created_at})`);
      });
    }

    // 4. Trigger immediate HubSpot sync
    console.log('\n4. Triggering HubSpot sync...');
    
    // Create sync data
    const syncData = {
      type: nominee.type,
      subcategoryId: nomination.subcategory_id,
      nominationId: nomination.id,
      firstname: nominee.firstname,
      lastname: nominee.lastname,
      email: nominee.person_email,
      linkedin: nominee.person_linkedin,
      jobtitle: nominee.jobtitle,
      company: nominee.person_company,
      phone: nominee.person_phone,
      country: nominee.person_country,
    };

    console.log('🔄 Sync data:', syncData);

    // Call the API endpoint to trigger sync
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sync/hubspot/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nominee',
        data: syncData
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ HubSpot sync triggered successfully:', result);
    } else {
      const error = await response.text();
      console.log('❌ HubSpot sync failed:', error);
    }

    // 5. Add to outbox for backup sync
    console.log('\n5. Adding to HubSpot outbox for backup sync...');
    
    const outboxPayload = {
      nominationId: nomination.id,
      nominatorId: nomination.nominator_id,
      nomineeId: nominee.id,
      type: nominee.type,
      subcategoryId: nomination.subcategory_id,
      nominator: {
        firstname: nomination.nominators.firstname,
        lastname: nomination.nominators.lastname,
        email: nomination.nominators.email
      },
      nominee: {
        firstname: nominee.firstname,
        lastname: nominee.lastname,
        email: nominee.person_email,
        linkedin: nominee.person_linkedin,
        jobtitle: nominee.jobtitle,
        company: nominee.person_company,
        phone: nominee.person_phone,
        country: nominee.person_country
      }
    };

    const { data: outboxItem, error: outboxInsertError } = await supabase
      .from('hubspot_outbox')
      .insert({
        event_type: 'nomination_approved',
        payload: outboxPayload,
        status: 'pending'
      })
      .select()
      .single();

    if (outboxInsertError) {
      console.error('❌ Error adding to outbox:', outboxInsertError);
    } else {
      console.log('✅ Added to HubSpot outbox:', outboxItem.id);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug and fix
debugAndFixSync().then(() => {
  console.log('\n🏁 Debug and sync complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});