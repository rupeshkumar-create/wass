#!/usr/bin/env node

/**
 * Test sending LinkedIn URLs directly to HubSpot API
 */

require('dotenv').config();

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function testHubSpotDirect() {
  console.log('🔍 Testing HubSpot LinkedIn URL Fields Directly\n');
  
  if (!HUBSPOT_TOKEN) {
    console.log('❌ HUBSPOT_PRIVATE_APP_TOKEN not found');
    return;
  }
  
  console.log('✅ HubSpot token found');
  console.log('Token preview:', HUBSPOT_TOKEN.substring(0, 10) + '...\n');
  
  try {
    // Test 1: Create a contact with LinkedIn URL
    console.log('🧪 Test 1: Creating contact with LinkedIn URL\n');
    
    const testContact = {
      properties: {
        firstname: 'LinkedIn',
        lastname: 'Test Contact',
        email: 'linkedin.test.contact@example.com',
        linkedin_url: 'https://linkedin.com/in/test-contact-linkedin',
        website: 'https://linkedin.com/in/test-contact-linkedin'
      }
    };
    
    console.log('📤 Sending contact data:');
    console.log(JSON.stringify(testContact, null, 2));
    
    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });
    
    console.log(`\n📥 Contact Response Status: ${contactResponse.status}`);
    
    if (contactResponse.ok) {
      const contactResult = await contactResponse.json();
      console.log('✅ Contact created successfully');
      console.log('Contact ID:', contactResult.id);
      console.log('Properties returned:', JSON.stringify(contactResult.properties, null, 2));
      
      // Check if LinkedIn URL was saved
      const linkedinUrl = contactResult.properties.linkedin_url;
      const website = contactResult.properties.website;
      
      console.log('\n🔍 LinkedIn URL Fields Check:');
      console.log(`   linkedin_url: ${linkedinUrl || '❌ NOT SAVED'}`);
      console.log(`   website: ${website || '❌ NOT SAVED'}`);
      
    } else {
      const errorText = await contactResponse.text();
      console.log('❌ Contact creation failed');
      console.log('Error:', errorText);
    }
    
    // Test 2: Create a company with LinkedIn URL
    console.log('\n🧪 Test 2: Creating company with LinkedIn URL\n');
    
    const testCompany = {
      properties: {
        name: 'LinkedIn Test Company',
        domain: 'linkedintestcompany.com',
        linkedin_url: 'https://linkedin.com/company/test-company-linkedin',
        website: 'https://linkedintestcompany.com'
      }
    };
    
    console.log('📤 Sending company data:');
    console.log(JSON.stringify(testCompany, null, 2));
    
    const companyResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCompany)
    });
    
    console.log(`\n📥 Company Response Status: ${companyResponse.status}`);
    
    if (companyResponse.ok) {
      const companyResult = await companyResponse.json();
      console.log('✅ Company created successfully');
      console.log('Company ID:', companyResult.id);
      console.log('Properties returned:', JSON.stringify(companyResult.properties, null, 2));
      
      // Check if LinkedIn URL was saved
      const linkedinUrl = companyResult.properties.linkedin_url;
      const website = companyResult.properties.website;
      
      console.log('\n🔍 LinkedIn URL Fields Check:');
      console.log(`   linkedin_url: ${linkedinUrl || '❌ NOT SAVED'}`);
      console.log(`   website: ${website || '❌ NOT SAVED'}`);
      
    } else {
      const errorText = await companyResponse.text();
      console.log('❌ Company creation failed');
      console.log('Error:', errorText);
    }
    
    // Test 3: Check available properties
    console.log('\n🧪 Test 3: Checking available contact properties\n');
    
    const propertiesResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (propertiesResponse.ok) {
      const properties = await propertiesResponse.json();
      const linkedinProps = properties.results.filter(prop => 
        prop.name.toLowerCase().includes('linkedin') || 
        prop.name.toLowerCase().includes('wsa')
      );
      
      console.log('🔍 LinkedIn-related properties found:');
      linkedinProps.forEach(prop => {
        console.log(`   ${prop.name}: ${prop.label} (${prop.type})`);
      });
      
      if (linkedinProps.length === 0) {
        console.log('❌ No LinkedIn-related properties found');
        console.log('💡 You may need to create custom properties in HubSpot');
      }
      
    } else {
      console.log('❌ Could not fetch properties');
    }
    
  } catch (error) {
    console.error('❌ Error testing HubSpot:', error.message);
  }
}

testHubSpotDirect().catch(console.error);