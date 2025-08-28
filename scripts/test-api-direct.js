#!/usr/bin/env node

/**
 * TEST API DIRECTLY
 * This script tests the API code directly without going through the server
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Simulate the API code directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAPIDirectly() {
  console.log('🔍 TESTING API CODE DIRECTLY\n');
  
  try {
    console.log('📡 Testing admin nominations query...');
    
    // This is the exact query from the API
    let query = supabaseAdmin
      .from('admin_nominations')
      .select(`
        nomination_id,
        state,
        votes,
        subcategory_id,
        category_group_id,
        admin_notes,
        rejection_reason,
        created_at,
        updated_at,
        approved_at,
        approved_by,
        nominee_id,
        nominee_type,
        nominee_firstname,
        nominee_lastname,
        nominee_email,
        nominee_linkedin,
        nominee_jobtitle,
        headshot_url,
        why_me,
        company_name,
        company_website,
        company_linkedin,
        logo_url,
        why_us,
        live_url,
        nominee_display_name,
        nominee_image_url,
        nominator_id,
        nominator_email,
        nominator_firstname,
        nominator_lastname,
        nominator_linkedin,
        nominator_company,
        nominator_job_title
      `);

    query = query.order('created_at', { ascending: false });

    const { data: nominations, error } = await query;

    if (error) {
      console.error('❌ Failed to get admin nominations:', error);
      console.error('   Error details:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error hint:', error.hint);
      return;
    }

    console.log(`✅ Query successful! Found ${nominations.length} nominations`);
    
    // Transform to admin-friendly format (this is the exact code from the API)
    const adminNominations = nominations.map(nom => ({
      id: nom.nomination_id,
      type: nom.nominee_type,
      state: nom.state,
      categoryGroupId: nom.category_group_id,
      subcategoryId: nom.subcategory_id,
      
      // Person fields
      firstname: nom.nominee_firstname,
      lastname: nom.nominee_lastname,
      jobtitle: nom.nominee_jobtitle,
      personEmail: nom.nominee_email,
      personLinkedin: nom.nominee_linkedin,
      headshotUrl: nom.headshot_url,
      whyMe: nom.why_me,
      
      // Company fields
      companyName: nom.company_name,
      companyDomain: null, // Not in improved schema
      companyWebsite: nom.company_website,
      companyLinkedin: nom.company_linkedin,
      logoUrl: nom.logo_url,
      whyUs: nom.why_us,
      
      // Shared fields
      liveUrl: nom.live_url,
      votes: nom.votes,
      createdAt: nom.created_at,
      updatedAt: nom.updated_at,
      
      // Nominator info
      nominatorEmail: nom.nominator_email,
      nominatorName: `${nom.nominator_firstname || ''} ${nom.nominator_lastname || ''}`.trim(),
      nominatorCompany: nom.nominator_company,
      nominatorJobTitle: nom.nominator_job_title,
      
      // Computed fields
      displayName: nom.nominee_display_name,
      imageUrl: nom.nominee_image_url,
      
      // Admin fields
      adminNotes: nom.admin_notes,
      rejectionReason: nom.rejection_reason,
      approvedAt: nom.approved_at,
      approvedBy: nom.approved_by
    }));

    console.log('✅ Transformation successful!');
    console.log(`📊 Result: ${JSON.stringify({
      success: true,
      data: adminNominations,
      count: adminNominations.length
    }, null, 2)}`);
    
  } catch (error) {
    console.error('❌ Direct API test failed:', error);
    console.error('   Stack trace:', error.stack);
  }
}

// Also test other endpoints
async function testOtherEndpoints() {
  console.log('\n🔍 TESTING OTHER ENDPOINTS DIRECTLY\n');
  
  // Test stats endpoint
  console.log('📊 Testing stats endpoint...');
  try {
    const { data: nominations, error: nominationsError } = await supabaseAdmin
      .from('nominations')
      .select('id, state, subcategory_id, votes');

    if (nominationsError) {
      console.log(`❌ Stats nominations query failed: ${nominationsError.message}`);
    } else {
      console.log(`✅ Stats nominations query successful: ${nominations.length} records`);
    }

    const { data: votes, error: votesError } = await supabaseAdmin
      .from('votes')
      .select('id, subcategory_id, voter_id');

    if (votesError) {
      console.log(`❌ Stats votes query failed: ${votesError.message}`);
    } else {
      console.log(`✅ Stats votes query successful: ${votes.length} records`);
    }

    const { data: voters, error: votersError } = await supabaseAdmin
      .from('voters')
      .select('id');

    if (votersError) {
      console.log(`❌ Stats voters query failed: ${votersError.message}`);
    } else {
      console.log(`✅ Stats voters query successful: ${voters.length} records`);
    }
  } catch (error) {
    console.log(`❌ Stats endpoint test failed: ${error.message}`);
  }
  
  // Test nominees endpoint
  console.log('\n🏆 Testing nominees endpoint...');
  try {
    const { data: publicNominees, error: nomineesError } = await supabaseAdmin
      .from('public_nominees')
      .select('*')
      .limit(5);

    if (nomineesError) {
      console.log(`❌ Public nominees query failed: ${nomineesError.message}`);
    } else {
      console.log(`✅ Public nominees query successful: ${publicNominees.length} records`);
    }
  } catch (error) {
    console.log(`❌ Nominees endpoint test failed: ${error.message}`);
  }
}

async function runAllTests() {
  await testAPIDirectly();
  await testOtherEndpoints();
}

runAllTests().catch(console.error);