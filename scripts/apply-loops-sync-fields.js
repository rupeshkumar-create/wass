#!/usr/bin/env node

/**
 * Apply Loops sync fields to the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyLoopsSyncFields() {
  try {
    console.log('🔧 Applying Loops sync fields to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'ADD_LOOPS_SYNC_FIELDS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute each statement separately
      console.log('🔄 Trying alternative approach...');
      
      const statements = [
        'ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS loops_contact_id TEXT',
        'ALTER TABLE public.nominees ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ',
        'ALTER TABLE public.nominators ADD COLUMN IF NOT EXISTS loops_contact_id TEXT',
        'ALTER TABLE public.nominators ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ',
        'ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS loops_contact_id TEXT',
        'ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS loops_synced_at TIMESTAMPTZ'
      ];
      
      for (const statement of statements) {
        try {
          console.log(`Executing: ${statement}`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (stmtError) {
            console.error(`❌ Error with statement: ${stmtError.message}`);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (err) {
          console.error(`❌ Error executing statement: ${err.message}`);
        }
      }
    } else {
      console.log('✅ SQL executed successfully');
    }
    
    // Verify the fields were added
    console.log('\n🔍 Verifying fields were added...');
    
    const { data: nominees, error: nomineesError } = await supabase
      .from('nominees')
      .select('loops_contact_id, loops_synced_at')
      .limit(1);
    
    if (nomineesError) {
      console.error('❌ Error checking nominees table:', nomineesError.message);
    } else {
      console.log('✅ Nominees table now has Loops sync fields');
    }
    
    const { data: nominators, error: nominatorsError } = await supabase
      .from('nominators')
      .select('loops_contact_id, loops_synced_at')
      .limit(1);
    
    if (nominatorsError) {
      console.error('❌ Error checking nominators table:', nominatorsError.message);
    } else {
      console.log('✅ Nominators table now has Loops sync fields');
    }
    
    console.log('\n🎉 Loops sync fields setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyLoopsSyncFields();