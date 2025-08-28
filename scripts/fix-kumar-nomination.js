#!/usr/bin/env node

/**
 * Fix Kumar Nominess nomination approval
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

async function fixKumarNomination() {
  console.log('🔧 FIXING KUMAR NOMINESS NOMINATION');
  console.log('===================================');
  
  const targetEmail = 'wosayed784@besaies.com';
  const targetNomineeId = '49805d0c-dc50-40f6-8ebb-424e0ac7e73e';
  
  // 1. Find the nomination for Kumar Nominess
  console.log('\n1. Finding Kumar Nominess nomination...');
  const { data: nominations, error: findError } = await supabase
    .from('nominations')
    .select(`
      *,
      nominees(*)
    `)
    .eq('nominee_id', targetNomineeId);
  
  if (findError) {
    console.error('❌ Error finding nomination:', findError);
    return;
  }
  
  if (!nominations || nominations.length === 0) {
    console.error('❌ No nomination found for Kumar Nominess');
    return;
  }
  
  const nomination = nominations[0];
  console.log('✅ Found nomination:');
  console.log(`   ID: ${nomination.id}`);
  console.log(`   State: ${nomination.state}`);
  console.log(`   Approved At: ${nomination.approved_at}`);
  console.log(`   Nominee: ${nomination.nominees.firstname} ${nomination.nominees.lastname}`);
  console.log(`   Email: ${nomination.nominees.person_email}`);
  
  // 2. Check if it needs approval
  if (nomination.state !== 'approved') {
    console.log('\n2. Approving nomination...');
    
    const { data: updatedNomination, error: approveError } = await supabase
      .from('nominations')
      .update({
        state: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin'
      })
      .eq('id', nomination.id)
      .select()
      .single();
    
    if (approveError) {
      console.error('❌ Error approving nomination:', approveError);
      return;
    }
    
    console.log('✅ Nomination approved successfully!');
    console.log(`   New state: ${updatedNomination.state}`);
    console.log(`   Approved at: ${updatedNomination.approved_at}`);
  } else {
    console.log('\n2. Nomination is already approved');
  }
  
  // 3. Check if nominee appears in public_nominees view now
  console.log('\n3. Checking public_nominees view...');
  const { data: publicNominees, error: publicError } = await supabase
    .from('public_nominees')
    .select('*')
    .eq('email', targetEmail);
  
  if (publicError) {
    console.error('❌ Error checking public_nominees:', publicError);
  } else if (publicNominees && publicNominees.length > 0) {
    console.log('✅ Kumar Nominess now appears in public_nominees:');
    publicNominees.forEach(nominee => {
      console.log(`   - Display Name: ${nominee.display_name}`);
      console.log(`     Email: ${nominee.email}`);
      console.log(`     Category: ${nominee.subcategory_id}`);
      console.log(`     Votes: ${nominee.votes}`);
    });
  } else {
    console.log('❌ Kumar Nominess still not in public_nominees view');
    
    // Let's check what's wrong with the view
    console.log('\n4. Debugging public_nominees view...');
    const { data: allPublic, error: allError } = await supabase
      .from('public_nominees')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error('❌ Error querying public_nominees:', allError);
    } else {
      console.log('📋 Sample public_nominees entries:');
      allPublic.forEach(nominee => {
        console.log(`   - ${nominee.display_name} (${nominee.email})`);
      });
    }
  }
  
  // 4. Test the API endpoint
  console.log('\n5. Testing API endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/nominees');
    const result = await response.json();
    
    if (result.success) {
      const kumarNominee = result.data.find(n => 
        n.nominee?.email === targetEmail ||
        n.name.includes('Kumar Nominess')
      );
      
      if (kumarNominee) {
        console.log('✅ Kumar Nominess now appears in API:');
        console.log(`   Name: ${kumarNominee.name}`);
        console.log(`   Email: ${kumarNominee.nominee?.email}`);
        console.log(`   Category: ${kumarNominee.category}`);
      } else {
        console.log('❌ Kumar Nominess still not in API response');
      }
    } else {
      console.error('❌ API error:', result.error);
    }
  } catch (error) {
    console.error('❌ API request failed:', error.message);
  }
  
  console.log('\n🎉 FIXING COMPLETE!');
  console.log('==================');
  console.log('Kumar Nominess should now appear in the directory if the nomination was properly approved.');
}

fixKumarNomination().catch(console.error);