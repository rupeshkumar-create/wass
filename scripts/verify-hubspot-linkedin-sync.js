#!/usr/bin/env node

/**
 * Verify that LinkedIn URLs are actually being synced to HubSpot
 */

require('dotenv').config();

async function verifyHubSpotSync() {
  console.log('🔍 Verifying HubSpot LinkedIn URL Sync\n');
  
  try {
    // Get some nominees with LinkedIn URLs
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?limit=5');
    
    if (!nomineesResponse.ok) {
      console.log('❌ Could not fetch nominees');
      return;
    }
    
    const nominees = await nomineesResponse.json();
    console.log(`📊 Found ${nominees.length} nominees\n`);
    
    // Show nominees with LinkedIn URLs
    console.log('✅ Nominees with LinkedIn URLs:');
    nominees.forEach((nominee, i) => {
      console.log(`${i + 1}. ${nominee.nominee.name}`);
      console.log(`   Type: ${nominee.type}`);
      console.log(`   Category: ${nominee.category}`);
      console.log(`   LinkedIn: ${nominee.nominee.linkedin}`);
      console.log('');
    });
    
    // Test the HubSpot sync with a real nominee
    if (nominees.length > 0) {
      const testNominee = nominees[0];
      
      console.log('🧪 Testing HubSpot sync with real nominee:\n');
      console.log(`Selected nominee: ${testNominee.nominee.name}`);
      console.log(`LinkedIn URL: ${testNominee.nominee.linkedin}`);
      console.log(`Type: ${testNominee.type}`);
      
      // Create the nomination object that would be sent to HubSpot
      const nominationForSync = {
        id: testNominee.id,
        type: testNominee.type,
        category: testNominee.category,
        nominee: {
          name: testNominee.nominee.name,
          linkedin: testNominee.nominee.linkedin,
          country: testNominee.nominee.country,
          title: testNominee.nominee.title,
          website: testNominee.nominee.website
        },
        liveUrl: testNominee.liveUrl
      };
      
      console.log('\n📤 Data that would be sent to HubSpot:');
      console.log(JSON.stringify(nominationForSync, null, 2));
      
      // Test the actual sync endpoint
      console.log('\n🚀 Testing actual HubSpot sync...');
      
      const syncResponse = await fetch('http://localhost:3000/api/integrations/hubspot/sync-nominators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomination: nominationForSync,
          action: 'approved'
        })
      });
      
      console.log(`Response status: ${syncResponse.status}`);
      
      if (syncResponse.ok) {
        const result = await syncResponse.json();
        console.log('✅ Sync successful!');
        console.log('Response:', JSON.stringify(result, null, 2));
        
        console.log('\n🎯 LinkedIn URL should now be in HubSpot:');
        console.log(`   Contact/Company: ${testNominee.nominee.name}`);
        console.log(`   LinkedIn URL field: ${testNominee.nominee.linkedin}`);
        console.log(`   WSA LinkedIn URL field: ${testNominee.nominee.linkedin}`);
        if (testNominee.type === 'person') {
          console.log(`   Website field: ${testNominee.nominee.linkedin}`);
        }
        
      } else {
        const errorText = await syncResponse.text();
        console.log('❌ Sync failed');
        console.log('Error:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error verifying sync:', error.message);
  }
}

verifyHubSpotSync().catch(console.error);