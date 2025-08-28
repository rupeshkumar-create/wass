#!/usr/bin/env node

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

async function verifySchema() {
  console.log('🔍 Verifying Current Database Schema...\n');
  
  try {
    // Check if new schema tables exist
    console.log('📋 Checking for new schema tables...');
    
    const tables = ['nominators', 'nominees', 'nominations', 'voters', 'votes', 'hubspot_outbox'];
    const views = ['public_nominees', 'admin_nominations', 'voting_stats'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' does not exist or has issues: ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error: ${err.message}`);
      }
    }
    
    console.log('\n📊 Checking for views...');
    for (const view of views) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ View '${view}' does not exist or has issues: ${error.message}`);
        } else {
          console.log(`✅ View '${view}' exists`);
        }
      } catch (err) {
        console.log(`❌ View '${view}' error: ${err.message}`);
      }
    }
    
    // Check public_nominees view specifically (critical for individual pages)
    console.log('\n🎯 Testing public_nominees view (critical for individual pages)...');
    try {
      const { data, error } = await supabase
        .from('public_nominees')
        .select('*')
        .limit(5);
      
      if (error) {
        console.log(`❌ public_nominees view error: ${error.message}`);
        console.log('🚨 This is why individual nominee pages are not working!');
      } else {
        console.log(`✅ public_nominees view working, found ${data.length} records`);
        if (data.length > 0) {
          console.log('📝 Sample record:');
          console.log(JSON.stringify(data[0], null, 2));
        }
      }
    } catch (err) {
      console.log(`❌ public_nominees view error: ${err.message}`);
    }
    
    // Check if old schema still exists
    console.log('\n🔍 Checking for old schema remnants...');
    const oldTables = ['nominations_old', 'nominees_old'];
    
    for (const table of oldTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`⚠️  Old table '${table}' still exists`);
        }
      } catch (err) {
        // Expected if table doesn't exist
      }
    }
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
  }
}

verifySchema();