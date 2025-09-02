#!/usr/bin/env node

/**
 * Add WSA26 Source Option
 * Adds "WSA26" as an option to the source property
 */

require('dotenv').config({ path: '.env.local' });

async function addWSA26SourceOption() {
  console.log('🔧 Adding WSA26 as Source Option...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    console.log('\n1️⃣ Getting current source property...');
    
    const getResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/source', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const error = await getResponse.text();
      console.error('❌ Failed to get source property:', error);
      return;
    }
    
    const sourceProperty = await getResponse.json();
    console.log('Current source options:');
    sourceProperty.options.forEach((option, index) => {
      console.log(`  ${index + 1}. "${option.label}" (value: "${option.value}")`);
    });
    
    // Check if WSA26 already exists
    const wsa26Exists = sourceProperty.options.some(option => option.value === 'WSA26');
    
    if (wsa26Exists) {
      console.log('✅ WSA26 option already exists!');
      return;
    }
    
    console.log('\n2️⃣ Adding WSA26 option...');
    
    // Add WSA26 to the options
    const newOptions = [
      ...sourceProperty.options,
      {
        label: 'WSA26',
        value: 'WSA26',
        displayOrder: sourceProperty.options.length,
        hidden: false,
        readOnly: false
      }
    ];
    
    const updateResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/source', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: newOptions
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Successfully added WSA26 as a source option!');
      
      // Test creating a contact with the new source
      console.log('\n3️⃣ Testing contact creation with WSA26 source...');
      await testContactWithWSA26Source(token);
      
    } else {
      const error = await updateResponse.text();
      console.error('❌ Failed to update source property:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testContactWithWSA26Source(token) {
  const testEmail = `test.wsa26.${Date.now()}@example.com`;
  
  try {
    const contactData = {
      properties: {
        firstname: 'WSA26',
        lastname: 'Test',
        email: testEmail,
        company: 'Test Company Ltd',
        linkedin: 'https://linkedin.com/in/wsa26test',
        source: 'WSA26',
        wsa_year: 2026,
        wsa_role: 'Voter',
        wsa_voted_for_display_name: 'Jane Smith',
        wsa_voted_subcategory_id: 'top-recruiter',
        wsa_vote_timestamp: new Date().toISOString()
      }
    };
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test contact created successfully!');
      console.log('   ID:', result.id);
      console.log('   Email:', result.properties.email);
      console.log('   Source:', result.properties.source);
      console.log('   LinkedIn:', result.properties.linkedin);
      console.log('   WSA Role:', result.properties.wsa_role);
    } else {
      const error = await response.text();
      console.error('❌ Failed to create test contact:', error);
    }
    
  } catch (error) {
    console.error('❌ Test contact creation failed:', error.message);
  }
}

addWSA26SourceOption();