#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Correct categories from the image
const CORRECT_CATEGORIES = [
  // Role-Specific Excellence - Recognizing outstanding individual contributors
  { id: 'top-recruiter', group: 'role-specific-excellence', title: 'Top Recruiter', type: 'person' },
  { id: 'top-executive-leader', group: 'role-specific-excellence', title: 'Top Executive Leader', type: 'person' },
  { id: 'rising-star-under-30', group: 'role-specific-excellence', title: 'Rising Star (Under 30)', type: 'person' },
  { id: 'top-staffing-influencer', group: 'role-specific-excellence', title: 'Top Staffing Influencer', type: 'person' },
  
  // Innovation & Technology - Leading the future of staffing technology
  { id: 'top-ai-driven-staffing-platform', group: 'innovation-technology', title: 'Top AI-Driven Staffing Platform', type: 'company' },
  { id: 'top-digital-experience-for-clients', group: 'innovation-technology', title: 'Top Digital Experience for Clients', type: 'company' },
  
  // Culture & Impact - Making a positive difference in the industry
  { id: 'top-women-led-staffing-firm', group: 'culture-impact', title: 'Top Women-Led Staffing Firm', type: 'company' },
  { id: 'fastest-growing-staffing-firm', group: 'culture-impact', title: 'Fastest Growing Staffing Firm', type: 'company' },
  
  // Growth & Performance - Excellence in operations and thought leadership
  { id: 'best-staffing-process-at-scale', group: 'growth-performance', title: 'Best Staffing Process at Scale', type: 'company' },
  { id: 'thought-leadership-and-influence', group: 'growth-performance', title: 'Thought Leadership & Influence', type: 'person' },
  
  // Geographic Excellence - Regional and global recognition
  { id: 'top-staffing-company-usa', group: 'geographic-excellence', title: 'Top Staffing Company - USA', type: 'company' },
  { id: 'top-staffing-company-europe', group: 'geographic-excellence', title: 'Top Staffing Company - Europe', type: 'company' },
  { id: 'top-global-recruiter', group: 'geographic-excellence', title: 'Top Global Recruiter', type: 'person' },
  
  // Special Recognition - Unique contributions to the industry
  { id: 'special-recognition', group: 'special-recognition', title: 'Special Recognition', type: 'person' }
];

async function createCorrectCategoryData() {
  try {
    console.log('🎯 Creating dummy data with correct categories from image...\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominators').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('voters').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('hubspot_outbox').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create realistic nominators
    console.log('👥 Creating nominators...');
    const nominators = [];
    const nominatorData = [
      {
        email: 'sarah.johnson@techcorp.com',
        firstname: 'Sarah',
        lastname: 'Johnson',
        linkedin: 'https://linkedin.com/in/sarahjohnson',
        company: 'TechCorp Solutions',
        job_title: 'Head of Talent Acquisition',
        phone: '+1-555-0101',
        country: 'United States'
      },
      {
        email: 'michael.chen@globalhr.co.uk',
        firstname: 'Michael',
        lastname: 'Chen',
        linkedin: 'https://linkedin.com/in/michaelchen',
        company: 'Global HR Partners',
        job_title: 'Senior Recruitment Manager',
        phone: '+44-20-7946-0958',
        country: 'United Kingdom'
      },
      {
        email: 'emma.williams@startupinc.com',
        firstname: 'Emma',
        lastname: 'Williams',
        linkedin: 'https://linkedin.com/in/emmawilliams',
        company: 'StartupInc',
        job_title: 'People Operations Lead',
        phone: '+1-555-0102',
        country: 'Canada'
      },
      {
        email: 'david.brown@recruitpro.au',
        firstname: 'David',
        lastname: 'Brown',
        linkedin: 'https://linkedin.com/in/davidbrown',
        company: 'RecruitPro Australia',
        job_title: 'Director of Recruitment',
        phone: '+61-2-9876-5432',
        country: 'Australia'
      },
      {
        email: 'lisa.garcia@talentfirst.com',
        firstname: 'Lisa',
        lastname: 'Garcia',
        linkedin: 'https://linkedin.com/in/lisagarcia',
        company: 'TalentFirst Solutions',
        job_title: 'VP of Human Resources',
        phone: '+1-555-0103',
        country: 'United States'
      }
    ];

    for (const nomData of nominatorData) {
      const { data, error } = await supabase
        .from('nominators')
        .insert(nomData)
        .select()
        .single();

      if (error) throw error;
      nominators.push(data);
    }

    // Create nominees and nominations for each category
    console.log('🏆 Creating nominees and nominations...');
    const nominees = [];
    const nominations = [];

    for (let i = 0; i < CORRECT_CATEGORIES.length; i++) {
      const category = CORRECT_CATEGORIES[i];
      
      // Create 2-3 nominees per category
      const numNominees = 2 + (i % 2); // 2 or 3 nominees per category
      
      for (let j = 1; j <= numNominees; j++) {
        const nomineeIndex = i * 3 + j;
        const nominator = nominators[j % nominators.length];
        
        let nominee;
        if (category.type === 'person') {
          // Person nominee
          nominee = {
            type: 'person',
            firstname: `${category.title.replace(/[^A-Za-z]/g, '')}${nomineeIndex}`,
            lastname: `Professional${nomineeIndex}`,
            person_email: `${category.id.replace(/-/g, '')}${nomineeIndex}@example.com`,
            person_linkedin: `https://linkedin.com/in/${category.id.replace(/-/g, '')}${nomineeIndex}`,
            person_phone: `+1-555-${(1000 + nomineeIndex).toString()}`,
            jobtitle: `Senior ${category.title}`,
            person_company: `Excellence Corp ${nomineeIndex}`,
            person_country: 'United States',
            headshot_url: `https://images.unsplash.com/photo-${1500000000 + nomineeIndex}?w=400&h=400&fit=crop&crop=face`,
            why_me: `I am an exceptional ${category.title.toLowerCase()} with over 10 years of experience in the staffing industry. My innovative approaches and dedication to excellence have resulted in outstanding achievements and industry recognition.`,
            live_url: `https://${category.id.replace(/-/g, '')}${nomineeIndex}.example.com`,
            bio: `Experienced ${category.title.toLowerCase()} with a passion for excellence in staffing and recruitment.`,
            achievements: `Winner of multiple industry awards, thought leader in ${category.title.toLowerCase()}, and mentor to emerging professionals.`
          };
        } else {
          // Company nominee
          nominee = {
            type: 'company',
            company_name: `${category.title} Excellence ${nomineeIndex}`,
            company_domain: `${category.id.replace(/-/g, '')}${nomineeIndex}.com`,
            company_website: `https://${category.id.replace(/-/g, '')}${nomineeIndex}.com`,
            company_linkedin: `https://linkedin.com/company/${category.id.replace(/-/g, '')}${nomineeIndex}`,
            company_phone: `+1-555-${(2000 + nomineeIndex).toString()}`,
            company_country: 'United States',
            company_size: '100-500',
            company_industry: 'Staffing & Recruitment',
            logo_url: `https://images.unsplash.com/photo-${1600000000 + nomineeIndex}?w=400&h=400&fit=crop`,
            why_us: `We are a leading ${category.title.toLowerCase()} with innovative solutions and exceptional client service. Our team of experts delivers outstanding results and has been recognized for excellence in the staffing industry.`,
            live_url: `https://${category.id.replace(/-/g, '')}${nomineeIndex}.com`,
            bio: `Leading company specializing in ${category.title.toLowerCase()} services and solutions.`,
            achievements: `Industry leader with multiple certifications, awards for excellence, and recognition as a top performer in ${category.title.toLowerCase()}.`
          };
        }

        const { data: nomineeData, error: nomineeError } = await supabase
          .from('nominees')
          .insert(nominee)
          .select()
          .single();

        if (nomineeError) throw nomineeError;
        nominees.push(nomineeData);

        // Create nomination linking nominator to nominee
        const nomination = {
          nominator_id: nominator.id,
          nominee_id: nomineeData.id,
          category_group_id: category.group,
          subcategory_id: category.id,
          state: j === 1 ? 'approved' : (j === 2 ? 'submitted' : 'approved'), // Mix of states
          votes: 0
        };

        const { data: nominationData, error: nominationError } = await supabase
          .from('nominations')
          .insert(nomination)
          .select()
          .single();

        if (nominationError) throw nominationError;
        nominations.push(nominationData);

        console.log(`✅ Created ${category.type} nomination: ${nomineeData.type === 'person' ? `${nomineeData.firstname} ${nomineeData.lastname}` : nomineeData.company_name} for ${category.id}`);
      }
    }

    // Create voters and votes
    console.log('\n🗳️ Creating voters and votes...');
    const voters = [];
    
    const voterData = [
      {
        email: 'john.smith@techstartup.com',
        firstname: 'John',
        lastname: 'Smith',
        linkedin: 'https://linkedin.com/in/johnsmith',
        company: 'TechStartup Inc',
        job_title: 'CTO',
        country: 'United States'
      },
      {
        email: 'maria.gonzalez@consulting.com',
        firstname: 'Maria',
        lastname: 'Gonzalez',
        linkedin: 'https://linkedin.com/in/mariagonzalez',
        company: 'Global Consulting',
        job_title: 'Partner',
        country: 'Spain'
      },
      {
        email: 'robert.kim@fintech.co',
        firstname: 'Robert',
        lastname: 'Kim',
        linkedin: 'https://linkedin.com/in/robertkim',
        company: 'FinTech Solutions',
        job_title: 'Head of People',
        country: 'South Korea'
      },
      {
        email: 'anna.mueller@techgmbh.de',
        firstname: 'Anna',
        lastname: 'Mueller',
        linkedin: 'https://linkedin.com/in/annamueller',
        company: 'Tech GmbH',
        job_title: 'HR Director',
        country: 'Germany'
      },
      {
        email: 'james.wilson@innovation.ca',
        firstname: 'James',
        lastname: 'Wilson',
        linkedin: 'https://linkedin.com/in/jameswilson',
        company: 'Innovation Labs',
        job_title: 'Talent Manager',
        country: 'Canada'
      }
    ];

    for (const voterInfo of voterData) {
      const { data, error } = await supabase
        .from('voters')
        .insert(voterInfo)
        .select()
        .single();

      if (error) throw error;
      voters.push(data);
    }

    // Create votes for approved nominations
    const approvedNominations = nominations.filter(n => n.state === 'approved');
    
    for (let i = 0; i < Math.min(50, voters.length * 10); i++) {
      const voter = voters[i % voters.length];
      const nomination = approvedNominations[i % approvedNominations.length];
      
      // Check if voter already voted in this subcategory
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_id', voter.id)
        .eq('subcategory_id', nomination.subcategory_id)
        .single();

      if (!existingVote) {
        const vote = {
          voter_id: voter.id,
          nomination_id: nomination.id,
          subcategory_id: nomination.subcategory_id,
          vote_timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Test Browser)'
        };

        const { error: voteError } = await supabase
          .from('votes')
          .insert(vote);

        if (voteError && !voteError.message.includes('duplicate')) {
          console.warn('Vote error:', voteError.message);
        }
      }
    }

    console.log('\n✅ Correct category data created successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${nominators.length} nominators`);
    console.log(`   - ${nominees.length} nominees`);
    console.log(`   - ${nominations.length} nominations`);
    console.log(`   - ${voters.length} voters`);
    console.log(`   - Votes (will be counted by triggers)`);

    // Verify data
    console.log('\n🔍 Verifying data...');
    
    const { data: publicNominees } = await supabase
      .from('public_nominees')
      .select('*');
    
    const { data: adminNominations } = await supabase
      .from('admin_nominations')
      .select('*');

    const { data: votingStats } = await supabase
      .from('voting_stats')
      .select('*');

    console.log(`✅ Public nominees view: ${publicNominees?.length || 0} records`);
    console.log(`✅ Admin nominations view: ${adminNominations?.length || 0} records`);
    console.log(`✅ Voting stats view: ${votingStats?.length || 0} records`);

    // Show category coverage
    console.log('\n📂 Category Coverage:');
    const categoryStats = {};
    publicNominees?.forEach(nominee => {
      categoryStats[nominee.subcategory_id] = (categoryStats[nominee.subcategory_id] || 0) + 1;
    });

    CORRECT_CATEGORIES.forEach(cat => {
      const count = categoryStats[cat.id] || 0;
      console.log(`   ${cat.title}: ${count} nominees`);
    });

    console.log('\n🎉 Correct category data creation completed!');
    console.log('\n🌐 Ready for testing at http://localhost:3000');

  } catch (error) {
    console.error('❌ Error creating correct category data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createCorrectCategoryData();
}

module.exports = { createCorrectCategoryData };