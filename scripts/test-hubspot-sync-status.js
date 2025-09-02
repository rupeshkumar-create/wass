#!/usr/bin/env node

/**
 * Comprehensive HubSpot Sync Status Check
 * Tests all components of the HubSpot integration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hubspotToken = process.env.HUBSPOT_TOKEN;

console.log('🔍 HubSpot Sync Status Check');
console.log('============================');

// Check environment variables
console.log('\n📋 Environment Configuration:');
console.log(`Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`Supabase Service Key: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
console.log(`HubSpot Token: ${hubspotToken ? '✅ Set' : '❌ Missing'}`);
console.log(`HubSpot Sync Enabled: ${process.env.HUBSPOT_SYNC_ENABLED}`);

if (!supabaseUrl || !supabaseServiceKey || !hubspotToken) {
  console.error('\n❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testHubSpotConnection() {
  console.log('\n🔗 Testing HubSpot Connection...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ HubSpot connection successful');
      console.log(`   Portal ID: ${result.accountInfo?.portalId}`);
      console.log(`   Account Name: ${result.accountInfo?.accountName}`);
      return true;
    } else {
      console.error('❌ HubSpot connection failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ HubSpot connection error:', error.message);
    return false;
  }
}

async function testCustomProperties() {
  console.log('\n🏷️ Testing Custom Properties Setup...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'setup-properties',
        test: true 
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Custom properties setup successful');
      if (result.created && result.created.length > 0) {
        console.log(`   Created ${result.created.length} new properties`);
      } else {
        console.log('   All properties already exist');
      }
      return true;
    } else {
      console.error('❌ Custom properties setup failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Custom properties error:', error.message);
    return false;
  }
}

async function checkOutboxStatus() {
  console.log('\n📤 Checking HubSpot Outbox Status...');
  
  try {
    const { data: outboxStats, error } = await supabase
      .from('hubspot_outbox')
      .select('status, event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (!outboxStats || outboxStats.length === 0) {
      console.log('ℹ️ No sync records found in outbox');
      return true;
    }

    // Group by status
    const statusCounts = outboxStats.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`📊 Found ${outboxStats.length} recent sync records:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      const icon = status === 'done' ? '✅' : status === 'pending' ? '⏳' : status === 'processing' ? '🔄' : '❌';
      console.log(`   ${icon} ${status}: ${count}`);
    });

    // Show recent records
    console.log('\n📋 Recent sync records:');
    outboxStats.slice(0, 5).forEach(record => {
      const icon = record.status === 'done' ? '✅' : record.status === 'pending' ? '⏳' : record.status === 'processing' ? '🔄' : '❌';
      const date = new Date(record.created_at).toLocaleString();
      console.log(`   ${icon} ${record.event_type} (${record.status}) - ${date}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Outbox check error:', error.message);
    return false;
  }
}

async function testDirectHubSpotSync() {
  console.log('\n🧪 Testing Direct HubSpot Sync...');
  
  try {
    // Test nominator sync
    const testNominator = {
      firstname: 'Test',
      lastname: 'Nominator',
      email: 'test.sync@example.com',
      linkedin: 'https://linkedin.com/in/testsync',
      company: 'Test Sync Company',
      jobTitle: 'Test Role',
      phone: '+1-555-0199',
      country: 'United States'
    };

    console.log('   Testing nominator sync...');
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'person',
        categoryGroupId: 'individual-awards',
        subcategoryId: 'best-recruiter',
        nominator: testNominator,
        nominee: {
          firstname: 'Test',
          lastname: 'Nominee',
          email: 'test.nominee.sync@example.com',
          linkedin: 'https://linkedin.com/in/testnomineesync',
          jobtitle: 'Test Position',
          company: 'Test Nominee Corp',
          country: 'United States',
          headshotUrl: 'https://example.com/headshot-sync.jpg',
          whyMe: 'Test sync reason',
          bio: 'Test sync bio',
          achievements: 'Test sync achievements'
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Nomination submission successful');
      console.log(`   Nomination ID: ${result.nominationId}`);
      
      // Wait a moment for sync to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if sync record was created
      const { data: syncRecord } = await supabase
        .from('hubspot_outbox')
        .select('*')
        .eq('event_type', 'nomination_submitted')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (syncRecord) {
        console.log(`✅ Sync record created with status: ${syncRecord.status}`);
        return { success: true, nominationId: result.nominationId };
      } else {
        console.log('⚠️ No sync record found');
        return { success: false };
      }
    } else {
      console.error('❌ Nomination submission failed:', result.error);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Direct sync test error:', error.message);
    return { success: false };
  }
}

async function processPendingSync() {
  console.log('\n⚙️ Processing Pending Sync Items...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-key': process.env.CRON_SECRET || 'dev-secret-key'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Sync processing completed');
      console.log(`   Processed: ${result.processed || 0}`);
      console.log(`   Succeeded: ${result.succeeded || 0}`);
      console.log(`   Failed: ${result.failed || 0}`);
      
      if (result.results && result.results.length > 0) {
        console.log('\n📋 Sync Results:');
        result.results.forEach(item => {
          const icon = item.status === 'done' ? '✅' : '❌';
          console.log(`   ${icon} ${item.event_type} (${item.status})`);
          if (item.error) {
            console.log(`      Error: ${item.error}`);
          }
        });
      }
      
      return true;
    } else {
      console.error('❌ Sync processing failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Sync processing error:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    const testEmails = [
      'test.sync@example.com',
      'test.nominee.sync@example.com'
    ];

    // Clean up test records
    for (const email of testEmails) {
      // Clean up voters first
      const { data: voter } = await supabase
        .from('voters')
        .select('id')
        .eq('email', email)
        .single();

      if (voter) {
        await supabase.from('votes').delete().eq('voter_id', voter.id);
        await supabase.from('voters').delete().eq('id', voter.id);
      }

      // Clean up nominations
      const { data: nominator } = await supabase
        .from('nominators')
        .select('id')
        .eq('email', email)
        .single();

      if (nominator) {
        const { data: nominations } = await supabase
          .from('nominations')
          .select('id, nominee_id')
          .eq('nominator_id', nominator.id);

        if (nominations) {
          for (const nomination of nominations) {
            await supabase.from('nominations').delete().eq('id', nomination.id);
            await supabase.from('nominees').delete().eq('id', nomination.nominee_id);
          }
        }

        await supabase.from('nominators').delete().eq('id', nominator.id);
      }
    }

    // Clean up test sync records
    await supabase
      .from('hubspot_outbox')
      .delete()
      .like('payload->nominator->email', '%test.sync@example.com%');

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Cleanup error (non-critical):', error.message);
  }
}

async function main() {
  let allTestsPassed = true;

  // Test 1: HubSpot Connection
  const connectionOk = await testHubSpotConnection();
  if (!connectionOk) allTestsPassed = false;

  // Test 2: Custom Properties
  const propertiesOk = await testCustomProperties();
  if (!propertiesOk) allTestsPassed = false;

  // Test 3: Outbox Status
  const outboxOk = await checkOutboxStatus();
  if (!outboxOk) allTestsPassed = false;

  // Test 4: Direct Sync Test
  const syncTest = await testDirectHubSpotSync();
  if (!syncTest.success) allTestsPassed = false;

  // Test 5: Process Pending Sync
  const processOk = await processPendingSync();
  if (!processOk) allTestsPassed = false;

  // Final outbox check
  await checkOutboxStatus();

  // Cleanup
  await cleanupTestData();

  // Summary
  console.log('\n📊 HubSpot Sync Status Summary');
  console.log('==============================');
  console.log(`HubSpot Connection: ${connectionOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Custom Properties: ${propertiesOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Outbox Status: ${outboxOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Direct Sync Test: ${syncTest.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Sync Processing: ${processOk ? '✅ Working' : '❌ Failed'}`);

  if (allTestsPassed) {
    console.log('\n🎉 HubSpot sync is working properly!');
  } else {
    console.log('\n❌ Some HubSpot sync components need attention.');
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Test interrupted. Cleaning up...');
  await cleanupTestData();
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});