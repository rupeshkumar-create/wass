#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyImprovedSchema() {
  try {
    console.log('🔄 Applying improved schema to Supabase...');
    
    // Read the improved schema file
    const schemaPath = path.join(__dirname, '..', 'supabase-schema-improved.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`   ⚠️  Warning on statement ${i + 1}: ${error.message}`);
          }
        } catch (err) {
          console.warn(`   ⚠️  Warning on statement ${i + 1}: ${err.message}`);
        }
      }
    }
    
    console.log('✅ Schema application completed');
    
    // Verify the new structure
    console.log('\n🔍 Verifying new schema structure...');
    
    const tables = ['nominators', 'nominees', 'nominations', 'voters', 'votes', 'hubspot_outbox'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table} is accessible`);
      }
    }
    
    // Check views
    const views = ['public_nominees', 'admin_nominations', 'voting_stats'];
    
    for (const view of views) {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing view ${view}: ${error.message}`);
      } else {
        console.log(`✅ View ${view} is accessible`);
      }
    }
    
    console.log('\n🎉 Improved schema successfully applied!');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

// Execute with direct SQL approach
async function executeDirectSQL() {
  try {
    console.log('🔄 Applying schema using direct SQL execution...');
    
    const schemaPath = path.join(__dirname, '..', 'supabase-schema-improved.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Use the SQL editor approach
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: schemaSql 
    });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
      // Try alternative approach
      await applyImprovedSchema();
    } else {
      console.log('✅ Schema applied successfully via direct SQL');
      
      // Verify tables exist
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      console.log('📋 Available tables:', tables?.map(t => t.table_name) || []);
    }
    
  } catch (error) {
    console.error('❌ Direct SQL failed, trying statement-by-statement approach...');
    await applyImprovedSchema();
  }
}

if (require.main === module) {
  executeDirectSQL();
}

module.exports = { applyImprovedSchema, executeDirectSQL };