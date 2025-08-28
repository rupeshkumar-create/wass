#!/usr/bin/env node

/**
 * Simple HubSpot Token Test
 * Tests if the HubSpot token is valid by calling the account info endpoint
 */

require('dotenv').config({ path: '.env.local' });

async function testHubSpotToken() {
  console.log('🔧 Testing HubSpot Token...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found in environment variables');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('HUBSPOT')));
    return;
  }
  
  console.log('✅ Token found:', token.slice(0, 20) + '...');
  console.log('Token format:', token.startsWith('pat-') ? 'Private App Token' : 'Unknown format');
  
  try {
    console.log('\n🔍 Testing HubSpot API connection...');
    
    const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ HubSpot connection successful!');
      console.log('Account ID:', data.portalId);
      console.log('Account Name:', data.accountName);
      console.log('Hub Domain:', data.hubDomain);
    } else {
      const error = await response.text();
      console.error('❌ HubSpot API error:', error);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testHubSpotToken();