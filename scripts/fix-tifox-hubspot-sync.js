#!/usr/bin/env node

/**
 * Fix HubSpot sync for nominee: tifox10992@besaies.com
 * This script will:
 * 1. Find the nominee and nomination
 * 2. Directly call HubSpot sync functions
 * 3. Process all pending outbox items
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

async function fixHubSpotSync() {
  const targetEmail = 'tifox10992@besaies.com';
  
  console.log(`🔧 Fixing HubSpot sync for: ${targetEmail}`);
  console.log('='.repeat(60));

  try {
    // 1. Find the nominee and nomination
    console.log('\n1. Finding nominee and nomination...');
    
    const { data: nominees, error: nomineeError } = await supabase
      .from('nominees')
      .select('*')
      .eq('person_email', targetEmail);

    if (nomineeError || !nominees || nominees.length === 0) {
      console.error('❌ Nominee not found:', nomineeError);
      return;
    }

    const nominee = nominees[0];
    console.log('✅ Found nominee:', nominee.firstname, nominee.lastname);

    const { data: nominations, error: nominationError } = await supabase
      .from('nominations')
      .select(`
        *,
        nominators (*)
      `)
      .eq('nominee_id', nominee.id);

    if (nominationError || !nominations || nominations.length === 0) {
      console.error('❌ Nomination not found:', nominationError);
      return;
    }

    const nomination = nominations[0];
    console.log('✅ Found nomination:', nomination.id, 'State:', nomination.state);

    // 2. Test HubSpot connection first
    console.log('\n2. Testing HubSpot connection...');
    
    try {
      const testResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true })
      });

      if (testResponse.ok) {
        const testResult = await testResponse.json();
        console.log('✅ HubSpot connection test:', testResult.success ? 'SUCCESS' : 'FAILED');
        if (testResult.accountInfo) {
          console.log('  Account:', testResult.accountInfo.portalId);
        }
      } else {
        console.log('❌ HubSpot connection test failed:', await testResponse.text());
      }
    } catch (testError) {
      console.log('❌ HubSpot connection test error:', testError.message);
    }

    // 3. Setup HubSpot properties if needed
    console.log('\n3. Setting up HubSpot properties...');
    
    try {
      const setupResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'setup-properties' })
      });

      if (setupResponse.ok) {
        const setupResult = await setupResponse.json();
        console.log('✅ HubSpot properties setup:', setupResult.success ? 'SUCCESS' : 'FAILED');
        if (setupResult.created && setupResult.created.length > 0) {
          console.log('  Created properties:', setupResult.created.length);
        }
      } else {
        console.log('❌ HubSpot properties setup failed:', await setupResponse.text());
      }
    } catch (setupError) {
      console.log('❌ HubSpot properties setup error:', setupError.message);
    }

    // 4. Sync nominator first
    console.log('\n4. Syncing nominator to HubSpot...');
    
    const nominatorData = {
      firstname: nomination.nominators.firstname,
      lastname: nomination.nominators.lastname,
      email: nomination.nominators.email,
      linkedin: nomination.nominators.linkedin,
      company: nomination.nominators.company,
      jobTitle: nomination.nominators.job_title,
      phone: nomination.nominators.phone,
      country: nomination.nominators.country,
    };

    try {
      const nominatorResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_nominator',
          data: nominatorData
        })
      });

      if (nominatorResponse.ok) {
        const nominatorResult = await nominatorResponse.json();
        console.log('✅ Nominator sync:', nominatorResult.success ? 'SUCCESS' : 'FAILED');
        if (nominatorResult.contactId) {
          console.log('  Contact ID:', nominatorResult.contactId);
        }
        if (nominatorResult.error) {
          console.log('  Error:', nominatorResult.error);
        }
      } else {
        console.log('❌ Nominator sync failed:', await nominatorResponse.text());
      }
    } catch (nominatorError) {
      console.log('❌ Nominator sync error:', nominatorError.message);
    }

    // 5. Sync nominee
    console.log('\n5. Syncing nominee to HubSpot...');
    
    const nomineeData = {
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

    try {
      const nomineeResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_nominee',
          data: nomineeData
        })
      });

      if (nomineeResponse.ok) {
        const nomineeResult = await nomineeResponse.json();
        console.log('✅ Nominee sync:', nomineeResult.success ? 'SUCCESS' : 'FAILED');
        if (nomineeResult.contactId) {
          console.log('  Contact ID:', nomineeResult.contactId);
        }
        if (nomineeResult.error) {
          console.log('  Error:', nomineeResult.error);
        }
      } else {
        console.log('❌ Nominee sync failed:', await nomineeResponse.text());
      }
    } catch (nomineeError) {
      console.log('❌ Nominee sync error:', nomineeError.message);
    }

    // 6. Process all pending outbox items
    console.log('\n6. Processing all pending HubSpot outbox items...');
    
    try {
      const batchResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
        },
        body: JSON.stringify({})
      });

      if (batchResponse.ok) {
        const batchResult = await batchResponse.json();
        console.log('✅ Batch sync completed:');
        console.log(`  Processed: ${batchResult.processed}`);
        console.log(`  Succeeded: ${batchResult.succeeded}`);
        console.log(`  Failed: ${batchResult.failed}`);
        
        if (batchResult.results && batchResult.results.length > 0) {
          console.log('\n  Results:');
          batchResult.results.forEach((result, index) => {
            console.log(`    ${index + 1}. ${result.event_type} - ${result.status}`);
            if (result.error) {
              console.log(`       Error: ${result.error}`);
            }
          });
        }
      } else {
        console.log('❌ Batch sync failed:', await batchResponse.text());
      }
    } catch (batchError) {
      console.log('❌ Batch sync error:', batchError.message);
    }

    // 7. Verify sync status
    console.log('\n7. Verifying sync status...');
    
    const { data: finalOutboxItems, error: finalOutboxError } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (finalOutboxError) {
      console.error('❌ Error checking final outbox status:', finalOutboxError);
    } else {
      console.log(`✅ Remaining pending items: ${finalOutboxItems.length}`);
      if (finalOutboxItems.length > 0) {
        finalOutboxItems.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.event_type} - ${item.status} (${item.created_at})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Fix script error:', error);
  }
}

// Run the fix
fixHubSpotSync().then(() => {
  console.log('\n🏁 HubSpot sync fix complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});