#!/usr/bin/env node

/**
 * Debug HubSpot Sync Issue
 * Check specific emails and sync status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
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

const testEmails = [
  '0a5m7@powerscrews.com',      // Nominator
  'paxibaf121@ahanim.com',      // Nominee
  'fowl36104@mailshan.com'      // Voter
];

async function checkDatabaseRecords() {
  console.log('🔍 Checking database records for test emails...\n');

  // Check nominators
  console.log('📋 NOMINATORS:');
  for (const email of testEmails) {
    const { data: nominator } = await supabase
      .from('nominators')
      .select('*')
      .eq('email', email)
      .single();

    if (nominator) {
      console.log(`✅ Found nominator: ${email}`);
      console.log(`   - ID: ${nominator.id}`);
      console.log(`   - Name: ${nominator.firstname} ${nominator.lastname}`);
      console.log(`   - Created: ${nominator.created_at}`);
    } else {
      console.log(`❌ No nominator found for: ${email}`);
    }
  }

  // Check nominees
  console.log('\n📋 NOMINEES:');
  for (const email of testEmails) {
    const { data: nominee } = await supabase
      .from('nominees')
      .select('*')
      .eq('person_email', email)
      .single();

    if (nominee) {
      console.log(`✅ Found nominee: ${email}`);
      console.log(`   - ID: ${nominee.id}`);
      console.log(`   - Name: ${nominee.firstname} ${nominee.lastname}`);
      console.log(`   - Type: ${nominee.type}`);
    } else {
      console.log(`❌ No nominee found for: ${email}`);
    }
  }

  // Check voters
  console.log('\n📋 VOTERS:');
  for (const email of testEmails) {
    const { data: voter } = await supabase
      .from('voters')
      .select('*')
      .eq('email', email)
      .single();

    if (voter) {
      console.log(`✅ Found voter: ${email}`);
      console.log(`   - ID: ${voter.id}`);
      console.log(`   - Name: ${voter.firstname} ${voter.lastname}`);
      console.log(`   - Created: ${voter.created_at}`);
    } else {
      console.log(`❌ No voter found for: ${email}`);
    }
  }

  // Check nominations
  console.log('\n📋 NOMINATIONS:');
  const { data: nominations } = await supabase
    .from('nominations')
    .select(`
      *,
      nominators(email, firstname, lastname),
      nominees(person_email, firstname, lastname, type)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (nominations && nominations.length > 0) {
    console.log(`Found ${nominations.length} recent nominations:`);
    nominations.forEach((nom, index) => {
      console.log(`${index + 1}. Nomination ID: ${nom.id}`);
      console.log(`   - Nominator: ${nom.nominators?.email}`);
      console.log(`   - Nominee: ${nom.nominees?.person_email || 'Company'}`);
      console.log(`   - State: ${nom.state}`);
      console.log(`   - Created: ${nom.created_at}`);
    });
  } else {
    console.log('❌ No nominations found');
  }

  // Check votes
  console.log('\n📋 VOTES:');
  const { data: votes } = await supabase
    .from('votes')
    .select(`
      *,
      voters(email, firstname, lastname)
    `)
    .order('vote_timestamp', { ascending: false })
    .limit(10);

  if (votes && votes.length > 0) {
    console.log(`Found ${votes.length} recent votes:`);
    votes.forEach((vote, index) => {
      console.log(`${index + 1}. Vote ID: ${vote.id}`);
      console.log(`   - Voter: ${vote.voters?.email}`);
      console.log(`   - Nomination ID: ${vote.nomination_id}`);
      console.log(`   - Timestamp: ${vote.vote_timestamp}`);
    });
  } else {
    console.log('❌ No votes found');
  }
}

async function checkHubSpotOutbox() {
  console.log('\n🔍 Checking HubSpot outbox for sync records...\n');

  const { data: outboxRecords } = await supabase
    .from('hubspot_outbox')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (outboxRecords && outboxRecords.length > 0) {
    console.log(`📊 Found ${outboxRecords.length} sync records:`);
    outboxRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. ${record.event_type} (ID: ${record.id})`);
      console.log(`   - Status: ${record.status || 'pending'}`);
      console.log(`   - Attempts: ${record.attempt_count || 0}`);
      console.log(`   - Created: ${record.created_at}`);
      console.log(`   - Last Error: ${record.last_error || 'None'}`);
      
      // Show relevant email from payload
      if (record.payload) {
        const payload = record.payload;
        if (payload.nominator?.email) {
          console.log(`   - Nominator Email: ${payload.nominator.email}`);
        }
        if (payload.nominee?.email || payload.nominee?.person_email) {
          console.log(`   - Nominee Email: ${payload.nominee.email || payload.nominee.person_email}`);
        }
        if (payload.voter?.email) {
          console.log(`   - Voter Email: ${payload.voter.email}`);
        }
      }
    });
  } else {
    console.log('❌ No HubSpot outbox records found');
  }
}

async function testHubSpotConnection() {
  console.log('\n🔍 Testing HubSpot connection...\n');

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
      console.log(`   - Portal ID: ${result.accountInfo?.portalId}`);
      console.log(`   - Custom Properties: ${result.customProperties?.length || 0} WSA properties found`);
    } else {
      console.error('❌ HubSpot connection failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ HubSpot connection error:', error.message);
    return false;
  }

  return true;
}

async function testDirectHubSpotSync() {
  console.log('\n🔍 Testing direct HubSpot sync...\n');

  // Test nominator sync
  console.log('Testing nominator sync...');
  try {
    const nominatorData = {
      firstname: 'Test',
      lastname: 'Nominator',
      email: '0a5m7@powerscrews.com',
      linkedin: 'https://linkedin.com/in/test',
      company: 'Test Company',
      jobTitle: 'Test Role',
      phone: '+1-555-0123',
      country: 'United States'
    };

    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'person',
        categoryGroupId: 'individual-awards',
        subcategoryId: 'best-recruiter',
        nominator: nominatorData,
        nominee: {
          firstname: 'Test',
          lastname: 'Nominee',
          email: 'paxibaf121@ahanim.com',
          linkedin: 'https://linkedin.com/in/testnominee',
          jobtitle: 'Test Position',
          company: 'Test Corp',
          country: 'United States',
          headshotUrl: 'https://example.com/headshot.jpg',
          whyMe: 'Test reason',
          bio: 'Test bio',
          achievements: 'Test achievements'
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nomination submission successful');
      console.log(`   - Nomination ID: ${result.nominationId}`);
      return result.nominationId;
    } else {
      const error = await response.json();
      console.error('❌ Nomination submission failed:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Nomination submission error:', error.message);
    return null;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...\n');

  const requiredVars = [
    'HUBSPOT_TOKEN',
    'HUBSPOT_SYNC_ENABLED',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allPresent = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('TOKEN') || varName.includes('KEY') ? '***REDACTED***' : value}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allPresent = false;
    }
  });

  return allPresent;
}

async function main() {
  console.log('🚀 HubSpot Sync Debug Tool');
  console.log('==========================\n');

  console.log('Target emails:');
  testEmails.forEach(email => console.log(`  - ${email}`));

  // Check environment
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    console.log('\n❌ Environment variables missing. Please check your .env file.');
    return;
  }

  // Check database records
  await checkDatabaseRecords();

  // Check HubSpot outbox
  await checkHubSpotOutbox();

  // Test HubSpot connection
  const connectionOk = await testHubSpotConnection();
  if (!connectionOk) {
    console.log('\n❌ HubSpot connection failed. Sync will not work.');
    return;
  }

  // Test direct sync
  await testDirectHubSpotSync();

  console.log('\n📊 Debug Summary:');
  console.log('================');
  console.log('1. Check the database records above to see if your submissions were saved');
  console.log('2. Check the HubSpot outbox to see if sync records were created');
  console.log('3. If outbox records exist but have errors, check the error messages');
  console.log('4. If no outbox records exist, the real-time sync might not be triggering');
  console.log('5. Check the server logs for any error messages during submission');
}

main().catch(error => {
  console.error('💥 Debug script failed:', error);
  process.exit(1);
});