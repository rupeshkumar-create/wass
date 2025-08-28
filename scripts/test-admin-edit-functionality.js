#!/usr/bin/env node

/**
 * Test script for admin edit functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function testAdminEditFunctionality() {
  console.log('🔧 Testing Admin Edit Functionality...\n');

  try {
    // Test 1: Get a nomination to edit
    console.log('1. Finding a nomination to test editing...');
    const { data: nominations, error: nomError } = await supabase
      .from('nominations')
      .select('*')
      .limit(1);

    if (nomError) {
      console.error('❌ Error fetching nominations:', nomError);
      return;
    }

    if (nominations.length === 0) {
      console.log('❌ No nominations found to test with');
      return;
    }

    const testNomination = nominations[0];
    console.log(`✅ Found nomination: ${testNomination.type} - ${testNomination.id}`);

    // Test 2: Test updating why_me/why_us text
    console.log('\n2. Testing "Why Vote" text update...');
    const originalWhyText = testNomination.type === 'person' ? testNomination.why_me : testNomination.why_us;
    const newWhyText = `Updated via admin panel at ${new Date().toISOString()}`;
    
    const whyUpdateField = testNomination.type === 'person' ? 'why_me' : 'why_us';
    const { data: whyUpdated, error: whyError } = await supabase
      .from('nominations')
      .update({ 
        [whyUpdateField]: newWhyText,
        updated_at: new Date().toISOString()
      })
      .eq('id', testNomination.id)
      .select()
      .single();

    if (whyError) {
      console.error('❌ Error updating why text:', whyError);
      return;
    }

    console.log(`✅ Updated "Why Vote" text successfully`);
    console.log(`   Original: ${originalWhyText || 'null'}`);
    console.log(`   New: ${newWhyText}`);

    // Test 3: Test updating live_url
    console.log('\n3. Testing Live URL update...');
    const originalLiveUrl = testNomination.live_url;
    const newLiveUrl = 'https://example.com/updated-via-admin';

    const { data: urlUpdated, error: urlError } = await supabase
      .from('nominations')
      .update({ 
        live_url: newLiveUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', testNomination.id)
      .select()
      .single();

    if (urlError) {
      console.error('❌ Error updating live URL:', urlError);
      return;
    }

    console.log(`✅ Updated Live URL successfully`);
    console.log(`   Original: ${originalLiveUrl || 'null'}`);
    console.log(`   New: ${newLiveUrl}`);

    // Test 4: Test updating image URL
    console.log('\n4. Testing image URL update...');
    const imageField = testNomination.type === 'person' ? 'headshot_url' : 'logo_url';
    const originalImageUrl = testNomination[imageField];
    const newImageUrl = 'https://example.com/new-image.jpg';

    const { data: imageUpdated, error: imageError } = await supabase
      .from('nominations')
      .update({ 
        [imageField]: newImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', testNomination.id)
      .select()
      .single();

    if (imageError) {
      console.error('❌ Error updating image URL:', imageError);
      return;
    }

    console.log(`✅ Updated ${imageField} successfully`);
    console.log(`   Original: ${originalImageUrl || 'null'}`);
    console.log(`   New: ${newImageUrl}`);

    // Test 5: Revert all changes
    console.log('\n5. Reverting test changes...');
    const { data: reverted, error: revertError } = await supabase
      .from('nominations')
      .update({ 
        [whyUpdateField]: originalWhyText,
        live_url: originalLiveUrl,
        [imageField]: originalImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', testNomination.id)
      .select()
      .single();

    if (revertError) {
      console.error('❌ Error reverting changes:', revertError);
      return;
    }

    console.log(`✅ Successfully reverted all test changes`);

    console.log('\n🎉 All admin edit functionality tests passed!');
    console.log('\nAdmin edit features available:');
    console.log('• Edit headshot/logo images');
    console.log('• Edit "Why Vote" text');
    console.log('• Edit Live URL');
    console.log('• Real-time preview of changes');
    console.log('• File upload with validation');
    console.log('• Character count for text fields');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdminEditFunctionality();