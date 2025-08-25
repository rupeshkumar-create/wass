#!/usr/bin/env node

/**
 * Test HubSpot connection and credentials
 */

// Load environment variables
require('dotenv').config();

// Use built-in fetch (Node.js 18+) or global fetch

async function testHubSpotConnection() {
  console.log('🔌 Testing HubSpot Connection\n');

  // Check environment variables
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

  if (!token) {
    console.log('❌ HUBSPOT_PRIVATE_APP_TOKEN not found in environment');
    console.log('Please check your .env file');
    return false;
  }

  console.log('✅ HubSpot token found in environment');
  console.log('Token preview:', token.substring(0, 10) + '...');

  // Test direct HubSpot API call
  try {
    console.log('\n🔍 Testing direct HubSpot API access...');

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ HubSpot API connection successful');
      console.log('Available contacts:', data.total || 0);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ HubSpot API connection failed');
      console.log('Error:', errorText);
      return false;
    }

  } catch (error) {
    console.log('❌ Error connecting to HubSpot API:', error.message);
    return false;
  }
}

async function testLocalAPI() {
  console.log('\n🌐 Testing local API endpoints...');

  try {
    // Test if local server is running
    const response = await fetch('http://localhost:3000/api/stats');

    if (response.ok) {
      console.log('✅ Local development server is running');

      // Test HubSpot events endpoint
      try {
        const hubspotResponse = await fetch('http://localhost:3000/api/integrations/hubspot/events');
        console.log('HubSpot events endpoint status:', hubspotResponse.status);

        if (hubspotResponse.ok) {
          console.log('✅ HubSpot integration endpoints are accessible');
        } else {
          console.log('⚠️  HubSpot integration endpoints may have issues');
        }
      } catch (error) {
        console.log('⚠️  Could not test HubSpot endpoints:', error.message);
      }

      return true;
    } else {
      console.log('❌ Local server responded with status:', response.status);
      return false;
    }

  } catch (error) {
    console.log('❌ Local development server is not running');
    console.log('Please start it with: npm run dev');
    return false;
  }
}

async function runConnectionTest() {
  console.log('🧪 HubSpot Connection Test\n');

  const hubspotOk = await testHubSpotConnection();
  const localOk = await testLocalAPI();

  console.log('\n📊 Connection Test Results:');
  console.log('  HubSpot API:', hubspotOk ? '✅ CONNECTED' : '❌ FAILED');
  console.log('  Local Server:', localOk ? '✅ RUNNING' : '❌ NOT RUNNING');

  if (hubspotOk && localOk) {
    console.log('\n🎉 All connections successful!');
    console.log('You can now run the LinkedIn URL sync test:');
    console.log('  node scripts/test-hubspot-linkedin-live.js');
  } else {
    console.log('\n⚠️  Some connections failed. Please fix the issues above before testing LinkedIn sync.');

    if (!hubspotOk) {
      console.log('\nHubSpot troubleshooting:');
      console.log('1. Check your HUBSPOT_PRIVATE_APP_TOKEN in .env');
      console.log('2. Verify the token has the required scopes (contacts, companies)');
      console.log('3. Make sure the token is not expired');
    }

    if (!localOk) {
      console.log('\nLocal server troubleshooting:');
      console.log('1. Run: npm run dev');
      console.log('2. Wait for the server to start completely');
      console.log('3. Check for any error messages in the console');
    }
  }
}

runConnectionTest().catch(console.error);