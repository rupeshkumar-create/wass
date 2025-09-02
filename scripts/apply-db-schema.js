#!/usr/bin/env node

/**
 * Apply Database Schema Updates
 * Adds the why_vote_for_me column and updates the public_nominees view
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  console.log('🔧 Applying database schema updates...');
  
  try {
    // Step 1: Add the why_vote_for_me column
    console.log('📝 Adding why_vote_for_me column...');
    
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE nominations 
        ADD COLUMN IF NOT EXISTS why_vote_for_me TEXT 
        CHECK (char_length(why_vote_for_me) <= 1000);
      `
    });
    
    if (columnError) {
      console.error('❌ Failed to add column:', columnError);
    } else {
      console.log('✅ Column added successfully');
    }
    
    // Step 2: Update the public_nominees view
    console.log('📝 Updating public_nominees view...');
    
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP VIEW IF EXISTS public_nominees;
        
        CREATE OR REPLACE VIEW public_nominees AS
        SELECT 
          n.id,
          n.category,
          n.type,
          n.nominee_name,
          n.nominee_title,
          n.nominee_country,
          n.company_name,
          n.company_website,
          n.company_country,
          n.linkedin_norm,
          n.image_url,
          n.live_slug,
          n.status,
          n.created_at,
          n.why_vote_for_me,
          COALESCE(vc.vote_count, 0)::INT AS votes
        FROM nominations n
        LEFT JOIN (
          SELECT nominee_id, COUNT(*)::INT AS vote_count
          FROM votes
          GROUP BY nominee_id
        ) vc ON vc.nominee_id = n.id
        WHERE n.status = 'approved';
      `
    });
    
    if (viewError) {
      console.error('❌ Failed to update view:', viewError);
    } else {
      console.log('✅ View updated successfully');
    }
    
    console.log('🎉 Database schema updates completed!');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applySchemaAlternative() {
  console.log('🔧 Applying database schema updates (alternative method)...');
  
  try {
    // Try using a simple query to test connection
    const { data, error } = await supabase
      .from('nominations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('⚠️  Please run the following SQL manually in your Supabase SQL Editor:');
    console.log('');
    console.log('-- Add why_vote_for_me column');
    console.log('ALTER TABLE nominations ADD COLUMN IF NOT EXISTS why_vote_for_me TEXT CHECK (char_length(why_vote_for_me) <= 1000);');
    console.log('');
    console.log('-- Update public_nominees view');
    console.log('DROP VIEW IF EXISTS public_nominees;');
    console.log('');
    console.log(`CREATE OR REPLACE VIEW public_nominees AS
SELECT 
  n.id,
  n.category,
  n.type,
  n.nominee_name,
  n.nominee_title,
  n.nominee_country,
  n.company_name,
  n.company_website,
  n.company_country,
  n.linkedin_norm,
  n.image_url,
  n.live_slug,
  n.status,
  n.created_at,
  n.why_vote_for_me,
  COALESCE(vc.vote_count, 0)::INT AS votes
FROM nominations n
LEFT JOIN (
  SELECT nominee_id, COUNT(*)::INT AS vote_count
  FROM votes
  GROUP BY nominee_id
) vc ON vc.nominee_id = n.id
WHERE n.status = 'approved';`);
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

// Try the RPC method first, fall back to manual instructions
applySchema().catch(() => {
  console.log('\\n🔄 Trying alternative method...');
  applySchemaAlternative();
});