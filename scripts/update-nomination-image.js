#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateNominationWithRealImage() {
  try {
    console.log('🔍 Looking for test nomination...');
    
    const { data: nominations, error } = await supabase
      .from('nominations')
      .select('*')
      .eq('firstname', 'Jane')
      .eq('lastname', 'Doe')
      .limit(1);
      
    if (error) {
      console.error('Query error:', error);
      return;
    }
    
    if (!nominations.length) {
      console.log('No test nomination found');
      return;
    }
    
    const nomination = nominations[0];
    console.log('✅ Found nomination:', nomination.id);
    
    const imageUrl = 'https://cabdkztnkycebtlcmckx.supabase.co/storage/v1/object/public/images/headshots/test-required-headshot-1756146879132.png';
    
    const { data, error: updateError } = await supabase
      .from('nominations')
      .update({ headshot_url: imageUrl })
      .eq('id', nomination.id)
      .select();
      
    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log('✅ Updated nomination with real Supabase image URL');
      console.log('🔗 Image URL:', imageUrl);
    }
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

updateNominationWithRealImage();