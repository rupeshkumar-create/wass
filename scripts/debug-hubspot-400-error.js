#!/usr/bin/env node

/**
 * Debug HubSpot 400 Bad Request Errors
 * Investigates the specific cause of sync failures
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const hubspotToken = process.env.HUBSPOT_TOKEN;

if (!hubspotToken) {
  console.error('❌ Missing HubSpot token');
  process.exit(1);
}

async function testHubSpotDirectly() {
  console.log('🔍 Testing HubSpot API Directly');
  console.log('===============================');

  // Test 1: Basic account info
  console.log('\n1️⃣ Testing account info...');
  try {
    const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Account info successful');
      console.log(`   Portal ID: ${data.portalId}`);
      console.log(`   Account Name: ${data.accountName || 'N/A'}`);
    } else {
      const error = await response.json();
      console.error('❌ Account info failed:', error);
    }
  } catch (error) {
    console.error('❌ Account info error:', error.message);
  }

  // Test 2: Check existing custom properties
  console.log('\n2️⃣ Checking custom properties...');
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const wsaProperties = data.results.filter(p => p.name.startsWith('wsa_'));
      console.log(`✅ Found ${wsaProperties.length} WSA custom properties`);
      
      // Check for the specific properties we're trying to use
      const requiredProps = ['wsa_role', 'wsa_year', 'wsa_source', 'wsa_nominator_status'];
      const missingProps = requiredProps.filter(prop => 
        !wsaProperties.find(p => p.name === prop)
      );
      
      if (missingProps.length > 0) {
        console.warn(`⚠️ Missing properties: ${missingProps.join(', ')}`);
      } else {
        console.log('✅ All required properties exist');
      }

      // Show wsa_role property details
      const roleProperty = wsaProperties.find(p => p.name === 'wsa_role');
      if (roleProperty) {
        console.log('\n📋 wsa_role property details:');
        console.log(`   Type: ${roleProperty.type}`);
        console.log(`   Field Type: ${roleProperty.fieldType}`);
        if (roleProperty.options) {
          console.log(`   Options: ${roleProperty.options.map(o => o.value).join(', ')}`);
        }
      }
    } else {
      const error = await response.json();
      console.error('❌ Properties check failed:', error);
    }
  } catch (error) {
    console.error('❌ Properties check error:', error.message);
  }

  // Test 3: Try to create a simple contact
  console.log('\n3️⃣ Testing simple contact creation...');
  try {
    const testContact = {
      properties: {
        email: 'debug.test@example.com',
        firstname: 'Debug',
        lastname: 'Test',
        lifecyclestage: 'lead'
      }
    };

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Simple contact creation successful');
      console.log(`   Contact ID: ${data.id}`);
      
      // Clean up - delete the test contact
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`
        }
      });
      console.log('🧹 Test contact deleted');
    } else {
      const error = await response.json();
      console.error('❌ Simple contact creation failed:', error);
      console.error('   Status:', response.status);
      console.error('   Response:', JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.error('❌ Simple contact creation error:', error.message);
  }

  // Test 4: Try to create contact with WSA properties
  console.log('\n4️⃣ Testing contact with WSA properties...');
  try {
    const testContact = {
      properties: {
        email: 'debug.wsa.test@example.com',
        firstname: 'Debug',
        lastname: 'WSA Test',
        lifecyclestage: 'lead',
        wsa_role: 'Nominator',
        wsa_year: '2026',
        wsa_source: 'World Staffing Awards'
      }
    };

    console.log('📤 Sending contact data:', JSON.stringify(testContact, null, 2));

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ WSA contact creation successful');
      console.log(`   Contact ID: ${data.id}`);
      
      // Clean up - delete the test contact
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`
        }
      });
      console.log('🧹 Test contact deleted');
    } else {
      const error = await response.json();
      console.error('❌ WSA contact creation failed:', error);
      console.error('   Status:', response.status);
      console.error('   Response:', JSON.stringify(error, null, 2));
      
      // Try to identify the specific issue
      if (error.message && error.message.includes('Property')) {
        console.log('\n🔍 Property-related error detected. Checking property values...');
        
        // Check if the issue is with enumeration values
        if (error.message.includes('wsa_role')) {
          console.log('   Issue appears to be with wsa_role property');
          console.log('   Trying with different role values...');
          
          const roleValues = ['nominator', 'nominee', 'voter', 'Nominator', 'Nominee', 'Voter'];
          for (const roleValue of roleValues) {
            console.log(`   Testing role value: "${roleValue}"`);
            
            const testRoleContact = {
              properties: {
                email: `debug.role.${roleValue.toLowerCase()}@example.com`,
                firstname: 'Debug',
                lastname: 'Role Test',
                lifecyclestage: 'lead',
                wsa_role: roleValue
              }
            };

            const roleResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hubspotToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(testRoleContact)
            });

            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              console.log(`     ✅ Role "${roleValue}" works! Contact ID: ${roleData.id}`);
              
              // Clean up
              await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${roleData.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${hubspotToken}`
                }
              });
              break;
            } else {
              const roleError = await roleResponse.json();
              console.log(`     ❌ Role "${roleValue}" failed: ${roleError.message}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ WSA contact creation error:', error.message);
  }

  console.log('\n📊 Debug Summary');
  console.log('================');
  console.log('If you see 400 errors above, the issue is likely:');
  console.log('1. Invalid property values (especially enumeration properties)');
  console.log('2. Missing required properties');
  console.log('3. Property type mismatches');
  console.log('4. Invalid property names');
}

testHubSpotDirectly().catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});