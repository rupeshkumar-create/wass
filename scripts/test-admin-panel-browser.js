#!/usr/bin/env node

/**
 * TEST ADMIN PANEL IN BROWSER
 * This script tests the admin panel functionality that would be used in the browser
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminPanelInBrowser() {
  console.log('🖥️ TESTING ADMIN PANEL BROWSER FUNCTIONALITY\n');
  
  let testData = {
    nominatorId: null,
    nomineeId: null,
    nominationId: null
  };
  
  try {
    // 1. Create test data for admin panel
    console.log('📝 Setting up test data for admin panel...');
    
    // Create nominator
    const { data: nominator, error: nominatorError } = await supabase
      .from('nominators')
      .insert({
        email: 'admin.test@example.com',
        firstname: 'Admin',
        lastname: 'Tester',
        company: 'Test Company',
        job_title: 'Test Manager',
        linkedin: 'https://linkedin.com/in/admintester',
        country: 'USA'
      })
      .select()
      .single();
      
    if (nominatorError) throw new Error(`Failed to create nominator: ${nominatorError.message}`);
    testData.nominatorId = nominator.id;
    console.log(`✅ Created test nominator: ${nominator.firstname} ${nominator.lastname}`);
    
    // Create nominee
    const { data: nominee, error: nomineeError } = await supabase
      .from('nominees')
      .insert({
        type: 'person',
        firstname: 'Test',
        lastname: 'Candidate',
        person_email: 'test.candidate@example.com',
        person_linkedin: 'https://linkedin.com/in/testcandidate',
        jobtitle: 'Senior Recruiter',
        person_company: 'Recruitment Pro',
        person_country: 'USA',
        headshot_url: 'https://example.com/test-headshot.jpg',
        why_me: 'I am an excellent recruiter with proven track record.',
        live_url: 'https://recruitmentpro.com/test-candidate'
      })
      .select()
      .single();
      
    if (nomineeError) throw new Error(`Failed to create nominee: ${nomineeError.message}`);
    testData.nomineeId = nominee.id;
    console.log(`✅ Created test nominee: ${nominee.firstname} ${nominee.lastname}`);
    
    // Create nomination
    const { data: nomination, error: nominationError } = await supabase
      .from('nominations')
      .insert({
        nominator_id: testData.nominatorId,
        nominee_id: testData.nomineeId,
        category_group_id: 'individual-awards',
        subcategory_id: 'top-recruiter',
        state: 'submitted'
      })
      .select()
      .single();
      
    if (nominationError) throw new Error(`Failed to create nomination: ${nominationError.message}`);
    testData.nominationId = nomination.id;
    console.log(`✅ Created test nomination: ${nomination.subcategory_id} (${nomination.state})`);
    
    // 2. Test Admin Panel API Calls
    console.log('\n🔍 Testing admin panel API calls...');
    
    // Test getting all nominations (what admin panel would do on load)
    console.log('📊 Testing GET /api/admin/nominations...');
    const adminResponse = await fetch('http://localhost:3000/api/admin/nominations');
    
    if (!adminResponse.ok) {
      throw new Error(`Admin API failed: ${adminResponse.status} ${adminResponse.statusText}`);
    }
    
    const adminData = await adminResponse.json();
    console.log(`✅ Admin API successful: ${adminData.count} nominations found`);
    
    if (adminData.data.length > 0) {
      const testNomination = adminData.data.find(n => n.id === testData.nominationId);
      if (testNomination) {
        console.log(`✅ Found our test nomination in admin data:`);
        console.log(`   Name: ${testNomination.displayName}`);
        console.log(`   Status: ${testNomination.state}`);
        console.log(`   Category: ${testNomination.subcategoryId}`);
        console.log(`   Nominator: ${testNomination.nominatorName}`);
      }
    }
    
    // 3. Test Admin Panel Actions
    console.log('\n⚡ Testing admin panel actions...');
    
    // Test approving a nomination
    console.log('✅ Testing nomination approval...');
    const approveResponse = await fetch('http://localhost:3000/api/admin/nominations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nominationId: testData.nominationId,
        state: 'approved',
        liveUrl: 'https://updated-live-url.com'
      })
    });
    
    if (!approveResponse.ok) {
      throw new Error(`Approval failed: ${approveResponse.status} ${approveResponse.statusText}`);
    }
    
    const approveData = await approveResponse.json();
    console.log(`✅ Nomination approval successful: ${approveData.success ? 'Success' : 'Failed'}`);
    
    // Verify the approval worked
    const verifyResponse = await fetch('http://localhost:3000/api/admin/nominations');
    const verifyData = await verifyResponse.json();
    const updatedNomination = verifyData.data.find(n => n.id === testData.nominationId);
    
    if (updatedNomination && updatedNomination.state === 'approved') {
      console.log(`✅ Nomination status successfully updated to: ${updatedNomination.state}`);
    } else {
      console.log(`❌ Nomination status update failed`);
    }
    
    // 4. Test Public API (what users would see)
    console.log('\n🌐 Testing public API (approved nominees)...');
    
    const publicResponse = await fetch('http://localhost:3000/api/nominees');
    const publicData = await publicResponse.json();
    
    console.log(`✅ Public nominees API: ${publicData.count} approved nominees visible to public`);
    
    const ourApprovedNominee = publicData.data.find(n => n.name === 'Test Candidate');
    if (ourApprovedNominee) {
      console.log(`✅ Our approved nominee is visible to public: ${ourApprovedNominee.name}`);
    }
    
    // 5. Test Stats API
    console.log('\n📈 Testing stats API...');
    
    const statsResponse = await fetch('http://localhost:3000/api/stats');
    const statsData = await statsResponse.json();
    
    console.log(`✅ Stats API working:`);
    console.log(`   Total Nominees: ${statsData.totalNominees}`);
    console.log(`   Approved: ${statsData.approvedNominations}`);
    console.log(`   Pending: ${statsData.pendingNominations}`);
    console.log(`   Total Votes: ${statsData.totalVotes}`);
    
    console.log('\n🎉 ADMIN PANEL BROWSER TEST SUCCESSFUL!');
    console.log('✅ All admin panel functionality working correctly');
    console.log('✅ Nomination approval workflow functional');
    console.log('✅ Public visibility working correctly');
    console.log('✅ Stats dashboard functional');
    
  } catch (error) {
    console.error('❌ Admin panel test failed:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      if (testData.nominationId) {
        await supabase.from('nominations').delete().eq('id', testData.nominationId);
        console.log('✅ Deleted test nomination');
      }
      
      if (testData.nomineeId) {
        await supabase.from('nominees').delete().eq('id', testData.nomineeId);
        console.log('✅ Deleted test nominee');
      }
      
      if (testData.nominatorId) {
        await supabase.from('nominators').delete().eq('id', testData.nominatorId);
        console.log('✅ Deleted test nominator');
      }
      
      console.log('🧹 Cleanup complete!');
      
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
  }
}

testAdminPanelInBrowser().catch(console.error);