#!/usr/bin/env node

/**
 * Final comprehensive test for LinkedIn URL syncing
 */

require('dotenv').config();

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function testLinkedInFinalDebug() {
  console.log('🔍 Final LinkedIn URL Sync Debug\n');
  
  if (!HUBSPOT_TOKEN) {
    console.log('❌ HUBSPOT_PRIVATE_APP_TOKEN not found');
    return;
  }
  
  try {
    // Step 1: Test direct HubSpot API with both contact and company
    console.log('🧪 Step 1: Testing Direct HubSpot API\n');
    
    // Test Contact with LinkedIn URL
    const testContact = {
      properties: {
        firstname: 'LinkedIn',
        lastname: 'Test Final',
        email: 'linkedin.test.final@example.com',
        linkedin_url: 'https://linkedin.com/in/test-final-contact',
        wsa_linkedin_url: 'https://linkedin.com/in/test-final-contact',
        website: 'https://linkedin.com/in/test-final-contact'
      }
    };
    
    console.log('👤 Creating test contact...');
    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });
    
    if (contactResponse.ok) {
      const contactResult = await contactResponse.json();
      console.log('✅ Contact created successfully');
      console.log('LinkedIn fields saved:');
      console.log(`   linkedin_url: ${contactResult.properties.linkedin_url || '❌ NOT SAVED'}`);
      console.log(`   wsa_linkedin_url: ${contactResult.properties.wsa_linkedin_url || '❌ NOT SAVED'}`);
      console.log(`   website: ${contactResult.properties.website || '❌ NOT SAVED'}`);
    } else {
      const contactError = await contactResponse.text();
      console.log('❌ Contact creation failed:', contactError);
    }
    
    console.log('');
    
    // Test Company with LinkedIn URL
    const testCompany = {
      properties: {
        name: 'LinkedIn Test Final Company',
        domain: 'linkedintestfinal.com',
        linkedin_url: 'https://linkedin.com/company/test-final-company',
        wsa_linkedin_url: 'https://linkedin.com/company/test-final-company',
        website: 'https://linkedintestfinal.com'
      }
    };
    
    console.log('🏢 Creating test company...');
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
      console.log('✅ Company created successfully');
      console.log('LinkedIn fields saved:');
      console.log(`   linkedin_url: ${companyResult.properties.linkedin_url || '❌ NOT SAVED'}`);
      console.log(`   wsa_linkedin_url: ${companyResult.properties.wsa_linkedin_url || '❌ NOT SAVED'}`);
      console.log(`   website: ${companyResult.properties.website || '❌ NOT SAVED'}`);
    } else {
      const companyError = await companyResponse.text();
      console.log('❌ Company creation failed:', companyError);
    }
    
    // Step 2: Test our sync endpoints
    console.log('\n🧪 Step 2: Testing Our Sync Endpoints\n');
    
    // Get real nominees to test with
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?limit=2');
    
    if (!nomineesResponse.ok) {
      console.log('❌ Could not fetch nominees from our API');
      return;
    }
    
    const nominees = await nomineesResponse.json();
    console.log(`📊 Found ${nominees.length} nominees to test with\n`);
    
    for (const nominee of nominees.slice(0, 2)) {
      console.log(`🔍 Testing ${nominee.type}: ${nominee.nominee.name}`);
      console.log(`   LinkedIn: ${nominee.nominee.linkedin}`);
      
      // Create the nomination object for sync
      const nominationForSync = {
        id: nominee.id,
        type: nominee.type,
        category: nominee.category,
        nominee: {
          name: nominee.nominee.name,
          linkedin: nominee.nominee.linkedin,
          country: nominee.nominee.country,
          title: nominee.nominee.title,
          website: nominee.nominee.website,
          email: nominee.type === 'person' ? 'test@example.com' : undefined
        },
        liveUrl: nominee.liveUrl
      };
      
      console.log('📤 Sending to sync endpoint...');
      
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
      
      console.log(`📥 Sync response: ${syncResponse.status}`);
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('✅ Sync successful');
        
        if (syncResult.errors && syncResult.errors.length > 0) {
          console.log('⚠️  Sync had errors:');
          syncResult.errors.forEach(error => {
            console.log(`   - ${error}`);
          });
        }
      } else {
        const syncError = await syncResponse.text();
        console.log('❌ Sync failed:', syncError);
      }
      
      console.log('');
    }
    
    // Step 3: Check what properties are available
    console.log('🧪 Step 3: Checking Available Properties\n');
    
    // Check contact properties
    const contactPropsResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`
      }
    });
    
    if (contactPropsResponse.ok) {
      const contactProps = await contactPropsResponse.json();
      const linkedinContactProps = contactProps.results.filter(prop => 
        prop.name.toLowerCase().includes('linkedin') || prop.name.includes('wsa_linkedin')
      );
      
      console.log('👤 Contact LinkedIn Properties:');
      linkedinContactProps.forEach(prop => {
        console.log(`   ${prop.name}: ${prop.label} (${prop.type})`);
      });
    }
    
    console.log('');
    
    // Check company properties
    const companyPropsResponse = await fetch('https://api.hubapi.com/crm/v3/properties/companies', {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`
      }
    });
    
    if (companyPropsResponse.ok) {
      const companyProps = await companyPropsResponse.json();
      const linkedinCompanyProps = companyProps.results.filter(prop => 
        prop.name.toLowerCase().includes('linkedin') || prop.name.includes('wsa_linkedin')
      );
      
      console.log('🏢 Company LinkedIn Properties:');
      linkedinCompanyProps.forEach(prop => {
        console.log(`   ${prop.name}: ${prop.label} (${prop.type})`);
      });
    }
    
    console.log('\n🎯 Summary:');
    console.log('If the direct API tests worked but our sync doesn\'t show LinkedIn URLs,');
    console.log('the issue might be:');
    console.log('1. The sync is working but you\'re looking in the wrong place in HubSpot');
    console.log('2. The custom wsa_linkedin_url field needs to be created');
    console.log('3. There\'s a permission issue with the HubSpot token');
    console.log('4. The data is being overwritten by subsequent syncs');
    
  } catch (error) {
    console.error('❌ Error in final debug:', error.message);
  }
}

testLinkedInFinalDebug().catch(console.error);