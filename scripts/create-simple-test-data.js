#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSimpleTestData() {
  console.log('🚀 Creating simple test data...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominators').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('voters').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create nominators
    console.log('👤 Creating nominators...');
    const { data: nominators, error: nominatorError } = await supabase
      .from('nominators')
      .insert([
        {
          email: 'nominator1@example.com',
          firstname: 'John',
          lastname: 'Doe',
          linkedin: 'https://linkedin.com/in/johndoe',
          company: 'Acme Recruiting',
          job_title: 'Senior Recruiter'
        },
        {
          email: 'nominator2@example.com',
          firstname: 'Jane',
          lastname: 'Smith',
          linkedin: 'https://linkedin.com/in/janesmith',
          company: 'TechStaff Solutions',
          job_title: 'Talent Acquisition Manager'
        }
      ])
      .select();

    if (nominatorError) {
      console.error('❌ Error creating nominators:', nominatorError);
      return;
    }

    console.log(`✅ Created ${nominators.length} nominators`);

    // Create nominees
    console.log('🎯 Creating nominees...');
    const { data: nominees, error: nomineeError } = await supabase
      .from('nominees')
      .insert([
        {
          type: 'person',
          firstname: 'Alice',
          lastname: 'Johnson',
          person_email: 'alice@techcorp.com',
          jobtitle: 'Senior Technical Recruiter',
          person_linkedin: 'https://linkedin.com/in/alicejohnson',
          headshot_url: 'https://ui-avatars.com/api/?name=Alice+Johnson&size=256&background=3B82F6&color=fff&bold=true&format=png',
          why_me: 'Exceptional track record in technical recruiting with 95% placement success rate.',
          live_url: 'alice-johnson-top-recruiter'
        },
        {
          type: 'person',
          firstname: 'Bob',
          lastname: 'Wilson',
          person_email: 'bob@innovatestaff.com',
          jobtitle: 'CEO',
          person_linkedin: 'https://linkedin.com/in/bobwilson',
          headshot_url: 'https://ui-avatars.com/api/?name=Bob+Wilson&size=256&background=10B981&color=fff&bold=true&format=png',
          why_me: 'Transformed the staffing industry with innovative AI-driven solutions.',
          live_url: 'bob-wilson-executive-leader'
        },
        {
          type: 'company',
          company_name: 'InnovateTech Staffing',
          company_website: 'https://innovatetech.com',
          company_linkedin: 'https://linkedin.com/company/innovatetech',
          logo_url: 'https://ui-avatars.com/api/?name=IT&size=256&background=8B5CF6&color=fff&bold=true&format=png',
          why_us: 'Leading AI-driven staffing platform with 300% growth in 2 years.',
          live_url: 'innovatetech-staffing-ai-platform'
        },
        {
          type: 'company',
          company_name: 'GlobalStaff Solutions',
          company_website: 'https://globalstaff.com',
          company_linkedin: 'https://linkedin.com/company/globalstaff',
          logo_url: 'https://ui-avatars.com/api/?name=GS&size=256&background=EF4444&color=fff&bold=true&format=png',
          why_us: 'Premier women-led staffing firm with offices in 15 countries.',
          live_url: 'globalstaff-women-led-firm'
        }
      ])
      .select();

    if (nomineeError) {
      console.error('❌ Error creating nominees:', nomineeError);
      return;
    }

    console.log(`✅ Created ${nominees.length} nominees`);

    // Create nominations
    console.log('📝 Creating nominations...');
    const { data: nominations, error: nominationError } = await supabase
      .from('nominations')
      .insert([
        {
          state: 'approved',
          category_group_id: 'role-specific',
          subcategory_id: 'top-recruiter',
          votes: 25,
          nominator_id: nominators[0].id,
          nominee_id: nominees[0].id
        },
        {
          state: 'approved',
          category_group_id: 'role-specific',
          subcategory_id: 'top-executive-leader',
          votes: 18,
          nominator_id: nominators[1].id,
          nominee_id: nominees[1].id
        },
        {
          state: 'approved',
          category_group_id: 'innovation-tech',
          subcategory_id: 'top-ai-driven-platform',
          votes: 32,
          nominator_id: nominators[0].id,
          nominee_id: nominees[2].id
        },
        {
          state: 'approved',
          category_group_id: 'culture-impact',
          subcategory_id: 'top-women-led-firm',
          votes: 41,
          nominator_id: nominators[1].id,
          nominee_id: nominees[3].id
        }
      ])
      .select();

    if (nominationError) {
      console.error('❌ Error creating nominations:', nominationError);
      return;
    }

    console.log(`✅ Created ${nominations.length} nominations`);

    // Create some voters and votes
    console.log('🗳️ Creating voters and votes...');
    const { data: voters, error: voterError } = await supabase
      .from('voters')
      .insert([
        {
          email: 'voter1@example.com',
          firstname: 'Mike',
          lastname: 'Brown',
          linkedin: 'https://linkedin.com/in/mikebrown',
          company: 'HR Solutions Inc'
        },
        {
          email: 'voter2@example.com',
          firstname: 'Sarah',
          lastname: 'Davis',
          linkedin: 'https://linkedin.com/in/sarahdavis',
          company: 'Talent Partners LLC'
        }
      ])
      .select();

    if (voterError) {
      console.error('❌ Error creating voters:', voterError);
      return;
    }

    const { data: votes, error: voteError } = await supabase
      .from('votes')
      .insert([
        {
          voter_id: voters[0].id,
          nomination_id: nominations[0].id,
          subcategory_id: 'top-recruiter',
          vote_timestamp: new Date().toISOString()
        },
        {
          voter_id: voters[1].id,
          nomination_id: nominations[2].id,
          subcategory_id: 'top-ai-driven-platform',
          vote_timestamp: new Date().toISOString()
        }
      ])
      .select();

    if (voteError) {
      console.error('❌ Error creating votes:', voteError);
      return;
    }

    console.log(`✅ Created ${votes.length} votes`);

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Nominators: ${nominators.length}`);
    console.log(`   🎯 Nominees: ${nominees.length}`);
    console.log(`   📝 Nominations: ${nominations.length}`);
    console.log(`   🗳️ Voters: ${voters.length}`);
    console.log(`   ✅ Votes: ${votes.length}`);

  } catch (error) {
    console.error('❌ Failed to create test data:', error);
  }
}

createSimpleTestData();