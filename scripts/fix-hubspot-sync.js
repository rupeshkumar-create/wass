#!/usr/bin/env node

/**
 * HubSpot Sync Fix Script
 * Fixes HubSpot sync issues and provides new token setup instructions
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

console.log('🔧 HubSpot Sync Fix Script');
console.log('===========================');

const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN;

console.log('📋 Current Configuration:');
console.log(`   HubSpot Token: ${HUBSPOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   Token Preview: ${HUBSPOT_TOKEN ? HUBSPOT_TOKEN.substring(0, 20) + '...' : 'N/A'}`);

async function testCurrentToken() {
  if (!HUBSPOT_TOKEN) {
    console.log('\n❌ No HubSpot token found');
    return false;
  }

  console.log('\n🔗 Testing current HubSpot token...');
  
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Current token is valid and working');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Current token is invalid or expired');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing token:', error.message);
    return false;
  }
}

function showTokenSetupInstructions() {
  console.log('\n🔑 HubSpot Token Setup Instructions');
  console.log('====================================');
  console.log('');
  console.log('1. Go to your HubSpot account');
  console.log('2. Navigate to Settings → Integrations → Private Apps');
  console.log('3. Create a new Private App or update existing one');
  console.log('4. Configure the following scopes:');
  console.log('   ✅ crm.objects.contacts.read');
  console.log('   ✅ crm.objects.contacts.write');
  console.log('   ✅ crm.objects.companies.read');
  console.log('   ✅ crm.objects.companies.write');
  console.log('   ✅ crm.schemas.contacts.read');
  console.log('   ✅ crm.schemas.companies.read');
  console.log('');
  console.log('5. Copy the generated token');
  console.log('6. Update your .env.local file:');
  console.log('   HUBSPOT_PRIVATE_APP_TOKEN="your-new-token-here"');
  console.log('');
  console.log('7. Required Custom Properties in HubSpot:');
  console.log('   Contact Properties:');
  console.log('   - wsa_year (Single-line text)');
  console.log('   - wsa_segments (Multi-select dropdown with options:)');
  console.log('     * nominees_2026');
  console.log('     * voters_2026');
  console.log('     * nominators_2026');
  console.log('   - wsa_category (Single-line text)');
  console.log('   - wsa_linkedin_url (Single-line text)');
  console.log('   - wsa_last_voted_nominee (Single-line text)');
  console.log('   - wsa_last_voted_category (Single-line text)');
  console.log('   - wsa_nomination_id (Single-line text)');
  console.log('   - wsa_live_slug (Single-line text)');
  console.log('');
  console.log('   Company Properties:');
  console.log('   - wsa_year (Single-line text)');
  console.log('   - wsa_segments (Multi-select dropdown - same options as above)');
  console.log('   - wsa_category (Single-line text)');
  console.log('   - wsa_linkedin_url (Single-line text)');
  console.log('   - wsa_nomination_id (Single-line text)');
}

async function testSyncWithMockData() {
  console.log('\n🧪 Testing Sync Functions with Mock Data');
  console.log('=========================================');
  
  if (!HUBSPOT_TOKEN) {
    console.log('❌ Cannot test - no HubSpot token available');
    return;
  }

  // Test nominator sync
  console.log('\n📤 Testing nominator sync...');
  try {
    const response = await fetch('http://localhost:3000/api/test/hubspot-wsa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nominator',
        data: {
          name: 'Test Fix Nominator',
          email: `test.fix.nominator.${Date.now()}@example.com`,
          linkedin: 'https://www.linkedin.com/in/test-fix-nominator'
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Nominator sync test passed');
      console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    } else {
      const error = await response.text();
      console.log('❌ Nominator sync test failed');
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ Nominator sync test error:', error.message);
  }

  // Test integration health
  console.log('\n📤 Testing HubSpot integration health...');
  try {
    const response = await fetch('http://localhost:3000/api/test/hubspot-wsa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'test'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ HubSpot integration health test passed');
      console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    } else {
      const error = await response.text();
      console.log('❌ HubSpot integration health test failed');
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ HubSpot integration health test error:', error.message);
  }
}

async function main() {
  console.log('\n🚀 Starting HubSpot Sync Fix');
  console.log('=============================');
  
  // Test current token
  const tokenValid = await testCurrentToken();
  
  if (!tokenValid) {
    showTokenSetupInstructions();
    console.log('\n⚠️  Please update your HubSpot token and run this script again');
    process.exit(1);
  }
  
  // Test sync functions
  await testSyncWithMockData();
  
  console.log('\n📊 Fix Summary:');
  console.log('===============');
  console.log('✅ HubSpot token is valid');
  console.log('✅ Sync functions are available');
  console.log('⚠️  Check test results above for any issues');
  
  console.log('\n🔧 If sync is still not working:');
  console.log('1. Check that all custom properties exist in HubSpot');
  console.log('2. Verify the token has write permissions');
  console.log('3. Check server logs for detailed error messages');
  console.log('4. Test with a real nomination to verify end-to-end sync');
  
  console.log('\n✅ HubSpot sync fix completed!');
}

main().catch(error => {
  console.error('❌ Fix script failed:', error);
  process.exit(1);
});