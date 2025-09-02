#!/usr/bin/env node

/**
 * Debug script to find Kumar Nominess nominee
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

async function debugKumarNominess() {
  console.log('🔍 DEBUGGING KUMAR NOMINESS');
  console.log('==========================');
  
  const targetEmail = 'wosayed784@besaies.com';
  const targetName = 'Kumar Nominess';
  
  console.log(`\n1. Searching for nominee with email: ${targetEmail}`);
  console.log(`   Or name containing: ${targetName}`);
  
  // Check nominees table
  console.log('\n📋 Checking nominees table...');
  const { data: nominees, error: nomineesError } = await supabase
    .from('nominees')
    .select('*')
    .or(`person_email.eq.${targetEmail},firstname.ilike.%Kumar%,lastname.ilike.%Nominess%`);
  
  if (nomineesError) {
    console.error('❌ Error querying nominees:', nomineesError);
  } else {
    console.log(`✅ Found ${nominees.length} nominees:`);
    nominees.forEach(nominee => {
      console.log(`   - ID: ${nominee.id}`);
      console.log(`     Type: ${nominee.type}`);
      console.log(`     Name: ${nominee.firstname} ${nominee.lastname}`);
      console.log(`     Email: ${nominee.person_email}`);
      console.log(`     Created: ${nominee.created_at}`);
      console.log('');
    });
  }
  
  // Check nominations table
  console.log('\n📋 Checking nominations table...');
  const { data: nominations, error: nominationsError } = await supabase
    .from('nominations')
    .select(`
      *,
      nominees!inner(*)
    `)
    .or(`nominees.person_email.eq.${targetEmail},nominees.firstname.ilike.%Kumar%`);
  
  if (nominationsError) {
    console.error('❌ Error querying nominations:', nominationsError);
  } else {
    console.log(`✅ Found ${nominations.length} nominations:`);
    nominations.forEach(nomination => {
      console.log(`   - Nomination ID: ${nomination.id}`);
      console.log(`     State: ${nomination.state}`);
      console.log(`     Approved: ${nomination.approved_at}`);
      console.log(`     Nominee: ${nomination.nominees.firstname} ${nomination.nominees.lastname}`);
      console.log(`     Email: ${nomination.nominees.person_email}`);
      console.log(`     Votes: ${nomination.votes}`);
      console.log('');
    });
  }
  
  // Check public_nominees view
  console.log('\n📋 Checking public_nominees view...');
  const { data: publicNominees, error: publicError } = await supabase
    .from('public_nominees')
    .select('*')
    .or(`email.eq.${targetEmail},display_name.ilike.%Kumar%`);
  
  if (publicError) {
    console.error('❌ Error querying public_nominees:', publicError);
  } else {
    console.log(`✅ Found ${publicNominees.length} public nominees:`);
    publicNominees.forEach(nominee => {
      console.log(`   - Nomination ID: ${nominee.nomination_id}`);
      console.log(`     Display Name: ${nominee.display_name}`);
      console.log(`     Email: ${nominee.email}`);
      console.log(`     Type: ${nominee.type}`);
      console.log(`     Votes: ${nominee.votes}`);
      console.log(`     Category: ${nominee.subcategory_id}`);
      console.log(`     Approved: ${nominee.approved_at}`);
      console.log('');
    });
  }
  
  // Check all approved nominations
  console.log('\n📋 Checking all approved nominations...');
  const { data: allApproved, error: approvedError } = await supabase
    .from('nominations')
    .select(`
      *,
      nominees(*)
    `)
    .eq('state', 'approved')
    .order('approved_at', { ascending: false })
    .limit(10);
  
  if (approvedError) {
    console.error('❌ Error querying approved nominations:', approvedError);
  } else {
    console.log(`✅ Found ${allApproved.length} recent approved nominations:`);
    allApproved.forEach(nomination => {
      console.log(`   - ${nomination.nominees.firstname} ${nomination.nominees.lastname}`);
      console.log(`     Email: ${nomination.nominees.person_email}`);
      console.log(`     Approved: ${nomination.approved_at}`);
      console.log(`     State: ${nomination.state}`);
      console.log('');
    });
  }
  
  // Test the API endpoint
  console.log('\n🌐 Testing /api/nominees endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/nominees');
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ API returned ${result.data.length} nominees`);
      
      // Look for Kumar
      const kumarNominee = result.data.find(n => 
        n.name.includes('Kumar') || 
        n.nominee?.email === targetEmail ||
        n.displayName.includes('Kumar')
      );
      
      if (kumarNominee) {
        console.log('🎯 Found Kumar in API response:');
        console.log('   Name:', kumarNominee.name);
        console.log('   Email:', kumarNominee.nominee?.email);
        console.log('   Type:', kumarNominee.type);
        console.log('   Category:', kumarNominee.category);
        console.log('   Votes:', kumarNominee.votes);
      } else {
        console.log('❌ Kumar not found in API response');
        
        // Show first few nominees for comparison
        console.log('\n📋 First 3 nominees from API:');
        result.data.slice(0, 3).forEach(nominee => {
          console.log(`   - ${nominee.name} (${nominee.nominee?.email})`);
        });
      }
    } else {
      console.error('❌ API error:', result.error);
    }
  } catch (error) {
    console.error('❌ API request failed:', error.message);
  }
  
  console.log('\n🔍 DEBUGGING COMPLETE');
  console.log('====================');
}

debugKumarNominess().catch(console.error);