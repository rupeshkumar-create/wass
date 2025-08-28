#!/usr/bin/env node

/**
 * Add Nominee_Company Role Option
 * Add the missing "Nominee_Company" option to the wsa_role property
 */

require('dotenv').config({ path: '.env.local' });

async function addNomineeCompanyRole() {
  console.log('🔧 Adding Nominee_Company role option...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found in environment');
    return;
  }
  
  try {
    // First, get the current wsa_role property to see its current options
    console.log('\n1️⃣ Getting current wsa_role property...');
    const getResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/wsa_role', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('❌ Failed to get property:', errorText);
      return;
    }
    
    const currentProperty = await getResponse.json();
    console.log('Current wsa_role options:');
    currentProperty.options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.label} (${option.value})`);
    });
    
    // Check if Nominee_Company already exists
    const hasNomineeCompany = currentProperty.options.some(option => option.value === 'Nominee_Company');
    
    if (hasNomineeCompany) {
      console.log('✅ Nominee_Company option already exists!');
      return;
    }
    
    // Add the new option
    console.log('\n2️⃣ Adding Nominee_Company option...');
    const newOptions = [
      ...currentProperty.options,
      {
        label: 'Nominee (Company)',
        value: 'Nominee_Company',
        displayOrder: currentProperty.options.length,
        hidden: false
      }
    ];
    
    const updateData = {
      options: newOptions
    };
    
    console.log('Updating property with new options...');
    const updateResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/wsa_role', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      const updatedProperty = await updateResponse.json();
      console.log('✅ Successfully added Nominee_Company option!');
      console.log('Updated options:');
      updatedProperty.options.forEach((option, index) => {
        console.log(`  ${index + 1}. ${option.label} (${option.value})`);
      });
    } else {
      const errorText = await updateResponse.text();
      console.error('❌ Failed to update property:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

addNomineeCompanyRole();