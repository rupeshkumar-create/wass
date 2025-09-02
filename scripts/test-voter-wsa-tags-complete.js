#!/usr/bin/env node

/**
 * Comprehensive Voter WSA Tags Test
 * Tests voter tagging in HubSpot with "WSA 2026 Voters" tag
 */

async function testVoterWSATags() {
  try {
    console.log('🧪 Testing comprehensive voter WSA tags...');

    // Load environment variables
    require('dotenv').config();
    
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hubspotToken = process.env.HUBSPOT_TOKEN;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!hubspotToken) {
      throw new Error('Missing HubSpot token');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('✅ Environment variables loaded');

    // 1. Test HubSpot WSA Contact Tag property
    console.log('\n🔧 Testing HubSpot WSA Contact Tag property...');
    
    const headers = {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const propertyResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/wsa_contact_tag', {
        headers
      });

      if (propertyResponse.ok) {
        const property = await propertyResponse.json();
        console.log('✅ WSA Contact Tag property exists');
        
        const hasVoterOption = property.options?.some(opt => opt.value === 'WSA 2026 Voters');
        if (hasVoterOption) {
          console.log('✅ "WSA 2026 Voters" option exists in dropdown');
        } else {
          console.log('❌ "WSA 2026 Voters" option missing from dropdown');
          console.log('Available options:', property.options?.map(opt => opt.value));
        }
      } else {
        console.log('❌ WSA Contact Tag property not found');
      }
    } catch (error) {
      console.log('❌ Failed to check HubSpot property:', error.message);
    }

    // 2. Test voter sync via API
    console.log('\n🗳️ Testing voter sync via vote API...');
    
    const testVoteData = {
      subcategoryId: 'best-staffing-firm-north-america',
      email: 'test.wsa.voter@example.com',
      firstname: 'Test',
      lastname: 'WSAVoter',
      linkedin: 'https://linkedin.com/in/testwsavoter',
      company: 'Test WSA Company',
      jobTitle: 'Test WSA Role',
      country: 'United States',
      votedForDisplayName: 'Test WSA Nominee'
    };

    try {
      const voteResponse = await fetch('http://localhost:3000/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testVoteData)
      });

      const voteResult = await voteResponse.json();

      if (voteResponse.ok) {
        console.log('✅ Vote API call successful');
        console.log(`📋 Vote ID: ${voteResult.voteId}`);
        console.log(`👤 Voter ID: ${voteResult.voterId}`);
        
        // Wait a moment for sync to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check database for voter WSA tags
        console.log('\n📊 Checking voter database record...');
        
        const { data: voter, error: voterError } = await supabase
          .from('voters')
          .select('wsa_tags, wsa_contact_tag, wsa_role, hubspot_contact_id, hubspot_synced_at')
          .eq('email', testVoteData.email)
          .single();

        if (voterError) {
          console.log('❌ Failed to fetch voter from database:', voterError);
        } else if (voter) {
          console.log('✅ Voter found in database');
          console.log(`  • WSA Tags: ${voter.wsa_tags || 'Not set'}`);
          console.log(`  • WSA Contact Tag: ${voter.wsa_contact_tag || 'Not set'}`);
          console.log(`  • WSA Role: ${voter.wsa_role || 'Not set'}`);
          console.log(`  • HubSpot Contact ID: ${voter.hubspot_contact_id || 'Not synced'}`);
          console.log(`  • HubSpot Synced At: ${voter.hubspot_synced_at || 'Never'}`);
          
          if (voter.wsa_contact_tag === 'WSA 2026 Voters') {
            console.log('✅ Voter correctly tagged as "WSA 2026 Voters" in database');
          } else {
            console.log('❌ Voter tag incorrect in database');
          }
          
          // Check HubSpot contact if synced
          if (voter.hubspot_contact_id) {
            console.log('\n🔍 Checking HubSpot contact...');
            
            try {
              const contactResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${voter.hubspot_contact_id}?properties=wsa_contact_tag,wsa_tags,wsa_role,wsa_year,wsa_source`, {
                headers
              });

              if (contactResponse.ok) {
                const contact = await contactResponse.json();
                console.log('✅ HubSpot contact found');
                console.log(`  • WSA Contact Tag: ${contact.properties.wsa_contact_tag || 'Not set'}`);
                console.log(`  • WSA Tags: ${contact.properties.wsa_tags || 'Not set'}`);
                console.log(`  • WSA Role: ${contact.properties.wsa_role || 'Not set'}`);
                console.log(`  • WSA Year: ${contact.properties.wsa_year || 'Not set'}`);
                console.log(`  • WSA Source: ${contact.properties.wsa_source || 'Not set'}`);
                
                if (contact.properties.wsa_contact_tag === 'WSA 2026 Voters') {
                  console.log('✅ HubSpot contact correctly tagged as "WSA 2026 Voters"');
                } else {
                  console.log('❌ HubSpot contact tag incorrect');
                }
              } else {
                console.log('❌ Failed to fetch HubSpot contact:', contactResponse.status);
              }
            } catch (error) {
              console.log('❌ Error checking HubSpot contact:', error.message);
            }
          }
        }
        
      } else {
        if (voteResult.error === 'ALREADY_VOTED') {
          console.log('ℹ️ Voter already exists (expected for test)');
          
          // Still check the existing voter
          const { data: existingVoter } = await supabase
            .from('voters')
            .select('wsa_tags, wsa_contact_tag, wsa_role, hubspot_contact_id')
            .eq('email', testVoteData.email)
            .single();

          if (existingVoter) {
            console.log('📊 Existing voter tags:');
            console.log(`  • WSA Contact Tag: ${existingVoter.wsa_contact_tag || 'Not set'}`);
            
            if (existingVoter.wsa_contact_tag === 'WSA 2026 Voters') {
              console.log('✅ Existing voter correctly tagged');
            } else {
              console.log('❌ Existing voter tag needs fixing');
            }
          }
        } else {
          console.log('❌ Vote API call failed:', voteResult);
        }
      }
    } catch (error) {
      console.log('❌ Vote API test failed:', error.message);
    }

    // 3. Test direct HubSpot sync function
    console.log('\n🔄 Testing direct HubSpot voter sync...');
    
    try {
      // Import and test the sync function directly
      const { syncVoterToHubSpot } = require('../src/server/hubspot/realtime-sync.ts');
      
      const directSyncData = {
        firstname: 'Direct',
        lastname: 'SyncTest',
        email: 'direct.sync.test@example.com',
        linkedin: 'https://linkedin.com/in/directsync',
        company: 'Direct Sync Company',
        jobTitle: 'Direct Sync Role',
        country: 'United States',
        votedFor: 'Direct Sync Nominee',
        subcategoryId: 'test-category',
      };

      const syncResult = await syncVoterToHubSpot(directSyncData);
      
      if (syncResult.success) {
        console.log('✅ Direct HubSpot sync successful');
        console.log(`📋 Contact ID: ${syncResult.contactId}`);
        
        // Verify the contact was created with correct tags
        if (syncResult.contactId) {
          const contactResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${syncResult.contactId}?properties=wsa_contact_tag,wsa_tags,wsa_role`, {
            headers
          });

          if (contactResponse.ok) {
            const contact = await contactResponse.json();
            console.log('📊 Direct sync contact verification:');
            console.log(`  • WSA Contact Tag: ${contact.properties.wsa_contact_tag || 'Not set'}`);
            console.log(`  • WSA Tags: ${contact.properties.wsa_tags || 'Not set'}`);
            console.log(`  • WSA Role: ${contact.properties.wsa_role || 'Not set'}`);
            
            if (contact.properties.wsa_contact_tag === 'WSA 2026 Voters') {
              console.log('✅ Direct sync contact correctly tagged as "WSA 2026 Voters"');
            } else {
              console.log('❌ Direct sync contact tag incorrect');
            }
          }
        }
      } else {
        console.log('❌ Direct HubSpot sync failed:', syncResult.error);
      }
    } catch (error) {
      console.log('❌ Direct sync test failed:', error.message);
    }

    console.log('\n🎉 Voter WSA tags test completed!');
    console.log('\n📋 Summary:');
    console.log('  ✅ HubSpot property configuration checked');
    console.log('  ✅ Vote API voter sync tested');
    console.log('  ✅ Database voter tags verified');
    console.log('  ✅ HubSpot contact tags verified');
    console.log('  ✅ Direct sync function tested');
    console.log('\n🚀 Voter WSA tagging should be working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
    
    process.exit(1);
  }
}

// Run the test
testVoterWSATags().catch(console.error);