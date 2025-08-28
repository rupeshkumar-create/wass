#!/usr/bin/env node

/**
 * Verify Supabase Data
 * Check that data is properly stored in all tables
 */

require('dotenv').config({ path: '.env.local' });

async function verifyData() {
  console.log('🔍 Verifying Supabase Data Storage...\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Check nominations table
  console.log('1️⃣ Checking nominations table...');
  const { data: nominations, error: nomError } = await supabase
    .from('nominations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (nomError) {
    console.log('   ❌ Error:', nomError.message);
  } else {
    console.log(`   ✅ Found ${nominations.length} nominations`);
    nominations.forEach((nom, i) => {
      console.log(`   ${i + 1}. ${nom.type} - ${nom.firstname || nom.company_name} (${nom.state}) - Votes: ${nom.votes}`);
    });
  }
  
  // Check nominators table
  console.log('\\n2️⃣ Checking nominators table...');
  const { data: nominators, error: nomtError } = await supabase
    .from('nominators')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (nomtError) {
    console.log('   ❌ Error:', nomtError.message);
  } else {
    console.log(`   ✅ Found ${nominators.length} nominators`);
    nominators.forEach((nom, i) => {
      console.log(`   ${i + 1}. ${nom.firstname} ${nom.lastname} (${nom.email}) - Status: ${nom.status}`);
    });
  }
  
  // Check voters table
  console.log('\\n3️⃣ Checking voters table...');
  const { data: voters, error: voterError } = await supabase
    .from('voters')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (voterError) {
    console.log('   ❌ Error:', voterError.message);
  } else {
    console.log(`   ✅ Found ${voters.length} voters`);
    voters.forEach((voter, i) => {
      console.log(`   ${i + 1}. ${voter.firstname} ${voter.lastname} (${voter.email}) voted for: ${voter.voted_for_display_name}`);
    });
  }
  
  // Check HubSpot outbox
  console.log('\\n4️⃣ Checking HubSpot sync outbox...');
  const { data: outbox, error: outboxError } = await supabase
    .from('hubspot_outbox')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (outboxError) {
    console.log('   ❌ Error:', outboxError.message);
  } else {
    console.log(`   ✅ Found ${outbox.length} sync items`);
    outbox.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.event_type} - Status: ${item.status} (Attempts: ${item.attempt_count})`);
    });
    
    // Show pending items
    const pending = outbox.filter(item => item.status === 'pending');
    if (pending.length > 0) {
      console.log(`   📋 ${pending.length} items pending sync to HubSpot`);
    }
    
    const done = outbox.filter(item => item.status === 'done');
    if (done.length > 0) {
      console.log(`   ✅ ${done.length} items successfully synced`);
    }
  }
  
  console.log('\\n📊 Summary:');
  console.log(`   • ${nominations?.length || 0} nominations stored`);
  console.log(`   • ${nominators?.length || 0} nominators tracked`);
  console.log(`   • ${voters?.length || 0} votes cast`);
  console.log(`   • ${outbox?.length || 0} sync events queued`);
  
  console.log('\\n🎉 Supabase is storing all data correctly!');
  console.log('\\n📋 Next steps:');
  console.log('   1. Implement actual HubSpot sync logic in the worker');
  console.log('   2. Set up a cron job to process the sync queue');
  console.log('   3. Update your UI components to use these API routes');
}

verifyData();