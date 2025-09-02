#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMoreTestNominees() {
  console.log('🎯 CREATING MORE TEST NOMINEES FOR INDIVIDUAL PAGES\n');

  try {
    // First, let's see what we currently have
    const { data: existingNominations, error: existingError } = await supabase
      .from('nominations')
      .select(`
        id,
        state,
        subcategory_id,
        nominees (
          firstname,
          lastname,
          company_name,
          type
        )
      `);

    if (existingError) {
      console.error('Error checking existing nominations:', existingError);
      return;
    }

    console.log(`📊 Current nominations: ${existingNominations?.length || 0}`);
    const approvedCount = existingNominations?.filter(n => n.state === 'approved').length || 0;
    console.log(`📊 Currently approved: ${approvedCount}`);

    if (approvedCount >= 10) {
      console.log('✅ You already have enough test nominees!');
      return;
    }

    // Create more nominators
    const nominators = [
      {
        email: 'sarah.johnson@techcorp.com',
        firstname: 'Sarah',
        lastname: 'Johnson',
        linkedin: 'https://linkedin.com/in/sarahjohnson',
        company: 'TechCorp Solutions',
        job_title: 'Head of Talent',
        country: 'USA'
      },
      {
        email: 'michael.chen@globalhr.com',
        firstname: 'Michael',
        lastname: 'Chen',
        linkedin: 'https://linkedin.com/in/michaelchen',
        company: 'Global HR Partners',
        job_title: 'Senior Recruitment Manager',
        country: 'UK'
      },
      {
        email: 'emma.williams@startupinc.com',
        firstname: 'Emma',
        lastname: 'Williams',
        linkedin: 'https://linkedin.com/in/emmawilliams',
        company: 'StartupInc',
        job_title: 'People Operations Lead',
        country: 'Canada'
      },
      {
        email: 'david.brown@recruitpro.au',
        firstname: 'David',
        lastname: 'Brown',
        linkedin: 'https://linkedin.com/in/davidbrown',
        company: 'RecruitPro Australia',
        job_title: 'Director of Recruitment',
        country: 'Australia'
      }
    ];

    console.log('👥 Creating nominators...');
    const { data: createdNominators, error: nominatorError } = await supabase
      .from('nominators')
      .upsert(nominators, { onConflict: 'email' })
      .select();

    if (nominatorError) {
      console.error('Error creating nominators:', nominatorError);
      return;
    }

    console.log(`✅ Created/updated ${createdNominators.length} nominators`);

    // Create person nominees
    const personNominees = [
      {
        type: 'person',
        firstname: 'Jessica',
        lastname: 'Martinez',
        person_email: 'jessica.martinez@example.com',
        person_linkedin: 'https://linkedin.com/in/jessicamartinez',
        jobtitle: 'Senior Executive Recruiter',
        headshot_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        why_me: 'Exceptional track record in executive recruitment with over 8 years of experience placing C-level executives in Fortune 500 companies.',
        live_url: 'https://jessicamartinez.example.com'
      },
      {
        type: 'person',
        firstname: 'Robert',
        lastname: 'Thompson',
        person_email: 'robert.thompson@example.com',
        person_linkedin: 'https://linkedin.com/in/robertthompson',
        jobtitle: 'VP of Talent Acquisition',
        headshot_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        why_me: 'Innovative leader in talent acquisition technology, revolutionizing how companies find and hire top talent.',
        live_url: 'https://robertthompson.example.com'
      },
      {
        type: 'person',
        firstname: 'Lisa',
        lastname: 'Anderson',
        person_email: 'lisa.anderson@example.com',
        person_linkedin: 'https://linkedin.com/in/lisaanderson',
        jobtitle: 'Chief People Officer',
        headshot_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        why_me: 'Transformational people leader with expertise in building inclusive, high-performance teams across global organizations.',
        live_url: 'https://lisaanderson.example.com'
      },
      {
        type: 'person',
        firstname: 'James',
        lastname: 'Wilson',
        person_email: 'james.wilson@example.com',
        person_linkedin: 'https://linkedin.com/in/jameswilson',
        jobtitle: 'Director of Recruitment',
        headshot_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        why_me: 'Rising star in recruitment with innovative approaches to candidate experience and employer branding.',
        live_url: 'https://jameswilson.example.com'
      }
    ];

    // Create company nominees
    const companyNominees = [
      {
        type: 'company',
        company_name: 'TalentFlow Solutions',
        company_website: 'https://talentflow.com',
        company_linkedin: 'https://linkedin.com/company/talentflow',
        company_industry: 'Recruitment Technology',
        logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
        why_us: 'Leading recruitment technology company transforming how businesses find, engage, and hire top talent through AI-powered solutions.',
        live_url: 'https://talentflow.com'
      },
      {
        type: 'company',
        company_name: 'Global Staffing Partners',
        company_website: 'https://globalstaffing.com',
        company_linkedin: 'https://linkedin.com/company/globalstaffing',
        company_industry: 'Staffing Services',
        logo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop',
        why_us: 'International staffing firm with presence in 25 countries, specializing in executive search and permanent placement.',
        live_url: 'https://globalstaffing.com'
      },
      {
        type: 'company',
        company_name: 'NextGen Recruitment',
        company_website: 'https://nextgenrecruitment.com',
        company_linkedin: 'https://linkedin.com/company/nextgenrecruitment',
        company_industry: 'Digital Recruitment',
        logo_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop',
        why_us: 'Innovative recruitment agency leveraging cutting-edge technology and data analytics to deliver exceptional hiring outcomes.',
        live_url: 'https://nextgenrecruitment.com'
      }
    ];

    console.log('👤 Creating person nominees...');
    const { data: createdPersons, error: personError } = await supabase
      .from('nominees')
      .insert(personNominees)
      .select();

    if (personError) {
      console.error('Error creating person nominees:', personError);
      return;
    }

    console.log(`✅ Created ${createdPersons.length} person nominees`);

    console.log('🏢 Creating company nominees...');
    const { data: createdCompanies, error: companyError } = await supabase
      .from('nominees')
      .insert(companyNominees)
      .select();

    if (companyError) {
      console.error('Error creating company nominees:', companyError);
      return;
    }

    console.log(`✅ Created ${createdCompanies.length} company nominees`);

    // Create nominations for all nominees
    const allNominees = [...createdPersons, ...createdCompanies];
    const categories = [
      'top-recruiter',
      'top-executive-leader',
      'rising-star-under-30',
      'top-staffing-influencer',
      'fastest-growing-staffing-firm',
      'top-ai-driven-staffing-platform',
      'best-candidate-experience'
    ];

    console.log('📝 Creating nominations...');
    
    const nominations = allNominees.map((nominee, index) => ({
      nominator_id: createdNominators[index % createdNominators.length].id,
      nominee_id: nominee.id,
      category_group_id: nominee.type === 'person' ? 'role-specific-excellence' : 'innovation-technology',
      subcategory_id: categories[index % categories.length],
      state: 'approved', // Approve all for testing
      votes: Math.floor(Math.random() * 10) // Random vote count
    }));

    const { data: createdNominations, error: nominationError } = await supabase
      .from('nominations')
      .insert(nominations)
      .select();

    if (nominationError) {
      console.error('Error creating nominations:', nominationError);
      return;
    }

    console.log(`✅ Created ${createdNominations.length} approved nominations`);

    // Test the API to make sure everything is working
    console.log('\n🔍 Testing the nominees API...');
    
    const { data: publicNominees, error: apiError } = await supabase
      .from('public_nominees')
      .select('*')
      .limit(5);

    if (apiError) {
      console.error('Error testing public nominees view:', apiError);
      return;
    }

    console.log(`✅ Public nominees view working: ${publicNominees.length} nominees found`);

    console.log('\n🎉 SUCCESS! Test data created successfully!');
    console.log('\n🔗 You can now test these individual nominee pages:');
    
    createdNominations.forEach((nomination, index) => {
      const nominee = allNominees.find(n => n.id === nomination.nominee_id);
      const name = nominee.type === 'person' 
        ? `${nominee.firstname} ${nominee.lastname}`
        : nominee.company_name;
      
      console.log(`   http://localhost:3000/nominee/${nomination.id} - ${name}`);
    });

    console.log('\n📊 Total approved nominees now available for testing!');

  } catch (error) {
    console.error('❌ Failed to create test nominees:', error);
  }
}

// Run the script
createMoreTestNominees();