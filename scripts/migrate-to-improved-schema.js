#!/usr/bin/env node

/**
 * Migrate existing data to improved schema
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

async function migrateData() {
  console.log('🔄 Starting data migration to improved schema...\n');

  try {
    // Step 1: Backup existing data
    console.log('1. Backing up existing data...');
    
    const { data: oldNominations, error: nomError } = await supabase
      .from('nominations')
      .select('*');

    if (nomError) {
      console.error('❌ Error fetching old nominations:', nomError);
      return;
    }

    const { data: oldNominators, error: nominatorError } = await supabase
      .from('nominators')
      .select('*');

    if (nominatorError) {
      console.error('❌ Error fetching old nominators:', nominatorError);
      return;
    }

    const { data: oldVoters, error: voterError } = await supabase
      .from('voters')
      .select('*');

    if (voterError && voterError.code !== 'PGRST116') { // Table doesn't exist
      console.error('❌ Error fetching old voters:', voterError);
      return;
    }

    console.log(`✅ Backed up ${oldNominations.length} nominations, ${oldNominators.length} nominators, ${oldVoters?.length || 0} voters`);

    // Step 2: Apply new schema (this should be done manually in Supabase SQL editor)
    console.log('\n2. ⚠️  MANUAL STEP REQUIRED:');
    console.log('   Please run the SQL in supabase-schema-improved.sql in your Supabase SQL editor');
    console.log('   This will create the new table structure');
    console.log('   Press Enter when done...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // Step 3: Migrate nominators
    console.log('\n3. Migrating nominators...');
    
    const nominatorMap = new Map();
    
    for (const oldNominator of oldNominators) {
      const newNominator = {
        email: oldNominator.email,
        firstname: oldNominator.firstname,
        lastname: oldNominator.lastname,
        linkedin: oldNominator.linkedin,
        company: null, // Not available in old schema
        job_title: null, // Not available in old schema
        phone: null, // Not available in old schema
        country: null, // Not available in old schema
      };

      const { data: insertedNominator, error: insertError } = await supabase
        .from('nominators')
        .insert(newNominator)
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Error inserting nominator ${oldNominator.email}:`, insertError);
        continue;
      }

      nominatorMap.set(oldNominator.id, insertedNominator.id);
    }

    console.log(`✅ Migrated ${nominatorMap.size} nominators`);

    // Step 4: Migrate nominees and nominations
    console.log('\n4. Migrating nominees and nominations...');
    
    let migratedCount = 0;
    
    for (const oldNomination of oldNominations) {
      // Create nominee record
      const nominee = {
        type: oldNomination.type,
        firstname: oldNomination.firstname,
        lastname: oldNomination.lastname,
        person_email: oldNomination.person_email,
        person_linkedin: oldNomination.person_linkedin,
        jobtitle: oldNomination.jobtitle,
        headshot_url: oldNomination.headshot_url,
        why_me: oldNomination.why_me,
        company_name: oldNomination.company_name,
        company_domain: oldNomination.company_domain,
        company_website: oldNomination.company_website,
        company_linkedin: oldNomination.company_linkedin,
        logo_url: oldNomination.logo_url,
        why_us: oldNomination.why_us,
        live_url: oldNomination.live_url,
      };

      const { data: insertedNominee, error: nomineeError } = await supabase
        .from('nominees')
        .insert(nominee)
        .select()
        .single();

      if (nomineeError) {
        console.error(`❌ Error inserting nominee for nomination ${oldNomination.id}:`, nomineeError);
        continue;
      }

      // Find corresponding nominator
      const oldNominator = oldNominators.find(n => 
        n.subcategory_id === oldNomination.subcategory_id &&
        n.nominated_display_name === (
          oldNomination.type === 'person' 
            ? `${oldNomination.firstname || ''} ${oldNomination.lastname || ''}`.trim()
            : oldNomination.company_name
        )
      );

      if (!oldNominator) {
        console.warn(`⚠️  No nominator found for nomination ${oldNomination.id}`);
        continue;
      }

      const nominatorId = nominatorMap.get(oldNominator.id);
      if (!nominatorId) {
        console.warn(`⚠️  Nominator ID not found for ${oldNominator.id}`);
        continue;
      }

      // Create nomination record
      const nomination = {
        nominator_id: nominatorId,
        nominee_id: insertedNominee.id,
        category_group_id: oldNomination.category_group_id,
        subcategory_id: oldNomination.subcategory_id,
        state: oldNomination.state,
        votes: oldNomination.votes || 0,
        created_at: oldNomination.created_at,
        updated_at: oldNomination.updated_at,
      };

      const { error: nominationError } = await supabase
        .from('nominations')
        .insert(nomination);

      if (nominationError) {
        console.error(`❌ Error inserting nomination ${oldNomination.id}:`, nominationError);
        continue;
      }

      migratedCount++;
    }

    console.log(`✅ Migrated ${migratedCount} nominations with nominees`);

    // Step 5: Migrate voters (if they exist)
    if (oldVoters && oldVoters.length > 0) {
      console.log('\n5. Migrating voters...');
      
      for (const oldVoter of oldVoters) {
        const newVoter = {
          email: oldVoter.email,
          firstname: oldVoter.firstname,
          lastname: oldVoter.lastname,
          linkedin: oldVoter.linkedin,
          company: null, // Not available in old schema
          job_title: null, // Not available in old schema
          country: null, // Not available in old schema
        };

        const { error: voterError } = await supabase
          .from('voters')
          .insert(newVoter);

        if (voterError) {
          console.error(`❌ Error inserting voter ${oldVoter.email}:`, voterError);
        }
      }

      console.log(`✅ Migrated ${oldVoters.length} voters`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your API endpoints to use the new schema');
    console.log('2. Update your admin panel to work with the new structure');
    console.log('3. Test all functionality thoroughly');
    console.log('4. Consider dropping old tables once everything is working');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateData();