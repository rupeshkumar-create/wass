#!/usr/bin/env node

/**
 * Test new nomination with real-time HubSpot sync
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function testNewNomination() {
  console.log('🔍 Testing new nomination with HubSpot sync...');
  
  const testNomination = {
    type: 'person',
    categoryGroupId: 'individual-awards',
    subcategoryId: 'best-recruiter',
    nominator: {
      firstname: 'Test',
      lastname: 'Nominator',
      email: 'test.nominator.sync@example.com',
      linkedin: 'https://linkedin.com/in/testnominator',
      company: 'Test Sync Company',
      jobTitle: 'Senior Test Recruiter',
      phone: '+1-555-0199',
      country: 'United States'
    },
    nominee: {
      firstname: 'Test',
      lastname: 'Nominee',
      email: 'test.nominee.sync@example.com',
      linkedin: 'https://linkedin.com/in/testnominee',
      jobtitle: 'Test Position Manager',
      company: 'Test Nominee Corp',
      country: 'United States',
      headshotUrl: 'https://example.com/test-headshot.jpg',
      whyMe: 'Exceptional test skills and sync capabilities',
      bio: 'Experienced test nominee with 5+ years in sync testing',
      achievements: 'Top sync performer 2024'
    }
  };

  try {
    console.log('📤 Submitting nomination...');
    const response = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testNomination)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nomination submitted successfully!');
      console.log(`   - Nomination ID: ${result.nominationId}`);
      console.log(`   - Nominator ID: ${result.nominatorId}`);
      console.log(`   - Nominee ID: ${result.nomineeId}`);
      
      // Wait a moment for real-time sync to process
      console.log('\n⏳ Waiting for real-time sync...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now approve the nomination to test nominee sync
      console.log('\n📤 Approving nomination...');
      const approveResponse = await fetch('http://localhost:3000/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nominationId: result.nominationId,
          liveUrl: 'https://worldstaffingawards.com/nominee/test-nominee-sync'
        })
      });

      if (approveResponse.ok) {
        const approveResult = await approveResponse.json();
        console.log('✅ Nomination approved successfully!');
        console.log(`   - Live URL: ${approveResult.liveUrl}`);
        
        // Wait for nominee sync
        console.log('\n⏳ Waiting for nominee sync...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test voting
        console.log('\n📤 Casting test vote...');
        const voteResponse = await fetch('http://localhost:3000/api/vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subcategoryId: 'best-recruiter',
            votedForDisplayName: 'Test Nominee',
            firstname: 'Test',
            lastname: 'Voter',
            email: 'test.voter.sync@example.com',
            linkedin: 'https://linkedin.com/in/testvoter',
            company: 'Test Voter Corp',
            jobTitle: 'Test Voting Manager',
            country: 'Canada'
          })
        });

        if (voteResponse.ok) {
          const voteResult = await voteResponse.json();
          console.log('✅ Vote cast successfully!');
          console.log(`   - Vote ID: ${voteResult.voteId}`);
          console.log(`   - New Vote Count: ${voteResult.newVoteCount}`);
          
          console.log('\n🎉 All operations completed! Check HubSpot for the synced contacts.');
        } else {
          const voteError = await voteResponse.json();
          console.error('❌ Vote failed:', voteError);
        }
      } else {
        const approveError = await approveResponse.json();
        console.error('❌ Approval failed:', approveError);
      }
    } else {
      const error = await response.json();
      console.error('❌ Nomination failed:', error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNewNomination();