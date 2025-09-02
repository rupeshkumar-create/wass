const { default: fetch } = require('node-fetch');

async function testAdmin() {
  try {
    console.log('Testing admin API endpoint...');
    
    const response = await fetch('http://localhost:3002/api/admin/nominations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('Parsed data:', data);
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    }
    
  } catch (error) {
    console.error('Error testing admin:', error.message);
  }
}

testAdmin();