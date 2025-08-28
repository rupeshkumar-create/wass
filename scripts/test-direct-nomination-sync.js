#!/usr/bin/env node

/**
 * Test Direct Nomination Sync
 * Directly test the onSubmit function to see detailed errors
 */

require('dotenv').config({ path: '.env.local' });

async function testDirectNominationSync() {
  console.log('🔧 Testing Direct Nomination Sync...');
  
  try {
    // Import the sync function directly
    const { onSubmit } = require('../src/server/hubspot/sync.ts');
    
    const testData = {
      nominator: {
        email: 'direct.nominator@example.com',
        name: 'Direct Nominator',
        company: 'Direct Corp',
        linkedin: 'https://linkedin.com/in/direct-nominator'
      },
      nominee: {
        name: 'Direct Nominee',
        type: 'person',
        email: 'direct.nominee@example.com',
        firstname: 'Direct',
        lastname: 'Nominee',
        jobtitle: 'Direct Manager',
        linkedin: 'https://linkedin.com/in/direct-nominee',
        categories: ['top-recruiter'],
        headshotUrl: 'https://example.com/direct-photo.jpg'
      },
      categoryGroupId: 'top',
      subcategoryId: 'top-recruiter',
      imageUrl: 'https://example.com/direct-photo.jpg',
      content: 'They are excellent at direct management and never break production.'
    };
    
    console.log('Calling onSubmit directly with data:', JSON.stringify(testData, null, 2));
    
    const result = await onSubmit(testData);
    
    console.log('Direct sync result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Direct nomination sync succeeded!');
    } else {
      console.log('❌ Direct nomination sync failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Direct sync test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testDirectNominationSync();