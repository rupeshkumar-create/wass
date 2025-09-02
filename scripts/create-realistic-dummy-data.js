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

// Realistic data for manual testing
const realisticNominators = [
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

const realisticPersonNominees = [
  {
    type: 'person',
    firstname: 'Alexandra',
    lastname: 'Thompson',
    person_email: 'alexandra.thompson@email.com',
    person_linkedin: 'https://linkedin.com/in/alexandrathompson',
    person_phone: '+1-555-0201',
    jobtitle: 'Senior Technical Recruiter',
    person_company: 'Microsoft',
    person_country: 'United States',
    headshot_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face',
    why_me: 'With over 8 years of experience in technical recruitment, I have successfully placed over 500 engineers at top tech companies. My innovative sourcing strategies and commitment to candidate experience have resulted in a 95% offer acceptance rate and numerous industry recognitions.',
    live_url: 'https://alexandrathompson.dev',
    bio: 'Passionate technical recruiter specializing in software engineering and AI talent acquisition.',
    achievements: 'Winner of Tech Recruiter of the Year 2023, Featured speaker at RecTech Conference, Published author on modern recruitment strategies.',
    subcategory_id: 'top-recruiter',
    category_group_id: 'individual-awards'
  },
  {
    type: 'person',
    firstname: 'James',
    lastname: 'Rodriguez',
    person_email: 'james.rodriguez@email.com',
    person_linkedin: 'https://linkedin.com/in/jamesrodriguez',
    person_phone: '+1-555-0202',
    jobtitle: 'Diversity & Inclusion Specialist',
    person_company: 'Google',
    person_country: 'United States',
    headshot_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    why_me: 'I have led transformative D&I initiatives that increased underrepresented talent hiring by 300% over two years. My data-driven approach and inclusive recruitment practices have become industry benchmarks.',
    live_url: 'https://jamesrodriguez.com',
    bio: 'D&I champion with expertise in building inclusive hiring practices and diverse talent pipelines.',
    achievements: 'Diversity Leader Award 2023, TEDx speaker on inclusive recruitment, Mentor to 50+ underrepresented professionals.',
    subcategory_id: 'best-diversity-inclusion-champion',
    category_group_id: 'individual-awards'
  },
  {
    type: 'person',
    firstname: 'Priya',
    lastname: 'Patel',
    person_email: 'priya.patel@email.com',
    person_linkedin: 'https://linkedin.com/in/priyapatel',
    person_phone: '+44-20-7946-0959',
    jobtitle: 'Head of Talent Analytics',
    person_company: 'Unilever',
    person_country: 'United Kingdom',
    headshot_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    why_me: 'I revolutionized talent acquisition through advanced analytics, reducing time-to-hire by 40% and improving quality of hire metrics by 60%. My predictive models for candidate success are now used across 15 countries.',
    live_url: 'https://priyapatel.analytics',
    bio: 'Data scientist turned people analytics expert, transforming recruitment through AI and machine learning.',
    achievements: 'Analytics Innovation Award 2023, Published researcher in HR Analytics Journal, Keynote speaker at People Analytics Summit.',
    subcategory_id: 'best-people-analytics-professional',
    category_group_id: 'individual-awards'
  },
  {
    type: 'person',
    firstname: 'Marcus',
    lastname: 'Johnson',
    person_email: 'marcus.johnson@email.com',
    person_linkedin: 'https://linkedin.com/in/marcusjohnson',
    person_phone: '+1-555-0203',
    jobtitle: 'Freelance Executive Recruiter',
    person_company: 'Independent',
    person_country: 'United States',
    headshot_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    why_me: 'As an independent recruiter, I have built a network of 10,000+ professionals and successfully placed C-level executives at Fortune 500 companies. My personalized approach and industry expertise deliver exceptional results.',
    live_url: 'https://marcusjohnsonexec.com',
    bio: 'Executive search specialist with 12+ years experience placing senior leadership across multiple industries.',
    achievements: 'Top Freelance Recruiter 2023, 98% client satisfaction rate, Featured in Forbes "Top Recruiters to Watch".',
    subcategory_id: 'best-freelance-recruiter',
    category_group_id: 'individual-awards'
  },
  {
    type: 'person',
    firstname: 'Sophie',
    lastname: 'Anderson',
    person_email: 'sophie.anderson@email.com',
    person_linkedin: 'https://linkedin.com/in/sophieanderson',
    person_phone: '+61-2-9876-5433',
    jobtitle: 'Employer Brand Manager',
    person_company: 'Atlassian',
    person_country: 'Australia',
    headshot_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    why_me: 'I transformed our employer brand, resulting in a 250% increase in quality applications and recognition as "Best Place to Work" in three countries. My creative campaigns have won multiple industry awards.',
    live_url: 'https://sophieanderson.brand',
    bio: 'Creative employer branding expert specializing in authentic storytelling and candidate experience design.',
    achievements: 'Employer Brand Excellence Award 2023, Campaign of the Year winner, Featured in Harvard Business Review.',
    subcategory_id: 'best-employer-branding-professional',
    category_group_id: 'individual-awards'
  }
];

const realisticCompanyNominees = [
  {
    type: 'company',
    company_name: 'TalentFlow Innovations',
    company_domain: 'talentflow.com',
    company_website: 'https://talentflow.com',
    company_linkedin: 'https://linkedin.com/company/talentflow',
    company_phone: '+1-555-0301',
    company_country: 'United States',
    company_size: '50-200',
    company_industry: 'HR Technology',
    logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
    why_us: 'We are revolutionizing recruitment with AI-powered matching technology that has helped 500+ companies reduce time-to-hire by 50% while improving candidate quality. Our platform processes over 1 million applications monthly.',
    live_url: 'https://talentflow.com',
    bio: 'Leading recruitment technology provider specializing in AI-driven talent acquisition solutions.',
    achievements: 'TechCrunch Startup of the Year 2023, $50M Series B funding, Used by Fortune 500 companies globally.',
    subcategory_id: 'best-recruitment-technology-provider',
    category_group_id: 'company-awards'
  },
  {
    type: 'company',
    company_name: 'Global Talent Partners',
    company_domain: 'globaltalentpartners.com',
    company_website: 'https://globaltalentpartners.com',
    company_linkedin: 'https://linkedin.com/company/globaltalentpartners',
    company_phone: '+44-20-7946-0960',
    company_country: 'United Kingdom',
    company_size: '200-500',
    company_industry: 'Recruitment Services',
    logo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop',
    why_us: 'With offices in 15 countries, we have successfully placed over 10,000 professionals in the past year alone. Our specialized teams and global network deliver exceptional results across all industries.',
    live_url: 'https://globaltalentpartners.com',
    bio: 'International recruitment agency with expertise in executive search and specialized talent acquisition.',
    achievements: 'Recruitment Agency of the Year 2023, 95% client retention rate, Expanded to 5 new markets in 2023.',
    subcategory_id: 'best-recruitment-agency',
    category_group_id: 'company-awards'
  },
  {
    type: 'company',
    company_name: 'Netflix Talent Acquisition Team',
    company_domain: 'netflix.com',
    company_website: 'https://jobs.netflix.com',
    company_linkedin: 'https://linkedin.com/company/netflix',
    company_phone: '+1-555-0302',
    company_country: 'United States',
    company_size: '10000+',
    company_industry: 'Entertainment Technology',
    logo_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
    why_us: 'Our in-house recruitment team has built a world-class workforce of 15,000+ employees across 190 countries. We have pioneered innovative hiring practices and set new standards for candidate experience in tech.',
    live_url: 'https://jobs.netflix.com',
    bio: 'Award-winning in-house talent acquisition team known for innovative hiring practices and exceptional candidate experience.',
    achievements: 'Best In-House Team 2023, Glassdoor Best Places to Work, Industry leader in diversity hiring.',
    subcategory_id: 'best-in-house-recruitment-team',
    category_group_id: 'company-awards'
  },
  {
    type: 'company',
    company_name: 'RecruiterAcademy',
    company_domain: 'recruiteracademy.com',
    company_website: 'https://recruiteracademy.com',
    company_linkedin: 'https://linkedin.com/company/recruiteracademy',
    company_phone: '+1-555-0303',
    company_country: 'United States',
    company_size: '20-50',
    company_industry: 'Education & Training',
    logo_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=400&fit=crop',
    why_us: 'We have trained over 5,000 recruitment professionals through our comprehensive certification programs. Our graduates consistently outperform industry benchmarks and lead successful recruitment teams worldwide.',
    live_url: 'https://recruiteracademy.com',
    bio: 'Premier recruitment training provider offering certification programs and professional development for talent acquisition professionals.',
    achievements: 'Training Provider of the Year 2023, 98% course completion rate, Partnerships with 100+ recruitment agencies.',
    subcategory_id: 'best-recruitment-training-provider',
    category_group_id: 'company-awards'
  },
  {
    type: 'company',
    company_name: 'Shopify Diversity Initiative',
    company_domain: 'shopify.com',
    company_website: 'https://shopify.com/careers/diversity',
    company_linkedin: 'https://linkedin.com/company/shopify',
    company_phone: '+1-555-0304',
    company_country: 'Canada',
    company_size: '10000+',
    company_industry: 'E-commerce Technology',
    logo_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=400&fit=crop',
    why_us: 'Our comprehensive diversity initiative has increased underrepresented talent by 400% over three years. We have invested $25M in diversity programs and partnerships, setting new industry standards.',
    live_url: 'https://shopify.com/careers/diversity',
    bio: 'Groundbreaking diversity and inclusion initiative transforming tech hiring through innovative programs and partnerships.',
    achievements: 'Diversity Initiative of the Year 2023, $25M investment in D&I programs, Featured case study in Harvard Business School.',
    subcategory_id: 'best-diversity-inclusion-initiative',
    category_group_id: 'company-awards'
  }
];

async function createRealisticDummyData() {
  try {
    console.log('🎯 Creating realistic dummy data for manual testing...\n');

    // Create realistic nominators
    console.log('👥 Creating realistic nominators...');
    const createdNominators = [];
    
    for (const nominatorData of realisticNominators) {
      const { data: existingNominator } = await supabase
        .from('nominators')
        .select('*')
        .eq('email', nominatorData.email)
        .single();

      if (!existingNominator) {
        const { data, error } = await supabase
          .from('nominators')
          .insert(nominatorData)
          .select()
          .single();

        if (error) {
          console.error(`Error creating nominator ${nominatorData.email}:`, error);
        } else {
          createdNominators.push(data);
          console.log(`✅ Created nominator: ${data.firstname} ${data.lastname} (${data.email})`);
        }
      } else {
        createdNominators.push(existingNominator);
        console.log(`ℹ️  Nominator already exists: ${existingNominator.firstname} ${existingNominator.lastname}`);
      }
    }

    // Create realistic person nominees and nominations
    console.log('\n🏆 Creating realistic person nominees and nominations...');
    
    for (let i = 0; i < realisticPersonNominees.length; i++) {
      const nomineeData = realisticPersonNominees[i];
      const nominator = createdNominators[i % createdNominators.length];

      // Create nominee
      const { data: nominee, error: nomineeError } = await supabase
        .from('nominees')
        .insert({
          type: nomineeData.type,
          firstname: nomineeData.firstname,
          lastname: nomineeData.lastname,
          person_email: nomineeData.person_email,
          person_linkedin: nomineeData.person_linkedin,
          person_phone: nomineeData.person_phone,
          jobtitle: nomineeData.jobtitle,
          person_company: nomineeData.person_company,
          person_country: nomineeData.person_country,
          headshot_url: nomineeData.headshot_url,
          why_me: nomineeData.why_me,
          live_url: nomineeData.live_url,
          bio: nomineeData.bio,
          achievements: nomineeData.achievements
        })
        .select()
        .single();

      if (nomineeError) {
        console.error(`Error creating nominee ${nomineeData.firstname} ${nomineeData.lastname}:`, nomineeError);
        continue;
      }

      // Create nomination
      const { data: nomination, error: nominationError } = await supabase
        .from('nominations')
        .insert({
          nominator_id: nominator.id,
          nominee_id: nominee.id,
          category_group_id: nomineeData.category_group_id,
          subcategory_id: nomineeData.subcategory_id,
          state: 'approved', // Approve for visibility
          votes: Math.floor(Math.random() * 50) + 10 // Random votes between 10-60
        })
        .select()
        .single();

      if (nominationError) {
        console.error(`Error creating nomination for ${nomineeData.firstname} ${nomineeData.lastname}:`, nominationError);
      } else {
        console.log(`✅ Created person nomination: ${nominee.firstname} ${nominee.lastname} for ${nomineeData.subcategory_id}`);
      }
    }

    // Create realistic company nominees and nominations
    console.log('\n🏢 Creating realistic company nominees and nominations...');
    
    for (let i = 0; i < realisticCompanyNominees.length; i++) {
      const nomineeData = realisticCompanyNominees[i];
      const nominator = createdNominators[i % createdNominators.length];

      // Create nominee
      const { data: nominee, error: nomineeError } = await supabase
        .from('nominees')
        .insert({
          type: nomineeData.type,
          company_name: nomineeData.company_name,
          company_domain: nomineeData.company_domain,
          company_website: nomineeData.company_website,
          company_linkedin: nomineeData.company_linkedin,
          company_phone: nomineeData.company_phone,
          company_country: nomineeData.company_country,
          company_size: nomineeData.company_size,
          company_industry: nomineeData.company_industry,
          logo_url: nomineeData.logo_url,
          why_us: nomineeData.why_us,
          live_url: nomineeData.live_url,
          bio: nomineeData.bio,
          achievements: nomineeData.achievements
        })
        .select()
        .single();

      if (nomineeError) {
        console.error(`Error creating company nominee ${nomineeData.company_name}:`, nomineeError);
        continue;
      }

      // Create nomination
      const { data: nomination, error: nominationError } = await supabase
        .from('nominations')
        .insert({
          nominator_id: nominator.id,
          nominee_id: nominee.id,
          category_group_id: nomineeData.category_group_id,
          subcategory_id: nomineeData.subcategory_id,
          state: 'approved', // Approve for visibility
          votes: Math.floor(Math.random() * 100) + 20 // Random votes between 20-120
        })
        .select()
        .single();

      if (nominationError) {
        console.error(`Error creating nomination for ${nomineeData.company_name}:`, nominationError);
      } else {
        console.log(`✅ Created company nomination: ${nominee.company_name} for ${nomineeData.subcategory_id}`);
      }
    }

    // Create some realistic voters
    console.log('\n🗳️ Creating realistic voters...');
    const realisticVoters = [
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
      }
    ];

    for (const voterData of realisticVoters) {
      const { data: existingVoter } = await supabase
        .from('voters')
        .select('*')
        .eq('email', voterData.email)
        .single();

      if (!existingVoter) {
        const { data, error } = await supabase
          .from('voters')
          .insert(voterData)
          .select()
          .single();

        if (error) {
          console.error(`Error creating voter ${voterData.email}:`, error);
        } else {
          console.log(`✅ Created voter: ${data.firstname} ${data.lastname} (${data.email})`);
        }
      }
    }

    console.log('\n🔍 Verifying realistic data...');
    
    const { data: publicNominees } = await supabase
      .from('public_nominees')
      .select('*')
      .order('votes', { ascending: false });
    
    const { data: adminNominations } = await supabase
      .from('admin_nominations')
      .select('*')
      .order('created_at', { ascending: false });

    console.log(`✅ Total public nominees: ${publicNominees?.length || 0}`);
    console.log(`✅ Total admin nominations: ${adminNominations?.length || 0}`);

    if (publicNominees && publicNominees.length > 0) {
      console.log('\n🏆 Top nominees by votes:');
      publicNominees.slice(0, 5).forEach((nominee, index) => {
        console.log(`   ${index + 1}. ${nominee.display_name} (${nominee.subcategory_id}) - ${nominee.votes} votes`);
      });
    }

    console.log('\n🎉 Realistic dummy data creation completed!');
    console.log('\n📝 You can now test the application with realistic data:');
    console.log('   - Visit http://localhost:3000 to see the nominees');
    console.log('   - Visit http://localhost:3000/nominate to submit new nominations');
    console.log('   - Visit http://localhost:3000/admin to manage nominations');
    console.log('   - Use the API endpoints to test programmatically');

  } catch (error) {
    console.error('❌ Error creating realistic dummy data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createRealisticDummyData();
}

module.exports = { createRealisticDummyData };