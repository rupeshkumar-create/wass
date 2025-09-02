#!/usr/bin/env node

/**
 * Complete Loops User Groups Test
 * Tests all user group assignments and updates
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

async function testLoopsUserGroups() {
  console.log('🧪 COMPLETE LOOPS USER GROUPS TEST');
  console.log('==================================');
  
  // Check configuration
  console.log('\n1. Configuration Check');
  console.log('----------------------');
  console.log('LOOPS_API_KEY:', process.env.LOOPS_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('LOOPS_SYNC_ENABLED:', process.env.LOOPS_SYNC_ENABLED);
  
  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ LOOPS_API_KEY is required');
    return;
  }

  // Test Loops connection
  console.log('\n2. Testing Loops Connection');
  console.log('---------------------------');
  try {
    const testContact = {
      email: 'test-usergroups@worldstaffingawards.com',
      firstName: 'Test',
      lastName: 'UserGroups',
      source: 'World Staffing Awards 2026',
      userGroup: 'Test'
    };
    
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });
    
    if (response.ok || response.status === 409) {
      console.log('✅ Loops API connection successful');
    } else {
      const errorText = await response.text();
      console.error('❌ Loops API connection failed:', response.status, errorText);
      return;
    }
  } catch (error) {
    console.error('❌ Loops API connection error:', error.message);
    return;
  }

  // Test data with unique emails
  const timestamp = Date.now();
  const testData = {
    nominator: {
      firstname: 'Test',
      lastname: 'Nominator',
      email: `test.nominator.${timestamp}@example.com`,
      linkedin: 'https://linkedin.com/in/testnominator',
      company: 'Test Company',
      jobTitle: 'Test Manager',
      phone: '+1234567890',
      country: 'United States'
    },
    nominee: {
      firstname: 'Test',
      lastname: 'Nominee',
      email: `test.nominee.${timestamp}@example.com`,
      linkedin: 'https://linkedin.com/in/testnominee',
      jobtitle: 'Senior Developer',
      company: 'Tech Corp',
      phone: '+1987654321',
      country: 'Canada',
      headshotUrl: 'https://example.com/headshot.jpg',
      whyMe: 'Excellent developer with 10+ years experience',
      bio: 'Experienced developer',
      achievements: 'Multiple awards'
    },
    voter: {
      firstname: 'Test',
      lastname: 'Voter',
      email: `test.voter.${timestamp}@example.com`,
      linkedin: 'https://linkedin.com/in/testvoter',
      company: 'Voting Corp',
      jobTitle: 'Voter Manager',
      country: 'United Kingdom'
    },
    subcategoryId: 'test-category-usergroups',
    categoryGroupId: 'test-group-usergroups'
  };

  // Step 1: Test nomination submission (should sync nominator with "Nominator" user group)
  console.log('\n3. Testing Nomination Submission');
  console.log('--------------------------------');
  
  const nominationPayload = {
    nominator: testData.nominator,
    nominee: testData.nominee,
    type: 'person',
    subcategoryId: testData.subcategoryId,
    categoryGroupId: testData.categoryGroupId
  };

  try {
    const submitResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nominationPayload)
    });

    if (submitResponse.ok) {
      const submitResult = await submitResponse.json();
      console.log('✅ Nomination submitted successfully');
      console.log('   Nomination ID:', submitResult.nominationId);
      console.log('   Nominator Loops sync:', submitResult.loopsSync?.nominatorSynced ? '✅' : '❌');
      
      testData.nominationId = submitResult.nominationId;
      testData.nominatorId = submitResult.nominatorId;
      testData.nomineeId = submitResult.nomineeId;
    } else {
      const error = await submitResponse.text();
      console.error('❌ Nomination submission failed:', error);
      return;
    }
  } catch (error) {
    console.error('❌ Nomination submission error:', error.message);
    return;
  }

  // Wait for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Test nomination approval (should sync nominee with "Nominess" user group and update nominator to "Nominator Live")
  console.log('\n4. Testing Nomination Approval');
  console.log('------------------------------');
  
  const liveUrl = `https://worldstaffingawards.com/nominee/${testData.nominationId}`;
  
  try {
    const approveResponse = await fetch('http://localhost:3000/api/nomination/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nominationId: testData.nominationId,
        action: 'approve',
        liveUrl: liveUrl,
        adminNotes: 'Approved for user groups testing'
      })
    });

    if (approveResponse.ok) {
      const approveResult = await approveResponse.json();
      console.log('✅ Nomination approved successfully');
      console.log('   Live URL:', approveResult.liveUrl);
      console.log('   State:', approveResult.state);
    } else {
      const error = await approveResponse.text();
      console.error('❌ Nomination approval failed:', error);
      return;
    }
  } catch (error) {
    console.error('❌ Nomination approval error:', error.message);
    return;
  }

  // Wait for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Test vote casting (should sync voter with "Voters" user group)
  console.log('\n5. Testing Vote Casting');
  console.log('-----------------------');
  
  const votePayload = {
    ...testData.voter,
    subcategoryId: testData.subcategoryId,
    votedForDisplayName: `${testData.nominee.firstname} ${testData.nominee.lastname}`
  };

  try {
    const voteResponse = await fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(votePayload)
    });

    if (voteResponse.ok) {
      const voteResult = await voteResponse.json();
      console.log('✅ Vote cast successfully');
      console.log('   Vote ID:', voteResult.voteId);
      console.log('   New vote count:', voteResult.newVoteCount);
    } else {
      const error = await voteResponse.text();
      console.error('❌ Vote casting failed:', error);
      return;
    }
  } catch (error) {
    console.error('❌ Vote casting error:', error.message);
    return;
  }

  // Wait for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 4: Verify contacts in Loops
  console.log('\n6. Verifying Contacts in Loops');
  console.log('------------------------------');
  
  const contactsToCheck = [
    { email: testData.nominator.email, expectedGroup: 'Nominator Live', role: 'Nominator' },
    { email: testData.nominee.email, expectedGroup: 'Nominess', role: 'Nominee' },
    { email: testData.voter.email, expectedGroup: 'Voters', role: 'Voter' }
  ];

  for (const contact of contactsToCheck) {
    try {
      console.log(`\n   Checking ${contact.role}: ${contact.email}`);
      
      // Try to find the contact in Loops
      const findResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(contact.email)}`, {
        headers: {
          'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (findResponse.ok) {
        const responseData = await findResponse.json();
        const contactData = Array.isArray(responseData) ? responseData[0] : responseData;
        console.log(`   ✅ Contact found in Loops`);
        console.log(`   📧 Email: ${contactData.email}`);
        console.log(`   👤 Name: ${contactData.firstName} ${contactData.lastName}`);
        console.log(`   🏷️ User Group: ${contactData.userGroup || 'Not set'}`);
        console.log(`   📅 Created: ${contactData.createdAt || 'Not available'}`);
        
        if (contactData.userGroup === contact.expectedGroup) {
          console.log(`   ✅ User group matches expected: ${contact.expectedGroup}`);
        } else {
          console.log(`   ❌ User group mismatch. Expected: ${contact.expectedGroup}, Got: ${contactData.userGroup || 'Not set'}`);
        }
      } else if (findResponse.status === 404) {
        console.log(`   ❌ Contact not found in Loops`);
      } else {
        const errorText = await findResponse.text();
        console.log(`   ❌ Error checking contact: ${findResponse.status} ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${contact.role}: ${error.message}`);
    }
  }

  // Step 5: Test manual sync endpoint
  console.log('\n7. Testing Manual Loops Sync');
  console.log('----------------------------');
  
  try {
    const syncResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log('✅ Manual sync completed');
      console.log('   Processed:', syncResult.processed);
      console.log('   Errors:', syncResult.errors);
      console.log('   Total:', syncResult.total);
    } else {
      const error = await syncResponse.text();
      console.error('❌ Manual sync failed:', error);
    }
  } catch (error) {
    console.error('❌ Manual sync error:', error.message);
  }

  console.log('\n🎉 LOOPS USER GROUPS TEST COMPLETED!');
  console.log('====================================');
  console.log('');
  console.log('✅ What should have happened:');
  console.log('   1. Nominator synced with "Nominator" user group on submission');
  console.log('   2. Nominee synced with "Nominess" user group on approval');
  console.log('   3. Nominator updated to "Nominator Live" user group with nominee link');
  console.log('   4. Voter synced with "Voters" user group on vote');
  console.log('');
  console.log('🔍 Check your Loops dashboard to verify all contacts have correct user groups!');
  console.log('');
  console.log('📧 Test contacts created:');
  console.log(`   Nominator: ${testData.nominator.email} (should be "Nominator Live")`);
  console.log(`   Nominee: ${testData.nominee.email} (should be "Nominess")`);
  console.log(`   Voter: ${testData.voter.email} (should be "Voters")`);
}

testLoopsUserGroups().catch(console.error);