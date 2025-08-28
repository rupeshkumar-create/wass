#!/usr/bin/env node

/**
 * CHECK ACTUAL DATABASE STRUCTURE
 * This script checks what actually exists in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseStructure() {
  console.log('🔍 CHECKING ACTUAL DATABASE STRUCTURE\n');
  
  // List of tables to check
  const tablesToCheck = [
    'nominations',
    'votes', 
    'nominators',
    'nominees',
    'voters',
    'hubspot_outbox'
  ];
  
  // List of views to check
  const viewsToCheck = [
    'admin_nominations',
    'public_nominees',
    'voting_stats'
  ];
  
  console.log('📋 CHECKING TABLES...\n');
  
  for (const tableName of tablesToCheck) {
    console.log(`🔍 Table: ${tableName}`);
    
    try {
      // Try to get table structure by selecting with limit 0
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
        
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Table exists`);
        
        // Try to get a sample row to see columns
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (sample && sample.length > 0) {
          const columns = Object.keys(sample[0]);
          console.log(`   📝 Columns (${columns.length}): ${columns.join(', ')}`);
        } else {
          console.log(`   📝 Table is empty, trying to infer structure...`);
          
          // Try some common columns to see what exists
          const commonColumns = {
            nominations: ['id', 'created_at', 'updated_at', 'state', 'category_group_id', 'subcategory_id', 'votes', 'nominator_id', 'nominee_id'],
            votes: ['id', 'created_at', 'voter_id', 'nomination_id', 'subcategory_id', 'vote_timestamp'],
            nominators: ['id', 'email', 'firstname', 'lastname', 'company', 'job_title'],
            nominees: ['id', 'type', 'firstname', 'lastname', 'company_name', 'headshot_url', 'logo_url'],
            voters: ['id', 'email', 'firstname', 'lastname', 'linkedin', 'company'],
            hubspot_outbox: ['id', 'event_type', 'payload', 'status', 'created_at']
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
            console.log(`   📝 Existing columns: ${existingColumns.join(', ')}`);
            
            const missingColumns = commonColumns[tableName].filter(col => !existingColumns.includes(col));
            if (missingColumns.length > 0) {
              console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
            }
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('👁️  CHECKING VIEWS...\n');
  
  for (const viewName of viewsToCheck) {
    console.log(`🔍 View: ${viewName}`);
    
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ View exists`);
        
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   📝 Columns (${columns.length}): ${columns.join(', ')}`);
        } else {
          console.log(`   📝 View is empty but accessible`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  // Check if we can create a simple test record
  console.log('🧪 TESTING BASIC OPERATIONS...\n');
  
  try {
    // Test if we can insert into nominators table
    console.log('🔍 Testing nominator insert...');
    const { data: testNominator, error: nominatorError } = await supabase
      .from('nominators')
      .insert({
        email: 'test@example.com',
        firstname: 'Test',
        lastname: 'User',
        company: 'Test Company',
        job_title: 'Tester'
      })
      .select()
      .single();
      
    if (nominatorError) {
      console.log(`   ❌ Nominator insert failed: ${nominatorError.message}`);
    } else {
      console.log(`   ✅ Nominator insert successful: ${testNominator.id}`);
      
      // Clean up
      await supabase.from('nominators').delete().eq('id', testNominator.id);
      console.log(`   🧹 Cleaned up test nominator`);
    }
  } catch (err) {
    console.log(`   ❌ Nominator test exception: ${err.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE STRUCTURE SUMMARY');
  console.log('='.repeat(60));
}

checkDatabaseStructure().catch(console.error);