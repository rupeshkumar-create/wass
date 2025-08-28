#!/usr/bin/env node

/**
 * APPLY IMPROVED SCHEMA TO SUPABASE
 * This script applies the improved schema to the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyImprovedSchema() {
  console.log('🔄 APPLYING IMPROVED SCHEMA TO SUPABASE\n');
  
  try {
    // Read the improved schema file
    const schemaSQL = fs.readFileSync('supabase-schema-improved.sql', 'utf8');
    
    console.log('📖 Read schema file successfully');
    console.log(`   Schema size: ${schemaSQL.length} characters`);
    
    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      console.log(`${i + 1}/${statements.length} Executing: ${statement.substring(0, 80)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('cannot drop') ||
              error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`   ⚠️  Expected: ${error.message}`);
          } else {
            console.log(`   ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        // Try direct query if RPC fails
        try {
          const { error: directError } = await supabase
            .from('_temp_exec')
            .select('*')
            .limit(0); // This will fail but might give us better error info
            
          console.log(`   ❌ RPC failed, trying alternative: ${err.message}`);
          errorCount++;
        } catch (e) {
          console.log(`   ❌ Both methods failed: ${err.message}`);
          errorCount++;
        }
      }
      
      // Add small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCHEMA APPLICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    // Test if key views were created
    console.log('\n🔍 TESTING KEY VIEWS AND TABLES...');
    
    const testQueries = [
      { name: 'admin_nominations view', query: 'SELECT * FROM admin_nominations LIMIT 1' },
      { name: 'public_nominees view', query: 'SELECT * FROM public_nominees LIMIT 1' },
      { name: 'voting_stats view', query: 'SELECT * FROM voting_stats LIMIT 1' },
      { name: 'nominators table', query: 'SELECT * FROM nominators LIMIT 1' },
      { name: 'nominees table', query: 'SELECT * FROM nominees LIMIT 1' },
      { name: 'nominations table', query: 'SELECT * FROM nominations LIMIT 1' },
      { name: 'voters table', query: 'SELECT * FROM voters LIMIT 1' },
      { name: 'votes table', query: 'SELECT * FROM votes LIMIT 1' }
    ];
    
    for (const test of testQueries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: test.query 
        });
        
        if (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`✅ ${test.name}: Available`);
        }
      } catch (err) {
        console.log(`❌ ${test.name}: ${err.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Failed to apply schema:', error);
  }
}

applyImprovedSchema().catch(console.error);