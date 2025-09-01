#!/usr/bin/env node

/**
 * Check for admin panel errors by testing the API endpoints
 */

async function checkAdminErrors() {
  try {
    console.log('🔍 Checking admin panel for errors...');
    
    // Test admin API endpoint
    console.log('\n1. Testing admin nominations API...');
    const response = await fetch('http://localhost:3000/api/admin/nominations');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin API working:', data.length, 'nominations found');
    } else {
      console.error('❌ Admin API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
    // Test nominees API
    console.log('\n2. Testing nominees API...');
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees');
    
    if (nomineesResponse.ok) {
      const nomineesData = await nomineesResponse.json();
      console.log('✅ Nominees API working:', nomineesData.length, 'nominees found');
    } else {
      console.error('❌ Nominees API error:', nomineesResponse.status, nomineesResponse.statusText);
      const errorText = await nomineesResponse.text();
      console.error('Error details:', errorText);
    }
    
    console.log('\n✅ API checks completed. If there are no errors above, the issue might be in the frontend components.');
    console.log('\n🔧 To check frontend errors:');
    console.log('1. Open http://localhost:3000/admin in your browser');
    console.log('2. Open browser developer tools (F12)');
    console.log('3. Check the Console tab for React/DOM errors');
    console.log('4. Try clicking "Edit" on a nomination to see if DOM nesting errors occur');
    
  } catch (error) {
    console.error('❌ Error checking admin panel:', error.message);
  }
}

checkAdminErrors();