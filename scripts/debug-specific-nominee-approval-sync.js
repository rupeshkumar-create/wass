#!/usr/bin/env node

/**
 * Debug specific nominee approval sync issues
 * Test case: toleyo1875@cavoyar.com
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSpecificNomineeApprovalSync() {
  try {
    console.log('🔍 Debugging nominee approval sync for: toleyo1875@cavoyar.com');
    
    // 1. Find the nominee
    const { data: nominees, error: nomineeError } = await supabase
      .from('nominees')
      .select('*')
      .or('person_email.eq.toleyo1875@cavoyar.com,company_email.eq.toleyo1875@cavoyar.com');
    
    if (nomineeError) {
      console.error('❌ Error finding nominee:', nomineeError);
      return;
    }
    
    if (!nominees || nominees.length === 0) {
      console.log('❌ No nominee found with email: toleyo1875@cavoyar.com');
      return;
    }
    
    console.log('✅ Found nominee(s):', nominees.length);
    
    for (const nominee of nominees) {
      console.log('\n📋 Nominee Details:');
      console.log('- ID:', nominee.id);
      console.log('- Type:', nominee.type);
      console.log('- Name:', nominee.type === 'person' 
        ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
        : nominee.company_name);
      console.log('- Email:', nominee.person_email || nominee.company_email);
      console.log('- Created:', nominee.created_at);
      
      // 2. Find related nominations
      const { data: nominations, error: nominationError } = await supabase
        .from('nominations')
        .select('*')
        .eq('nominee_id', nominee.id);
      
      if (nominationError) {
        console.error('❌ Error finding nominations:', nominationError);
        continue;
      }
      
      console.log('\n📝 Related Nominations:', nominations?.length || 0);
      
      if (nominations && nominations.length > 0) {
        for (const nomination of nominations) {
          console.log(`\n  Nomination ${nomination.id}:`);
          console.log('  - State:', nomination.state);
          console.log('  - Subcategory:', nomination.subcategory_id);
          console.log('  - Approved At:', nomination.approved_at);
          console.log('  - Live URL:', nomination.live_url);
          
          // 3. Find nominator
          const { data: nominator, error: nominatorError } = await supabase
            .from('nominators')
            .select('*')
            .eq('id', nomination.nominator_id)
            .single();
          
          if (nominatorError) {
            console.error('  ❌ Error finding nominator:', nominatorError);
          } else if (nominator) {
            console.log('  📧 Nominator:', nominator.email);
            console.log('  📊 Nominator Status:', nominator.status);
          }
          
          // 4. Check HubSpot sync status
          const { data: hubspotOutbox, error: hubspotError } = await supabase
            .from('hubspot_outbox')
            .select('*')
            .eq('payload->>nominationId', nomination.id)
            .eq('event_type', 'nomination_approved');
          
          if (!hubspotError && hubspotOutbox) {
            console.log('  🔄 HubSpot Outbox Entries:', hubspotOutbox.length);
            hubspotOutbox.forEach((entry, index) => {
              console.log(`    ${index + 1}. Status: ${entry.status}, Created: ${entry.created_at}`);
              if (entry.error_message) {
                console.log(`       Error: ${entry.error_message}`);
              }
            });
          }
          
          // 5. Check Loops sync status
          const { data: loopsOutbox, error: loopsError } = await supabase
            .from('loops_outbox')
            .select('*')
            .eq('payload->>nominationId', nomination.id)
            .eq('event_type', 'nomination_approved');
          
          if (!loopsError && loopsOutbox) {
            console.log('  🔄 Loops Outbox Entries:', loopsOutbox.length);
            loopsOutbox.forEach((entry, index) => {
              console.log(`    ${index + 1}. Status: ${entry.status}, Created: ${entry.created_at}`);
              if (entry.error_message) {
                console.log(`       Error: ${entry.error_message}`);
              }
            });
          }
        }
      }
    }
    
    // 6. Test current sync functions
    console.log('\n🧪 Testing current sync functions...');
    
    // Test HubSpot sync
    try {
      const { syncNomineeToHubSpot } = require('../src/server/hubspot/realtime-sync.ts');
      console.log('✅ HubSpot sync module loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load HubSpot sync module:', error.message);
    }
    
    // Test Loops sync
    try {
      const { syncNomineeToLoops, updateNominatorToLive } = require('../src/server/loops/realtime-sync.ts');
      console.log('✅ Loops sync module loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Loops sync module:', error.message);
    }
    
    // 7. Check environment variables
    console.log('\n🔧 Environment Check:');
    console.log('- HUBSPOT_ACCESS_TOKEN:', process.env.HUBSPOT_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('- LOOPS_API_KEY:', process.env.LOOPS_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('- LOOPS_SYNC_ENABLED:', process.env.LOOPS_SYNC_ENABLED);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugSpecificNomineeApprovalSync();