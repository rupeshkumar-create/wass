#!/usr/bin/env node

/**
 * Find Source Details Property
 * Find the exact property name for "Source details" field
 */

require('dotenv').config({ path: '.env.local' });

async function findSourceDetailsProperty() {
  console.log('🔧 Finding Source details property...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found in environment');
    return;
  }
  
  try {
    // Get all contact properties
    console.log('\n1️⃣ Getting all contact properties...');
    const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get properties:', errorText);
      return;
    }
    
    const properties = await response.json();
    
    // Search for properties that might be "Source details"
    const sourceProperties = properties.results.filter(prop => 
      prop.label.toLowerCase().includes('source') || 
      prop.name.toLowerCase().includes('source')
    );
    
    console.log('Found source-related properties:');
    sourceProperties.forEach(prop => {
      console.log(`  - ${prop.label} (${prop.name}) - Type: ${prop.type}`);
      if (prop.options && prop.options.length > 0) {
        console.log(`    Options: ${prop.options.map(opt => opt.value).join(', ')}`);
      }
    });
    
    // Look specifically for "Source details" or similar
    const sourceDetailsProperty = properties.results.find(prop => 
      prop.label.toLowerCase().includes('source details') ||
      prop.label.toLowerCase() === 'source details'
    );
    
    if (sourceDetailsProperty) {
      console.log('\n✅ Found "Source details" property:');
      console.log(`   Name: ${sourceDetailsProperty.name}`);
      console.log(`   Label: ${sourceDetailsProperty.label}`);
      console.log(`   Type: ${sourceDetailsProperty.type}`);
      
      if (sourceDetailsProperty.options) {
        console.log('   Options:');
        sourceDetailsProperty.options.forEach((option, index) => {
          console.log(`     ${index + 1}. ${option.label} (${option.value})`);
        });
        
        const hasWSS26 = sourceDetailsProperty.options.some(opt => opt.value === 'WSS26');
        console.log(`   WSS26 exists: ${hasWSS26 ? '✅ Yes' : '❌ No'}`);
      }
    } else {
      console.log('\n❌ "Source details" property not found');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

findSourceDetailsProperty();