#!/usr/bin/env node

/**
 * Test exact tag values being sent to HubSpot
 * This will help us verify what tags are actually being applied
 */

require('dotenv').config({ path: '.env.local' });

async function testExactTagValues() {
  console.log('🏷️ Testing Exact HubSpot Tag Values');
  console.log('='.repeat(50));

  try {
    // Test nominator sync and check exact tag
    console.log('\n1. Testing Nominator Tag...');
    
    const nominatorData = {
      firstname: 'Exact',
      lastname: 'Tag',
      email: 'exact-tag-nominator@example.com',
      linkedin: 'https://linkedin.com/in/exact-tag',
      company: 'Exact Tag Company',
      jobTitle: 'Tag Tester',
      phone: '+1999999999',
      country: 'United States',
    };

    const nominatorResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
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
      console.log('✅ Nominator sync result:', nominatorResult);
      
      if (nominatorResult.contactId) {
        // Now fetch the contact from HubSpot to see the actual tag
        console.log(`\n   Fetching contact ${nominatorResult.contactId} from HubSpot...`);
        
        const contactResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_contact',
            contactId: nominatorResult.contactId
          })
        });

        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          console.log('   📋 Contact properties:');
          console.log(`      wsa_contact_tag: "${contactData.properties?.wsa_contact_tag || 'NOT SET'}"`);
          console.log(`      wsa_tags: "${contactData.properties?.wsa_tags || 'NOT SET'}"`);
          console.log(`      wsa_role: "${contactData.properties?.wsa_role || 'NOT SET'}"`);
        }
      }
    } else {
      console.log('❌ Nominator sync failed:', await nominatorResponse.text());
    }

    // Test nominee sync and check exact tag
    console.log('\n2. Testing Nominee Tag...');
    
    const nomineeData = {
      type: 'person',
      subcategoryId: 'top-recruiter',
      nominationId: 'exact-tag-test-nomination',
      firstname: 'Exact',
      lastname: 'Nominee',
      email: 'exact-tag-nominee@example.com',
      linkedin: 'https://linkedin.com/in/exact-tag-nominee',
      jobtitle: 'Exact Tag Recruiter',
      company: 'Exact Nominee Company',
      phone: '+1000000000',
      country: 'Canada',
    };

    const nomineeResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
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
      console.log('✅ Nominee sync result:', nomineeResult);
      
      if (nomineeResult.contactId) {
        // Now fetch the contact from HubSpot to see the actual tag
        console.log(`\n   Fetching contact ${nomineeResult.contactId} from HubSpot...`);
        
        const contactResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_contact',
            contactId: nomineeResult.contactId
          })
        });

        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          console.log('   📋 Contact properties:');
          console.log(`      wsa_contact_tag: "${contactData.properties?.wsa_contact_tag || 'NOT SET'}"`);
          console.log(`      wsa_tags: "${contactData.properties?.wsa_tags || 'NOT SET'}"`);
          console.log(`      wsa_role: "${contactData.properties?.wsa_role || 'NOT SET'}"`);
        }
      }
    } else {
      console.log('❌ Nominee sync failed:', await nomineeResponse.text());
    }

    console.log('\n🎯 Expected vs Actual Tags:');
    console.log('   Expected Nominator Tag: "WSA2026 Nominator"');
    console.log('   Expected Nominee Tag: "WSA 2026 Nominess"');
    console.log('   Expected Voter Tag: "WSA 2026 Voters"');
    
    console.log('\n📋 Your HubSpot Dropdown Values:');
    console.log('   - WSA2026 Nominator');
    console.log('   - WSA 2026 Nominess');
    console.log('   - WSA 2026 Voters');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testExactTagValues().then(() => {
  console.log('\n🏁 Tag value test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});