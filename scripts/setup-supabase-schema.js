#!/usr/bin/env node

/**
 * Setup Supabase Schema
 * This script will attempt to create the database schema automatically
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function setupSchema() {
  console.log('🏗️  Setting up Supabase Schema...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  console.log('✅ Environment variables found');
  
  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found:', schemaPath);
    return;
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('✅ Schema file loaded');
  
  // Connect to Supabase
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Connected to Supabase');
    
    // Execute schema
    console.log('🔄 Executing schema...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Schema execution failed:', error.message);
      console.log('\n📋 Manual setup required:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Copy and paste the contents of supabase-schema.sql');
      console.log('   5. Click "Run" to execute the schema');
    } else {
      console.log('✅ Schema executed successfully');
      
      // Test that tables were created
      console.log('🔍 Verifying tables...');
      
      const tables = ['nominations', 'nominators', 'voters', 'hubspot_outbox'];
      let allTablesExist = true;
      
      for (const table of tables) {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        if (tableError) {
          console.log(`❌ Table '${table}' not found or accessible`);
          allTablesExist = false;
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      }
      
      if (allTablesExist) {
        console.log('\n🎉 Database setup completed successfully!');
        console.log('   You can now run: node scripts/test-supabase-integration.js');
      } else {
        console.log('\n⚠️  Some tables may not have been created properly');
        console.log('   Please check your Supabase dashboard and run the schema manually');
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Manual setup required:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the contents of supabase-schema.sql');
    console.log('   5. Click "Run" to execute the schema');
  }
}

setupSchema();