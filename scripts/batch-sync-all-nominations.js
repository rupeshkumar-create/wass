#!/usr/bin/env node

/**
 * Batch Sync All Nominations
 * Syncs all existing nominations from the JSON file to HubSpot
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function batchSyncAllNominations() {
  console.log('🔧 Batch Syncing All Nominations to HubSpot...');
  
  try {
    // Read nominations from JSON file
    const nominationsPath = path.join(__dirname, '../data/nominations.json');
    const nominationsData = JSON.parse(fs.readFileSync(nominationsPath, 'utf8'));
    
    console.log(`Found ${nominationsData.length} nominations to sync`);
    
    let successful = 0;
    let failed = 0;
    const errors = [];
    
    // Process each nomination
    for (let i = 0; i < nominationsData.length; i++) {
      const nomination = nominationsData[i];
      console.log(`\n📋 Processing ${i + 1}/${nominationsData.length}: ${nomination.nominee.name}`);
      
      try {
        // Convert to API format
        const nominationData = {
          nominator: nomination.nominator,
          nominee: {
            name: nomination.nominee.name,
            type: nomination.type,
            linkedin: nomination.nominee.linkedin,
            ...(nomination.nominee.email && { email: nomination.nominee.email }),
            ...(nomination.nominee.firstName && { firstName: nomination.nominee.firstName }),
            ...(nomination.nominee.lastName && { lastName: nomination.nominee.lastName }),
            ...(nomination.nominee.title && { title: nomination.nominee.title }),
            ...(nomination.nominee.website && { website: nomination.nominee.website }),
            ...(nomination.whyVoteForMe && { whyVoteForMe: nomination.whyVoteForMe })
          },
          category: nomination.category,
          categoryGroupId: nomination.category.split('-')[0] || 'general',
          subcategoryId: nomination.category,
          whyNominated: nomination.whyNominated,
          ...(nomination.imageUrl && { imageUrl: nomination.imageUrl })
        };
        
        // Send to API
        const response = await fetch('http://localhost:3000/api/sync/hubspot/nomination-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nominationData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Synced successfully - Nominator: ${result.nominatorContactId}, Nominee: ${result.nomineeContactId || result.nomineeCompanyId}`);
          successful++;
        } else {
          const error = await response.text();
          console.error(`❌ Sync failed: ${error}`);
          errors.push(`${nomination.nominee.name}: ${error}`);
          failed++;
        }
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${nomination.nominee.name}:`, error.message);
        errors.push(`${nomination.nominee.name}: ${error.message}`);
        failed++;
      }
    }
    
    // Summary
    console.log('\n📊 Batch Sync Summary:');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${nominationsData.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Verify some contacts
    if (successful > 0) {
      console.log('\n🔍 Verifying some synced contacts...');
      await verifySyncedContacts(nominationsData.slice(0, 3));
    }
    
  } catch (error) {
    console.error('❌ Batch sync failed:', error.message);
  }
}

async function verifySyncedContacts(nominations) {
  const token = process.env.HUBSPOT_TOKEN;
  
  for (const nomination of nominations) {
    console.log(`\n🔍 Checking: ${nomination.nominator.email}`);
    
    try {
      const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: nomination.nominator.email
            }]
          }],
          properties: [
            'firstname', 
            'lastname', 
            'email',
            'wsa_role',
            'wsa_nominated_display_name',
            'source'
          ]
        })
      });
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        
        if (searchResult.total > 0) {
          const contact = searchResult.results[0];
          console.log(`✅ Found: ${contact.properties.firstname} ${contact.properties.lastname} (${contact.properties.wsa_role}) - Source: ${contact.properties.source}`);
        } else {
          console.log('❌ Not found in HubSpot');
        }
      }
    } catch (error) {
      console.error('❌ Verification error:', error.message);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/sync/hubspot/test');
    if (response.ok || response.status === 404) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await batchSyncAllNominations();
  }
}

main();