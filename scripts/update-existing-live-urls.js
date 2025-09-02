#!/usr/bin/env node

/**
 * Script to update existing approved nominations with live URLs
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

async function updateExistingLiveUrls() {
  console.log('🔧 Updating Existing Approved Nominations with Live URLs\n');

  try {
    // 1. Get all approved nominations without live URLs
    console.log('1. Finding approved nominations without live URLs...');
    
    const { data: nominations, error: fetchError } = await supabase
      .from('nominations')
      .select(`
        id,
        type,
        firstname,
        lastname,
        company_name,
        live_url,
        state
      `)
      .eq('state', 'approved')
      .or('live_url.is.null,live_url.eq.');

    if (fetchError) throw fetchError;

    console.log(`Found ${nominations?.length || 0} approved nominations without live URLs`);

    if (!nominations || nominations.length === 0) {
      console.log('✅ All approved nominations already have live URLs!');
      return;
    }

    // 2. Update each nomination with a generated live URL
    console.log('\n2. Generating and assigning live URLs...');
    
    let updated = 0;
    let skipped = 0;

    for (const nomination of nominations) {
      // Generate display name
      const displayName = nomination.type === 'person' 
        ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
        : nomination.company_name || '';

      if (!displayName) {
        console.log(`⚠️ Skipping nomination ${nomination.id} - no display name`);
        skipped++;
        continue;
      }

      // Generate URL slug
      const slug = generateSlug(displayName);
      const liveUrl = `https://worldstaffingawards.com/nominee/${slug}`;

      // Update the nomination
      const { error: updateError } = await supabase
        .from('nominations')
        .update({ live_url: liveUrl })
        .eq('id', nomination.id);

      if (updateError) {
        console.error(`❌ Failed to update ${displayName}:`, updateError.message);
      } else {
        console.log(`✅ ${displayName} → ${liveUrl}`);
        updated++;
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`• Updated: ${updated} nominations`);
    console.log(`• Skipped: ${skipped} nominations`);

    // 3. Verify the updates
    console.log('\n3. Verifying updates...');
    
    const { data: verifyNominations, error: verifyError } = await supabase
      .from('nominations')
      .select('id, type, firstname, lastname, company_name, live_url')
      .eq('state', 'approved')
      .not('live_url', 'is', null);

    if (verifyError) throw verifyError;

    console.log(`✅ ${verifyNominations?.length || 0} approved nominations now have live URLs:`);
    
    verifyNominations?.forEach(nom => {
      const displayName = nom.type === 'person' 
        ? `${nom.firstname || ''} ${nom.lastname || ''}`.trim()
        : nom.company_name || '';
      console.log(`• ${displayName}: ${nom.live_url}`);
    });

    console.log('\n🎉 Live URL update completed successfully!');

  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

// Run the update
updateExistingLiveUrls();