#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testPodiumAPI() {
  try {
    console.log('Testing podium API...');
    
    // Test database connection
    console.log('1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('nominations')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Database connection error:', testError);
      return;
    }
    
    console.log('✓ Database connection successful');
    
    // Test nominations query
    console.log('2. Testing nominations query...');
    const { data: nominations, error } = await supabase
      .from('nominations')
      .select(`
        id,
        nominee_id,
        subcategory_id,
        state,
        votes,
        additional_votes,
        live_url,
        approved_at,
        nominees!inner (*)
      `)
      .eq('subcategory_id', 'top-recruiter')
      .eq('state', 'approved');
    
    if (error) {
      console.error('Query error:', error);
      return;
    }
    
    console.log(`✓ Found ${nominations?.length || 0} approved nominations for top-recruiter`);
    
    if (nominations && nominations.length > 0) {
      console.log('Sample nomination:', JSON.stringify(nominations[0], null, 2));
    }
    
    // Test API endpoint
    console.log('3. Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/podium?category=top-recruiter');
    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ API endpoint successful');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      console.error('API endpoint error:', result);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPodiumAPI();