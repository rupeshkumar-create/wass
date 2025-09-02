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

// Comprehensive dummy data
const dummyNominators = [
  { email: 'sarah.johnson@talentacq.com', firstname: 'Sarah', lastname: 'Johnson', linkedin: 'https://linkedin.com/in/sarahjohnson', company: 'TalentAcq Solutions', job_title: 'VP of Talent Acquisition' },
  { email: 'mike.chen@recruitpro.com', firstname: 'Mike', lastname: 'Chen', linkedin: 'https://linkedin.com/in/mikechen', company: 'RecruitPro Inc', job_title: 'Senior Recruiter' },
  { email: 'emily.davis@staffingworld.com', firstname: 'Emily', lastname: 'Davis', linkedin: 'https://linkedin.com/in/emilydavis', company: 'Staffing World', job_title: 'Recruitment Manager' },
  { email: 'david.wilson@hrtech.com', firstname: 'David', lastname: 'Wilson', linkedin: 'https://linkedin.com/in/davidwilson', company: 'HR Tech Solutions', job_title: 'Head of Recruitment' },
  { email: 'lisa.brown@globalstaff.com', firstname: 'Lisa', lastname: 'Brown', linkedin: 'https://linkedin.com/in/lisabrown', company: 'Global Staff Partners', job_title: 'Talent Director' },
  { email: 'james.taylor@innovaterecruit.com', firstname: 'James', lastname: 'Taylor', linkedin: 'https://linkedin.com/in/jamestaylor', company: 'Innovate Recruit', job_title: 'CEO' },
  { email: 'maria.garcia@techtalent.com', firstname: 'Maria', lastname: 'Garcia', linkedin: 'https://linkedin.com/in/mariagarcia', company: 'Tech Talent Hub', job_title: 'Principal Recruiter' },
  { email: 'robert.lee@staffingsolutions.com', firstname: 'Robert', lastname: 'Lee', linkedin: 'https://linkedin.com/in/robertlee', company: 'Staffing Solutions LLC', job_title: 'Managing Director' }
];

const dummyPersonNominees = [
  {
    type: 'person',
    firstname: 'Alexandra',
    lastname: 'Thompson',
    person_email: 'alexandra@techcorp.com',
    jobtitle: 'Senior Technical Recruiter',
    person_linkedin: 'https://linkedin.com/in/alexandrathompson',
    headshot_url: 'https://ui-avatars.com/api/?name=Alexandra+Thompson&size=256&background=3B82F6&color=fff&bold=true&format=png',
    why_me: 'Consistently achieved 95% placement success rate in technical roles with expertise in AI, blockchain, and cloud technologies. Built a network of 10,000+ tech professionals.',
    live_url: 'alexandra-thompson-top-recruiter'
  },
  {
    type: 'person',
    firstname: 'Marcus',
    lastname: 'Rodriguez',
    person_email: 'marcus@innovatestaff.com',
    jobtitle: 'CEO & Founder',
    person_linkedin: 'https://linkedin.com/in/marcusrodriguez',
    headshot_url: 'https://ui-avatars.com/api/?name=Marcus+Rodriguez&size=256&background=10B981&color=fff&bold=true&format=png',
    why_me: 'Transformed the staffing industry by pioneering AI-driven matching algorithms. Grew company from startup to $50M revenue in 5 years.',
    live_url: 'marcus-rodriguez-executive-leader'
  },
  {
    type: 'person',
    firstname: 'Priya',
    lastname: 'Patel',
    person_email: 'priya@talentbridge.com',
    jobtitle: 'Chief Technology Officer',
    person_linkedin: 'https://linkedin.com/in/priyapatel',
    headshot_url: 'https://ui-avatars.com/api/?name=Priya+Patel&size=256&background=8B5CF6&color=fff&bold=true&format=png',
    why_me: 'Leading voice in HR technology with 500K+ LinkedIn followers. Keynote speaker at 50+ industry conferences. Author of "The Future of Recruitment".',
    live_url: 'priya-patel-staffing-influencer'
  },
  {
    type: 'person',
    firstname: 'Jordan',
    lastname: 'Kim',
    person_email: 'jordan@nextgenrecruit.com',
    jobtitle: 'VP of Talent Acquisition',
    person_linkedin: 'https://linkedin.com/in/jordankim',
    headshot_url: 'https://ui-avatars.com/api/?name=Jordan+Kim&size=256&background=EF4444&color=fff&bold=true&format=png',
    why_me: 'At 28, revolutionized talent acquisition at Fortune 500 company. Implemented diversity hiring program that increased underrepresented hires by 300%.',
    live_url: 'jordan-kim-rising-star'
  },
  {
    type: 'person',
    firstname: 'Dr. Rachel',
    lastname: 'Foster',
    person_email: 'rachel@globaltalent.com',
    jobtitle: 'Chief People Officer',
    person_linkedin: 'https://linkedin.com/in/rachelfoster',
    headshot_url: 'https://ui-avatars.com/api/?name=Rachel+Foster&size=256&background=F59E0B&color=fff&bold=true&format=png',
    why_me: 'PhD in Organizational Psychology. Pioneered evidence-based recruitment methodologies adopted by 1000+ companies globally.',
    live_url: 'rachel-foster-thought-leader'
  },
  {
    type: 'person',
    firstname: 'Carlos',
    lastname: 'Mendoza',
    person_email: 'carlos@usastaffing.com',
    jobtitle: 'National Recruitment Director',
    person_linkedin: 'https://linkedin.com/in/carlosmendoza',
    headshot_url: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&size=256&background=6366F1&color=fff&bold=true&format=png',
    why_me: 'Built the largest healthcare staffing network in the USA. Placed 50,000+ healthcare professionals during COVID-19 pandemic.',
    live_url: 'carlos-mendoza-usa-leader'
  },
  {
    type: 'person',
    firstname: 'Elena',
    lastname: 'Kowalski',
    person_email: 'elena@europeantalent.com',
    jobtitle: 'Regional Director Europe',
    person_linkedin: 'https://linkedin.com/in/elenakowalski',
    headshot_url: 'https://ui-avatars.com/api/?name=Elena+Kowalski&size=256&background=EC4899&color=fff&bold=true&format=png',
    why_me: 'Fluent in 7 languages. Established recruitment operations across 15 European countries. Expert in cross-cultural talent acquisition.',
    live_url: 'elena-kowalski-europe-leader'
  },
  {
    type: 'person',
    firstname: 'Raj',
    lastname: 'Sharma',
    person_email: 'raj@globalrecruit.com',
    jobtitle: 'Global Head of Recruitment',
    person_linkedin: 'https://linkedin.com/in/rajsharma',
    headshot_url: 'https://ui-avatars.com/api/?name=Raj+Sharma&size=256&background=14B8A6&color=fff&bold=true&format=png',
    why_me: 'Manages recruitment operations across 40 countries. Built global talent pipeline of 1M+ candidates. Expert in remote workforce solutions.',
    live_url: 'raj-sharma-global-recruiter'
  }
];

const dummyCompanyNominees = [
  {
    type: 'company',
    company_name: 'TechStaff AI',
    company_website: 'https://techstaffai.com',
    company_linkedin: 'https://linkedin.com/company/techstaffai',
    logo_url: 'https://ui-avatars.com/api/?name=TS&size=256&background=3B82F6&color=fff&bold=true&format=png',
    why_us: 'Revolutionary AI platform that matches candidates with 98% accuracy. Reduced time-to-hire by 75% for 500+ clients. Processing 1M+ applications monthly.',
    live_url: 'techstaff-ai-platform'
  },
  {
    type: 'company',
    company_name: 'ClientFirst Recruiting',
    company_website: 'https://clientfirstrecruiting.com',
    company_linkedin: 'https://linkedin.com/company/clientfirst',
    logo_url: 'https://ui-avatars.com/api/?name=CF&size=256&background=10B981&color=fff&bold=true&format=png',
    why_us: 'Award-winning digital experience with 4.9/5 client satisfaction. Mobile-first platform with real-time candidate tracking and AI-powered insights.',
    live_url: 'clientfirst-digital-experience'
  },
  {
    type: 'company',
    company_name: 'WomenLead Staffing',
    company_website: 'https://womenleadstaffing.com',
    company_linkedin: 'https://linkedin.com/company/womenleadstaffing',
    logo_url: 'https://ui-avatars.com/api/?name=WL&size=256&background=EC4899&color=fff&bold=true&format=png',
    why_us: '100% women-owned and operated. 85% female leadership team. Pioneered inclusive hiring practices adopted industry-wide. $100M revenue milestone.',
    live_url: 'womenlead-staffing-firm'
  },
  {
    type: 'company',
    company_name: 'RocketGrowth Staffing',
    company_website: 'https://rocketgrowthstaffing.com',
    company_linkedin: 'https://linkedin.com/company/rocketgrowth',
    logo_url: 'https://ui-avatars.com/api/?name=RG&size=256&background=EF4444&color=fff&bold=true&format=png',
    why_us: 'Fastest growing staffing firm: 2,000% growth in 3 years. Expanded from 1 to 50 offices globally. Placed 100,000+ candidates.',
    live_url: 'rocketgrowth-fastest-growing'
  },
  {
    type: 'company',
    company_name: 'ScaleStaff Solutions',
    company_website: 'https://scalestaffsolutions.com',
    company_linkedin: 'https://linkedin.com/company/scalestaffsolutions',
    logo_url: 'https://ui-avatars.com/api/?name=SS&size=256&background=F59E0B&color=fff&bold=true&format=png',
    why_us: 'Proprietary process handles 10,000+ hires monthly. Automated screening reduces manual work by 90%. Serves Fortune 100 companies exclusively.',
    live_url: 'scalstaff-process-scale'
  },
  {
    type: 'company',
    company_name: 'USA Talent Partners',
    company_website: 'https://usatalentpartners.com',
    company_linkedin: 'https://linkedin.com/company/usatalentpartners',
    logo_url: 'https://ui-avatars.com/api/?name=US&size=256&background=6366F1&color=fff&bold=true&format=png',
    why_us: 'Leading staffing company in USA with offices in all 50 states. $500M annual revenue. Placed 250,000+ Americans in careers.',
    live_url: 'usa-talent-partners-company'
  },
  {
    type: 'company',
    company_name: 'EuroStaff Excellence',
    company_website: 'https://eurostaffexcellence.com',
    company_linkedin: 'https://linkedin.com/company/eurostaffexcellence',
    logo_url: 'https://ui-avatars.com/api/?name=EE&size=256&background=8B5CF6&color=fff&bold=true&format=png',
    why_us: 'Premier European staffing firm operating in 25 countries. Multilingual platform supporting 12 languages. €200M annual revenue.',
    live_url: 'eurostaff-excellence-company'
  },
  {
    type: 'company',
    company_name: 'AI Recruit Pro USA',
    company_website: 'https://airecruitprousa.com',
    company_linkedin: 'https://linkedin.com/company/airecruitprousa',
    logo_url: 'https://ui-avatars.com/api/?name=AR&size=256&background=14B8A6&color=fff&bold=true&format=png',
    why_us: 'Most advanced AI recruiting platform in North America. Patent-pending algorithms. Used by 50+ Fortune 500 companies.',
    live_url: 'ai-recruit-pro-usa-platform'
  }
];

// Category mappings
const categoryMappings = [
  { subcategory_id: 'top-recruiter', group_id: 'role-specific', nominees: [0] }, // Alexandra
  { subcategory_id: 'top-executive-leader', group_id: 'role-specific', nominees: [1] }, // Marcus
  { subcategory_id: 'top-staffing-influencer', group_id: 'role-specific', nominees: [2] }, // Priya
  { subcategory_id: 'rising-star', group_id: 'role-specific', nominees: [3] }, // Jordan
  { subcategory_id: 'thought-leadership', group_id: 'growth-performance', nominees: [4] }, // Rachel
  { subcategory_id: 'top-recruiting-leader-usa', group_id: 'geographic', nominees: [5] }, // Carlos
  { subcategory_id: 'top-recruiting-leader-europe', group_id: 'geographic', nominees: [6] }, // Elena
  { subcategory_id: 'top-global-recruiter', group_id: 'geographic', nominees: [7] }, // Raj
  
  // Companies
  { subcategory_id: 'top-ai-driven-platform', group_id: 'innovation-tech', nominees: [0], isCompany: true }, // TechStaff AI
  { subcategory_id: 'top-digital-experience', group_id: 'innovation-tech', nominees: [1], isCompany: true }, // ClientFirst
  { subcategory_id: 'top-women-led-firm', group_id: 'culture-impact', nominees: [2], isCompany: true }, // WomenLead
  { subcategory_id: 'fastest-growing-firm', group_id: 'culture-impact', nominees: [3], isCompany: true }, // RocketGrowth
  { subcategory_id: 'best-process-at-scale', group_id: 'growth-performance', nominees: [4], isCompany: true }, // ScaleStaff
  { subcategory_id: 'top-staffing-company-usa', group_id: 'geographic', nominees: [5], isCompany: true }, // USA Talent
  { subcategory_id: 'top-staffing-company-europe', group_id: 'geographic', nominees: [6], isCompany: true }, // EuroStaff
  { subcategory_id: 'top-ai-platform-usa', group_id: 'geographic', nominees: [7], isCompany: true }, // AI Recruit Pro
];

async function createComprehensiveDummyData() {
  console.log('🚀 Creating comprehensive dummy data for World Staffing Awards 2026...');

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
      .insert(dummyNominators)
      .select();

    if (nominatorError) {
      console.error('❌ Error creating nominators:', nominatorError);
      return;
    }
    console.log(`✅ Created ${nominators.length} nominators`);

    // Create person nominees
    console.log('🎯 Creating person nominees...');
    const { data: personNominees, error: personError } = await supabase
      .from('nominees')
      .insert(dummyPersonNominees)
      .select();

    if (personError) {
      console.error('❌ Error creating person nominees:', personError);
      return;
    }
    console.log(`✅ Created ${personNominees.length} person nominees`);

    // Create company nominees
    console.log('🏢 Creating company nominees...');
    const { data: companyNominees, error: companyError } = await supabase
      .from('nominees')
      .insert(dummyCompanyNominees)
      .select();

    if (companyError) {
      console.error('❌ Error creating company nominees:', companyError);
      return;
    }
    console.log(`✅ Created ${companyNominees.length} company nominees`);

    // Create nominations
    console.log('📝 Creating nominations...');
    const nominations = [];
    
    for (const mapping of categoryMappings) {
      for (const nomineeIndex of mapping.nominees) {
        const nominee = mapping.isCompany ? companyNominees[nomineeIndex] : personNominees[nomineeIndex];
        const nominator = nominators[Math.floor(Math.random() * nominators.length)];
        
        nominations.push({
          state: 'approved',
          category_group_id: mapping.group_id,
          subcategory_id: mapping.subcategory_id,
          votes: Math.floor(Math.random() * 100) + 10, // Random votes between 10-109
          nominator_id: nominator.id,
          nominee_id: nominee.id
        });
      }
    }

    const { data: createdNominations, error: nominationError } = await supabase
      .from('nominations')
      .insert(nominations)
      .select();

    if (nominationError) {
      console.error('❌ Error creating nominations:', nominationError);
      return;
    }
    console.log(`✅ Created ${createdNominations.length} nominations`);

    // Create voters
    console.log('🗳️ Creating voters...');
    const voters = [
      { email: 'voter1@techcorp.com', firstname: 'Jennifer', lastname: 'Adams', linkedin: 'https://linkedin.com/in/jenniferadams', company: 'TechCorp Inc' },
      { email: 'voter2@hrpro.com', firstname: 'Michael', lastname: 'Brown', linkedin: 'https://linkedin.com/in/michaelbrown', company: 'HR Pro Solutions' },
      { email: 'voter3@talentfirm.com', firstname: 'Sarah', lastname: 'Wilson', linkedin: 'https://linkedin.com/in/sarahwilson', company: 'Talent Firm LLC' },
      { email: 'voter4@recruitech.com', firstname: 'David', lastname: 'Miller', linkedin: 'https://linkedin.com/in/davidmiller', company: 'RecruTech Systems' },
      { email: 'voter5@staffpro.com', firstname: 'Lisa', lastname: 'Garcia', linkedin: 'https://linkedin.com/in/lisagarcia', company: 'Staff Pro International' },
      { email: 'voter6@hiringtech.com', firstname: 'John', lastname: 'Martinez', linkedin: 'https://linkedin.com/in/johnmartinez', company: 'Hiring Tech Solutions' },
      { email: 'voter7@talentbridge.com', firstname: 'Amanda', lastname: 'Johnson', linkedin: 'https://linkedin.com/in/amandajohnson', company: 'Talent Bridge Corp' },
      { email: 'voter8@recruitmax.com', firstname: 'Chris', lastname: 'Davis', linkedin: 'https://linkedin.com/in/chrisdavis', company: 'RecruitMax Global' }
    ];

    const { data: createdVoters, error: voterError } = await supabase
      .from('voters')
      .insert(voters)
      .select();

    if (voterError) {
      console.error('❌ Error creating voters:', voterError);
      return;
    }
    console.log(`✅ Created ${createdVoters.length} voters`);

    // Create votes (random distribution)
    console.log('✅ Creating votes...');
    const votes = [];
    
    for (let i = 0; i < 50; i++) { // Create 50 random votes
      const randomNomination = createdNominations[Math.floor(Math.random() * createdNominations.length)];
      const randomVoter = createdVoters[Math.floor(Math.random() * createdVoters.length)];
      
      // Check if this voter already voted in this category
      const existingVote = votes.find(v => 
        v.voter_id === randomVoter.id && v.subcategory_id === randomNomination.subcategory_id
      );
      
      if (!existingVote) {
        votes.push({
          voter_id: randomVoter.id,
          nomination_id: randomNomination.id,
          subcategory_id: randomNomination.subcategory_id,
          vote_timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
        });
      }
    }

    const { data: createdVotes, error: voteError } = await supabase
      .from('votes')
      .insert(votes)
      .select();

    if (voteError) {
      console.error('❌ Error creating votes:', voteError);
      return;
    }
    console.log(`✅ Created ${createdVotes.length} votes`);

    console.log('\n🎉 Comprehensive dummy data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Nominators: ${nominators.length}`);
    console.log(`   🎯 Person Nominees: ${personNominees.length}`);
    console.log(`   🏢 Company Nominees: ${companyNominees.length}`);
    console.log(`   📝 Nominations: ${createdNominations.length}`);
    console.log(`   🗳️ Voters: ${createdVoters.length}`);
    console.log(`   ✅ Votes: ${createdVotes.length}`);

    console.log('\n🌐 Ready for testing at:');
    console.log('   - Homepage: http://localhost:3000');
    console.log('   - Directory: http://localhost:3000/directory');
    console.log('   - Nomination Form: http://localhost:3000/nominate');
    console.log('   - Admin Panel: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Failed to create comprehensive dummy data:', error);
  }
}

createComprehensiveDummyData();