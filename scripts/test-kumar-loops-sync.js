#!/usr/bin/env node

/**
 * Test Loops sync for Kumar Nominess specifically
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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

async function testKumarLoopsSync() {
  console.log('🧪 TESTING KUMAR NOMINESS LOOPS SYNC');
  console.log('===================================');
  
  const targetEmail = 'wosayed784@besaies.com';
  const targetNomineeId = '49805d0c-dc50-40f6-8ebb-424e0ac7e73e';
  
  // 1. Get Kumar's nomination details
  console.log('\n1. Getting Kumar Nominess details...');
  const { data: nominations, error: findError } = await supabase
    .from('nominations')
    .select(`
      *,
      nominees(*),
      nominators(*)
    `)
    .eq('nominee_id', targetNomineeId)
    .single();
  
  if (findError || !nominations) {
    console.error('❌ Error finding nomination:', findError);
    return;
  }
  
  console.log('✅ Found nomination:');
  console.log(`   Nomination ID: ${nominations.id}`);
  console.log(`   State: ${nominations.state}`);
  console.log(`   Nominee: ${nominations.nominees.firstname} ${nominations.nominees.lastname}`);
  console.log(`   Nominee Email: ${nominations.nominees.person_email}`);
  console.log(`   Nominator: ${nominations.nominators.firstname} ${nominations.nominators.lastname}`);
  console.log(`   Nominator Email: ${nominations.nominators.email}`);
  
  // 2. Test nominee sync to Loops (since it's approved)
  console.log('\n2. Testing nominee sync to Loops...');
  
  try {
    // Import the Loops sync function
    const { syncNomineeToLoops } = require('../src/server/loops/realtime-sync');
    
    const nomineeLoopsData = {
      type: nominations.nominees.type,
      subcategoryId: nominations.subcategory_id,
      nominationId: nominations.id,
      liveUrl: `https://worldstaffingawards.com/nominee/${nominations.id}`,
      // Person fields
      firstname: nominations.nominees.firstname,
      lastname: nominations.nominees.lastname,
      email: nominations.nominees.person_email,
      linkedin: nominations.nominees.person_linkedin,
      jobtitle: nominations.nominees.jobtitle,
      company: nominations.nominees.person_company,
      phone: nominations.nominees.person_phone,
      country: nominations.nominees.person_country,
    };

    console.log('🔄 Syncing nominee to Loops...');
    const nomineeResult = await syncNomineeToLoops(nomineeLoopsData);
    
    if (nomineeResult.success) {
      console.log(`✅ Nominee synced successfully: ${nomineeResult.contactId}`);
    } else {
      console.error(`❌ Nominee sync failed: ${nomineeResult.error}`);
    }
  } catch (error) {
    console.error('❌ Error during nominee sync:', error.message);
  }
  
  // 3. Test nominator update to "Nominator Live"
  console.log('\n3. Testing nominator update to "Nominator Live"...');
  
  try {
    const { updateNominatorToLive } = require('../src/server/loops/realtime-sync');
    
    const nomineeName = `${nominations.nominees.firstname} ${nominations.nominees.lastname}`;
    const liveUrl = `https://worldstaffingawards.com/nominee/${nominations.id}`;
    
    console.log('🔄 Updating nominator to "Nominator Live"...');
    const nominatorResult = await updateNominatorToLive(
      nominations.nominators.email,
      {
        name: nomineeName,
        liveUrl: liveUrl
      }
    );
    
    if (nominatorResult.success) {
      console.log(`✅ Nominator updated successfully`);
    } else {
      console.error(`❌ Nominator update failed: ${nominatorResult.error}`);
    }
  } catch (error) {
    console.error('❌ Error during nominator update:', error.message);
  }
  
  // 4. Check if Kumar appears in directory
  console.log('\n4. Checking directory API...');
  try {
    const response = await fetch('http://localhost:3000/api/nominees');
    const result = await response.json();
    
    if (result.success) {
      const kumarNominee = result.data.find(n => 
        n.nominee?.email === targetEmail ||
        n.name.includes('Kumar Nominess')
      );
      
      if (kumarNominee) {
        console.log('✅ Kumar Nominess appears in directory:');
        console.log(`   Name: ${kumarNominee.name}`);
        console.log(`   Email: ${kumarNominee.nominee?.email}`);
        console.log(`   Category: ${kumarNominee.category}`);
        console.log(`   Votes: ${kumarNominee.votes}`);
        console.log(`   Live URL: ${kumarNominee.liveUrl}`);
      } else {
        console.log('❌ Kumar Nominess not found in directory');
      }
    } else {
      console.error('❌ Directory API error:', result.error);
    }
  } catch (error) {
    console.error('❌ Directory API request failed:', error.message);
  }
  
  console.log('\n🎉 KUMAR LOOPS SYNC TEST COMPLETE!');
  console.log('==================================');
  console.log('');
  console.log('✅ What should have happened:');
  console.log('   1. Kumar Nominess synced to Loops with "Nominess" user group');
  console.log('   2. Nominator updated to "Nominator Live" user group');
  console.log('   3. Kumar Nominess appears in the directory');
  console.log('');
  console.log('🔍 Check your Loops dashboard to verify the contacts were created with correct user groups!');
}

testKumarLoopsSync().catch(console.error);