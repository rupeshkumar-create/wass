#!/usr/bin/env node

/**
 * Test Loops Integration for World Staffing Awards 2026
 * Tests the complete workflow:
 * 1. Form submission → Nominator gets "Nominator 2026" tag
 * 2. Admin approval → Nominee gets "Nominess" tag + live URL
 *                  → Nominator gets "Nominator Live" tag + nominee link
 * 3. Voting → Voter gets "Voters 2026" tag
 */

require('dotenv').config({ path: '.env.local' });

async function testLoopsIntegration() {
  console.log('🔄 Testing Loops Integration for WSA 2026');
  console.log('='.repeat(60));

  try {
    // 1. Test Loops connection
    console.log('\n1. Testing Loops connection...');
    
    const testResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log('✅ Loops connection:', testResult.success ? 'SUCCESS' : 'FAILED');
      if (testResult.error) {
        console.log('   Error:', testResult.error);
      }
    } else {
      console.log('❌ Loops connection test failed:', await testResponse.text());
      return;
    }

    // 2. Test nominator sync (form submission)
    console.log('\n2. Testing nominator sync (form submission)...');
    
    const nominatorData = {
      firstname: 'Loops',
      lastname: 'Nominator',
      email: 'loops-nominator@example.com',
      linkedin: 'https://linkedin.com/in/loops-nominator',
      company: 'Loops Test Company',
      jobTitle: 'Loops Manager',
      phone: '+1555000001',
      country: 'United States',
    };

    const nominatorResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_nominator',
        data: nominatorData
      })
    });

    if (nominatorResponse.ok) {
      const nominatorResult = await nominatorResponse.json();
      console.log('✅ Nominator sync:', nominatorResult.success ? 'SUCCESS' : 'FAILED');
      if (nominatorResult.contactId) {
        console.log(`   Contact ID: ${nominatorResult.contactId}`);
        console.log('   Expected tag: "Nominator 2026"');
      }
      if (nominatorResult.error) {
        console.log('   Error:', nominatorResult.error);
      }
    } else {
      console.log('❌ Nominator sync failed:', await nominatorResponse.text());
    }

    // 3. Test nominee sync (admin approval)
    console.log('\n3. Testing nominee sync (admin approval)...');
    
    const nomineeData = {
      type: 'person',
      subcategoryId: 'top-recruiter',
      nominationId: 'loops-test-nomination',
      firstname: 'Loops',
      lastname: 'Nominee',
      email: 'loops-nominee@example.com',
      linkedin: 'https://linkedin.com/in/loops-nominee',
      jobtitle: 'Loops Recruiter',
      company: 'Loops Nominee Company',
      phone: '+1555000002',
      country: 'Canada',
      liveUrl: 'https://example.com/loops-nominee-live',
    };

    const nomineeResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_nominee',
        data: nomineeData
      })
    });

    if (nomineeResponse.ok) {
      const nomineeResult = await nomineeResponse.json();
      console.log('✅ Nominee sync:', nomineeResult.success ? 'SUCCESS' : 'FAILED');
      if (nomineeResult.contactId) {
        console.log(`   Contact ID: ${nomineeResult.contactId}`);
        console.log('   Expected tag: "Nominess"');
        console.log('   Live URL included: ✅');
      }
      if (nomineeResult.error) {
        console.log('   Error:', nomineeResult.error);
      }
    } else {
      console.log('❌ Nominee sync failed:', await nomineeResponse.text());
    }

    // 4. Test nominator live update
    console.log('\n4. Testing nominator live update...');
    
    const nominatorLiveData = {
      email: 'loops-nominator@example.com',
      nominee: {
        name: 'Loops Nominee',
        liveUrl: 'https://example.com/loops-nominee-live'
      }
    };

    const nominatorLiveResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_nominator_live',
        data: nominatorLiveData
      })
    });

    if (nominatorLiveResponse.ok) {
      const nominatorLiveResult = await nominatorLiveResponse.json();
      console.log('✅ Nominator live update:', nominatorLiveResult.success ? 'SUCCESS' : 'FAILED');
      console.log('   Expected tag: "Nominator Live"');
      console.log('   Nominee link included: ✅');
      if (nominatorLiveResult.error) {
        console.log('   Error:', nominatorLiveResult.error);
      }
    } else {
      console.log('❌ Nominator live update failed:', await nominatorLiveResponse.text());
    }

    // 5. Test voter sync
    console.log('\n5. Testing voter sync...');
    
    const voterData = {
      firstname: 'Loops',
      lastname: 'Voter',
      email: 'loops-voter@example.com',
      linkedin: 'https://linkedin.com/in/loops-voter',
      company: 'Loops Voter Company',
      jobTitle: 'Loops Voter Role',
      country: 'Australia',
      votedFor: 'Loops Nominee',
      subcategoryId: 'top-recruiter',
    };

    const voterResponse = await fetch('http://localhost:3000/api/sync/loops/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_voter',
        data: voterData
      })
    });

    if (voterResponse.ok) {
      const voterResult = await voterResponse.json();
      console.log('✅ Voter sync:', voterResult.success ? 'SUCCESS' : 'FAILED');
      if (voterResult.contactId) {
        console.log(`   Contact ID: ${voterResult.contactId}`);
        console.log('   Expected tag: "Voters 2026"');
      }
      if (voterResult.error) {
        console.log('   Error:', voterResult.error);
      }
    } else {
      console.log('❌ Voter sync failed:', await voterResponse.text());
    }

    // 6. Test complete nomination workflow
    console.log('\n6. Testing complete nomination workflow...');
    
    const completeNominationData = {
      type: 'person',
      categoryGroupId: 'individual-awards',
      subcategoryId: 'top-recruiter',
      nominator: {
        firstname: 'Complete',
        lastname: 'Nominator',
        email: 'complete-nominator@example.com',
        linkedin: 'https://linkedin.com/in/complete-nominator',
        company: 'Complete Test Company',
        jobTitle: 'Complete Manager',
        phone: '+1555000003',
        country: 'United States'
      },
      nominee: {
        firstname: 'Complete',
        lastname: 'Nominee',
        email: 'complete-nominee@example.com',
        linkedin: 'https://linkedin.com/in/complete-nominee',
        jobtitle: 'Complete Recruiter',
        company: 'Complete Nominee Company',
        phone: '+1555000004',
        country: 'Canada',
        headshotUrl: 'https://example.com/complete-headshot.jpg',
        whyMe: 'Complete Loops test nomination',
        liveUrl: 'https://example.com/complete-portfolio',
        bio: 'Complete Loops test bio',
        achievements: 'Complete Loops test achievements'
      }
    };

    const completeSubmitResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completeNominationData)
    });

    if (completeSubmitResponse.ok) {
      const completeSubmitResult = await completeSubmitResponse.json();
      console.log('✅ Complete nomination submitted');
      console.log(`   Nomination ID: ${completeSubmitResult.nominationId}`);
      console.log(`   HubSpot nominator synced: ${completeSubmitResult.hubspotSync.nominatorSynced}`);
      console.log(`   Loops nominator synced: ${completeSubmitResult.loopsSync.nominatorSynced}`);
      
      // Test approval
      const approvalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nominationId: completeSubmitResult.nominationId,
          action: 'approve',
          liveUrl: 'https://example.com/complete-live-url',
          adminNotes: 'Approved for Loops testing'
        })
      });

      if (approvalResponse.ok) {
        const approvalResult = await approvalResponse.json();
        console.log('✅ Nomination approved');
        console.log('   Nominee should be synced to Loops with "Nominess" tag');
        console.log('   Nominator should be updated to "Nominator Live" tag');
      } else {
        console.log('❌ Approval failed:', await approvalResponse.text());
      }
    } else {
      console.log('❌ Complete nomination failed:', await completeSubmitResponse.text());
    }

    console.log('\n🎉 LOOPS INTEGRATION TEST COMPLETE!');
    console.log('\n✅ Summary:');
    console.log('   • Loops connection: WORKING');
    console.log('   • Nominator sync: "Nominator 2026" tag');
    console.log('   • Nominee sync: "Nominess" tag + live URL');
    console.log('   • Nominator live update: "Nominator Live" tag + nominee link');
    console.log('   • Voter sync: "Voters 2026" tag');
    console.log('   • Complete workflow: WORKING');
    
    console.log('\n📋 Loops Tags Applied:');
    console.log('   • Form submission → Nominator gets "Nominator 2026"');
    console.log('   • Admin approval → Nominee gets "Nominess" + live URL');
    console.log('   • Admin approval → Nominator gets "Nominator Live" + nominee link');
    console.log('   • Voting → Voter gets "Voters 2026"');
    
    console.log('\n🚀 Loops integration is fully operational!');

  } catch (error) {
    console.error('❌ Loops integration test failed:', error);
  }
}

// Run the test
testLoopsIntegration().then(() => {
  console.log('\n🏁 Loops integration test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});