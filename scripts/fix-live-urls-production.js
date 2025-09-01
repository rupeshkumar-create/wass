#!/usr/bin/env node

/**
 * Fix live URLs to use production domain consistently
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const PRODUCTION_DOMAIN = 'https://wass-steel.vercel.app';

async function fixLiveUrls() {
  console.log('🔧 Fixing Live URLs for Production...\n');

  try {
    // 1. Update nominees table
    console.log('1️⃣ Updating nominees live URLs...');
    
    // Get all nominees that need URL updates
    const { data: nomineesToUpdate, error: fetchError } = await supabase
      .from('nominees')
      .select('id, live_url')
      .or(`live_url.is.null,live_url.eq.,live_url.like.%localhost%,live_url.like.%worldstaffingawards.com%,live_url.like.%world-staffing-awards.vercel.app%`);

    if (fetchError) {
      console.error('❌ Error fetching nominees:', fetchError.message);
      return;
    }

    console.log(`📋 Found ${nomineesToUpdate?.length || 0} nominees to update`);

    // Update each nominee individually
    let updateCount = 0;
    for (const nominee of nomineesToUpdate || []) {
      const newUrl = `${PRODUCTION_DOMAIN}/nominee/${nominee.id}`;
      const { error: individualUpdateError } = await supabase
        .from('nominees')
        .update({ live_url: newUrl })
        .eq('id', nominee.id);

      if (!individualUpdateError) {
        updateCount++;
      } else {
        console.error(`❌ Error updating ${nominee.id}:`, individualUpdateError.message);
      }
    }

    console.log(`✅ Updated ${updateCount} nominee URLs`);

    if (updateError) {
      console.error('❌ Error updating nominees:', updateError.message);
    } else {
      console.log(`✅ Updated ${updatedNominees?.length || 0} nominee URLs`);
    }

    // 2. Check current URLs
    console.log('\n2️⃣ Checking current live URLs...');
    const { data: allNominees, error: checkError } = await supabase
      .from('nominees')
      .select('id, live_url')
      .limit(5);

    if (!checkError && allNominees) {
      console.log('📋 Sample URLs:');
      allNominees.forEach(nominee => {
        console.log(`   - ${nominee.id}: ${nominee.live_url}`);
      });
    }

    // 3. Update HubSpot outbox
    console.log('\n3️⃣ Updating HubSpot outbox URLs...');
    
    // Get HubSpot entries that need updating
    const { data: hubspotEntries, error: hubspotFetchError } = await supabase
      .from('hubspot_outbox')
      .select('id, payload')
      .in('event_type', ['nomination_submitted', 'nomination_approved'])
      .not('payload->nomineeId', 'is', null);

    if (!hubspotFetchError && hubspotEntries) {
      let hubspotUpdateCount = 0;
      for (const entry of hubspotEntries) {
        const nomineeId = entry.payload?.nomineeId;
        if (nomineeId) {
          const updatedPayload = {
            ...entry.payload,
            liveUrl: `${PRODUCTION_DOMAIN}/nominee/${nomineeId}`
          };
          
          const { error: updateError } = await supabase
            .from('hubspot_outbox')
            .update({ payload: updatedPayload })
            .eq('id', entry.id);

          if (!updateError) {
            hubspotUpdateCount++;
          }
        }
      }
      console.log(`✅ Updated ${hubspotUpdateCount} HubSpot outbox entries`);
    }

    // 4. Check if loops_outbox exists and update
    console.log('\n4️⃣ Checking Loops outbox...');
    const { data: loopsExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'loops_outbox')
      .single();

    if (loopsExists) {
      // Get Loops entries that need updating
      const { data: loopsEntries, error: loopsFetchError } = await supabase
        .from('loops_outbox')
        .select('id, payload')
        .in('event_type', ['nomination_submitted', 'nomination_approved'])
        .not('payload->nomineeId', 'is', null);

      if (!loopsFetchError && loopsEntries) {
        let loopsUpdateCount = 0;
        for (const entry of loopsEntries) {
          const nomineeId = entry.payload?.nomineeId;
          if (nomineeId) {
            const updatedPayload = {
              ...entry.payload,
              liveUrl: `${PRODUCTION_DOMAIN}/nominee/${nomineeId}`
            };
            
            const { error: updateError } = await supabase
              .from('loops_outbox')
              .update({ payload: updatedPayload })
              .eq('id', entry.id);

            if (!updateError) {
              loopsUpdateCount++;
            }
          }
        }
        console.log(`✅ Updated ${loopsUpdateCount} Loops outbox entries`);
      }
    } else {
      console.log('ℹ️  Loops outbox table not found, skipping');
    }

    // 5. Verification
    console.log('\n5️⃣ Verification...');
    const { data: verification, error: verifyError } = await supabase
      .from('nominees')
      .select('live_url')
      .like('live_url', `${PRODUCTION_DOMAIN}%`);

    if (!verifyError) {
      console.log(`✅ ${verification?.length || 0} nominees have production URLs`);
    }

    console.log('\n🎉 Live URL fix completed!');
    console.log(`🔗 Production domain: ${PRODUCTION_DOMAIN}`);
    console.log('📱 URLs should now work correctly in production');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixLiveUrls().catch(console.error);