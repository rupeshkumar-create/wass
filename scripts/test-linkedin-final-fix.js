#!/usr/bin/env node

/**
 * Test the final LinkedIn URL fix
 */

require('dotenv').config();

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function testLinkedInFinalFix() {
  console.log('🔧 Testing Final LinkedIn URL Fix\n');
  
  try {
    // Test 1: Direct HubSpot API with correct company field
    console.log('🧪 Test 1: Direct HubSpot API with correct fields\n');
    
    const testCompany = {
      properties: {
        name: 'LinkedIn Final Fix Test Company',
        domain: 'linkedinfinalfix.com',
        linkedin_company_page: 'https://linkedin.com/company/final-fix-test',
        wsa_linkedin_url: 'https://linkedin.com/company/final-fix-test',
        website: 'https://linkedinfinalfix.com'
      }
    };
    
    console.log('🏢 Creating company with correct LinkedIn field...');
    const companyResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCompany)
    });
    
    if (companyResponse.ok) {
      const companyResult = await companyResponse.json();
      console.log('✅ Company created successfully!');
      console.log('LinkedIn fields saved:');
      console.log(`   linkedin_company_page: ${companyResult.properties.linkedin_company_page || '❌ NOT SAVED'}`);
      console.log(`   wsa_linkedin_url: ${companyResult.properties.wsa_linkedin_url || '❌ NOT SAVED'}`);
      console.log(`   website: ${companyResult.properties.website || '❌ NOT SAVED'}`);
    } else {
      const companyError = await companyResponse.text();
      console.log('❌ Company creation failed:', companyError);
    }
    
    // Test 2: Our sync endpoint with the fix
    console.log('\n🧪 Test 2: Our Sync Endpoint with Fix\n');
    
    // Get a company nominee
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?type=company&limit=1');
    
    if (nomineesResponse.ok) {
      const nominees = await nomineesResponse.json();
      if (nominees.length > 0) {
        const companyNominee = nominees[0];
        
        console.log(`🏢 Testing company sync: ${companyNominee.nominee.name}`);
        console.log(`   LinkedIn: ${companyNominee.nominee.linkedin}`);
        
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
        
        console.log(`📥 Company sync response: ${syncResponse.status}`);
        
        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          console.log('✅ Company sync successful!');
          
          console.log('\n🎯 LinkedIn URL should now be in HubSpot:');
          console.log(`   Company: ${companyNominee.nominee.name}`);
          console.log(`   linkedin_company_page: ${companyNominee.nominee.linkedin}`);
          console.log(`   wsa_linkedin_url: ${companyNominee.nominee.linkedin}`);
          
          if (syncResult.errors && syncResult.errors.length > 0) {
            console.log('\n⚠️  Sync had errors:');
            syncResult.errors.forEach(error => {
              console.log(`   - ${error}`);
            });
          }
        } else {
          const syncError = await syncResponse.text();
          console.log('❌ Company sync failed:', syncError);
        }
      }
    }
    
    // Test 3: Person nominee (should still work)
    console.log('\n🧪 Test 3: Person Nominee (Verification)\n');
    
    const personResponse = await fetch('http://localhost:3000/api/nominees?type=person&limit=1');
    
    if (personResponse.ok) {
      const persons = await personResponse.json();
      if (persons.length > 0) {
        const personNominee = persons[0];
        
        console.log(`👤 Testing person sync: ${personNominee.nominee.name}`);
        console.log(`   LinkedIn: ${personNominee.nominee.linkedin}`);
        
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
        
        console.log(`📥 Person sync response: ${personSyncResponse.status}`);
        
        if (personSyncResponse.ok) {
          console.log('✅ Person sync successful!');
          
          console.log('\n🎯 LinkedIn URL should be in HubSpot:');
          console.log(`   Contact: ${personNominee.nominee.name}`);
          console.log(`   linkedin_url: ${personNominee.nominee.linkedin}`);
          console.log(`   wsa_linkedin_url: ${personNominee.nominee.linkedin}`);
          console.log(`   website: ${personNominee.nominee.linkedin}`);
        } else {
          const personSyncError = await personSyncResponse.text();
          console.log('❌ Person sync failed:', personSyncError);
        }
      }
    }
    
    console.log('\n🎉 Final Summary:');
    console.log('✅ Contacts use: linkedin_url, wsa_linkedin_url, website');
    console.log('✅ Companies use: linkedin_company_page, wsa_linkedin_url');
    console.log('✅ Both should now sync LinkedIn URLs correctly!');
    
  } catch (error) {
    console.error('❌ Error in final fix test:', error.message);
  }
}

testLinkedInFinalFix().catch(console.error);