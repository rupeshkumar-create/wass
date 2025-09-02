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

// Categories from constants
const CATEGORIES = [
  { id: 'top-recruiter', group: 'individual-awards', title: 'Top Recruiter' },
  { id: 'rising-star-recruiter', group: 'individual-awards', title: 'Rising Star Recruiter' },
  { id: 'best-sourcer', group: 'individual-awards', title: 'Best Sourcer' },
  { id: 'best-recruitment-leader', group: 'individual-awards', title: 'Best Recruitment Leader' },
  { id: 'best-talent-acquisition-professional', group: 'individual-awards', title: 'Best Talent Acquisition Professional' },
  { id: 'best-hr-business-partner', group: 'individual-awards', title: 'Best HR Business Partner' },
  { id: 'best-diversity-inclusion-champion', group: 'individual-awards', title: 'Best Diversity & Inclusion Champion' },
  { id: 'best-recruitment-marketing-professional', group: 'individual-awards', title: 'Best Recruitment Marketing Professional' },
  { id: 'best-people-analytics-professional', group: 'individual-awards', title: 'Best People Analytics Professional' },
  { id: 'best-employer-branding-professional', group: 'individual-awards', title: 'Best Employer Branding Professional' },
  { id: 'best-recruitment-technology-innovator', group: 'individual-awards', title: 'Best Recruitment Technology Innovator' },
  { id: 'best-freelance-recruiter', group: 'individual-awards', title: 'Best Freelance Recruiter' },
  { id: 'best-recruitment-agency', group: 'company-awards', title: 'Best Recruitment Agency' },
  { id: 'best-in-house-recruitment-team', group: 'company-awards', title: 'Best In-House Recruitment Team' },
  { id: 'best-recruitment-technology-provider', group: 'company-awards', title: 'Best Recruitment Technology Provider' },
  { id: 'best-recruitment-training-provider', group: 'company-awards', title: 'Best Recruitment Training Provider' },
  { id: 'best-diversity-inclusion-initiative', group: 'company-awards', title: 'Best Diversity & Inclusion Initiative' },
  { id: 'best-employer-branding-campaign', group: 'company-awards', title: 'Best Employer Branding Campaign' },
  { id: 'best-recruitment-marketing-campaign', group: 'company-awards', title: 'Best Recruitment Marketing Campaign' },
  { id: 'best-candidate-experience-initiative', group: 'company-awards', title: 'Best Candidate Experience Initiative' },
  { id: 'best-use-of-recruitment-technology', group: 'company-awards', title: 'Best Use of Recruitment Technology' },
  { id: 'best-startup-employer', group: 'company-awards', title: 'Best Startup Employer' }
];

async function createTestData() {
  try {
    console.log('🔄 Creating test data for new schema...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nominators').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('voters').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('hubspot_outbox').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create nominators
    console.log('👥 Creating nominators...');
    const nominators = [];
    for (let i = 1; i <= 10; i++) {
      const nominator = {
        email: `nominator${i}@example.com`,
        firstname: `Nominator${i}`,
        lastname: `LastName${i}`,
        linkedin: `https://linkedin.com/in/nominator${i}`,
        company: `Company ${i}`,
        job_title: `HR Manager ${i}`,
        phone: `+1-555-000${i.toString().padStart(4, '0')}`,
        country: 'USA'
      };

      const { data, error } = await supabase
        .from('nominators')
        .insert(nominator)
        .select()
        .single();

      if (error) throw error;
      nominators.push(data);
    }

    // Create nominees and nominations
    console.log('🏆 Creating nominees and nominations...');
    const nominees = [];
    const nominations = [];

    for (let i = 0; i < CATEGORIES.length; i++) {
      const category = CATEGORIES[i];
      
      // Create 2-3 nominees per category
      const numNominees = 2 + (i % 2); // 2 or 3 nominees per category
      
      for (let j = 1; j <= numNominees; j++) {
        const isPersonCategory = category.group === 'individual-awards';
        const nomineeIndex = i * 3 + j;
        
        let nominee;
        if (isPersonCategory) {
          // Person nominee
          nominee = {
            type: 'person',
            firstname: `Person${nomineeIndex}`,
            lastname: `LastName${nomineeIndex}`,
            person_email: `person${nomineeIndex}@example.com`,
            person_linkedin: `https://linkedin.com/in/person${nomineeIndex}`,
            person_phone: `+1-555-${nomineeIndex.toString().padStart(4, '0')}`,
            jobtitle: `Senior ${category.title.replace('Best ', '').replace('Top ', '')}`,
            person_company: `Tech Corp ${nomineeIndex}`,
            person_country: 'USA',
            headshot_url: `https://images.unsplash.com/photo-${1500000000 + nomineeIndex}?w=400&h=400&fit=crop&crop=face`,
            why_me: `I am an exceptional ${category.title.toLowerCase()} with over 10 years of experience in the field. My innovative approaches and dedication to excellence make me a strong candidate for this award.`,
            live_url: `https://portfolio${nomineeIndex}.example.com`,
            bio: `Experienced professional with a passion for ${category.title.toLowerCase()}.`,
            achievements: `Winner of multiple industry awards, published author, and thought leader in ${category.title.toLowerCase()}.`
          };
        } else {
          // Company nominee
          nominee = {
            type: 'company',
            company_name: `${category.title.replace('Best ', '')} Corp ${nomineeIndex}`,
            company_domain: `company${nomineeIndex}.com`,
            company_website: `https://company${nomineeIndex}.com`,
            company_linkedin: `https://linkedin.com/company/company${nomineeIndex}`,
            company_phone: `+1-555-${nomineeIndex.toString().padStart(4, '0')}`,
            company_country: 'USA',
            company_size: '100-500',
            company_industry: 'Technology',
            logo_url: `https://images.unsplash.com/photo-${1600000000 + nomineeIndex}?w=400&h=400&fit=crop`,
            why_us: `We are a leading ${category.title.toLowerCase()} with innovative solutions and exceptional client service. Our team of experts delivers outstanding results consistently.`,
            live_url: `https://company${nomineeIndex}.com`,
            bio: `Leading company in ${category.title.toLowerCase()} services.`,
            achievements: `Industry leader with multiple certifications and awards for excellence in ${category.title.toLowerCase()}.`
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
          nominator_id: nominators[j % nominators.length].id,
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
      }
    }

    // Create voters and votes
    console.log('🗳️ Creating voters and votes...');
    const voters = [];
    
    for (let i = 1; i <= 50; i++) {
      const voter = {
        email: `voter${i}@example.com`,
        firstname: `Voter${i}`,
        lastname: `LastName${i}`,
        linkedin: `https://linkedin.com/in/voter${i}`,
        company: `Voting Company ${i}`,
        job_title: `Voter Title ${i}`,
        country: 'USA'
      };

      const { data, error } = await supabase
        .from('voters')
        .insert(voter)
        .select()
        .single();

      if (error) throw error;
      voters.push(data);
    }

    // Create votes for approved nominations
    const approvedNominations = nominations.filter(n => n.state === 'approved');
    
    for (let i = 0; i < Math.min(100, voters.length * 2); i++) {
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

    console.log('✅ Test data created successfully!');
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

    console.log('\n🎉 New schema test data creation completed!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };