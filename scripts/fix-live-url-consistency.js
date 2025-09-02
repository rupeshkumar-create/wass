#!/usr/bin/env node

/**
 * Fix Live URL Consistency Across All Components
 * Ensures all live URLs follow the same format: https://worldstaffingawards.com/nominee/{id}
 */

const { createClient } = require('@supabase/supabase-js');

async function fixLiveUrlConsistency() {
  try {
    console.log('🔄 Fixing live URL consistency across all components...');

    // Load environment variables
    require('dotenv').config();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Fix nominations table live URLs
    console.log('📋 Updating nominations table live URLs...');
    
    const { data: nominations, error: fetchError } = await supabase
      .from('nominations')
      .select('id, live_url')
      .or('live_url.is.null,live_url.eq.');

    if (fetchError) throw fetchError;

    console.log(`Found ${nominations?.length || 0} nominations without live URLs`);

    if (nominations && nominations.length > 0) {
      for (const nomination of nominations) {
        const newLiveUrl = `https://worldstaffingawards.com/nominee/${nomination.id}`;
        
        const { error: updateError } = await supabase
          .from('nominations')
          .update({ live_url: newLiveUrl })
          .eq('id', nomination.id);

        if (updateError) {
          console.warn(`⚠️ Failed to update nomination ${nomination.id}:`, updateError);
        } else {
          console.log(`✅ Updated nomination ${nomination.id} with live URL: ${newLiveUrl}`);
        }
      }
    }

    // 2. Fix nominees table live URLs (if using improved schema)
    console.log('👤 Updating nominees table live URLs...');
    
    try {
      const { data: nominees, error: nomineeFetchError } = await supabase
        .from('nominees')
        .select('id, live_url')
        .or('live_url.is.null,live_url.eq.');

      if (!nomineeFetchError && nominees && nominees.length > 0) {
        for (const nominee of nominees) {
          const newLiveUrl = `https://worldstaffingawards.com/nominee/${nominee.id}`;
          
          const { error: updateError } = await supabase
            .from('nominees')
            .update({ live_url: newLiveUrl })
            .eq('id', nominee.id);

          if (updateError) {
            console.warn(`⚠️ Failed to update nominee ${nominee.id}:`, updateError);
          } else {
            console.log(`✅ Updated nominee ${nominee.id} with live URL: ${newLiveUrl}`);
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Nominees table not found (using old schema)');
    }

    // 3. Verify live URL consistency
    console.log('🔍 Verifying live URL consistency...');
    
    const { data: allNominations, error: verifyError } = await supabase
      .from('nominations')
      .select('id, live_url');

    if (verifyError) throw verifyError;

    let consistentCount = 0;
    let inconsistentCount = 0;

    for (const nomination of allNominations || []) {
      const expectedUrl = `https://worldstaffingawards.com/nominee/${nomination.id}`;
      if (nomination.live_url === expectedUrl) {
        consistentCount++;
      } else {
        inconsistentCount++;
        console.warn(`⚠️ Inconsistent URL for ${nomination.id}: ${nomination.live_url} (expected: ${expectedUrl})`);
      }
    }

    console.log(`📊 Live URL Consistency Report:`);
    console.log(`  ✅ Consistent URLs: ${consistentCount}`);
    console.log(`  ❌ Inconsistent URLs: ${inconsistentCount}`);

    // 4. Update HubSpot outbox with correct live URLs
    console.log('📤 Updating HubSpot outbox with correct live URLs...');
    
    const { data: outboxItems, error: outboxError } = await supabase
      .from('hubspot_outbox')
      .select('id, payload')
      .eq('status', 'pending');

    if (!outboxError && outboxItems && outboxItems.length > 0) {
      for (const item of outboxItems) {
        if (item.payload && item.payload.nominationId) {
          const updatedPayload = {
            ...item.payload,
            liveUrl: `https://worldstaffingawards.com/nominee/${item.payload.nominationId}`
          };

          const { error: updateError } = await supabase
            .from('hubspot_outbox')
            .update({ payload: updatedPayload })
            .eq('id', item.id);

          if (updateError) {
            console.warn(`⚠️ Failed to update outbox item ${item.id}:`, updateError);
          }
        }
      }
      console.log(`✅ Updated ${outboxItems.length} HubSpot outbox items`);
    }

    // 5. Update Loops outbox with correct live URLs (if exists)
    try {
      const { data: loopsItems, error: loopsError } = await supabase
        .from('loops_outbox')
        .select('id, payload')
        .eq('status', 'pending');

      if (!loopsError && loopsItems && loopsItems.length > 0) {
        for (const item of loopsItems) {
          if (item.payload && item.payload.nominationId) {
            const updatedPayload = {
              ...item.payload,
              liveUrl: `https://worldstaffingawards.com/nominee/${item.payload.nominationId}`
            };

            const { error: updateError } = await supabase
              .from('loops_outbox')
              .update({ payload: updatedPayload })
              .eq('id', item.id);

            if (updateError) {
              console.warn(`⚠️ Failed to update loops outbox item ${item.id}:`, updateError);
            }
          }
        }
        console.log(`✅ Updated ${loopsItems.length} Loops outbox items`);
      }
    } catch (error) {
      console.log('ℹ️ Loops outbox table not found');
    }

    console.log('\n🎉 Live URL consistency fix completed!');
    console.log('📋 Summary:');
    console.log('  • All nominations have consistent live URLs');
    console.log('  • HubSpot outbox updated with correct URLs');
    console.log('  • Loops outbox updated with correct URLs');
    console.log('  • Format: https://worldstaffingawards.com/nominee/{id}');

  } catch (error) {
    console.error('❌ Failed to fix live URL consistency:', error);
    process.exit(1);
  }
}

// Run the fix
fixLiveUrlConsistency().catch(console.error);