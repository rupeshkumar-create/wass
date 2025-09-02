#!/usr/bin/env node

/**
 * Test HubSpot Configuration
 * Check HubSpot connection and get pipeline/stage IDs
 */

require('dotenv').config({ path: '.env.local' });

async function testHubSpotConfig() {
  console.log('🔧 Testing HubSpot Configuration...\n');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.log('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  console.log('✅ HubSpot token found:', token.substring(0, 20) + '...');
  
  // Test 1: Basic API connection
  console.log('\n1️⃣ Testing HubSpot API connection...');
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ HubSpot API connection successful');
    } else {
      const error = await response.json();
      console.log('❌ HubSpot API connection failed:', response.status, error);
      return;
    }
  } catch (error) {
    console.log('❌ HubSpot API connection error:', error.message);
    return;
  }
  
  // Test 2: Get pipelines
  console.log('\n2️⃣ Fetching HubSpot pipelines...');
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/pipelines/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.results.length} ticket pipelines:`);
      
      data.results.forEach((pipeline, i) => {
        console.log(`   ${i + 1}. ${pipeline.label} (ID: ${pipeline.id})`);
        
        if (pipeline.stages && pipeline.stages.length > 0) {
          console.log('      Stages:');
          pipeline.stages.forEach((stage, j) => {
            console.log(`         ${j + 1}. ${stage.label} (ID: ${stage.id})`);
          });
        }
      });
      
      // Suggest configuration
      if (data.results.length > 0) {
        const firstPipeline = data.results[0];
        console.log('\n💡 Suggested configuration:');
        console.log(`   HUBSPOT_PIPELINE_ID=${firstPipeline.id}`);
        
        if (firstPipeline.stages && firstPipeline.stages.length >= 2) {
          console.log(`   HUBSPOT_STAGE_SUBMITTED=${firstPipeline.stages[0].id}`);
          console.log(`   HUBSPOT_STAGE_APPROVED=${firstPipeline.stages[1].id}`);
        }
      }
      
    } else {
      const error = await response.json();
      console.log('❌ Failed to fetch pipelines:', response.status, error);
    }
  } catch (error) {
    console.log('❌ Pipeline fetch error:', error.message);
  }
  
  // Test 3: Check contact properties
  console.log('\n3️⃣ Checking contact properties...');
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const linkedinProps = data.results.filter(prop => 
        prop.name.toLowerCase().includes('linkedin') || 
        prop.label.toLowerCase().includes('linkedin')
      );
      
      console.log(`✅ Found ${linkedinProps.length} LinkedIn-related contact properties:`);
      linkedinProps.forEach((prop, i) => {
        console.log(`   ${i + 1}. ${prop.label} (${prop.name})`);
      });
      
      // Check if our configured property exists
      const configuredProp = process.env.HUBSPOT_CONTACT_LINKEDIN_KEY;
      const exists = data.results.find(prop => prop.name === configuredProp);
      console.log(`\n🎯 Configured contact LinkedIn property (${configuredProp}): ${exists ? '✅ Found' : '❌ Not found'}`);
      
    } else {
      console.log('❌ Failed to fetch contact properties');
    }
  } catch (error) {
    console.log('❌ Contact properties error:', error.message);
  }
  
  // Test 4: Check company properties
  console.log('\n4️⃣ Checking company properties...');
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/properties/companies', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const linkedinProps = data.results.filter(prop => 
        prop.name.toLowerCase().includes('linkedin') || 
        prop.label.toLowerCase().includes('linkedin')
      );
      
      console.log(`✅ Found ${linkedinProps.length} LinkedIn-related company properties:`);
      linkedinProps.forEach((prop, i) => {
        console.log(`   ${i + 1}. ${prop.label} (${prop.name})`);
      });
      
      // Check if our configured property exists
      const configuredProp = process.env.HUBSPOT_COMPANY_LINKEDIN_KEY;
      const exists = data.results.find(prop => prop.name === configuredProp);
      console.log(`\n🎯 Configured company LinkedIn property (${configuredProp}): ${exists ? '✅ Found' : '❌ Not found'}`);
      
    } else {
      console.log('❌ Failed to fetch company properties');
    }
  } catch (error) {
    console.log('❌ Company properties error:', error.message);
  }
  
  console.log('\n📋 Current Environment Configuration:');
  console.log(`   HUBSPOT_TOKEN: ${token ? '✅ Set' : '❌ Missing'}`);
  console.log(`   HUBSPOT_CONTACT_LINKEDIN_KEY: ${process.env.HUBSPOT_CONTACT_LINKEDIN_KEY}`);
  console.log(`   HUBSPOT_COMPANY_LINKEDIN_KEY: ${process.env.HUBSPOT_COMPANY_LINKEDIN_KEY}`);
  console.log(`   HUBSPOT_PIPELINE_ID: ${process.env.HUBSPOT_PIPELINE_ID}`);
  console.log(`   HUBSPOT_STAGE_SUBMITTED: ${process.env.HUBSPOT_STAGE_SUBMITTED}`);
  console.log(`   HUBSPOT_STAGE_APPROVED: ${process.env.HUBSPOT_STAGE_APPROVED}`);
  console.log(`   HUBSPOT_SYNC_ENABLED: ${process.env.HUBSPOT_SYNC_ENABLED}`);
}

testHubSpotConfig();