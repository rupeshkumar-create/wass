#!/usr/bin/env node

/**
 * Check Pipelines
 * Check available pipelines and stages in HubSpot
 */

require('dotenv').config({ path: '.env.local' });

async function checkPipelines() {
  console.log('🔧 Checking HubSpot pipelines...');
  
  const token = process.env.HUBSPOT_TOKEN;
  
  if (!token) {
    console.error('❌ HUBSPOT_TOKEN not found in environment');
    return;
  }
  
  try {
    // Get ticket pipelines
    console.log('\n1️⃣ Getting ticket pipelines...');
    const pipelinesResponse = await fetch('https://api.hubapi.com/crm/v3/pipelines/tickets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (pipelinesResponse.ok) {
      const pipelines = await pipelinesResponse.json();
      console.log('Available ticket pipelines:');
      
      pipelines.results.forEach((pipeline, index) => {
        console.log(`\n  ${index + 1}. ${pipeline.label} (ID: ${pipeline.id})`);
        console.log('     Stages:');
        pipeline.stages.forEach((stage, stageIndex) => {
          console.log(`       ${stageIndex + 1}. ${stage.label} (ID: ${stage.id})`);
        });
      });
      
      // Show current environment values
      console.log('\n📋 Current environment values:');
      console.log('   HUBSPOT_PIPELINE_ID:', process.env.HUBSPOT_PIPELINE_ID);
      console.log('   HUBSPOT_STAGE_SUBMITTED:', process.env.HUBSPOT_STAGE_SUBMITTED);
      console.log('   HUBSPOT_STAGE_APPROVED:', process.env.HUBSPOT_STAGE_APPROVED);
      
    } else {
      const errorText = await pipelinesResponse.text();
      console.error('❌ Failed to get pipelines:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

checkPipelines();