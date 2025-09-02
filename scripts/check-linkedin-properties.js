#!/usr/bin/env node

/**
 * Check LinkedIn Properties
 * Verify that the LinkedIn property keys exist in HubSpot
 */

require('dotenv').config({ path: '.env.local' });

async function checkLinkedInProperties() {
  console.log('🔧 Checking LinkedIn properties...');
  
  const token = process.env.HUBSPOT_TOKEN;
  const contactLinkedInKey = process.env.HUBSPOT_CONTACT_LINKEDIN_KEY;
  const companyLinkedInKey = process.env.HUBSPOT_COMPANY_LINKEDIN_KEY;
  
  console.log('Contact LinkedIn key:', contactLinkedInKey);
  console.log('Company LinkedIn key:', companyLinkedInKey);
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found in environment');
    return;
  }
  
  try {
    // Check contact LinkedIn property
    console.log('\n1️⃣ Checking contact LinkedIn property...');
    const contactResponse = await fetch(`https://api.hubapi.com/crm/v3/properties/contacts/${contactLinkedInKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (contactResponse.ok) {
      const contactProperty = await contactResponse.json();
      console.log('✅ Contact LinkedIn property exists:', contactProperty.name);
      console.log('   Type:', contactProperty.type);
      console.log('   Field Type:', contactProperty.fieldType);
    } else {
      const errorText = await contactResponse.text();
      console.error('❌ Contact LinkedIn property not found:', errorText);
    }
    
    // Check company LinkedIn property
    console.log('\n2️⃣ Checking company LinkedIn property...');
    const companyResponse = await fetch(`https://api.hubapi.com/crm/v3/properties/companies/${companyLinkedInKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (companyResponse.ok) {
      const companyProperty = await companyResponse.json();
      console.log('✅ Company LinkedIn property exists:', companyProperty.name);
      console.log('   Type:', companyProperty.type);
      console.log('   Field Type:', companyProperty.fieldType);
    } else {
      const errorText = await companyResponse.text();
      console.error('❌ Company LinkedIn property not found:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

checkLinkedInProperties();