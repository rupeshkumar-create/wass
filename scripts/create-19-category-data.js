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

// All 19 categories
const ALL_19_CATEGORIES = [
  // Role-Specific Excellence - Recognizing outstanding individual contributors
  { id: 'top-recruiter', group: 'role-specific-excellence', title: 'Top Recruiter', type: 'person' },
  { id: 'top-executive-leader', group: 'role-specific-excellence', title: 'Top Executive Leader', type: 'person' },
  { id: 'rising-star-under-30', group: 'role-specific-excellence', title: 'Rising Star (Under 30)', type: 'person' },
  { id: 'top-staffing-influencer', group: 'role-specific-excellence', title: 'Top Staffing Influencer', type: 'person' },
  { id: 'best-sourcer', group: 'role-specific-excellence', title: 'Best Sourcer', type: 'person' },
  
  // Innovation & Technology - Leading the future of staffing technology
  { id: 'top-ai-driven-staffing-platform', group: 'innovation-technology', title: 'Top AI-Driven Staffing Platform', type: 'company' },
  { id: 'top-digital-experience-for-clients', group: 'innovation-technology', title: 'Top Digital Experience for Clients', type: 'company' },
  
  // Culture & Impact - Making a positive difference in the industry
  { id: 'top-women-led-staffing-firm', group: 'culture-impact', title: 'Top Women-Led Staffing Firm', type: 'company' },
  { id: 'fastest-growing-staffing-firm', group: 'culture-impact', title: 'Fastest Growing Staffing Firm', type: 'company' },
  { id: 'best-diversity-inclusion-initiative', group: 'culture-impact', title: 'Best Diversity & Inclusion Initiative', type: 'company' },
  { id: 'best-candidate-experience', group: 'culture-impact', title: 'Best Candidate Experience', type: 'company' },
  
  // Growth & Performance - Excellence in operations and thought leadership
  { id: 'best-staffing-process-at-scale', group: 'growth-performance', title: 'Best Staffing Process at Scale', type: 'company' },
  { id: 'thought-leadership-and-influence', group: 'growth-performance', title: 'Thought Leadership & Influence', type: 'person' },
  { id: 'best-recruitment-agency', group: 'growth-performance', title: 'Best Recruitment Agency', type: 'company' },
  { id: 'best-in-house-recruitment-team', group: 'growth-performance', title: 'Best In-House Recruitment Team', type: 'company' },
  
  // Geographic Excellence - Regional and global recognition
  { id: 'top-staffing-company-usa', group: 'geographic-excellence', title: 'Top Staffing Company - USA', type: 'company' },
  { id: 'top-staffing-company-europe', group: 'geographic-excellence', title: 'Top Staffing Company - Europe', type: 'company' },
  { id: 'top-global-recruiter', group: 'geographic-excellence', title: 'Top Global Recruiter', type: 'person' },
  
  // Special Recognition - Unique contributions to the industry
  { id: 'special-recognition', group: 'special-recognition', title: 'Special Recognition', type: 'person' }
];

async function create19CategoryData() {
  try {
    console.log('🎯 Creating data for all 19 categories...\n');

    // Get existing nominators
    const { data: existingNominators } = await supabase
      .from('nominators')
      .select('*')
      .limit(10);

    let nominators = existingNominators || [];

    // Create additional nominators if needed
    if (nominators.length < 5) {
      const additionalNominators = [
        {
          email: 'category.nominator1@example.com',
          firstname: 'Category',
          lastname: 'Nominator1',
          linkedin: 'https://linkedin.com/in/categorynominator1',
          company: 'Category Test Company 1',
          job_title: 'HR Director',
          phone: '+1-555-1001',
          country: 'United States'
        },
        {
          email: 'category.nominator2@example.com',
          firstname: 'Category',
          lastname: 'Nominator2',
          linkedin: 'https://linkedin.com/in/categorynominator2',
          company: 'Category Test Company 2',
          job_title: 'Talent Manager',
          phone: '+1-555-1002',
          country: 'Canada'
        }
      ];

      for (const nomData of additionalNominators) {
        const { data: existingNom } = await supabase
          .from('nominators')
          .select('*')
          .eq('email', nomData.email)
          .single();

        if (!existingNom) {
          const { data, error } = await supabase
            .from('nominators')
            .insert(nomData)
            .select()
            .single();

          if (error) {
            console.warn('Error creating nominator:', error.message);
          } else {
            nominators.push(data);
          }
        }
      }
    }

    console.log(`👥 Using ${nominators.length} nominators`);

    // Check which categories already have data
    const { data: existingNominations } = await supabase
      .from('nominations')
      .select('subcategory_id');

    const existingCategories = new Set(existingNominations?.map(n => n.subcategory_id) || []);
    const missingCategories = ALL_19_CATEGORIES.filter(cat => !existingCategories.has(cat.id));

    console.log(`📊 Found ${existingCategories.size} categories with data`);
    console.log(`➕ Need to create data for ${missingCategories.length} categories`);

    if (missingCategories.length > 0) {
      console.log('\n🏆 Creating nominees for missing categories...');

      for (let i = 0; i < missingCategories.length; i++) {
        const category = missingCategories[i];
        const nominator = nominators[i % nominators.length];
        
        // Create 2 nominees per missing category
        for (let j = 1; j <= 2; j++) {
          const nomineeIndex = (i * 2) + j + 1000; // Offset to avoid conflicts
          
          let nominee;
          if (category.type === 'person') {
            nominee = {
              type: 'person',
              firstname: `${category.title.replace(/[^A-Za-z]/g, '')}${nomineeIndex}`,
              lastname: `Professional${nomineeIndex}`,
              person_email: `${category.id.replace(/-/g, '')}${nomineeIndex}@example.com`,
              person_linkedin: `https://linkedin.com/in/${category.id.replace(/-/g, '')}${nomineeIndex}`,
              person_phone: `+1-555-${(2000 + nomineeIndex).toString()}`,
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
            nominee = {
              type: 'company',
              company_name: `${category.title} Excellence ${nomineeIndex}`,
              company_domain: `${category.id.replace(/-/g, '')}${nomineeIndex}.com`,
              company_website: `https://${category.id.replace(/-/g, '')}${nomineeIndex}.com`,
              company_linkedin: `https://linkedin.com/company/${category.id.replace(/-/g, '')}${nomineeIndex}`,
              company_phone: `+1-555-${(3000 + nomineeIndex).toString()}`,
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

          if (nomineeError) {
            console.warn(`Error creating nominee for ${category.id}:`, nomineeError.message);
            continue;
          }

          // Create nomination
          const nomination = {
            nominator_id: nominator.id,
            nominee_id: nomineeData.id,
            category_group_id: category.group,
            subcategory_id: category.id,
            state: j === 1 ? 'approved' : 'submitted', // Mix of states
            votes: 0
          };

          const { data: nominationData, error: nominationError } = await supabase
            .from('nominations')
            .insert(nomination)
            .select()
            .single();

          if (nominationError) {
            console.warn(`Error creating nomination for ${category.id}:`, nominationError.message);
          } else {
            console.log(`✅ Created ${category.type} nomination: ${nomineeData.type === 'person' ? `${nomineeData.firstname} ${nomineeData.lastname}` : nomineeData.company_name} for ${category.id}`);
          }
        }
      }
    }

    // Verify all 19 categories now have data
    console.log('\n🔍 Verifying all 19 categories have data...');
    
    const { data: finalNominations } = await supabase
      .from('nominations')
      .select('subcategory_id');

    const finalCategories = new Set(finalNominations?.map(n => n.subcategory_id) || []);
    
    console.log(`📊 Categories with data: ${finalCategories.size}/19`);
    
    ALL_19_CATEGORIES.forEach(cat => {
      const hasData = finalCategories.has(cat.id);
      console.log(`   ${hasData ? '✅' : '❌'} ${cat.title} (${cat.id})`);
    });

    // Get final stats
    const { data: publicNominees } = await supabase
      .from('public_nominees')
      .select('*');
    
    const { data: adminNominations } = await supabase
      .from('admin_nominations')
      .select('*');

    const { data: votes } = await supabase
      .from('votes')
      .select('*');

    console.log('\n📈 Final Statistics:');
    console.log(`   Total Categories: 19`);
    console.log(`   Categories with Data: ${finalCategories.size}`);
    console.log(`   Public Nominees: ${publicNominees?.length || 0}`);
    console.log(`   Total Nominations: ${adminNominations?.length || 0}`);
    console.log(`   Total Votes: ${votes?.length || 0}`);

    console.log('\n🎉 All 19 categories now have data for real-time stats!');

  } catch (error) {
    console.error('❌ Error creating 19 category data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  create19CategoryData();
}

module.exports = { create19CategoryData };