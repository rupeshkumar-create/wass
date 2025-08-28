#!/usr/bin/env node

/**
 * Setup Supabase Storage bucket for images
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Found' : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase Storage...');

    // Create images bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const imagesBucket = buckets.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      console.log('📦 Creating images bucket...');
      const { data, error } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }

      console.log('✅ Images bucket created successfully');
    } else {
      console.log('✅ Images bucket already exists');
    }

    // Set up RLS policies for the bucket
    console.log('🔒 Setting up storage policies...');
    
    // Allow public read access to images
    const { error: policyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'images',
      policy_name: 'Public read access',
      definition: 'true',
      operation: 'SELECT'
    });

    if (policyError && !policyError.message.includes('already exists')) {
      console.warn('⚠️ Policy creation warning:', policyError.message);
    }

    // Test upload to verify everything works
    console.log('🧪 Testing image upload...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testPath = `test/setup-test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(testPath, testImageBuffer, {
        contentType: 'image/png'
      });

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
      return;
    }

    console.log('✅ Test upload successful');

    // Get public URL to verify access
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(testPath);

    console.log('🔗 Test image URL:', urlData.publicUrl);

    // Clean up test file
    await supabase.storage.from('images').remove([testPath]);
    console.log('🧹 Test file cleaned up');

    console.log('\n✅ Supabase Storage setup complete!');
    console.log('📁 Bucket: images');
    console.log('🔒 Public read access enabled');
    console.log('📏 File size limit: 5MB');
    console.log('🎨 Allowed types: JPEG, PNG, SVG, WebP');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupStorage();