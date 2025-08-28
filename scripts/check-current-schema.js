#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentSchema() {
  console.log('🔍 CHECKING CURRENT DATABASE SCHEMA\n');
  
  try {
    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info');
      
    if (tablesError) {
      console.log('❌ Could not get table info via RPC, trying direct query...');
      
      // Try direct query to information_schema
      const { data: directTables, error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
        
      if (directError) {
        console.log('❌ Direct query failed too:', directError.message);
        
        // Try simple table queries to see what exists
        const testTables = ['nominations', 'votes', 'nominators', 'nominees', 'voters'];
        
        for (const tableName of testTables) {
          try {
            const { data, error } = await supabase.from(tableName).select('*').limit(1);
            if (error) {
              console.log(`❌ Table ${tableName}: ${error.message}`);
            } else {
              console.log(`✅ Table ${tableName}: exists`);
              
              // Try to get column info by selecting with specific columns
              const { data: sample, error: sampleError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
                
              if (sample && sample.length > 0) {
                console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
              } else {
                console.log(`   Table is empty, checking structure...`);
                
                // Try common columns to see what exists
                const commonColumns = {
                  nominations: ['id', 'created_at', 'status', 'category', 'nominator_name', 'nominee_name'],
                  votes: ['id', 'created_at', 'voter_email', 'nomination_id', 'voter_name'],
                  nominators: ['id', 'email', 'firstname', 'lastname'],
                  nominees: ['id', 'type', 'firstname', 'lastname'],
                  voters: ['id', 'email', 'firstname', 'lastname']
                };
                
                if (commonColumns[tableName]) {
                  const existingColumns = [];
                  for (const col of commonColumns[tableName]) {
                    try {
                      const { error: colError } = await supabase
                        .from(tableName)
                        .select(col)
                        .limit(1);
                      if (!colError) {
                        existingColumns.push(col);
                      }
                    } catch (e) {
                      // Column doesn't exist
                    }
                  }
                  console.log(`   Existing columns: ${existingColumns.join(', ')}`);
                  
                  const missingColumns = commonColumns[tableName].filter(col => !existingColumns.includes(col));
                  if (missingColumns.length > 0) {
                    console.log(`   Missing columns: ${missingColumns.join(', ')}`);
                  }
                }
              }
            }
          } catch (err) {
            console.log(`❌ Table ${tableName}: Exception - ${err.message}`);
          }
        }
      } else {
        console.log('✅ Found tables:', directTables.map(t => t.table_name).join(', '));
      }
    } else {
      console.log('✅ Got table info via RPC:', tables);
    }
    
  } catch (err) {
    console.log('❌ General error:', err.message);
  }
}

checkCurrentSchema().catch(console.error);