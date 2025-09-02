#!/usr/bin/env node

/**
 * Add manual votes field to nominations table using direct queries
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('Key:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addManualVotesField() {
  console.log('🔧 Adding manual votes field to nominations table...');

  try {
    // First, let's check if the column already exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'nominations')
      .eq('column_name', 'additional_votes');

    if (columnsError) {
      console.error('❌ Failed to check existing columns:', columnsError);
      throw columnsError;
    }

    if (columns && columns.length > 0) {
      console.log('✅ additional_votes column already exists');
    } else {
      console.log('📝 Column does not exist, will need to add it manually via Supabase dashboard');
    }

    // Let's try to update existing records to have 0 additional votes
    const { error: updateError } = await supabase
      .from('nominations')
      .update({ additional_votes: 0 })
      .is('additional_votes', null);

    if (updateError && !updateError.message.includes('column "additional_votes" does not exist')) {
      console.error('❌ Failed to update existing records:', updateError);
      throw updateError;
    }

    // Test if we can select the column
    const { data: testData, error: testError } = await supabase
      .from('nominations')
      .select('id, additional_votes')
      .limit(1);

    if (testError) {
      if (testError.message.includes('column "additional_votes" does not exist')) {
        console.log('⚠️  Column additional_votes does not exist yet');
        console.log('📋 Please run this SQL in your Supabase SQL editor:');
        console.log('');
        console.log('ALTER TABLE nominations ADD COLUMN additional_votes INTEGER DEFAULT 0;');
        console.log('UPDATE nominations SET additional_votes = 0 WHERE additional_votes IS NULL;');
        console.log('CREATE INDEX IF NOT EXISTS idx_nominations_additional_votes ON nominations(additional_votes);');
        console.log('');
        return;
      } else {
        console.error('❌ Failed to test column:', testError);
        throw testError;
      }
    }

    console.log('✅ Column verification successful');
    console.log('📊 Sample data:', testData);

    console.log('\n🎉 Manual votes field setup completed successfully!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the setup
addManualVotesField();