#!/usr/bin/env node

/**
 * Debug Loops User Group Issue
 */

require('dotenv').config({ path: '.env.local' });

async function debugUserGroupIssue() {
  console.log('🔍 DEBUGGING LOOPS USER GROUP ISSUE');
  console.log('===================================');
  
  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ LOOPS_API_KEY is required');
    return;
  }

  const testEmail = `debug-usergroup-${Date.now()}@example.com`;
  
  // Test 1: Create contact with userGroup in create request
  console.log('\n1. Creating contact with userGroup in create request');
  console.log('---------------------------------------------------');
  
  const createData = {
    email: testEmail,
    firstName: 'Debug',
    lastName: 'UserGroup',
    source: 'World Staffing Awards 2026',
    userGroup: 'TestCreateGroup'
  };
  
  console.log('Create payload:', JSON.stringify(createData, null, 2));
  
  try {
    const createResponse = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createData)
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Contact created');
      console.log('Response:', JSON.stringify(createResult, null, 2));
    } else {
      const errorText = await createResponse.text();
      console.error('❌ Create failed:', createResponse.status, errorText);
      return;
    }
  } catch (error) {
    console.error('❌ Create error:', error.message);
    return;
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Check if userGroup was set during create
  console.log('\n2. Checking contact after create');
  console.log('--------------------------------');
  
  try {
    const findResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(testEmail)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (findResponse.ok) {
      const responseData = await findResponse.json();
      const contactData = Array.isArray(responseData) ? responseData[0] : responseData;
      console.log('✅ Contact found after create');
      console.log('userGroup field:', contactData.userGroup);
      console.log('All fields:', Object.keys(contactData));
    } else {
      console.error('❌ Find failed:', findResponse.status);
      return;
    }
  } catch (error) {
    console.error('❌ Find error:', error.message);
    return;
  }
  
  // Test 3: Update contact with userGroup
  console.log('\n3. Updating contact with userGroup');
  console.log('----------------------------------');
  
  const updateData = {
    email: testEmail,
    userGroup: 'TestUpdateGroup'
  };
  
  console.log('Update payload:', JSON.stringify(updateData, null, 2));
  
  try {
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
      console.log('✅ Contact updated');
      console.log('Response:', JSON.stringify(updateResult, null, 2));
    } else {
      const errorText = await updateResponse.text();
      console.error('❌ Update failed:', updateResponse.status, errorText);
      return;
    }
  } catch (error) {
    console.error('❌ Update error:', error.message);
    return;
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Check if userGroup was updated
  console.log('\n4. Checking contact after update');
  console.log('---------------------------------');
  
  try {
    const findResponse = await fetch(`https://app.loops.so/api/v1/contacts/find?email=${encodeURIComponent(testEmail)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (findResponse.ok) {
      const responseData = await findResponse.json();
      const contactData = Array.isArray(responseData) ? responseData[0] : responseData;
      console.log('✅ Contact found after update');
      console.log('userGroup field:', contactData.userGroup);
      console.log('Expected: TestUpdateGroup');
      console.log('Match:', contactData.userGroup === 'TestUpdateGroup' ? '✅' : '❌');
    } else {
      console.error('❌ Find failed:', findResponse.status);
    }
  } catch (error) {
    console.error('❌ Find error:', error.message);
  }
  
  console.log('\n🎉 DEBUG COMPLETED!');
  console.log('==================');
}

debugUserGroupIssue().catch(console.error);