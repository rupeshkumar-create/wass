#!/usr/bin/env node

/**
 * Check if Loops sync fields exist in the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLoopsSchema() {
  try {
    console.log('🔍 Checking Loops schema status...');
    
    // Check nominees table structure
    console.log('\n📊 Checking nominees table...');
    const { data: nominees, error: nomineesError } = await supabase
      .from('nominees')
      .select('*')
      .limit(1);
    
    if (nomineesError) {
      console.error('❌ Error fetching nominees:', nomineesError);
    } else if (nominees && nominees.length > 0) {
      const nominee = nominees[0];
      console.log('✅ Nominees table columns:');
      Object.keys(nominee).forEach(key => {
        if (key.includes('loops')) {
          console.log(`  - ${key}: ${nominee[key]} (LOOPS FIELD)`);
        } else {
          console.log(`  - ${key}`);
        }
      });
    }
    
    // Check nominators table structure
    console.log('\n👤 Checking nominators table...');
    const { data: nominators, error: nominatorsError } = await supabase
      .from('nominators')
      .select('*')
      .limit(1);
    
    if (nominatorsError) {
      console.error('❌ Error fetching nominators:', nominatorsError);
    } else if (nominators && nominators.length > 0) {
      const nominator = nominators[0];
      console.log('✅ Nominators table columns:');
      Object.keys(nominator).forEach(key => {
        if (key.includes('loops')) {
          console.log(`  - ${key}: ${nominator[key]} (LOOPS FIELD)`);
        } else {
          console.log(`  - ${key}`);
        }
      });
    }
    
    // Check if loops_outbox table exists
    console.log('\n📦 Checking loops_outbox table...');
    const { data: outbox, error: outboxError } = await supabase
      .from('loops_outbox')
      .select('*')
      .limit(1);
    
    if (outboxError) {
      console.error('❌ loops_outbox table does not exist or has error:', outboxError.message);
    } else {
      console.log('✅ loops_outbox table exists');
      if (outbox && outbox.length > 0) {
        console.log('Sample record:', outbox[0]);
      } else {
        console.log('Table is empty');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkLoopsSchema();