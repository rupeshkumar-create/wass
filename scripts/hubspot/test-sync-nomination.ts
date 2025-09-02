#!/usr/bin/env npx tsx

/**
 * Test HubSpot Sync for a Single Nomination
 */

import 'dotenv/config';
import { syncNominationApproved } from '../../src/integrations/hubspot/sync';

// Test with the first approved nomination
const testNomination = {
  "id": "342dc6af-ef65-40fb-97d2-003d85baa091",
  "category": "Top Recruiter",
  "type": "person" as const,
  "nominator": {
    "name": "Aman Kumar",
    "email": "Aman@kumar.com",
    "phone": ""
  },
  "nominee": {
    "name": "Mayank Raj",
    "email": "Mayank@raj.com",
    "title": "CEO",
    "country": "",
    "linkedin": "https://www.linkedin.com/in/aira-mongush",
    "headshotBase64": ""
  },
  "liveUrl": "/nominee/mayank-raj",
  "status": "approved" as const,
  "createdAt": "2025-08-13T19:14:54.723+00:00",
  "uniqueKey": "top recruiter__https://www.linkedin.com/in/aira-mongush",
  "moderatedAt": "2025-08-14T05:28:55.549+00:00",
  "moderatedBy": null,
  "moderatorNote": null,
  "imageUrl": "",
  "whyVoteForMe": ""
};

async function testSync() {
  console.log('🧪 Testing HubSpot Sync for Single Nomination');
  console.log('=' .repeat(50));
  
  try {
    console.log(`\\n📋 Syncing nomination: ${testNomination.nominee.name}`);
    console.log(`   Category: ${testNomination.category}`);
    console.log(`   Type: ${testNomination.type}`);
    console.log(`   LinkedIn: ${testNomination.nominee.linkedin}`);
    
    await syncNominationApproved(testNomination);
    
    console.log('\\n✅ Sync completed successfully!');
    console.log('\\n📋 Next Steps:');
    console.log('1. Check HubSpot Contacts for the new contact');
    console.log('2. Verify the contact has WSA data in notes');
    console.log('3. Test the admin panel HubSpot tab');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error('\\nFull error:', error);
  }
}

testSync();