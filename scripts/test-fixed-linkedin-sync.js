#!/usr/bin/env node

/**
 * Test the fixed LinkedIn URL sync
 */

require('dotenv').config();

async function testFixedSync() {
  console.log('🔧 Testing Fixed LinkedIn URL Sync\n');
  
  try {
    // Get a company nominee to test
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?type=company&limit=1');
    
    if (!nomineesResponse.ok) {
      console.log('❌ Could not fetch company nominees');
      return;
    }
    
    const nominees = await nomineesResponse.json();
    if (nominees.length === 0) {
      console.log('❌ No company nominees found');
      return;
    }
    
    const companyNominee = nominees[0];
    console.log('🏢 Testing with company nominee:');
    console.log(`   Name: ${companyNominee.nominee.name}`);
    console.log(`   LinkedIn: ${companyNominee.nominee.linkedin}`);
    console.log('');
    
    // Test the sync
    const syncResponse = await fetch('http://localhost:3000/api/integrations/hubspot/sync-nominators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nomination: {
          id: companyNominee.id,
          type: companyNominee.type,
          category: companyNominee.category,
          nominee: {
            name: companyNominee.nominee.name,
            linkedin: companyNominee.nominee.linkedin,
            country: companyNominee.nominee.country,
            website: companyNominee.nominee.website
          },
          liveUrl: companyNominee.liveUrl
        },
        action: 'approved'
      })
    });
    
    console.log(`📡 Sync Response Status: ${syncResponse.status}`);
    
    if (syncResponse.ok) {
      const result = await syncResponse.json();
      console.log('✅ Company sync successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      console.log('\n🎯 LinkedIn URL should now be in HubSpot:');
      console.log(`   Company: ${companyNominee.nominee.name}`);
      console.log(`   WSA LinkedIn URL field: ${companyNominee.nominee.linkedin}`);
      console.log('   (Note: Companies use wsa_linkedin_url, not linkedin_url)');
      
    } else {
      const errorText = await syncResponse.text();
      console.log('❌ Company sync failed');
      console.log('Error:', errorText);
    }
    
    // Also test a person nominee
    console.log('\n👤 Testing with person nominee...\n');
    
    const personResponse = await fetch('http://localhost:3000/api/nominees?type=person&limit=1');
    
    if (personResponse.ok) {
      const persons = await personResponse.json();
      if (persons.length > 0) {
        const personNominee = persons[0];
        console.log('👤 Testing with person nominee:');
        console.log(`   Name: ${personNominee.nominee.name}`);
        console.log(`   LinkedIn: ${personNominee.nominee.linkedin}`);
        console.log('');
        
        const personSyncResponse = await fetch('http://localhost:3000/api/integrations/hubspot/sync-nominators', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nomination: {
              id: personNominee.id,
              type: personNominee.type,
              category: personNominee.category,
              nominee: {
                name: personNominee.nominee.name,
                linkedin: personNominee.nominee.linkedin,
                country: personNominee.nominee.country,
                title: personNominee.nominee.title,
                email: 'test@example.com'
              },
              liveUrl: personNominee.liveUrl
            },
            action: 'approved'
          })
        });
        
        console.log(`📡 Person Sync Response Status: ${personSyncResponse.status}`);
        
        if (personSyncResponse.ok) {
          const personResult = await personSyncResponse.json();
          console.log('✅ Person sync successful!');
          
          console.log('\n🎯 LinkedIn URL should now be in HubSpot:');
          console.log(`   Contact: ${personNominee.nominee.name}`);
          console.log(`   linkedin_url field: ${personNominee.nominee.linkedin}`);
          console.log(`   wsa_linkedin_url field: ${personNominee.nominee.linkedin}`);
          console.log(`   website field: ${personNominee.nominee.linkedin}`);
          
        } else {
          const personErrorText = await personSyncResponse.text();
          console.log('❌ Person sync failed');
          console.log('Error:', personErrorText);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing fixed sync:', error.message);
  }
}

testFixedSync().catch(console.error);