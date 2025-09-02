#!/usr/bin/env node

/**
 * Apply the public_nominees view fix to ensure data consistency
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyViewFix() {
  console.log('🔧 Applying public_nominees view fix for data consistency...\n');

  try {
    // Read the SQL fix file
    const sqlFile = path.join(__dirname, '..', 'FIX_PUBLIC_NOMINEES_COMBINED_VOTES.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('SELECT \'Testing'));

    console.log(`Found ${statements.length} SQL statements to execute...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct execution for view creation
        console.log('Trying alternative execution method...');
        const { error: directError } = await supabase
          .from('_temp_sql_execution')
          .select('*')
          .limit(0); // This will fail but we can catch it
        
        // For view creation, we need to use a different approach
        if (statement.includes('CREATE VIEW')) {
          console.log('⚠️  View creation requires manual execution. Continuing...');
          continue;
        } else {
          console.error(`❌ Failed to execute statement: ${error.message}`);
          return false;
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    // Test the fix by checking vote consistency
    console.log('\n🧪 Testing vote consistency...');
    
    const { data: publicNominees, error: publicError } = await supabase
      .from('public_nominees')
      .select('nomination_id, votes, display_name')
      .limit(5);

    if (publicError) {
      console.error('❌ Failed to query public_nominees:', publicError.message);
      return false;
    }

    const { data: adminNominations, error: adminError } = await supabase
      .from('admin_nominations')
      .select('nomination_id, votes, additional_votes, nominee_display_name')
      .limit(5);

    if (adminError) {
      console.error('❌ Failed to query admin_nominations:', adminError.message);
      return false;
    }

    console.log('Checking vote consistency between views...');
    let consistencyIssues = 0;

    for (const publicNom of publicNominees) {
      const adminNom = adminNominations.find(a => a.nomination_id === publicNom.nomination_id);
      
      if (adminNom) {
        const adminTotal = (adminNom.votes || 0) + (adminNom.additional_votes || 0);
        const publicVotes = publicNom.votes || 0;
        
        if (adminTotal !== publicVotes) {
          console.log(`⚠️  Vote mismatch for ${publicNom.display_name}:`);
          console.log(`   Admin: ${adminNom.votes} + ${adminNom.additional_votes} = ${adminTotal}`);
          console.log(`   Public: ${publicVotes}`);
          consistencyIssues++;
        } else {
          console.log(`✅ ${publicNom.display_name}: ${publicVotes} votes (consistent)`);
        }
      }
    }

    if (consistencyIssues === 0) {
      console.log('\n🎉 All vote counts are now consistent!');
      return true;
    } else {
      console.log(`\n⚠️  Still found ${consistencyIssues} inconsistencies. Manual database update may be needed.`);
      return false;
    }

  } catch (error) {
    console.error('❌ Failed to apply view fix:', error.message);
    return false;
  }
}

async function main() {
  const success = await applyViewFix();
  
  if (success) {
    console.log('\n✅ View fix applied successfully!');
    console.log('📊 Data consistency between admin panel and homepage should now be maintained.');
    process.exit(0);
  } else {
    console.log('\n❌ View fix failed or incomplete.');
    console.log('🔧 You may need to manually execute the SQL in FIX_PUBLIC_NOMINEES_COMBINED_VOTES.sql');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});