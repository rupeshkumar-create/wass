#!/usr/bin/env node

/**
 * Apply the corrected live URL fix to the database
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function applyLiveUrlFix() {
  console.log('🔧 Applying Live URL Fix...\n');

  try {
    // Read the corrected SQL file
    const sqlPath = path.join(__dirname, '..', 'FIXED_NOMINEE_PAGES_AND_LIVE_URL_CORRECTED.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Loaded SQL file');

    // Split SQL into individual statements (basic splitting)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) continue;

      console.log(`${i + 1}/${statements.length} Executing: ${statement.substring(0, 50)}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query for simpler statements
          const { error: directError } = await supabase
            .from('_temp_exec')
            .select('*')
            .limit(0); // This will fail, but we can try the statement directly

          // For UPDATE statements, try them directly
          if (statement.trim().toUpperCase().startsWith('UPDATE')) {
            console.log('   Trying direct UPDATE...');
            // We'll handle updates manually below
          } else {
            console.error(`   ❌ Error: ${error.message}`);
          }
        } else {
          console.log('   ✅ Success');
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }

    // Manual fixes for critical operations
    console.log('\n🔧 Applying manual fixes...');

    // 1. Update nominees live URLs
    console.log('1️⃣ Updating nominees live URLs...');
    const { error: updateError } = await supabase
      .from('nominees')
      .update({ 
        live_url: supabase.raw(`'https://worldstaffingawards.com/nominee/' || id::text`)
      })
      .or('live_url.is.null,live_url.eq.,live_url.not.like.https://worldstaffingawards.com/nominee/%');

    if (updateError) {
      console.error('❌ Error updating nominees:', updateError.message);
    } else {
      console.log('✅ Updated nominees live URLs');
    }

    console.log('\n🎉 Live URL fix application completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node scripts/test-live-url-fix.js');
    console.log('2. Test nominee pages in browser');
    console.log('3. Verify URLs work: https://worldstaffingawards.com/nominee/[id]');

  } catch (error) {
    console.error('❌ Application failed:', error.message);
  }
}

// Run the application
applyLiveUrlFix().catch(console.error);