#!/usr/bin/env node

/**
 * Verify Loops Nominees
 * Check which nominees are actually in Loops and their details
 */

require('dotenv').config({ path: '.env.local' });

async function verifyLoopsNominees() {
  console.log('🔍 Verifying Loops Nominees...\n');

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.log('❌ LOOPS_API_KEY not configured');
    return;
  }

  const baseUrl = 'https://app.loops.so/api/v1';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Check the specific emails that were synced
    const emailsToCheck = [
      'jane.smith.loops.test@example.com',
      'test.nominee.1756404860273@example.com',
      'test.nominee.1756405118335@example.com'
    ];

    console.log('Checking synced nominee emails...');
    
    for (const email of emailsToCheck) {
      console.log(`\nChecking: ${email}`);
      
      try {
        const response = await fetch(`${baseUrl}/contacts/find?email=${email}`, {
          headers,
        });

        if (response.ok) {
          const contacts = await response.json();
          if (contacts && contacts.length > 0) {
            const contact = contacts[0];
            console.log(`  ✅ Found in Loops`);
            console.log(`  - Name: ${contact.firstName} ${contact.lastName}`);
            console.log(`  - UserGroup: ${contact.userGroup}`);
            console.log(`  - Source: ${contact.source}`);
            console.log(`  - Live URL: ${contact.liveUrl || 'None'}`);
            console.log(`  - Nominee Type: ${contact.nomineeType || 'None'}`);
            console.log(`  - Category: ${contact.category || 'None'}`);
          } else {
            console.log(`  ❌ Not found in Loops`);
          }
        } else {
          console.log(`  ❌ Failed to check: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking: ${error.message}`);
      }
    }

    // Also check for any contacts with userGroup "Nominess"
    console.log('\n\nSearching for all contacts with userGroup "Nominess"...');
    
    // Since we can't search by userGroup directly, let's check some recent contacts
    // that might have been synced as nominees
    const testEmails = [
      'test.voter.1756405118335@example.com', // This should be a voter
      'test.nominator.1756405118335@example.com', // This should be a nominator
    ];

    for (const email of testEmails) {
      try {
        const response = await fetch(`${baseUrl}/contacts/find?email=${email}`, {
          headers,
        });

        if (response.ok) {
          const contacts = await response.json();
          if (contacts && contacts.length > 0) {
            const contact = contacts[0];
            console.log(`\n${email}:`);
            console.log(`  - UserGroup: ${contact.userGroup}`);
            console.log(`  - Source: ${contact.source}`);
            
            if (contact.userGroup === 'Nominator Live') {
              console.log(`  - Nominee Name: ${contact.nomineeName || 'None'}`);
              console.log(`  - Nominee Live URL: ${contact.nomineeLiveUrl || 'None'}`);
            }
          }
        }
      } catch (error) {
        console.log(`  Error checking ${email}: ${error.message}`);
      }
    }

    console.log('\n✅ Loops nominees verification completed');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the verification
verifyLoopsNominees().catch(console.error);