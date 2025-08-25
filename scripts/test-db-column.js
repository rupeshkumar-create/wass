#!/usr/bin/env node

/**
 * Test if the why_vote_for_me column exists and is working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testColumn() {
  console.log('🔍 Testing why_vote_for_me column...');
  
  try {
    // Test 1: Check if column exists in nominations table
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('id, why_vote_for_me')
      .limit(1);
    
    if (nomError) {
      console.error('❌ Column does not exist in nominations table:', nomError.message);
      console.log('📋 Please run the SQL from fix-db-schema-simple.sql in Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Column exists in nominations table');
    
    // Test 2: Check if public_nominees view includes the column
    const { data: publicNominees, error: viewError } = await supabase
      .from('public_nominees')
      .select('id, why_vote_for_me')
      .limit(1);
    
    if (viewError) {
      console.error('❌ Column missing from public_nominees view:', viewError.message);
      console.log('📋 Please run the SQL from fix-db-schema-simple.sql in Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Column exists in public_nominees view');
    
    // Test 3: Check specific nominee
    const { data: specificNominee, error: specificError } = await supabase
      .from('public_nominees')
      .select('*')
      .eq('live_slug', 'simple-test-nominee')
      .single();
    
    if (specificError) {
      console.error('❌ Could not find test nominee:', specificError.message);
    } else {
      console.log('✅ Test nominee found:');
      console.log('   ID:', specificNominee.id);
      console.log('   Name:', specificNominee.nominee_name);
      console.log('   Why Vote:', specificNominee.why_vote_for_me || '(empty)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testColumn();