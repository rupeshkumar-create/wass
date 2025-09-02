#!/usr/bin/env node

/**
 * Debug script for admin panel errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Debugging Admin Panel Issues...\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SERVICE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugAdminIssues() {
  try {
    // Test 1: Database connection
    console.log('\n2. Testing Database Connection...');
    const { data: testData, error: testError } = await supabase
      .from('nominations')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Nominations table structure
    console.log('\n3. Testing Nominations Table Structure...');
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select(`
        id,
        type,
        category_group_id,
        subcategory_id,
        state,
        firstname,
        lastname,
        jobtitle,
        person_email,
        person_linkedin,
        headshot_url,
        why_me,
        company_name,
        company_domain,
        company_website,
        company_linkedin,
        logo_url,
        why_us,
        live_url,
        votes,
        created_at,
        updated_at
      `)
      .limit(1);

    if (nomError) {
      console.error('❌ Nominations query failed:', nomError);
      return;
    }
    console.log('✅ Nominations table structure valid');

    // Test 3: Stats API simulation
    console.log('\n4. Testing Stats Calculation...');
    const { data: allNominations, error: allError } = await supabase
      .from('nominations')
      .select('state, votes');

    if (allError) {
      console.error('❌ Stats query failed:', allError);
      return;
    }

    const stats = {
      totalNominees: allNominations.length,
      pendingNominations: allNominations.filter(n => n.state === 'submitted').length,
      approvedNominations: allNominations.filter(n => n.state === 'approved').length,
      rejectedNominations: allNominations.filter(n => n.state === 'rejected').length,
      totalVotes: allNominations.reduce((sum, n) => sum + (n.votes || 0), 0)
    };

    console.log('✅ Stats calculated successfully:');
    console.log(`   Total: ${stats.totalNominees}`);
    console.log(`   Pending: ${stats.pendingNominations}`);
    console.log(`   Approved: ${stats.approvedNominations}`);
    console.log(`   Rejected: ${stats.rejectedNominations}`);
    console.log(`   Total Votes: ${stats.totalVotes}`);

    // Test 4: Votes table
    console.log('\n5. Testing Votes Table...');
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(5);

    if (votesError) {
      console.error('❌ Votes query failed:', votesError);
      console.log('   This might be expected if votes table doesn\'t exist yet');
    } else {
      console.log(`✅ Votes table accessible, found ${votes.length} sample votes`);
    }

    // Test 5: Categories and directory structure
    console.log('\n6. Testing Categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (catError) {
      console.error('❌ Categories query failed:', catError);
    } else {
      console.log(`✅ Categories table accessible, found ${categories.length} categories`);
    }

    console.log('\n🎉 All basic tests passed!');
    console.log('\nPossible issues to check:');
    console.log('• Check browser console for client-side errors');
    console.log('• Verify admin authentication is working');
    console.log('• Check network tab for failed API requests');
    console.log('• Ensure all required UI components exist');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugAdminIssues();