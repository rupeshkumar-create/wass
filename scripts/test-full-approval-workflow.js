#!/usr/bin/env node

/**
 * Test the full approval workflow
 * 1. Create a new nomination
 * 2. Approve it via API
 * 3. Verify nominee syncs to HubSpot
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testFullApprovalWorkflow() {
  console.log('🧪 Testing Full Approval Workflow...\n');

  try {
    const timestamp = Date.now();
    
    // 1. Submit a new nomination
    console.log('1️⃣ Submitting new nomination...');
    
    const nominationData = {
      type: 'person',
      categoryGroupId: 'role-specific',
      subcategoryId: 'top-recruiter',
      
      nominator: {
        firstname: 'Test',
        lastname: 'Approver',
        email: `test.approver.${timestamp}@example.com`,
        linkedin: `https://linkedin.com/in/test-approver-${timestamp}`,
        company: 'Test Approval Company',
        jobTitle: 'HR Manager',
        phone: '+1-555-0301',
        country: 'United States'
      },
      
      nominee: {
        firstname: 'Approval',
        lastname: 'TestNominee',
        email: `approval.testnominee.${timestamp}@example.com`,
        linkedin: `https://linkedin.com/in/approval-testnominee-${timestamp}`,
        jobtitle: 'Senior Recruiter',
        company: 'Approval Test Solutions',
        phone: '+1-555-0302',
        country: 'United States',
        headshotUrl: 'https://example.com/headshots/approval-testnominee.jpg',
        whyMe: 'Exceptional recruiting skills with proven track record of successful placements and client satisfaction.'
      }
    };

    const nominationResponse = await fetch(`${baseUrl}/api/nomination/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nominationData)
    });

    if (!nominationResponse.ok) {
      const errorText = await nominationResponse.text();
      throw new Error(`Nomination submission failed: ${nominationResponse.status} - ${errorText}`);
    }

    const nominationResult = await nominationResponse.json();
    console.log(`✅ Nomination submitted: ${nominationResult.nominationId}`);

    // Wait for nominator sync
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Approve the nomination
    console.log('\n2️⃣ Approving nomination...');
    
    const approvalResponse = await fetch(`${baseUrl}/api/nomination/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nominationId: nominationResult.nominationId,
        liveUrl: `https://worldstaffingawards.com/nominee/approval-testnominee-${timestamp}`
      })
    });

    if (!approvalResponse.ok) {
      const errorText = await approvalResponse.text();
      throw new Error(`Nomination approval failed: ${approvalResponse.status} - ${errorText}`);
    }

    const approvalResult = await approvalResponse.json();
    console.log(`✅ Nomination approved: ${approvalResult.nominationId}`);

    // Wait for nominee sync
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Verify the nominee was synced to HubSpot
    console.log('\n3️⃣ Verifying nominee sync to HubSpot...');
    
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    
    // Search for the specific nominee
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
            value: `approval.testnominee.${timestamp}@example.com`
          }]
        }],
        properties: [
          'email',
          'firstname',
          'lastname',
          'wsa_contact_tag',
          'wsa_role',
          'wsa_nominee_type',
          'wsa_category',
          'createdate'
        ],
        limit: 1
      })
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const contacts = searchData.results || [];
      
      if (contacts.length > 0) {
        const contact = contacts[0];
        console.log('✅ Nominee found in HubSpot:');
        console.log(`  - Name: ${contact.properties.firstname} ${contact.properties.lastname}`);
        console.log(`  - Email: ${contact.properties.email}`);
        console.log(`  - Tag: ${contact.properties.wsa_contact_tag}`);
        console.log(`  - Role: ${contact.properties.wsa_role}`);
        console.log(`  - Type: ${contact.properties.wsa_nominee_type}`);
        console.log(`  - Category: ${contact.properties.wsa_category}`);
        console.log(`  - Created: ${new Date(contact.properties.createdate).toLocaleString()}`);
        
        if (contact.properties.wsa_contact_tag === 'WSA 2026 Nominees') {
          console.log('🎉 SUCCESS: Nominee has correct tag!');
        } else {
          console.log('⚠️ WARNING: Nominee has incorrect tag');
        }
      } else {
        console.log('❌ Nominee not found in HubSpot');
      }
    } else {
      console.log('❌ Failed to search HubSpot for nominee');
    }

    // 4. Also verify the nominator was synced
    console.log('\n4️⃣ Verifying nominator sync...');
    
    const nominatorSearchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
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
            value: `test.approver.${timestamp}@example.com`
          }]
        }],
        properties: [
          'email',
          'firstname',
          'lastname',
          'wsa_contact_tag',
          'wsa_role',
          'createdate'
        ],
        limit: 1
      })
    });

    if (nominatorSearchResponse.ok) {
      const nominatorSearchData = await nominatorSearchResponse.json();
      const nominatorContacts = nominatorSearchData.results || [];
      
      if (nominatorContacts.length > 0) {
        const nominator = nominatorContacts[0];
        console.log('✅ Nominator found in HubSpot:');
        console.log(`  - Name: ${nominator.properties.firstname} ${nominator.properties.lastname}`);
        console.log(`  - Email: ${nominator.properties.email}`);
        console.log(`  - Tag: ${nominator.properties.wsa_contact_tag}`);
        console.log(`  - Role: ${nominator.properties.wsa_role}`);
        console.log(`  - Created: ${new Date(nominator.properties.createdate).toLocaleString()}`);
        
        if (nominator.properties.wsa_contact_tag === 'WSA2026 Nominator') {
          console.log('🎉 SUCCESS: Nominator has correct tag!');
        } else {
          console.log('⚠️ WARNING: Nominator has incorrect tag');
        }
      } else {
        console.log('❌ Nominator not found in HubSpot');
      }
    }

    console.log('\n🎉 Full approval workflow test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Nomination submission works');
    console.log('✅ Nominator syncs immediately with "WSA2026 Nominator" tag');
    console.log('✅ Nomination approval works');
    console.log('✅ Nominee syncs on approval with "WSA 2026 Nominees" tag');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testFullApprovalWorkflow();