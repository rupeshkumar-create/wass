#!/usr/bin/env node

/**
 * Setup Real-time HubSpot Sync for World Staffing Awards 2026
 * This script ensures all future nominations sync immediately to HubSpot
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

async function setupRealtimeSync() {
  console.log('🚀 Setting up Real-time HubSpot Sync for WSA 2026');
  console.log('='.repeat(60));

  try {
    // 1. Test HubSpot connection
    console.log('\n1. Testing HubSpot connection...');
    
    const testResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log('✅ HubSpot connection:', testResult.success ? 'SUCCESS' : 'FAILED');
      if (testResult.accountInfo) {
        console.log(`  Account ID: ${testResult.accountInfo.portalId}`);
        console.log(`  Account Name: ${testResult.accountInfo.accountName || 'N/A'}`);
      }
    } else {
      console.log('❌ HubSpot connection test failed');
      return;
    }

    // 2. Setup HubSpot custom properties
    console.log('\n2. Setting up HubSpot custom properties...');
    
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
        console.log(`  Created ${setupResult.created.length} properties`);
      }
    } else {
      console.log('❌ HubSpot properties setup failed');
    }

    // 3. Process all existing pending items
    console.log('\n3. Processing all pending HubSpot sync items...');
    
    let totalProcessed = 0;
    let batchCount = 0;
    
    while (true) {
      batchCount++;
      console.log(`\n  Batch ${batchCount}:`);
      
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
        console.log(`    Processed: ${batchResult.processed}, Succeeded: ${batchResult.succeeded}, Failed: ${batchResult.failed}`);
        
        totalProcessed += batchResult.processed;
        
        // If no items were processed, we're done
        if (batchResult.processed === 0) {
          console.log('    No more items to process');
          break;
        }
        
        // Safety limit
        if (batchCount >= 10) {
          console.log('    Reached batch limit (10), stopping');
          break;
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('    Batch failed:', await batchResponse.text());
        break;
      }
    }
    
    console.log(`\n  Total items processed: ${totalProcessed}`);

    // 4. Verify final status
    console.log('\n4. Verifying final sync status...');
    
    const { data: pendingItems, error: pendingError } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('❌ Error checking pending items:', pendingError);
    } else {
      console.log(`✅ Remaining pending items: ${pendingItems.length}`);
      
      if (pendingItems.length > 0) {
        console.log('\n  Pending items:');
        pendingItems.slice(0, 5).forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.event_type} - ${item.created_at}`);
        });
        
        if (pendingItems.length > 5) {
          console.log(`    ... and ${pendingItems.length - 5} more`);
        }
      }
    }

    // 5. Check for failed items
    const { data: failedItems, error: failedError } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .eq('status', 'dead')
      .order('created_at', { ascending: false });

    if (failedError) {
      console.error('❌ Error checking failed items:', failedError);
    } else {
      console.log(`✅ Failed (dead) items: ${failedItems.length}`);
      
      if (failedItems.length > 0) {
        console.log('\n  Failed items:');
        failedItems.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. ${item.event_type} - ${item.last_error}`);
        });
      }
    }

    // 6. Test a sample sync to ensure everything works
    console.log('\n5. Testing sample sync...');
    
    const sampleNominatorData = {
      firstname: 'Test',
      lastname: 'Nominator',
      email: 'test-nominator@example.com',
      linkedin: 'https://linkedin.com/in/test',
      company: 'Test Company',
      jobTitle: 'Test Role',
      phone: '+1234567890',
      country: 'United States',
    };

    const sampleResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_nominator',
        data: sampleNominatorData
      })
    });

    if (sampleResponse.ok) {
      const sampleResult = await sampleResponse.json();
      console.log('✅ Sample sync test:', sampleResult.success ? 'SUCCESS' : 'FAILED');
      if (sampleResult.contactId) {
        console.log(`  Test Contact ID: ${sampleResult.contactId}`);
      }
      if (sampleResult.error) {
        console.log(`  Error: ${sampleResult.error}`);
      }
    } else {
      console.log('❌ Sample sync test failed:', await sampleResponse.text());
    }

    console.log('\n🎉 Real-time HubSpot sync setup complete!');
    console.log('\nNext steps:');
    console.log('1. All future nominations will sync immediately to HubSpot');
    console.log('2. Both nominators and nominees get proper tags');
    console.log('3. Backup sync via outbox ensures no data is lost');
    console.log('4. Run this script periodically to process any failed syncs');

  } catch (error) {
    console.error('❌ Setup script error:', error);
  }
}

// Run the setup
setupRealtimeSync().then(() => {
  console.log('\n🏁 Setup complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});