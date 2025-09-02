#!/usr/bin/env node

/**
 * Add additional_votes column to nominations table
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAdditionalVotesColumn() {
  console.log('🔧 Adding additional_votes column to nominations table...');

  try {
    // Test if we can update a record (this will tell us if the column exists)
    const { data: testNominations, error: testError } = await supabase
      .from('nominations')
      .select('id')
      .limit(1);

    if (testError) {
      throw new Error(`Cannot access nominations table: ${testError.message}`);
    }

    if (!testNominations || testNominations.length === 0) {
      console.log('⚠️  No nominations found in table');
      return;
    }

    const testId = testNominations[0].id;

    // Try to update with additional_votes to see if column exists
    const { error: updateError } = await supabase
      .from('nominations')
      .update({ additional_votes: 0 })
      .eq('id', testId);

    if (updateError) {
      if (updateError.message.includes('column "additional_votes" does not exist')) {
        console.log('❌ Column additional_votes does not exist');
        console.log('📋 Please add the column manually in Supabase dashboard:');
        console.log('');
        console.log('1. Go to Supabase Dashboard > Table Editor > nominations');
        console.log('2. Click "Add Column"');
        console.log('3. Name: additional_votes');
        console.log('4. Type: int4 (integer)');
        console.log('5. Default value: 0');
        console.log('6. Allow nullable: No');
        console.log('7. Click "Save"');
        console.log('');
        console.log('Or run this SQL in the SQL Editor:');
        console.log('ALTER TABLE nominations ADD COLUMN additional_votes INTEGER DEFAULT 0 NOT NULL;');
        console.log('');
        return;
      } else {
        throw updateError;
      }
    }

    console.log('✅ Column additional_votes already exists and is working');

    // Update all existing records to have 0 additional votes if they're null
    const { error: bulkUpdateError } = await supabase
      .from('nominations')
      .update({ additional_votes: 0 })
      .is('additional_votes', null);

    if (bulkUpdateError) {
      console.warn('⚠️  Could not bulk update null values:', bulkUpdateError.message);
    } else {
      console.log('✅ Updated all null additional_votes to 0');
    }

    console.log('\n🎉 additional_votes column is ready!');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
addAdditionalVotesColumn();