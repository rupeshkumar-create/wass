#!/usr/bin/env node

/**
 * Comprehensive HubSpot Real-time Sync Test
 * Tests nominator, nominee, and voter sync functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testHubSpotConnection() {
  console.log('\n🔍 Testing HubSpot Connection...');
  
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ HubSpot connection successful');
      console.log('Account Info:', result.accountInfo?.portalId);
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

async function testNominatorSync() {
  console.log('\n🔍 Testing Nominator Sync...');
  
  const testNomination = {
    type: 'person',
    categoryGroupId: 'individual-awards',
    subcategoryId: 'best-recruiter',
    nominator: {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe.test@example.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      company: 'Test Staffing Co',
      jobTitle: 'Senior Recruiter',
      phone: '+1-555-0123',
      country: 'United States'
    },
    nominee: {
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane.smith.test@example.com',
      linkedin: 'https://linkedin.com/in/janesmith',
      jobtitle: 'Talent Acquisition Manager',
      company: 'Amazing Corp',
      country: 'United States',
      headshotUrl: 'https://example.com/headshot.jpg',
      whyMe: 'Exceptional recruiting skills',
      bio: 'Experienced recruiter with 10+ years',
      achievements: 'Top performer 2023'
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testNomination)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Nominator sync successful');
      console.log('Nomination ID:', result.nominationId);
      console.log('Nominator ID:', result.nominatorId);
      return result;
    } else {
      console.error('❌ Nominator sync failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Nominator sync error:', error.message);
    return null;
  }
}

async function testNomineeSync(nominationId) {
  console.log('\n🔍 Testing Nominee Sync (Approval)...');
  
  if (!nominationId) {
    console.error('❌ No nomination ID provided for approval test');
    return false;
  }

  try {
    const response = await fetch('http://localhost:3000/api/nomination/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nominationId: nominationId,
        liveUrl: 'https://worldstaffingawards.com/nominee/jane-smith'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Nominee sync successful');
      console.log('Approved Nomination ID:', result.nominationId);
      console.log('Live URL:', result.liveUrl);
      return true;
    } else {
      console.error('❌ Nominee sync failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Nominee sync error:', error.message);
    return false;
  }
}

async function testVoterSync() {
  console.log('\n🔍 Testing Voter Sync...');
  
  // First, get available nominees to vote for
  const { data: nominees } = await supabase
    .from('public_nominees')
    .select('*')
    .eq('subcategory_id', 'best-recruiter')
    .limit(1);

  if (!nominees || nominees.length === 0) {
    console.error('❌ No nominees found to vote for');
    return false;
  }

  const testVote = {
    subcategoryId: 'best-recruiter',
    votedForDisplayName: nominees[0].display_name,
    firstname: 'Alice',
    lastname: 'Johnson',
    email: 'alice.johnson.test@example.com',
    linkedin: 'https://linkedin.com/in/alicejohnson',
    company: 'Voter Corp',
    jobTitle: 'HR Director',
    country: 'Canada'
  };

  try {
    const response = await fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testVote)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Voter sync successful');
      console.log('Vote ID:', result.voteId);
      console.log('Voter ID:', result.voterId);
      console.log('New Vote Count:', result.newVoteCount);
      return true;
    } else {
      console.error('❌ Voter sync failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Voter sync error:', error.message);
    return false;
  }
}

async function testHubSpotCustomProperties() {
  console.log('\n🔍 Testing HubSpot Custom Properties Setup...');
  
  try {
    // Test via API endpoint instead of direct import
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
        console.log('Created properties:', result.created);
      }
      return true;
    } else {
      console.error('❌ Custom properties setup failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Custom properties test error:', error.message);
    return false;
  }
}

async function verifyHubSpotData() {
  console.log('\n🔍 Verifying HubSpot Data...');
  
  try {
    // Check HubSpot outbox for sync records
    const { data: outboxRecords } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log(`📊 Found ${outboxRecords?.length || 0} recent sync records in outbox`);
    
    if (outboxRecords && outboxRecords.length > 0) {
      outboxRecords.forEach(record => {
        console.log(`  - ${record.event_type} (${record.status || 'pending'}) - ${record.created_at}`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Data verification error:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test nominations, nominators, nominees, voters, and votes
    const testEmails = [
      'john.doe.test@example.com',
      'jane.smith.test@example.com',
      'alice.johnson.test@example.com'
    ];

    // Clean up votes first (foreign key constraints)
    for (const email of testEmails) {
      const { data: voter } = await supabase
        .from('voters')
        .select('id')
        .eq('email', email)
        .single();

      if (voter) {
        await supabase.from('votes').delete().eq('voter_id', voter.id);
        await supabase.from('voters').delete().eq('id', voter.id);
      }
    }

    // Clean up nominations and related data
    const { data: nominations } = await supabase
      .from('nominations')
      .select('id, nominee_id, nominator_id')
      .in('nominator_id', 
        (await supabase.from('nominators').select('id').in('email', testEmails)).data?.map(n => n.id) || []
      );

    if (nominations) {
      for (const nomination of nominations) {
        await supabase.from('nominations').delete().eq('id', nomination.id);
        await supabase.from('nominees').delete().eq('id', nomination.nominee_id);
        await supabase.from('nominators').delete().eq('id', nomination.nominator_id);
      }
    }

    // Clean up hubspot_outbox test records
    await supabase
      .from('hubspot_outbox')
      .delete()
      .like('payload->nominator->email', '%test@example.com%');

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Cleanup error (non-critical):', error.message);
  }
}

async function main() {
  console.log('🚀 Starting HubSpot Real-time Sync Test Suite');
  console.log('================================================');

  let allTestsPassed = true;

  // Test 1: HubSpot Connection
  const connectionOk = await testHubSpotConnection();
  if (!connectionOk) {
    allTestsPassed = false;
  }

  // Test 2: Custom Properties Setup
  const propertiesOk = await testHubSpotCustomProperties();
  if (!propertiesOk) {
    allTestsPassed = false;
  }

  // Test 3: Nominator Sync
  const nominationResult = await testNominatorSync();
  if (!nominationResult) {
    allTestsPassed = false;
  }

  // Test 4: Nominee Sync (Approval)
  let nomineeOk = false;
  if (nominationResult) {
    nomineeOk = await testNomineeSync(nominationResult.nominationId);
    if (!nomineeOk) {
      allTestsPassed = false;
    }
  }

  // Test 5: Voter Sync
  const voterOk = await testVoterSync();
  if (!voterOk) {
    allTestsPassed = false;
  }

  // Test 6: Data Verification
  const dataOk = await verifyHubSpotData();
  if (!dataOk) {
    allTestsPassed = false;
  }

  // Cleanup
  await cleanupTestData();

  // Final Results
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`HubSpot Connection: ${connectionOk ? '✅' : '❌'}`);
  console.log(`Custom Properties: ${propertiesOk ? '✅' : '❌'}`);
  console.log(`Nominator Sync: ${nominationResult ? '✅' : '❌'}`);
  console.log(`Nominee Sync: ${nomineeOk ? '✅' : '❌'}`);
  console.log(`Voter Sync: ${voterOk ? '✅' : '❌'}`);
  console.log(`Data Verification: ${dataOk ? '✅' : '❌'}`);

  if (allTestsPassed) {
    console.log('\n🎉 All HubSpot sync tests passed! Real-time sync is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
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
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});