#!/usr/bin/env node

/**
 * Fix additional votes column in nominations table
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdditionalVotesColumn() {
  console.log('🔧 Checking and fixing additional_votes column...\n');

  try {
    // Check if additional_votes column exists
    console.log('1️⃣ Checking nominations table structure...');
    const { data: nominations, error: checkError } = await supabase
      .from('nominations')
      .select('id, votes, additional_votes')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('additional_votes')) {
        console.log('❌ additional_votes column does not exist. Adding it...');
        
        // Add the column using raw SQL
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS additional_votes INTEGER DEFAULT 0;'
        });

        if (alterError) {
          console.error('❌ Failed to add additional_votes column:', alterError.message);
          console.log('\n📝 Please run this SQL manually in your Supabase SQL editor:');
          console.log('ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS additional_votes INTEGER DEFAULT 0;');
          return;
        }

        console.log('✅ additional_votes column added successfully');
      } else {
        console.error('❌ Error checking nominations table:', checkError.message);
        return;
      }
    } else {
      console.log('✅ additional_votes column already exists');
    }

    // Test the column
    console.log('\n2️⃣ Testing additional_votes column...');
    const { data: testData, error: testError } = await supabase
      .from('nominations')
      .select('id, votes, additional_votes')
      .limit(3);

    if (testError) {
      console.error('❌ Error testing column:', testError.message);
      return;
    }

    console.log(`✅ Found ${testData.length} nominations`);
    testData.forEach(nom => {
      console.log(`   - ID: ${nom.id} | Votes: ${nom.votes || 0} | Additional: ${nom.additional_votes || 0}`);
    });

    // Test the votes table structure
    console.log('\n3️⃣ Testing votes table structure...');
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('id, nomination_id, voter_id')
      .limit(3);

    if (votesError) {
      console.error('❌ Error checking votes table:', votesError.message);
      return;
    }

    console.log(`✅ Found ${votesData.length} votes`);
    votesData.forEach(vote => {
      console.log(`   - Vote ID: ${vote.id} | Nomination ID: ${vote.nomination_id}`);
    });

    console.log('\n🎉 Additional votes column fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the admin panel manual vote update');
    console.log('2. Verify vote counts are working correctly');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixAdditionalVotesColumn().catch(console.error);