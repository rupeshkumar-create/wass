#!/usr/bin/env node

/**
 * Check Source Property
 * Check the source property options to see if WSA26 is valid
 */

require('dotenv').config({ path: '.env.local' });

async function checkSourceProperty() {
  console.log('🔧 Checking source property...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found in environment');
    return;
  }
  
  try {
    // Get the source property
    console.log('\n1️⃣ Getting source property...');
    const getResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/source', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('❌ Failed to get source property:', errorText);
      return;
    }
    
    const sourceProperty = await getResponse.json();
    console.log('Source property type:', sourceProperty.type);
    console.log('Source property field type:', sourceProperty.fieldType);
    
    if (sourceProperty.options && sourceProperty.options.length > 0) {
      console.log('Available source options:');
      sourceProperty.options.forEach((option, index) => {
        console.log(`  ${index + 1}. ${option.label} (${option.value})`);
      });
      
      // Check if WSA26 exists
      const hasWSA26 = sourceProperty.options.some(option => option.value === 'WSA26');
      console.log('\nWSA26 option exists:', hasWSA26 ? '✅ Yes' : '❌ No');
      
    } else {
      console.log('Source property has no predefined options (free text field)');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

checkSourceProperty();