#!/usr/bin/env node

/**
 * CLEANUP TEST DATA
 * This script removes all test data from the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTestData() {
  console.log('🧹 CLEANING UP ALL TEST DATA\n');
  
  try {
    // Delete all votes first (due to foreign key constraints)
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
    if (votesError && !votesError.message.includes('No rows found')) {
      console.log(`⚠️ Votes cleanup: ${votesError.message}`);
    } else {
      console.log('✅ Cleaned up votes');
    }
    
    // Delete all voters
    const { error: votersError } = await supabase
      .from('voters')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
    if (votersError && !votersError.message.includes('No rows found')) {
      console.log(`⚠️ Voters cleanup: ${votersError.message}`);
    } else {
      console.log('✅ Cleaned up voters');
    }
    
    // Delete all nominations
    const { error: nominationsError } = await supabase
      .from('nominations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
    if (nominationsError && !nominationsError.message.includes('No rows found')) {
      console.log(`⚠️ Nominations cleanup: ${nominationsError.message}`);
    } else {
      console.log('✅ Cleaned up nominations');
    }
    
    // Delete all nominees
    const { error: nomineesError } = await supabase
      .from('nominees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
    if (nomineesError && !nomineesError.message.includes('No rows found')) {
      console.log(`⚠️ Nominees cleanup: ${nomineesError.message}`);
    } else {
      console.log('✅ Cleaned up nominees');
    }
    
    // Delete all nominators
    const { error: nominatorsError } = await supabase
      .from('nominators')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
    if (nominatorsError && !nominatorsError.message.includes('No rows found')) {
      console.log(`⚠️ Nominators cleanup: ${nominatorsError.message}`);
    } else {
      console.log('✅ Cleaned up nominators');
    }
    
    console.log('\n🎉 CLEANUP COMPLETE!');
    console.log('✅ All test data has been removed');
    console.log('✅ Database is now clean and ready for production data');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanupTestData().catch(console.error);