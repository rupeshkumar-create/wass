#!/usr/bin/env node

/**
 * Check Existing Loops Contacts
 * See how existing contacts are structured and what properties they have
 */

require('dotenv').config({ path: '.env.local' });

async function checkExistingLoopsContacts() {
  console.log('🔍 Checking Existing Loops Contacts...\n');

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
    // Get some existing contacts to see their structure
    console.log('1. Getting existing contacts...');
    
    const contactsResponse = await fetch(`${baseUrl}/contacts/find?email=test.voter.1756405118335@example.com`, {
      method: 'GET',
      headers,
    });
    
    if (contactsResponse.ok) {
      const contact = await contactsResponse.json();
      console.log('   ✅ Found existing contact:');
      console.log('   Contact data:', JSON.stringify(contact, null, 2));
    } else {
      console.log(`   ❌ Failed to find contact: ${contactsResponse.status}`);
    }

    // Try to get all contacts (limited)
    console.log('\n2. Getting all contacts (limited)...');
    
    try {
      const allContactsResponse = await fetch(`${baseUrl}/contacts`, {
        method: 'GET',
        headers,
      });
      
      if (allContactsResponse.ok) {
        const contacts = await allContactsResponse.json();
        console.log(`   ✅ Retrieved ${contacts.length || 'unknown'} contacts`);
        
        if (contacts && contacts.length > 0) {
          console.log('   Sample contact structure:');
          console.log(JSON.stringify(contacts[0], null, 2));
        }
      } else {
        console.log(`   ❌ Failed to get all contacts: ${allContactsResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error getting all contacts: ${error.message}`);
    }

    // Check if we can search for contacts with userGroup property
    console.log('\n3. Testing userGroup property search...');
    
    try {
      // Create a test contact with userGroup
      const testEmail = `test-usergroup-${Date.now()}@example.com`;
      
      const createResponse = await fetch(`${baseUrl}/contacts/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: testEmail,
          firstName: 'Test',
          lastName: 'UserGroup',
          userGroup: 'Voters',
          source: 'World Staffing Awards 2026 - UserGroup Test',
        }),
      });
      
      if (createResponse.ok) {
        const contact = await createResponse.json();
        console.log(`   ✅ Created contact with userGroup: ${contact.id}`);
        
        // Try to find it back
        const findResponse = await fetch(`${baseUrl}/contacts/find?email=${testEmail}`, {
          method: 'GET',
          headers,
        });
        
        if (findResponse.ok) {
          const foundContact = await findResponse.json();
          console.log('   ✅ Found contact with userGroup:');
          console.log('   UserGroup property:', foundContact.userGroup);
          console.log('   Full contact:', JSON.stringify(foundContact, null, 2));
        }
        
        // Clean up
        await fetch(`${baseUrl}/contacts/delete`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: testEmail }),
        });
        console.log('   ✅ Test contact cleaned up');
        
      } else {
        console.log(`   ❌ Failed to create test contact: ${createResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing userGroup: ${error.message}`);
    }

    console.log('\n✅ Existing contacts check completed');

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

// Run the check
checkExistingLoopsContacts().catch(console.error);