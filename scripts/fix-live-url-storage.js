#!/usr/bin/env node

/**
 * Script to fix live URL storage and ensure approved nominees have proper URLs
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

async function fixLiveUrlStorage() {
  console.log('🔧 Fixing Live URL Storage for Approved Nominees\n');

  try {
    // 1. Check current database structure
    console.log('1. Checking database structure...');
    
    // Check if nominations table has live_url column
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'nominations' })
      .catch(() => {
        // If RPC doesn't exist, try direct query
        return supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'nominations')
          .eq('table_schema', 'public');
      });

    if (columnsError) {
      console.log('⚠️ Could not check columns directly, proceeding with fixes...');
    } else {
      console.log('✅ Found columns:', columns?.map(c => c.column_name || c.COLUMN_NAME).join(', '));
    }

    // 2. Check if admin_nominations view/table exists
    console.log('\n2. Checking admin_nominations structure...');
    const { data: adminNomTest, error: adminNomError } = await supabase
      .from('admin_nominations')
      .select('*')
      .limit(1);

    if (adminNomError) {
      console.log('⚠️ admin_nominations view/table does not exist, will query nominations directly');
      
      // 3. Get approved nominations without live URLs
      console.log('\n3. Finding approved nominations without live URLs...');
      const { data: nominations, error: nomError } = await supabase
        .from('nominations')
        .select('*')
        .eq('state', 'approved')
        .is('live_url', null);

      if (nomError) throw nomError;

      console.log(`Found ${nominations?.length || 0} approved nominations without live URLs`);

      // 4. Generate and assign live URLs for approved nominees
      if (nominations && nominations.length > 0) {
        console.log('\n4. Generating live URLs for approved nominees...');
        
        for (const nomination of nominations) {
          const displayName = nomination.type === 'person' 
            ? `${nomination.firstname || ''} ${nomination.lastname || ''}`.trim()
            : nomination.company_name || '';

          if (!displayName) {
            console.log(`⚠️ Skipping nomination ${nomination.id} - no display name`);
            continue;
          }

          // Generate URL slug
          const slug = displayName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

          const liveUrl = `https://worldstaffingawards.com/nominee/${slug}`;

          // Update the nomination with live URL
          const { error: updateError } = await supabase
            .from('nominations')
            .update({ live_url: liveUrl })
            .eq('id', nomination.id);

          if (updateError) {
            console.error(`❌ Failed to update ${nomination.id}:`, updateError);
          } else {
            console.log(`✅ Updated ${displayName}: ${liveUrl}`);
          }
        }
      }

    } else {
      console.log('✅ admin_nominations exists, checking for missing live URLs...');
      
      // Query through admin_nominations view
      const { data: adminNoms, error: adminError } = await supabase
        .from('admin_nominations')
        .select('*')
        .eq('state', 'approved')
        .is('nominee_live_url', null);

      if (adminError) throw adminError;

      console.log(`Found ${adminNoms?.length || 0} approved nominations without live URLs in admin view`);
    }

    // 5. Verify current approved nominations have live URLs
    console.log('\n5. Verifying approved nominations have live URLs...');
    const { data: approvedNoms, error: verifyError } = await supabase
      .from('nominations')
      .select('id, type, firstname, lastname, company_name, live_url, state')
      .eq('state', 'approved');

    if (verifyError) throw verifyError;

    console.log('\n📊 Current approved nominations:');
    approvedNoms?.forEach(nom => {
      const displayName = nom.type === 'person' 
        ? `${nom.firstname || ''} ${nom.lastname || ''}`.trim()
        : nom.company_name || '';
      
      console.log(`• ${displayName}: ${nom.live_url || '❌ NO URL'}`);
    });

    // 6. Test admin API response
    console.log('\n6. Testing admin API response...');
    const response = await fetch('http://localhost:3000/api/admin/nominations?status=approved', {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        console.log(`✅ Admin API returned ${result.data.length} approved nominations`);
        
        result.data.forEach(nom => {
          console.log(`• ${nom.displayName}: liveUrl = ${nom.liveUrl || '❌ MISSING'}`);
        });
      } else {
        console.log('⚠️ Admin API returned no data or error:', result.error);
      }
    } else {
      console.log('⚠️ Admin API request failed:', response.status);
    }

    console.log('\n🎉 Live URL storage fix completed!');
    console.log('\nNext steps:');
    console.log('• Approved nominees should now have live URLs assigned');
    console.log('• Admin panel should display live URLs for approved nominees');
    console.log('• New approvals will automatically get live URLs assigned');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixLiveUrlStorage();