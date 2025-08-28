#!/usr/bin/env node

/**
 * Test our actual sync functions directly
 */

require('dotenv').config({ path: '.env.local' });

async function testOurSyncFunctions() {
  console.log('🧪 TESTING OUR SYNC FUNCTIONS');
  console.log('==============================');
  
  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ LOOPS_API_KEY is required');
    return;
  }

  const timestamp = Date.now();
  
  try {
    // Import our sync functions
    const { 
      syncNominatorToLoops, 
      syncNomineeToLoops, 
      syncVoterToLoops,
      updateNominatorToLive 
    } = require('../src/server/loops/realtime-sync');
    
    // Test 1: Sync nominator
    console.log('\n1. Testing syncNominatorToLoops');
    console.log('-------------------------------');
    
    const nominatorData = {
      firstname: 'Function',
      lastname: 'Nominator',
      email: `function.nominator.${timestamp}@example.com`,
      linkedin: 'https://linkedin.com/in/functionnominator',
      company: 'Function Company',
      jobTitle: 'Function Manager',
      phone: '+1234567890',
      country: 'United States'
    };
    
    console.log('Syncing nominator:', nominatorData.email);
    const nominatorResult = await syncNominatorToLoops(nominatorData);
    console.log('Result:', nominatorResult);
    
    // Test 2: Sync nominee
    console.log('\n2. Testing syncNomineeToLoops');
    console.log('-----------------------------');
    
    const nomineeData = {
      type: 'person',
      subcategoryId: 'test-category',
      nominationId: 'test-nomination-id',
      liveUrl: 'https://worldstaffingawards.com/nominee/test',
      firstname: 'Function',
      lastname: 'Nominee',
      email: `function.nominee.${timestamp}@example.com`,
      linkedin: 'https://linkedin.com/in/functionnominee',
      jobtitle: 'Senior Developer',
      company: 'Tech Corp',
      phone: '+1987654321',
      country: 'Canada'
    };
    
    console.log('Syncing nominee:', nomineeData.email);
    const nomineeResult = await syncNomineeToLoops(nomineeData);
    console.log('Result:', nomineeResult);
    
    // Test 3: Sync voter
    console.log('\n3. Testing syncVoterToLoops');
    console.log('---------------------------');
    
    const voterData = {
      firstname: 'Function',
      lastname: 'Voter',
      email: `function.voter.${timestamp}@example.com`,
      linkedin: 'https://linkedin.com/in/functionvoter',
      company: 'Voting Corp',
      jobTitle: 'Voter Manager',
      country: 'United Kingdom',
      votedFor: 'Function Nominee',
      subcategoryId: 'test-category'
    };
    
    console.log('Syncing voter:', voterData.email);
    const voterResult = await syncVoterToLoops(voterData);
    console.log('Result:', voterResult);
    
    // Test 4: Update nominator to live
    console.log('\n4. Testing updateNominatorToLive');
    console.log('--------------------------------');
    
    console.log('Updating nominator to live:', nominatorData.email);
    const updateResult = await updateNominatorToLive(
      nominatorData.email,
      {
        name: 'Function Nominee',
        liveUrl: 'https://worldstaffingawards.com/nominee/test'
      }
    );
    console.log('Result:', updateResult);
    
    // Wait for updates to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5: Verify all contacts
    console.log('\n5. Verifying All Contacts');
    console.log('-------------------------');
    
    const contactsToCheck = [
      { email: nominatorData.email, expectedGroup: 'Nominator Live', role: 'Nominator' },
      { email: nomineeData.email, expectedGroup: 'Nominess', role: 'Nominee' },
      { email: voterData.email, expectedGroup: 'Voters', role: 'Voter' }
    ];

    for (const contact of contactsToCheck) {
      try {
        console.log(`\nChecking ${contact.role}: ${contact.email}`);
        
        const findResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(contact.email)}`, {
          headers: {
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (findResponse.ok) {
          const responseData = await findResponse.json();
          const contactData = Array.isArray(responseData) ? responseData[0] : responseData;
          console.log(`✅ Contact found`);
          console.log(`   User Group: ${contactData.userGroup || 'Not set'}`);
          console.log(`   Expected: ${contact.expectedGroup}`);
          
          if (contactData.userGroup === contact.expectedGroup) {
            console.log(`   ✅ User group matches!`);
          } else {
            console.log(`   ❌ User group mismatch!`);
          }
        } else {
          console.log(`   ❌ Contact not found: ${findResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${contact.role}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error importing or running sync functions:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🎉 SYNC FUNCTIONS TEST COMPLETED!');
  console.log('=================================');
}

testOurSyncFunctions().catch(console.error);