#!/usr/bin/env node

/**
 * Find Source Property
 * Searches for the correct lead source property in HubSpot
 */

require('dotenv').config({ path: '.env.local' });

async function findSourceProperty() {
  console.log('🔧 Finding Lead Source Property in HubSpot...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    console.log('\n📋 Searching for source-related properties...');
    
    const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Search for source-related properties
      const sourceProperties = data.results.filter(prop => 
        prop.name.toLowerCase().includes('source') || 
        prop.name.toLowerCase().includes('lead') ||
        prop.label.toLowerCase().includes('source') ||
        prop.label.toLowerCase().includes('lead')
      );
      
      console.log('Found source-related properties:');
      sourceProperties.forEach(prop => {
        console.log(`  📌 ${prop.name} - "${prop.label}" (${prop.type})`);
        if (prop.description) {
          console.log(`     Description: ${prop.description}`);
        }
      });
      
      // Also look for common HubSpot default properties
      const commonProps = ['hs_lead_source', 'source', 'leadsource', 'hs_analytics_source', 'hs_analytics_source_data_1', 'hs_analytics_source_data_2'];
      
      console.log('\n🔍 Checking common source properties:');
      commonProps.forEach(propName => {
        const found = data.results.find(p => p.name === propName);
        console.log(`  ${found ? '✅' : '❌'} ${propName}${found ? ` - "${found.label}"` : ''}`);
      });
      
    } else {
      const error = await response.text();
      console.error('❌ Failed to fetch properties:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

findSourceProperty();