#!/usr/bin/env node

/**
 * Test the exact data being sent to HubSpot
 * This will help identify the specific cause of 400 errors
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const hubspotToken = process.env.HUBSPOT_TOKEN;

if (!hubspotToken) {
  console.error('❌ Missing HubSpot token');
  process.exit(1);
}

async function testExactSyncData() {
  console.log('🔍 Testing Exact Sync Data');
  console.log('==========================');

  // This is the exact data structure our syncNominatorToHubSpot function creates
  const nominatorProperties = {
    email: 'test.exact.sync@example.com',
    firstname: 'Test',
    lastname: 'Exact Sync',
    lifecyclestage: 'lead',
    
    // Custom WSA properties
    wsa_role: 'Nominator',
    wsa_year: '2026',
    wsa_source: 'World Staffing Awards',
    wsa_nominator_status: 'submitted',
    wsa_submission_date: new Date().toISOString(),
    
    // Optional fields
    linkedin: 'https://linkedin.com/in/testexactsync',
    wsa_linkedin: 'https://linkedin.com/in/testexactsync',
    company: 'Test Exact Sync Company',
    wsa_company: 'Test Exact Sync Company',
    jobtitle: 'Test Role',
    wsa_job_title: 'Test Role',
    phone: '+1-555-0199',
    wsa_phone: '+1-555-0199',
    country: 'United States',
    wsa_country: 'United States'
  };

  console.log('\n📤 Testing nominator data:');
  console.log(JSON.stringify(nominatorProperties, null, 2));

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties: nominatorProperties })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Nominator sync successful');
      console.log(`   Contact ID: ${data.id}`);
      
      // Clean up
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`
        }
      });
      console.log('🧹 Test contact deleted');
    } else {
      const error = await response.json();
      console.error('❌ Nominator sync failed:', error);
      console.error('   Status:', response.status);
      
      // Check for specific property errors
      if (error.message && error.message.includes('Property')) {
        console.log('\n🔍 Property error detected. Checking each property...');
        
        // Test each property individually
        const baseProps = {
          email: 'test.prop.check@example.com',
          firstname: 'Test',
          lastname: 'Property Check'
        };

        const testProps = [
          { name: 'lifecyclestage', value: 'lead' },
          { name: 'wsa_role', value: 'Nominator' },
          { name: 'wsa_year', value: '2026' },
          { name: 'wsa_source', value: 'World Staffing Awards' },
          { name: 'wsa_nominator_status', value: 'submitted' },
          { name: 'wsa_submission_date', value: new Date().toISOString() },
          { name: 'linkedin', value: 'https://linkedin.com/in/test' },
          { name: 'wsa_linkedin', value: 'https://linkedin.com/in/test' },
          { name: 'company', value: 'Test Company' },
          { name: 'wsa_company', value: 'Test Company' },
          { name: 'jobtitle', value: 'Test Role' },
          { name: 'wsa_job_title', value: 'Test Role' },
          { name: 'phone', value: '+1-555-0199' },
          { name: 'wsa_phone', value: '+1-555-0199' },
          { name: 'country', value: 'United States' },
          { name: 'wsa_country', value: 'United States' }
        ];

        for (const prop of testProps) {
          const testContact = {
            properties: {
              ...baseProps,
              [prop.name]: prop.value
            }
          };

          try {
            const propResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hubspotToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(testContact)
            });

            if (propResponse.ok) {
              const propData = await propResponse.json();
              console.log(`     ✅ Property "${prop.name}" works`);
              
              // Clean up
              await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${propData.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${hubspotToken}`
                }
              });
            } else {
              const propError = await propResponse.json();
              console.log(`     ❌ Property "${prop.name}" failed: ${propError.message}`);
            }
          } catch (propErr) {
            console.log(`     ❌ Property "${prop.name}" error: ${propErr.message}`);
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  // Test person nominee data
  console.log('\n📤 Testing person nominee data:');
  const personNomineeProperties = {
    email: 'test.person.nominee@example.com',
    firstname: 'Test',
    lastname: 'Person Nominee',
    lifecyclestage: 'customer',
    
    // Custom WSA properties
    wsa_role: 'Nominee_Person',
    wsa_year: '2026',
    wsa_source: 'World Staffing Awards',
    wsa_nominee_type: 'person',
    wsa_nominee_status: 'approved',
    wsa_approval_date: new Date().toISOString(),
    wsa_category: 'best-recruiter',
    wsa_nomination_id: 'test-nomination-id',
    
    // Optional fields
    linkedin: 'https://linkedin.com/in/testpersonnominee',
    wsa_linkedin: 'https://linkedin.com/in/testpersonnominee',
    jobtitle: 'Test Position',
    wsa_job_title: 'Test Position',
    company: 'Test Nominee Corp',
    wsa_company: 'Test Nominee Corp'
  };

  console.log(JSON.stringify(personNomineeProperties, null, 2));

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties: personNomineeProperties })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Person nominee sync successful');
      console.log(`   Contact ID: ${data.id}`);
      
      // Clean up
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`
        }
      });
      console.log('🧹 Test contact deleted');
    } else {
      const error = await response.json();
      console.error('❌ Person nominee sync failed:', error);
      console.error('   Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Person nominee test error:', error.message);
  }

  // Test voter data
  console.log('\n📤 Testing voter data:');
  const voterProperties = {
    email: 'test.voter@example.com',
    firstname: 'Test',
    lastname: 'Voter',
    lifecyclestage: 'lead',
    
    // Custom WSA properties
    wsa_role: 'Voter',
    wsa_year: '2026',
    wsa_source: 'World Staffing Awards',
    wsa_voter_status: 'active',
    wsa_last_vote_date: new Date().toISOString(),
    wsa_voted_for: 'Test Nominee',
    wsa_vote_category: 'best-recruiter',
    
    // Optional fields
    linkedin: 'https://linkedin.com/in/testvoter',
    wsa_linkedin: 'https://linkedin.com/in/testvoter',
    company: 'Test Voter Corp',
    wsa_company: 'Test Voter Corp'
  };

  console.log(JSON.stringify(voterProperties, null, 2));

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties: voterProperties })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Voter sync successful');
      console.log(`   Contact ID: ${data.id}`);
      
      // Clean up
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`
        }
      });
      console.log('🧹 Test contact deleted');
    } else {
      const error = await response.json();
      console.error('❌ Voter sync failed:', error);
      console.error('   Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Voter test error:', error.message);
  }
}

testExactSyncData().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});