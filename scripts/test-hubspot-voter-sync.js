#!/usr/bin/env node

/**
 * Test HubSpot voter sync with correct WSA Voter 2026 tag
 */

require('dotenv').config({ path: '.env.local' });

async function testVoterSync() {
  console.log('🧪 Testing HubSpot Voter Sync with WSA Voter 2026 tag\n');

  try {
    // Test voter sync directly
    const { syncVoterToHubSpot } = await import('../src/server/hubspot/realtime-sync.ts');
    
    const testVoterData = {
      firstname: 'Test',
      lastname: 'Voter',
      email: 'test.voter@example.com',
      linkedin: 'https://linkedin.com/in/testvoter',
      company: 'Test Voting Company',
      jobTitle: 'Test Manager',
      phone: '+1234567892',
      country: 'United States',
      votedFor: 'Test Nominee',
      subcategoryId: 'best-recruiter-individual'
    };

    console.log('📝 Testing voter sync with data:', {
      email: testVoterData.email,
      name: `${testVoterData.firstname} ${testVoterData.lastname}`,
      company: testVoterData.company,
      votedFor: testVoterData.votedFor
    });

    const result = await syncVoterToHubSpot(testVoterData);

    if (result.success) {
      console.log('✅ Voter sync successful!');
      console.log(`   Contact ID: ${result.contactId}`);
      
      // Verify the contact has the correct tag
      console.log('\n🔍 Verifying contact tags...');
      
      const { hubspotClient } = await import('../src/server/hubspot/client.ts');
      
      const contactData = await hubspotClient.hubFetch(
        `/crm/v3/objects/contacts/${result.contactId}?properties=wsa_contact_tag,wsa_tags,wsa_role,firstname,lastname,email`
      );
      
      console.log('📊 Contact properties:');
      console.log(`   Name: ${contactData.properties.firstname} ${contactData.properties.lastname}`);
      console.log(`   Email: ${contactData.properties.email}`);
      console.log(`   WSA Role: ${contactData.properties.wsa_role}`);
      console.log(`   WSA Contact Tag: ${contactData.properties.wsa_contact_tag}`);
      console.log(`   WSA Tags: ${contactData.properties.wsa_tags}`);
      
      // Verify correct tag
      if (contactData.properties.wsa_contact_tag === 'WSA Voter 2026') {
        console.log('✅ Correct voter tag applied: WSA Voter 2026');
      } else {
        console.log(`❌ Incorrect voter tag: ${contactData.properties.wsa_contact_tag} (expected: WSA Voter 2026)`);
      }
      
    } else {
      console.log('❌ Voter sync failed:', result.error);
    }

    // Test HubSpot properties setup
    console.log('\n🔧 Testing HubSpot custom properties...');
    
    const { setupHubSpotCustomProperties } = await import('../src/server/hubspot/realtime-sync.ts');
    
    const setupResult = await setupHubSpotCustomProperties();
    
    if (setupResult.success) {
      console.log('✅ HubSpot properties setup successful');
      if (setupResult.created.length > 0) {
        console.log('   Created properties:', setupResult.created.join(', '));
      } else {
        console.log('   All properties already exist');
      }
    } else {
      console.log('❌ HubSpot properties setup failed:', setupResult.error);
    }

    // Test connection
    console.log('\n🔗 Testing HubSpot connection...');
    
    const { testHubSpotRealTimeSync } = await import('../src/server/hubspot/realtime-sync.ts');
    
    const connectionTest = await testHubSpotRealTimeSync();
    
    if (connectionTest.success) {
      console.log('✅ HubSpot connection successful');
      console.log(`   Account: ${connectionTest.accountInfo?.portalId}`);
      
      if (connectionTest.customProperties) {
        const wsaProperties = connectionTest.customProperties.filter(p => p.name.startsWith('wsa_'));
        console.log(`   WSA Properties: ${wsaProperties.length} found`);
        
        const contactTagProperty = wsaProperties.find(p => p.name === 'wsa_contact_tag');
        if (contactTagProperty) {
          console.log('   WSA Contact Tag options:', contactTagProperty.options?.map(o => o.value).join(', '));
        }
      }
    } else {
      console.log('❌ HubSpot connection failed:', connectionTest.error);
    }

    console.log('\n🎉 HubSpot Voter Sync Test Completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testVoterSync();