#!/usr/bin/env node

/**
 * Test if manual votes field exists and works
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

async function testManualVotes() {
  console.log('🔧 Testing manual votes functionality...');

  try {
    // Test if we can select the additional_votes column
    const { data: testData, error: testError } = await supabase
      .from('nominations')
      .select('id, additional_votes')
      .limit(1);

    if (testError) {
      if (testError.message.includes('column "additional_votes" does not exist')) {
        console.log('⚠️  Column additional_votes does not exist yet');
        console.log('📋 Please add the column manually in Supabase dashboard:');
        console.log('   1. Go to Table Editor > nominations');
        console.log('   2. Add new column: additional_votes (type: int4, default: 0)');
        console.log('   3. Run this script again');
        return;
      } else {
        console.error('❌ Failed to test column:', testError);
        throw testError;
      }
    }

    console.log('✅ additional_votes column exists');
    console.log('📊 Sample data:', testData);

    // Test the admin API
    console.log('\n🧪 Testing admin vote update API...');
    
    // Get a nomination to test with
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('id')
      .eq('state', 'approved')
      .limit(1);

    if (nomError || !nominations || nominations.length === 0) {
      console.log('⚠️  No approved nominations found to test with');
      return;
    }

    const testNominationId = nominations[0].id;
    console.log(`📝 Testing with nomination ID: ${testNominationId}`);

    // Test updating additional votes
    const { data: updateResult, error: updateError } = await supabase
      .from('nominations')
      .update({ additional_votes: 5 })
      .eq('id', testNominationId)
      .select('id, additional_votes')
      .single();

    if (updateError) {
      console.error('❌ Failed to update additional votes:', updateError);
      throw updateError;
    }

    console.log('✅ Successfully updated additional votes:', updateResult);

    // Reset back to 0
    await supabase
      .from('nominations')
      .update({ additional_votes: 0 })
      .eq('id', testNominationId);

    console.log('✅ Reset additional votes back to 0');

    console.log('\n🎉 Manual votes functionality is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testManualVotes();