#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkConstraints() {
  console.log('🔍 Checking table constraints...');

  try {
    // Check nominees table structure
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'nominees' 
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.error('❌ Error checking columns:', error);
      
      // Try alternative approach - just insert a minimal record to see what's required
      console.log('🧪 Testing minimal person nominee...');
      const { data: testData, error: testError } = await supabase
        .from('nominees')
        .insert({
          type: 'person',
          firstname: 'Test',
          lastname: 'Person'
        })
        .select();

      if (testError) {
        console.error('❌ Test insert failed:', testError);
        
        // Try with more fields
        console.log('🧪 Testing with more fields...');
        const { data: testData2, error: testError2 } = await supabase
          .from('nominees')
          .insert({
            type: 'person',
            firstname: 'Test',
            lastname: 'Person',
            person_email: 'test@example.com',
            jobtitle: 'Test Role',
            person_linkedin: 'https://linkedin.com/in/test',
            why_me: 'Test reason',
            live_url: 'test-person'
          })
          .select();

        if (testError2) {
          console.error('❌ Extended test insert failed:', testError2);
        } else {
          console.log('✅ Extended test insert succeeded:', testData2);
          
          // Clean up
          await supabase.from('nominees').delete().eq('id', testData2[0].id);
        }
      } else {
        console.log('✅ Minimal test insert succeeded:', testData);
        
        // Clean up
        await supabase.from('nominees').delete().eq('id', testData[0].id);
      }
      
      return;
    }

    console.log('📋 Nominees table columns:');
    data.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Failed to check constraints:', error);
  }
}

checkConstraints();