#!/usr/bin/env node

/**
 * Check current database schema
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking Current Database Schema\n');

  try {
    // Check nominations table
    console.log('📋 Nominations Table:');
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('*')
      .limit(1);

    if (nomError) {
      console.error('❌ Nominations error:', nomError.message);
    } else {
      console.log('✅ Nominations table accessible');
      if (nominations && nominations.length > 0) {
        console.log('   Columns:', Object.keys(nominations[0]).join(', '));
      }
    }

    // Check votes table
    console.log('\n🗳️  Votes Table:');
    const { data: votes, error: voteError } = await supabase
      .from('votes')
      .select('*')
      .limit(1);

    if (voteError) {
      console.error('❌ Votes error:', voteError.message);
    } else {
      console.log('✅ Votes table accessible');
      if (votes && votes.length > 0) {
        console.log('   Columns:', Object.keys(votes[0]).join(', '));
      }
    }

    // Check nominees table
    console.log('\n👤 Nominees Table:');
    const { data: nominees, error: nomineeError } = await supabase
      .from('nominees')
      .select('*')
      .limit(1);

    if (nomineeError) {
      console.error('❌ Nominees error:', nomineeError.message);
    } else {
      console.log('✅ Nominees table accessible');
      if (nominees && nominees.length > 0) {
        console.log('   Columns:', Object.keys(nominees[0]).join(', '));
      }
    }

    // Check nominators table
    console.log('\n📝 Nominators Table:');
    const { data: nominators, error: nominatorError } = await supabase
      .from('nominators')
      .select('*')
      .limit(1);

    if (nominatorError) {
      console.error('❌ Nominators error:', nominatorError.message);
    } else {
      console.log('✅ Nominators table accessible');
      if (nominators && nominators.length > 0) {
        console.log('   Columns:', Object.keys(nominators[0]).join(', '));
      }
    }

    // Check views
    console.log('\n👁️  Views:');
    
    const { data: adminView, error: adminViewError } = await supabase
      .from('admin_nominations')
      .select('*')
      .limit(1);

    if (adminViewError) {
      console.error('❌ Admin view error:', adminViewError.message);
    } else {
      console.log('✅ Admin view accessible');
    }

    const { data: publicView, error: publicViewError } = await supabase
      .from('public_nominees')
      .select('*')
      .limit(1);

    if (publicViewError) {
      console.error('❌ Public view error:', publicViewError.message);
    } else {
      console.log('✅ Public view accessible');
    }

  } catch (error) {
    console.error('\n❌ Schema check failed:', error.message);
  }
}

checkSchema();