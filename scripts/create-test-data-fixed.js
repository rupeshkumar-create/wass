require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data matching the actual schema
const testNominations = [
  // Person nominations
  {
    type: 'person',
    category_group_id: 'individual-awards',
    subcategory_id: 'top-recruiter',
    state: 'approved',
    firstname: 'Sarah',
    lastname: 'Johnson',
    jobtitle: 'Senior Technical Recruiter',
    person_email: 'sarah.johnson@techcorp.com',
    person_linkedin: 'https://linkedin.com/in/sarahjohnson',
    headshot_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    why_me: 'I have successfully placed over 500 tech professionals with a 95% retention rate and built innovative recruitment processes.',
    live_url: 'sarah-johnson-top-recruiter',
    votes: 45
  },
  {
    type: 'person',
    category_group_id: 'individual-awards',
    subcategory_id: 'talent-acquisition-leader',
    state: 'approved',
    firstname: 'David',
    lastname: 'Rodriguez',
    jobtitle: 'Director of Talent Acquisition',
    person_email: 'david.rodriguez@globaltech.com',
    person_linkedin: 'https://linkedin.com/in/davidrodriguez',
    headshot_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    why_me: 'Led talent acquisition for 3 unicorn startups, scaling teams from 10 to 500+ employees while maintaining quality and culture fit.',
    live_url: 'david-rodriguez-talent-leader',
    votes: 38
  },
  {
    type: 'person',
    category_group_id: 'individual-awards',
    subcategory_id: 'recruitment-innovation-award',
    state: 'approved',
    firstname: 'Emily',
    lastname: 'Chen',
    jobtitle: 'Head of Recruitment Innovation',
    person_email: 'emily.chen@innovaterecruit.com',
    person_linkedin: 'https://linkedin.com/in/emilychen',
    headshot_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    why_me: 'Pioneered AI-driven recruitment matching that increased placement success by 300% and reduced time-to-hire by 60%.',
    live_url: 'emily-chen-innovation',
    votes: 52
  },
  {
    type: 'person',
    category_group_id: 'individual-awards',
    subcategory_id: 'rising-star',
    state: 'approved',
    firstname: 'Alex',
    lastname: 'Thompson',
    jobtitle: 'Junior Talent Specialist',
    person_email: 'alex.thompson@futurestaffing.com',
    person_linkedin: 'https://linkedin.com/in/alexthompson',
    headshot_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    why_me: 'At 26, I have already placed 200+ candidates and created a mentorship program that has helped 50+ junior recruiters excel.',
    live_url: 'alex-thompson-rising-star',
    votes: 29
  },

  // Company nominations
  {
    type: 'company',
    category_group_id: 'company-awards',
    subcategory_id: 'best-staffing-firm',
    state: 'approved',
    company_name: 'Elite Staffing Solutions',
    company_website: 'https://elitestaffingsolutions.com',
    company_linkedin: 'https://linkedin.com/company/elitestaffingsolutions',
    logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    why_us: 'We have revolutionized staffing with our proprietary AI matching technology, achieving 98% client satisfaction and 95% candidate retention.',
    live_url: 'elite-staffing-solutions',
    votes: 67
  },
  {
    type: 'company',
    category_group_id: 'company-awards',
    subcategory_id: 'top-ai-driven-platform',
    state: 'approved',
    company_name: 'TalentAI Pro',
    company_website: 'https://talentaipro.com',
    company_linkedin: 'https://linkedin.com/company/talentaipro',
    logo_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
    why_us: 'Our AI platform has processed over 1 million candidate profiles and achieved 40% faster placements with 85% accuracy in skill matching.',
    live_url: 'talentai-pro-platform',
    votes: 43
  },
  {
    type: 'company',
    category_group_id: 'company-awards',
    subcategory_id: 'top-women-led-firm',
    state: 'approved',
    company_name: 'WomenFirst Staffing',
    company_website: 'https://womenfirststaffing.com',
    company_linkedin: 'https://linkedin.com/company/womenfirststaffing',
    logo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    why_us: 'Led by an all-female executive team, we have increased female representation in tech roles by 200% and mentor 500+ women annually.',
    live_url: 'womenfirst-staffing',
    votes: 56
  },

  // Pending nominations for admin testing
  {
    type: 'person',
    category_group_id: 'individual-awards',
    subcategory_id: 'top-recruiter',
    state: 'submitted',
    firstname: 'Michael',
    lastname: 'Brown',
    jobtitle: 'Senior Recruiter',
    person_email: 'michael.brown@staffingpro.com',
    person_linkedin: 'https://linkedin.com/in/michaelbrown',
    headshot_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    why_me: 'Specialized in executive search with 15 years experience and 300+ successful C-level placements.',
    live_url: 'michael-brown-recruiter',
    votes: 0
  },
  {
    type: 'company',
    category_group_id: 'company-awards',
    subcategory_id: 'fastest-growing-firm',
    state: 'submitted',
    company_name: 'RapidGrow Staffing',
    company_website: 'https://rapidgrowstaffing.com',
    company_linkedin: 'https://linkedin.com/company/rapidgrowstaffing',
    logo_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400',
    why_us: 'Grew from 5 to 200 employees in 2 years, expanded to 15 cities, and maintained 99% client satisfaction.',
    live_url: 'rapidgrow-staffing',
    votes: 0
  },

  // Rejected nomination for admin testing
  {
    type: 'person',
    category_group_id: 'individual-awards',
    subcategory_id: 'talent-acquisition-leader',
    state: 'rejected',
    firstname: 'Jane',
    lastname: 'Smith',
    jobtitle: 'Talent Manager',
    person_email: 'jane.smith@example.com',
    person_linkedin: 'https://linkedin.com/in/janesmith',
    headshot_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    why_me: 'Basic recruitment experience with standard processes.',
    live_url: 'jane-smith-talent',
    votes: 0
  }
];

async function createTestData() {
  try {
    console.log('🚀 Creating test data...');

    // Clear existing data
    console.log('🧹 Clearing existing nominations...');
    await supabase.from('nominations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert nominations
    console.log('📝 Inserting nominations...');
    const { data: insertedNominations, error: nominationError } = await supabase
      .from('nominations')
      .insert(testNominations)
      .select();

    if (nominationError) {
      console.error('❌ Error inserting nominations:', nominationError);
      return;
    }

    console.log(`✅ Inserted ${insertedNominations.length} nominations`);

    // Create some votes for approved nominations
    console.log('🗳️ Creating votes for approved nominations...');
    const approvedNominations = insertedNominations.filter(n => n.state === 'approved');
    
    const voters = [
      { firstname: 'Alice', lastname: 'Johnson', email: 'alice.johnson@voter1.com', linkedin: 'https://linkedin.com/in/alicejohnson' },
      { firstname: 'Bob', lastname: 'Wilson', email: 'bob.wilson@voter2.com', linkedin: 'https://linkedin.com/in/bobwilson' },
      { firstname: 'Carol', lastname: 'Davis', email: 'carol.davis@voter3.com', linkedin: 'https://linkedin.com/in/caroldavis' },
      { firstname: 'David', lastname: 'Miller', email: 'david.miller@voter4.com', linkedin: 'https://linkedin.com/in/davidmiller' },
      { firstname: 'Eva', lastname: 'Garcia', email: 'eva.garcia@voter5.com', linkedin: 'https://linkedin.com/in/evagarcia' }
    ];

    const votes = [];
    for (const nomination of approvedNominations) {
      const numVotes = Math.floor(Math.random() * 5) + 1; // 1-5 votes per nomination
      for (let i = 0; i < numVotes; i++) {
        const voter = voters[i % voters.length];
        votes.push({
          nominee_id: nomination.id,
          category: nomination.subcategory_id,
          voter_data: voter,
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Test Browser)',
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    if (votes.length > 0) {
      const { error: voteError } = await supabase
        .from('votes')
        .insert(votes);

      if (voteError) {
        console.error('❌ Error inserting votes:', voteError);
      } else {
        console.log(`✅ Inserted ${votes.length} votes`);
      }
    }

    // Update vote counts
    console.log('🔄 Updating vote counts...');
    for (const nomination of approvedNominations) {
      const voteCount = votes.filter(v => v.nominee_id === nomination.id).length;
      await supabase
        .from('nominations')
        .update({ votes: voteCount })
        .eq('id', nomination.id);
    }

    console.log('🎉 Test data creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Total nominations: ${insertedNominations.length}`);
    console.log(`- Approved: ${insertedNominations.filter(n => n.state === 'approved').length}`);
    console.log(`- Pending: ${insertedNominations.filter(n => n.state === 'submitted').length}`);
    console.log(`- Rejected: ${insertedNominations.filter(n => n.state === 'rejected').length}`);
    console.log(`- Total votes: ${votes.length}`);
    
    console.log('\n🔗 Test URLs:');
    console.log('- Directory: http://localhost:3001/directory');
    console.log('- Admin: http://localhost:3001/admin (passcode: admin123)');
    console.log('- Nominate: http://localhost:3001/nominate');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();