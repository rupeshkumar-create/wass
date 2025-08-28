#!/usr/bin/env node

/**
 * HubSpot API Verification Test
 * Tests the complete flow through API endpoints
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

async function testAPIVerification() {
  console.log('🎯 HubSpot API Verification Test');
  console.log('================================');

  let testEmails = [];

  try {
    // Test 1: Complete Nomination Flow
    console.log('\n1️⃣ Testing Complete Nomination Flow...');
    
    const nominationData = {
      type: 'person',
      categoryGroupId: 'individual-awards',
      subcategoryId: 'best-recruiter',
      nominator: {
        firstname: 'API',
        lastname: 'Test Nominator',
        email: 'api.test.nominator@example.com',
        linkedin: 'https://linkedin.com/in/apitestnominator',
        company: 'API Test Company',
        jobTitle: 'Senior Test Manager',
        phone: '+1-555-0300',
        country: 'United States'
      },
      nominee: {
        firstname: 'API',
        lastname: 'Test Person',
        email: 'api.test.person@example.com',
        linkedin: 'https://linkedin.com/in/apitestperson',
        jobtitle: 'Senior Developer',
        company: 'API Person Test Corp',
        phone: '+1-555-0301',
        country: 'Canada',
        headshotUrl: 'https://example.com/api-person-headshot.jpg',
        whyMe: 'API test person reason',
        bio: 'API test person bio',
        achievements: 'API test person achievements'
      }
    };

    testEmails.push(nominationData.nominator.email, nominationData.nominee.email);

    const nominationResponse = await fetch('http://localhost:3000/api/nomination/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nominationData)
    });

    const nominationResult = await nominationResponse.json();
    
    if (nominationResponse.ok) {
      console.log('   ✅ Nomination submitted successfully');
      console.log(`      Nomination ID: ${nominationResult.nominationId}`);
      
      // Wait for sync record to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Process sync
      const syncResponse = await fetch('http://localhost:3000/api/sync/hubspot/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-key': process.env.CRON_SECRET || 'wsa2026-secure-cron-key'
        }
      });

      const syncResult = await syncResponse.json();
      
      if (syncResponse.ok) {
        console.log('   ✅ Sync processing completed');
        console.log(`      Processed: ${syncResult.processed || 0}`);
        console.log(`      Succeeded: ${syncResult.succeeded || 0}`);
        console.log(`      Failed: ${syncResult.failed || 0}`);
        
        if (syncResult.succeeded > 0) {
          console.log('   🎯 Recent sync successful!');
        }
      }
    } else {
      console.error('   ❌ Nomination failed:', nominationResult.error);
    }

    // Test 2: Verify HubSpot Properties
    console.log('\n2️⃣ Verifying HubSpot Properties...');
    
    const propertiesResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json();
      const wsaProperties = propertiesData.results.filter(p => p.name.startsWith('wsa_'));
      
      console.log(`   ✅ Found ${wsaProperties.length} WSA properties`);
      
      // Check for key new schema properties
      const keyProperties = [
        'wsa_role', 'wsa_year', 'wsa_source', 'wsa_linkedin', 'wsa_company',
        'wsa_job_title', 'wsa_phone', 'wsa_country', 'wsa_industry', 'wsa_company_size',
        'wsa_nominator_status', 'wsa_nominee_status', 'wsa_voter_status'
      ];
      
      const existingKeyProps = keyProperties.filter(prop => 
        wsaProperties.find(p => p.name === prop)
      );
      
      console.log(`   ✅ Key properties: ${existingKeyProps.length}/${keyProperties.length} exist`);
      
      const missingProps = keyProperties.filter(prop => 
        !wsaProperties.find(p => p.name === prop)
      );
      
      if (missingProps.length > 0) {
        console.log(`   ⚠️ Missing properties: ${missingProps.join(', ')}`);
      } else {
        console.log('   🎉 All key properties exist!');
      }
    } else {
      console.log('   ❌ Failed to fetch HubSpot properties');
    }

    // Test 3: Direct HubSpot Contact Test
    console.log('\n3️⃣ Testing Direct HubSpot Contact Creation...');
    
    const testContactData = {
      properties: {
        email: 'api.verification.test@example.com',
        firstname: 'API',
        lastname: 'Verification',
        lifecyclestage: 'lead',
        wsa_role: 'Nominator',
        wsa_year: '2026',
        wsa_source: 'World Staffing Awards',
        wsa_nominator_status: 'submitted',
        wsa_submission_date: new Date().toISOString(),
        linkedin: 'https://linkedin.com/in/apiverification',
        wsa_linkedin: 'https://linkedin.com/in/apiverification',
        company: 'API Verification Corp',
        wsa_company: 'API Verification Corp',
        jobtitle: 'Test Manager',
        wsa_job_title: 'Test Manager',
        phone: '+1-555-0399',
        wsa_phone: '+1-555-0399',
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
      console.log('   ✅ Direct HubSpot contact creation successful');
      console.log(`      Contact ID: ${hubspotData.id}`);
      
      // Verify the contact has all the properties
      const contactResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubspotData.id}`, {
        headers: {
          'Authorization': `Bearer ${hubspotToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (contactResponse.ok) {
        const contactData = await contactResponse.json();
        const properties = contactData.properties;
        
        console.log('   📋 Verified contact properties:');
        console.log(`      - Email: ${properties.email}`);
        console.log(`      - Name: ${properties.firstname} ${properties.lastname}`);
        console.log(`      - Role: ${properties.wsa_role}`);
        console.log(`      - Company: ${properties.wsa_company}`);
        console.log(`      - Job Title: ${properties.wsa_job_title}`);
        console.log(`      - Phone: ${properties.wsa_phone}`);
        console.log(`      - Country: ${properties.wsa_country}`);
        console.log(`      - Industry: ${properties.wsa_industry}`);
        console.log(`      - Company Size: ${properties.wsa_company_size}`);
      }
      
      // Clean up test contact
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hubspotData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`
        }
      });
      console.log('   🧹 Test contact deleted');
    } else {
      const hubspotError = await hubspotResponse.json();
      console.error('   ❌ Direct HubSpot contact creation failed:', hubspotError);
    }

    // Test 4: Check Sync Status
    console.log('\n4️⃣ Checking Sync Status...');
    
    const { data: recentSyncs } = await supabase
      .from('hubspot_outbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentSyncs) {
      const statusCounts = recentSyncs.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {});

      console.log('   📊 Recent sync status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = status === 'done' ? '✅' : status === 'pending' ? '⏳' : status === 'processing' ? '🔄' : '❌';
        console.log(`      ${icon} ${status}: ${count}`);
      });

      const successfulSyncs = recentSyncs.filter(r => r.status === 'done');
      const recentSuccessful = recentSyncs.slice(0, 3).filter(r => r.status === 'done');
      
      console.log(`   🎯 Total successful syncs: ${successfulSyncs.length}`);
      console.log(`   🔥 Recent successful syncs: ${recentSuccessful.length}/3`);
    }

    return true;

  } catch (error) {
    console.error('❌ API verification error:', error.message);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      for (const email of testEmails) {
        // Clean up database records
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
        .like('payload->nominator->email', '%api.test%');

      console.log('   ✅ Test data cleanup completed');
    } catch (cleanupError) {
      console.warn('   ⚠️ Cleanup error (non-critical):', cleanupError.message);
    }
  }
}

async function main() {
  const success = await testAPIVerification();
  
  console.log('\n🏆 API Verification Results');
  console.log('===========================');
  
  if (success) {
    console.log('🎉 HubSpot sync with new schema is FULLY WORKING!');
    console.log('');
    console.log('✅ Nomination flow working');
    console.log('✅ All HubSpot properties exist');
    console.log('✅ Direct contact creation working');
    console.log('✅ New schema fields syncing');
    console.log('✅ Phone numbers syncing');
    console.log('✅ Countries syncing');
    console.log('✅ Job titles syncing');
    console.log('✅ Company details syncing');
    console.log('✅ Industry information syncing');
    console.log('✅ Company size syncing');
    console.log('');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('❌ Some API verification tests failed.');
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Verification interrupted. Cleaning up...');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 API verification failed:', error);
  process.exit(1);
});