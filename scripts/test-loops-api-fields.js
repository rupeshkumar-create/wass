#!/usr/bin/env node

/**
 * Test Loops API field structure
 */

require('dotenv').config({ path: '.env.local' });

async function testLoopsFields() {
  console.log('🧪 TESTING LOOPS API FIELDS');
  console.log('============================');
  
  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ LOOPS_API_KEY is required');
    return;
  }

  const testEmail = `test-fields-${Date.now()}@example.com`;
  
  // Test 1: Create contact with userGroup field
  console.log('\n1. Creating contact with userGroup field');
  console.log('----------------------------------------');
  
  const contactData = {
    email: testEmail,
    firstName: 'Test',
    lastName: 'Fields',
    source: 'World Staffing Awards 2026',
    userGroup: 'TestGroup'
  };
  
  try {
    const createResponse = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Contact created successfully');
      console.log('   Contact ID:', createResult.id);
      console.log('   Success:', createResult.success);
    } else {
      const errorText = await createResponse.text();
      console.error('❌ Contact creation failed:', createResponse.status, errorText);
    }
  } catch (error) {
    console.error('❌ Contact creation error:', error.message);
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Find the contact and check fields
  console.log('\n2. Finding contact and checking fields');
  console.log('-------------------------------------');
  
  try {
    const findResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(testEmail)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (findResponse.ok) {
      const contactData = await findResponse.json();
      console.log('✅ Contact found');
      console.log('   Full response:', JSON.stringify(contactData, null, 2));
    } else {
      const errorText = await findResponse.text();
      console.error('❌ Contact find failed:', findResponse.status, errorText);
    }
  } catch (error) {
    console.error('❌ Contact find error:', error.message);
  }
  
  // Test 3: Update contact with userGroup
  console.log('\n3. Updating contact with userGroup');
  console.log('----------------------------------');
  
  try {
    const updateData = {
      email: testEmail,
      userGroup: 'UpdatedGroup',
      testField: 'TestValue'
    };
    
    const updateResponse = await fetch('https://app.loops.so/api/v1/contacts/update', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Contact updated successfully');
      console.log('   Success:', updateResult.success);
    } else {
      const errorText = await updateResponse.text();
      console.error('❌ Contact update failed:', updateResponse.status, errorText);
    }
  } catch (error) {
    console.error('❌ Contact update error:', error.message);
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Find the contact again to see updated fields
  console.log('\n4. Finding updated contact');
  console.log('-------------------------');
  
  try {
    const findResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(testEmail)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (findResponse.ok) {
      const contactData = await findResponse.json();
      console.log('✅ Updated contact found');
      console.log('   Full response:', JSON.stringify(contactData, null, 2));
      
      // Check specific fields (Loops returns an array)
      const contact = Array.isArray(contactData) ? contactData[0] : contactData;
      console.log('\n📋 Field Analysis:');
      console.log('   userGroup:', contact.userGroup || 'Not found');
      console.log('   testField:', contact.testField || 'Not found');
      console.log('   All fields:', Object.keys(contact));
    } else {
      const errorText = await findResponse.text();
      console.error('❌ Updated contact find failed:', findResponse.status, errorText);
    }
  } catch (error) {
    console.error('❌ Updated contact find error:', error.message);
  }
  
  console.log('\n🎉 LOOPS API FIELDS TEST COMPLETED!');
  console.log('===================================');
}

testLoopsFields().catch(console.error);