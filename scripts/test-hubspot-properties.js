#!/usr/bin/env node

/**
 * HubSpot Properties Test
 * Tests if the required custom properties exist in HubSpot
 */

require('dotenv').config({ path: '.env.local' });

async function testHubSpotProperties() {
  console.log('🔧 Testing HubSpot Custom Properties...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found');
    return;
  }
  
  try {
    // Test contact properties
    console.log('\n📋 Checking Contact Properties...');
    const contactPropsResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (contactPropsResponse.ok) {
      const contactProps = await contactPropsResponse.json();
      const requiredContactProps = [
        'wsa_year',
        'wsa_role', 
        'wsa_nominated_display_name',
        'wsa_nominator_status',
        'wsa_voted_for_display_name',
        'wsa_voted_subcategory_id',
        'wsa_vote_timestamp',
        'wsa_live_url'
      ];
      
      console.log('Total contact properties:', contactProps.results.length);
      
      for (const prop of requiredContactProps) {
        const exists = contactProps.results.find(p => p.name === prop);
        console.log(`  ${exists ? '✅' : '❌'} ${prop}${exists ? '' : ' (missing)'}`);
      }
    } else {
      console.error('❌ Failed to fetch contact properties:', await contactPropsResponse.text());
    }
    
    // Test company properties
    console.log('\n🏢 Checking Company Properties...');
    const companyPropsResponse = await fetch('https://api.hubapi.com/crm/v3/properties/companies', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (companyPropsResponse.ok) {
      const companyProps = await companyPropsResponse.json();
      const requiredCompanyProps = [
        'wsa_year',
        'wsa_role',
        'wsa_live_url'
      ];
      
      console.log('Total company properties:', companyProps.results.length);
      
      for (const prop of requiredCompanyProps) {
        const exists = companyProps.results.find(p => p.name === prop);
        console.log(`  ${exists ? '✅' : '❌'} ${prop}${exists ? '' : ' (missing)'}`);
      }
    } else {
      console.error('❌ Failed to fetch company properties:', await companyPropsResponse.text());
    }
    
    // Test ticket properties
    console.log('\n🎫 Checking Ticket Properties...');
    const ticketPropsResponse = await fetch('https://api.hubapi.com/crm/v3/properties/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (ticketPropsResponse.ok) {
      const ticketProps = await ticketPropsResponse.json();
      const requiredTicketProps = [
        'wsa_year',
        'wsa_type',
        'wsa_category_group',
        'wsa_subcategory_id',
        'wsa_nominee_display_name',
        'wsa_nominee_linkedin_url',
        'wsa_image_url',
        'wsa_nominator_email',
        'wsa_live_url',
        'wsa_approval_timestamp'
      ];
      
      console.log('Total ticket properties:', ticketProps.results.length);
      
      for (const prop of requiredTicketProps) {
        const exists = ticketProps.results.find(p => p.name === prop);
        console.log(`  ${exists ? '✅' : '❌'} ${prop}${exists ? '' : ' (missing)'}`);
      }
    } else {
      console.error('❌ Failed to fetch ticket properties:', await ticketPropsResponse.text());
    }
    
    // Test pipelines
    console.log('\n🔄 Checking Pipelines...');
    const pipelinesResponse = await fetch('https://api.hubapi.com/crm/v3/pipelines/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (pipelinesResponse.ok) {
      const pipelines = await pipelinesResponse.json();
      console.log('Available pipelines:');
      
      for (const pipeline of pipelines.results) {
        console.log(`  📋 ${pipeline.label} (ID: ${pipeline.id})`);
        console.log(`     Stages: ${pipeline.stages.map(s => `${s.label} (${s.id})`).join(', ')}`);
      }
      
      const configuredPipelineId = process.env.HUBSPOT_PIPELINE_ID;
      if (configuredPipelineId) {
        const pipeline = pipelines.results.find(p => p.id === configuredPipelineId);
        console.log(`\n🎯 Configured pipeline (${configuredPipelineId}): ${pipeline ? '✅ Found' : '❌ Not found'}`);
      } else {
        console.log('\n⚠️  No pipeline configured in HUBSPOT_PIPELINE_ID');
      }
    } else {
      console.error('❌ Failed to fetch pipelines:', await pipelinesResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHubSpotProperties();