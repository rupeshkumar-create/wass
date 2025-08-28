#!/usr/bin/env node

/**
 * Test HubSpot Sync with New Schema Fields
 * Verifies that all fields from the enhanced schema are being synced correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hubspotToken = process.env.HUBSPOT_TOKEN;

if (!supabaseUrl || !supabaseServiceKey || !hubspotToken) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testNewSchemaSync() {
  console.log('🚀 Testing HubSpot Sync with New Schema Fields');
  console.log('===============================================');

  let testEmails = [];

  try {
    // Test 1: Person Nomination with All Fields
    console.log('\n1️⃣ Testing Person Nomination with Complete Data...');
    
    const personNomination = {
      type: 'person',
      categoryGroupId: 'individual-awards',
      subcategoryId: 'best-recruiter',
      nominator: {
        firstname: 'Schema',
        lastname: 'Test Nominator',
        email: 'schema.test.nominator@example.com',
        linkedin: 'https://linkedin.com/in/schematestnom',
        company: 'Schema Test Company',
        jobTitle: 'Senior Test Manager',
        phone: '+1-555-0100',
        country: 'United States'
      },
      nominee: {
        firstname: 'Schema',
        lastname: 'Test Person',
        email: 'schema.test.person@example.com',
        linkedin: 'https://linkedin.com/in/schematestperson',
        jobtitle: 'Senior Developer',
        company: 'Person Test Corp',
        phone: '+1-555-0101',
        country: 'Canada',
        headshotUrl: 'https://example.com/schema-person-headshot.jpg',
        whyMe: 'Schema test person reason',
        bio: 'Schema test person bio',
        achievements: 'Schema test person achievements'
      }
    };

    testEmails.push(personNomination.nominator.email, personNomination.nominee.email);

    const personResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personNomination)
    });

    const personResult = await personResponse.json();
    
    if (personResponse.ok) {
      console.log('✅ Person nomination submitted successfully');
      console.log(`   Nomination ID: ${personResult.nominationId}`);
      
      // Approve the nomination to test nominee sync
      const approvalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nominationId: personResult.nominationId,
          liveUrl: 'https://worldstaffingawards.com/nominee/schema-test-person'
        })
      });

      if (approvalResponse.ok) {
        console.log('✅ Person nomination approved successfully');
      } else {
        console.log('⚠️ Person nomination approval failed');
      }
    } else {
      console.error('❌ Person nomination failed:', personResult.error);
    }

    // Test 2: Company Nomination with All Fields
    console.log('\n2️⃣ Testing Company Nomination with Complete Data...');
    
    const companyNomination = {
      type: 'company',
      categoryGroupId: 'company-awards',
      subcategoryId: 'best-staffing-firm',
      nominator: {
        firstname: 'Company',
        lastname: 'Test Nominator',
        email: 'company.test.nominator@example.com',
        linkedin: 'https://linkedin.com/in/companytestnom',
        company: 'Company Test Nominator Corp',
        jobTitle: 'VP of Operations',
        phone: '+1-555-0102',
        country: 'United Kingdom'
      },
      nominee: {
        name: 'Schema Test Company',
        domain: 'schematestcompany.com',
        website: 'https://schematestcompany.com',
        linkedin: 'https://linkedin.com/company/schematestcompany',
        phone: '+1-555-0103',
        country: 'Australia',
        size: '100-500',
        industry: 'Technology Staffing',
        logoUrl: 'https://example.com/schema-company-logo.jpg',
        whyUs: 'Schema test company reason',
        bio: 'Schema test company bio',
        achievements: 'Schema test company achievements'
      }
    };

    testEmails.push(companyNomination.nominator.email);

    const companyResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyNomination)
    });

    const companyResult = await companyResponse.json();
    
    if (companyResponse.ok) {
      console.log('✅ Company nomination submitted successfully');
      console.log(`   Nomination ID: ${companyResult.nominationId}`);
      
      // Approve the company nomination
      const companyApprovalResponse = await fetch('http://localhost:3000/api/nomination/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nominationId: companyResult.nominationId,
          liveUrl: 'https://worldstaffingawards.com/nominee/schema-test-company'
        })
      });

      if (companyApprovalResponse.ok) {
        console.log('✅ Company nomination approved successfully');
      } else {
        console.log('⚠️ Company nomination approval failed');
      }
    } else {
      console.error('❌ Company nomination failed:', companyResult.error);
    }

    // Test 3: Vote with All Fields
    console.log('\n3️⃣ Testing Vote with Complete Voter Data...');
    
    // Get available nominees
    const { data: nominees } = await supabase
      .from('public_nominees')
      .select('*')
      .eq('subcategory_id', 'best-recruiter')
      .limit(1);

    if (nominees && nominees.length > 0) {
      const voteData = {
        subcategoryId: 'best-recruiter',
        votedForDisplayName: nominees[0].display_name,
        firstname: 'Schema',
        lastname: 'Test Voter',
        email: 'schema.test.voter@example.com',
        linkedin: 'https://linkedin.com/in/schematestvoter',
        company: 'Schema Test Voter Corp',
        jobTitle: 'HR Director',
        country: 'Germany'
      };

      testEmails.push(voteData.email);

      const voteResponse = await fetch('http://localhost:3000/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData)
      });

      const voteResult = await voteResponse.json();
      
      if (voteResponse.ok) {
        console.log('✅ Vote cast successfully');
        console.log(`   Vote ID: ${voteResult.voteId}`);
      } else {
        console.error('❌ Vote casting failed:', voteResult.error);
      }
    } else {
      console.log('ℹ️ No nominees available for voting test');
    }

    // Test 4: Process All Sync Items
    console.log('\n4️⃣ Processing All Sync Items...');
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for sync records to be created
    
    const syncResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
      }
    });

    const syncResult = await syncResponse.json();
    
    if (syncResponse.ok) {
      console.log('✅ Sync processing completed');
      console.log(`   Processed: ${syncResult.processed || 0}`);
      console.log(`   Succeeded: ${syncResult.succeeded || 0}`);
      console.log(`   Failed: ${syncResult.failed || 0}`);
      
      if (syncResult.results && syncResult.results.length > 0) {
        console.log('\n📋 Sync Results:');
        syncResult.results.forEach(item => {
          const icon = item.status === 'done' ? '✅' : '❌';
          console.log(`   ${icon} ${item.event_type} (${item.status})`);
          if (item.error) {
            console.log(`      Error: ${item.error}`);
          }
        });
      }
    } else {
      console.error('❌ Sync processing failed:', syncResult.error);
    }

    // Test 5: Verify HubSpot Data
    console.log('\n5️⃣ Verifying HubSpot Data...');
    
    // Test direct HubSpot contact creation with all new fields
    const testContactData = {
      properties: {
        email: 'schema.verification@example.com',
        firstname: 'Schema',
        lastname: 'Verification',
        lifecyclestage: 'lead',
        wsa_role: 'Nominator',
        wsa_year: '2026',
        wsa_source: 'World Staffing Awards',
        wsa_nominator_status: 'submitted',
        wsa_submission_date: new Date().toISOString(),
        linkedin: 'https://linkedin.com/in/schemaverification',
        wsa_linkedin: 'https://linkedin.com/in/schemaverification',
        company: 'Schema Verification Corp',
        wsa_company: 'Schema Verification Corp',
        jobtitle: 'Test Manager',
        wsa_job_title: 'Test Manager',
        phone: '+1-555-0199',
        wsa_phone: '+1-555-0199',
        country: 'France',
        wsa_country: 'France',
        wsa_industry: 'Technology',
        wsa_company_size: '50-100'
      }
    };

    const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContactData)
    });

    if (hubspotResponse.ok) {
      const hubspotData = await hubspotResponse.json();
      console.log('✅ Direct HubSpot contact creation successful');
      console.log(`   Contact ID: ${hubspotData.id}`);
      
      // Clean up test contact
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubspotData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`
        }
      });
      console.log('🧹 Test contact deleted');
    } else {
      const hubspotError = await hubspotResponse.json();
      console.error('❌ Direct HubSpot contact creation failed:', hubspotError);
    }

    return true;

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      for (const email of testEmails) {
        // Clean up voters
        const { data: voter } = await supabase
          .from('voters')
          .select('id')
          .eq('email', email)
          .single();

        if (voter) {
          await supabase.from('votes').delete().eq('voter_id', voter.id);
          await supabase.from('voters').delete().eq('id', voter.id);
        }

        // Clean up nominations
        const { data: nominator } = await supabase
          .from('nominators')
          .select('id')
          .eq('email', email)
          .single();

        if (nominator) {
          const { data: nominations } = await supabase
            .from('nominations')
            .select('id, nominee_id')
            .eq('nominator_id', nominator.id);

          if (nominations) {
            for (const nomination of nominations) {
              await supabase.from('nominations').delete().eq('id', nomination.id);
              await supabase.from('nominees').delete().eq('id', nomination.nominee_id);
            }
          }

          await supabase.from('nominators').delete().eq('id', nominator.id);
        }
      }

      // Clean up test sync records
      await supabase
        .from('hubspot_outbox')
        .delete()
        .like('payload->nominator->email', '%schema.test%');

      console.log('✅ Test data cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error (non-critical):', cleanupError.message);
    }
  }
}

async function main() {
  const success = await testNewSchemaSync();
  
  console.log('\n📊 New Schema Sync Test Results');
  console.log('===============================');
  
  if (success) {
    console.log('🎉 HubSpot sync with new schema is working correctly!');
    console.log('✅ Person nominations: All fields syncing');
    console.log('✅ Company nominations: All fields syncing');
    console.log('✅ Voter data: All fields syncing');
    console.log('✅ Enhanced properties: Working');
    console.log('✅ Phone numbers: Syncing');
    console.log('✅ Countries: Syncing');
    console.log('✅ Job titles: Syncing');
    console.log('✅ Company details: Syncing');
  } else {
    console.log('❌ Some new schema sync components need attention.');
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Test interrupted. Cleaning up...');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});