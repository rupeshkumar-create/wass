#!/usr/bin/env node

/**
 * Test exact Loops flow to match our sync functions
 */

require('dotenv').config({ path: '.env.local' });

async function testExactLoopsFlow() {
  console.log('🧪 TESTING EXACT LOOPS FLOW');
  console.log('============================');
  
  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ LOOPS_API_KEY is required');
    return;
  }

  const timestamp = Date.now();
  const nominatorEmail = `exact.nominator.${timestamp}@example.com`;
  const nomineeEmail = `exact.nominee.${timestamp}@example.com`;
  const voterEmail = `exact.voter.${timestamp}@example.com`;
  
  // Step 1: Test nominator sync (should get "Nominator" user group)
  console.log('\n1. Testing Nominator Sync');
  console.log('-------------------------');
  
  const nominatorData = {
    email: nominatorEmail,
    firstName: 'Exact',
    lastName: 'Nominator',
    source: 'World Staffing Awards 2026',
    linkedin: 'https://linkedin.com/in/exactnominator',
    company: 'Exact Company',
    jobTitle: 'Exact Manager',
    phone: '+1234567890',
    country: 'United States',
    userGroup: 'Nominator'
  };
  
  console.log('Creating nominator with userGroup:', nominatorData.userGroup);
  
  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nominatorData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nominator created:', result.id);
    } else {
      const error = await response.text();
      console.error('❌ Nominator creation failed:', response.status, error);
      return;
    }
  } catch (error) {
    console.error('❌ Nominator creation error:', error.message);
    return;
  }
  
  // Step 2: Test nominee sync (should get "Nominess" user group)
  console.log('\n2. Testing Nominee Sync');
  console.log('-----------------------');
  
  const nomineeData = {
    email: nomineeEmail,
    firstName: 'Exact',
    lastName: 'Nominee',
    source: 'World Staffing Awards 2026',
    nomineeType: 'person',
    category: 'test-category',
    nominationId: 'test-nomination-id',
    linkedin: 'https://linkedin.com/in/exactnominee',
    jobTitle: 'Senior Developer',
    company: 'Tech Corp',
    phone: '+1987654321',
    country: 'Canada',
    liveUrl: 'https://worldstaffingawards.com/nominee/test',
    userGroup: 'Nominess'
  };
  
  console.log('Creating nominee with userGroup:', nomineeData.userGroup);
  
  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nomineeData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nominee created:', result.id);
    } else {
      const error = await response.text();
      console.error('❌ Nominee creation failed:', response.status, error);
      return;
    }
  } catch (error) {
    console.error('❌ Nominee creation error:', error.message);
    return;
  }
  
  // Step 3: Test voter sync (should get "Voters" user group)
  console.log('\n3. Testing Voter Sync');
  console.log('---------------------');
  
  const voterData = {
    email: voterEmail,
    firstName: 'Exact',
    lastName: 'Voter',
    source: 'World Staffing Awards 2026',
    votedFor: 'Exact Nominee',
    voteCategory: 'test-category',
    lastVoteDate: new Date().toISOString(),
    linkedin: 'https://linkedin.com/in/exactvoter',
    company: 'Voting Corp',
    jobTitle: 'Voter Manager',
    country: 'United Kingdom',
    userGroup: 'Voters'
  };
  
  console.log('Creating voter with userGroup:', voterData.userGroup);
  
  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voterData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Voter created:', result.id);
    } else {
      const error = await response.text();
      console.error('❌ Voter creation failed:', response.status, error);
      return;
    }
  } catch (error) {
    console.error('❌ Voter creation error:', error.message);
    return;
  }
  
  // Step 4: Update nominator to "Nominator Live"
  console.log('\n4. Testing Nominator Update to Live');
  console.log('-----------------------------------');
  
  const nominatorUpdateData = {
    email: nominatorEmail,
    userGroup: 'Nominator Live',
    nomineeName: 'Exact Nominee',
    nomineeLiveUrl: 'https://worldstaffingawards.com/nominee/test',
    approvalDate: new Date().toISOString()
  };
  
  console.log('Updating nominator to userGroup:', nominatorUpdateData.userGroup);
  
  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/update', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nominatorUpdateData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nominator updated:', result.success);
    } else {
      const error = await response.text();
      console.error('❌ Nominator update failed:', response.status, error);
      return;
    }
  } catch (error) {
    console.error('❌ Nominator update error:', error.message);
    return;
  }
  
  // Wait for updates to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 5: Verify all contacts have correct user groups
  console.log('\n5. Verifying All Contacts');
  console.log('-------------------------');
  
  const contactsToCheck = [
    { email: nominatorEmail, expectedGroup: 'Nominator Live', role: 'Nominator' },
    { email: nomineeEmail, expectedGroup: 'Nominess', role: 'Nominee' },
    { email: voterEmail, expectedGroup: 'Voters', role: 'Voter' }
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
  
  console.log('\n🎉 EXACT LOOPS FLOW TEST COMPLETED!');
  console.log('===================================');
  console.log('');
  console.log('📧 Test contacts created:');
  console.log(`   Nominator: ${nominatorEmail} (should be "Nominator Live")`);
  console.log(`   Nominee: ${nomineeEmail} (should be "Nominess")`);
  console.log(`   Voter: ${voterEmail} (should be "Voters")`);
}

testExactLoopsFlow().catch(console.error);