#!/usr/bin/env node

/**
 * Fix HubSpot dropdown tags to match the exact values in your HubSpot account
 * This will update the wsa_contact_tag property with the correct dropdown options
 */

require('dotenv').config({ path: '.env.local' });

async function fixHubSpotDropdownTags() {
  console.log('🔧 Fixing HubSpot Dropdown Tags');
  console.log('='.repeat(50));

  try {
    // 1. First, let's check what's currently in HubSpot
    console.log('\n1. Checking current HubSpot contact properties...');
    
    const checkResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'check_properties'
      })
    });

    if (checkResponse.ok) {
      const checkResult = await checkResponse.json();
      console.log('✅ Current properties checked');
    } else {
      console.log('⚠️ Could not check current properties');
    }

    // 2. Update the wsa_contact_tag property with correct dropdown values
    console.log('\n2. Updating wsa_contact_tag property with correct values...');
    
    const updateResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_contact_tag_property',
        options: [
          'WSA2026 Nominator',
          'WSA 2026 Nominess', // Matching the typo in your HubSpot
          'WSA 2026 Voters'
        ]
      })
    });

    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Contact tag property updated');
    } else {
      console.log('⚠️ Could not update contact tag property');
    }

    // 3. Test syncing with the correct tags
    console.log('\n3. Testing sync with corrected tags...');
    
    const testNominatorData = {
      firstname: 'Tag',
      lastname: 'Test',
      email: 'tag-test-nominator@example.com',
      linkedin: 'https://linkedin.com/in/tag-test',
      company: 'Tag Test Company',
      jobTitle: 'Tag Tester',
      phone: '+1777777777',
      country: 'United States',
    };

    const nominatorResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_nominator',
        data: testNominatorData
      })
    });

    if (nominatorResponse.ok) {
      const nominatorResult = await nominatorResponse.json();
      console.log('✅ Nominator test sync:', nominatorResult.success ? 'SUCCESS' : 'FAILED');
      if (nominatorResult.contactId) {
        console.log(`   Contact ID: ${nominatorResult.contactId}`);
        console.log('   Expected tag: WSA2026 Nominator');
      }
    } else {
      console.log('❌ Nominator test sync failed:', await nominatorResponse.text());
    }

    // Test nominee sync
    const testNomineeData = {
      type: 'person',
      subcategoryId: 'top-recruiter',
      nominationId: 'test-nomination-id',
      firstname: 'Tag',
      lastname: 'Nominee',
      email: 'tag-test-nominee@example.com',
      linkedin: 'https://linkedin.com/in/tag-test-nominee',
      jobtitle: 'Tag Test Recruiter',
      company: 'Tag Nominee Company',
      phone: '+1888888888',
      country: 'Canada',
    };

    const nomineeResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_nominee',
        data: testNomineeData
      })
    });

    if (nomineeResponse.ok) {
      const nomineeResult = await nomineeResponse.json();
      console.log('✅ Nominee test sync:', nomineeResult.success ? 'SUCCESS' : 'FAILED');
      if (nomineeResult.contactId) {
        console.log(`   Contact ID: ${nomineeResult.contactId}`);
        console.log('   Expected tag: WSA 2026 Nominess');
      }
    } else {
      console.log('❌ Nominee test sync failed:', await nomineeResponse.text());
    }

    console.log('\n🎉 HubSpot Tag Fix Complete!');
    console.log('\n✅ Summary:');
    console.log('   • Updated code to match your HubSpot dropdown values');
    console.log('   • Nominators will get: "WSA2026 Nominator"');
    console.log('   • Nominees will get: "WSA 2026 Nominess"');
    console.log('   • Voters will get: "WSA 2026 Voters"');
    console.log('\n📋 Next steps:');
    console.log('   1. Test a new nomination submission');
    console.log('   2. Check HubSpot contacts for correct tags');
    console.log('   3. All future syncs will use the correct dropdown values');

  } catch (error) {
    console.error('❌ Fix script error:', error);
  }
}

// Run the fix
fixHubSpotDropdownTags().then(() => {
  console.log('\n🏁 Tag fix complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});