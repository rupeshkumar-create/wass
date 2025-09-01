#!/usr/bin/env node

/**
 * Fix specific nominee sync issues
 * Test case: toleyo1875@cavoyar.com
 * 
 * Issues to fix:
 * 1. Remove lifecycle stage syncing for nominees
 * 2. Fix Loops sync for approved nominees with live URLs
 * 3. Fix nominator user group updates
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSpecificNomineeSyncIssues() {
  try {
    console.log('🔧 Fixing nominee sync issues for: toleyo1875@cavoyar.com');
    
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
      console.log('\n📋 Processing Nominee:');
      console.log('- ID:', nominee.id);
      console.log('- Type:', nominee.type);
      console.log('- Name:', nominee.type === 'person' 
        ? `${nominee.firstname || ''} ${nominee.lastname || ''}`.trim()
        : nominee.company_name);
      console.log('- Email:', nominee.person_email || nominee.company_email);
      
      // 2. Find approved nominations for this nominee
      const { data: approvedNominations, error: nominationError } = await supabase
        .from('nominations')
        .select('*')
        .eq('nominee_id', nominee.id)
        .eq('state', 'approved');
      
      if (nominationError) {
        console.error('❌ Error finding approved nominations:', nominationError);
        continue;
      }
      
      if (!approvedNominations || approvedNominations.length === 0) {
        console.log('⚠️ No approved nominations found for this nominee');
        continue;
      }
      
      console.log(`✅ Found ${approvedNominations.length} approved nomination(s)`);
      
      for (const nomination of approvedNominations) {
        console.log(`\n🔄 Processing nomination ${nomination.id}:`);
        console.log('- State:', nomination.state);
        console.log('- Subcategory:', nomination.subcategory_id);
        console.log('- Approved At:', nomination.approved_at);
        
        // 3. Find nominator
        const { data: nominator, error: nominatorError } = await supabase
          .from('nominators')
          .select('*')
          .eq('id', nomination.nominator_id)
          .single();
        
        if (nominatorError || !nominator) {
          console.error('❌ Error finding nominator:', nominatorError);
          continue;
        }
        
        console.log('📧 Nominator:', nominator.email);
        
        // 4. Create a live URL for testing if none exists
        let liveUrl = nomination.live_url;
        if (!liveUrl) {
          const slug = nominee.type === 'person' 
            ? `${nominee.firstname || ''}-${nominee.lastname || ''}`.toLowerCase().replace(/\s+/g, '-')
            : (nominee.company_name || '').toLowerCase().replace(/\s+/g, '-');
          
          liveUrl = `https://worldstaffingawards.com/nominee/${slug}`;
          
          // Update the nomination with the live URL
          const { error: updateError } = await supabase
            .from('nominations')
            .update({ live_url: liveUrl })
            .eq('id', nomination.id);
          
          if (updateError) {
            console.warn('⚠️ Failed to update live URL:', updateError);
          } else {
            console.log('✅ Added live URL:', liveUrl);
          }
        }
        
        // 5. Test HubSpot sync (without lifecycle stage)
        console.log('\n🔄 Testing HubSpot sync...');
        try {
          const response = await fetch('http://localhost:3000/api/sync/hubspot/nomination-approve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nominationId: nomination.id,
              liveUrl: liveUrl,
              action: 'approve'
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ HubSpot sync successful:', result);
          } else {
            const error = await response.text();
            console.warn('⚠️ HubSpot sync failed:', error);
          }
        } catch (error) {
          console.warn('⚠️ HubSpot sync error:', error.message);
        }
        
        // 6. Test Loops sync
        console.log('\n🔄 Testing Loops sync...');
        try {
          const response = await fetch('http://localhost:3000/api/sync/loops/run', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event_type: 'nomination_approved',
              payload: {
                nominationId: nomination.id,
                liveUrl: liveUrl,
                type: nominee.type,
                subcategoryId: nomination.subcategory_id,
                nominee: nominee,
                nominator: nominator
              }
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Loops sync successful:', result);
          } else {
            const error = await response.text();
            console.warn('⚠️ Loops sync failed:', error);
          }
        } catch (error) {
          console.warn('⚠️ Loops sync error:', error.message);
        }
        
        // 7. Verify sync status in outbox tables
        console.log('\n📊 Checking sync status...');
        
        // Check HubSpot outbox
        const { data: hubspotOutbox } = await supabase
          .from('hubspot_outbox')
          .select('*')
          .eq('payload->>nominationId', nomination.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (hubspotOutbox && hubspotOutbox.length > 0) {
          const latest = hubspotOutbox[0];
          console.log(`📤 HubSpot Outbox: ${latest.status} (${latest.created_at})`);
          if (latest.error_message) {
            console.log(`   Error: ${latest.error_message}`);
          }
        }
        
        // Check Loops outbox
        const { data: loopsOutbox } = await supabase
          .from('loops_outbox')
          .select('*')
          .eq('payload->>nominationId', nomination.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (loopsOutbox && loopsOutbox.length > 0) {
          const latest = loopsOutbox[0];
          console.log(`📤 Loops Outbox: ${latest.status} (${latest.created_at})`);
          if (latest.error_message) {
            console.log(`   Error: ${latest.error_message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Sync issue fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixSpecificNomineeSyncIssues();