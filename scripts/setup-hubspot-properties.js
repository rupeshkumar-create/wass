#!/usr/bin/env node

/**
 * Setup HubSpot Custom Properties for World Staffing Awards 2026
 * Creates all required custom properties for nominator, nominee, and voter tracking
 */

require('dotenv').config();

async function setupHubSpotProperties() {
  console.log('🚀 Setting up HubSpot Custom Properties for WSA 2026');
  console.log('====================================================');

  if (!process.env.HUBSPOT_TOKEN) {
    console.error('❌ HUBSPOT_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    // Import the setup function
    const { setupHubSpotCustomProperties, testHubSpotRealTimeSync } = require('../src/server/hubspot/realtime-sync.ts');
    
    // Test connection first
    console.log('🔍 Testing HubSpot connection...');
    const connectionTest = await testHubSpotRealTimeSync();
    
    if (!connectionTest.success) {
      console.error('❌ HubSpot connection failed:', connectionTest.error);
      process.exit(1);
    }

    console.log('✅ HubSpot connection successful');
    console.log('Account Portal ID:', connectionTest.accountInfo?.portalId);

    // Setup custom properties
    console.log('\n🔧 Creating custom properties...');
    const result = await setupHubSpotCustomProperties();

    if (result.success) {
      console.log('✅ Custom properties setup completed successfully!');
      
      if (result.created.length > 0) {
        console.log('\n📝 Created properties:');
        result.created.forEach(prop => {
          console.log(`  - ${prop}`);
        });
      } else {
        console.log('\nℹ️ All properties already existed');
      }

      console.log('\n🎯 HubSpot is now ready for real-time sync!');
      console.log('\nNext steps:');
      console.log('1. Test the integration with: npm run test:hubspot');
      console.log('2. Submit a test nomination to verify nominator sync');
      console.log('3. Approve a nomination to verify nominee sync');
      console.log('4. Cast a vote to verify voter sync');

    } else {
      console.error('❌ Custom properties setup failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupHubSpotProperties();