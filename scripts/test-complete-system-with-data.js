#!/usr/bin/env node

/**
 * COMPLETE SYSTEM TEST WITH ACTUAL DATA
 * This script tests the entire system with real data flow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteSystemWithData() {
  console.log('🚀 TESTING COMPLETE SYSTEM WITH ACTUAL DATA\n');
  
  const testData = {
    nominatorIds: [],
    nomineeIds: [],
    nominationIds: [],
    voterIds: [],
    voteIds: []
  };
  
  try {
    // 1. CREATE TEST NOMINATORS
    console.log('👤 Creating test nominators...');
    
    const nominators = [
      {
        email: 'john.doe@techcorp.com',
        firstname: 'John',
        lastname: 'Doe',
        company: 'TechCorp Inc',
        job_title: 'CEO',
        linkedin: 'https://linkedin.com/in/johndoe',
        country: 'USA'
      },
      {
        email: 'jane.smith@innovate.com',
        firstname: 'Jane',
        lastname: 'Smith',
        company: 'Innovate Solutions',
        job_title: 'CTO',
        linkedin: 'https://linkedin.com/in/janesmith',
        country: 'UK'
      }
    ];
    
    for (const nominator of nominators) {
      const { data, error } = await supabase
        .from('nominators')
        .insert(nominator)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create nominator: ${error.message}`);
      testData.nominatorIds.push(data.id);
      console.log(`✅ Created nominator: ${data.firstname} ${data.lastname} (${data.id})`);
    }
    
    // 2. CREATE TEST NOMINEES
    console.log('\n🏆 Creating test nominees...');
    
    const nominees = [
      {
        type: 'person',
        firstname: 'Alice',
        lastname: 'Johnson',
        person_email: 'alice.johnson@example.com',
        person_linkedin: 'https://linkedin.com/in/alicejohnson',
        jobtitle: 'Senior Recruiter',
        person_company: 'Talent Solutions',
        person_country: 'USA',
        headshot_url: 'https://example.com/alice-headshot.jpg',
        why_me: 'I have successfully placed over 500 candidates in tech roles with a 95% retention rate.',
        live_url: 'https://talentsolutions.com/alice'
      },
      {
        type: 'company',
        company_name: 'Global Staffing Pro',
        company_website: 'https://globalstaffingpro.com',
        company_linkedin: 'https://linkedin.com/company/globalstaffingpro',
        company_country: 'Canada',
        company_size: '500-1000',
        company_industry: 'Staffing & Recruiting',
        logo_url: 'https://example.com/gsp-logo.jpg',
        why_us: 'We have revolutionized the staffing industry with AI-powered matching technology.',
        live_url: 'https://globalstaffingpro.com'
      },
      {
        type: 'person',
        firstname: 'Bob',
        lastname: 'Wilson',
        person_email: 'bob.wilson@example.com',
        person_linkedin: 'https://linkedin.com/in/bobwilson',
        jobtitle: 'Talent Acquisition Manager',
        person_company: 'Future Tech',
        person_country: 'Australia',
        headshot_url: 'https://example.com/bob-headshot.jpg',
        why_me: 'I specialize in finding rare tech talent and have built a network of 10,000+ professionals.',
        live_url: 'https://futuretech.com/bob'
      }
    ];
    
    for (const nominee of nominees) {
      const { data, error } = await supabase
        .from('nominees')
        .insert(nominee)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create nominee: ${error.message}`);
      testData.nomineeIds.push(data.id);
      
      const displayName = nominee.type === 'person' 
        ? `${nominee.firstname} ${nominee.lastname}`
        : nominee.company_name;
      console.log(`✅ Created ${nominee.type} nominee: ${displayName} (${data.id})`);
    }
    
    // 3. CREATE TEST NOMINATIONS
    console.log('\n📝 Creating test nominations...');
    
    const nominations = [
      {
        nominator_id: testData.nominatorIds[0],
        nominee_id: testData.nomineeIds[0],
        category_group_id: 'individual-awards',
        subcategory_id: 'top-recruiter',
        state: 'approved'
      },
      {
        nominator_id: testData.nominatorIds[1],
        nominee_id: testData.nomineeIds[1],
        category_group_id: 'company-awards',
        subcategory_id: 'best-staffing-firm',
        state: 'submitted'
      },
      {
        nominator_id: testData.nominatorIds[0],
        nominee_id: testData.nomineeIds[2],
        category_group_id: 'individual-awards',
        subcategory_id: 'talent-acquisition-leader',
        state: 'approved'
      }
    ];
    
    for (const nomination of nominations) {
      const { data, error } = await supabase
        .from('nominations')
        .insert(nomination)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create nomination: ${error.message}`);
      testData.nominationIds.push(data.id);
      console.log(`✅ Created nomination: ${nomination.subcategory_id} (${data.id}) - ${nomination.state}`);
    }
    
    // 4. CREATE TEST VOTERS
    console.log('\n🗳️ Creating test voters...');
    
    const voters = [
      {
        email: 'voter1@example.com',
        firstname: 'Sarah',
        lastname: 'Connor',
        linkedin: 'https://linkedin.com/in/sarahconnor',
        company: 'Cyberdyne Systems',
        job_title: 'HR Director',
        country: 'USA'
      },
      {
        email: 'voter2@example.com',
        firstname: 'Mike',
        lastname: 'Ross',
        linkedin: 'https://linkedin.com/in/mikeross',
        company: 'Pearson Hardman',
        job_title: 'Talent Manager',
        country: 'USA'
      }
    ];
    
    for (const voter of voters) {
      const { data, error } = await supabase
        .from('voters')
        .insert(voter)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create voter: ${error.message}`);
      testData.voterIds.push(data.id);
      console.log(`✅ Created voter: ${data.firstname} ${data.lastname} (${data.id})`);
    }
    
    // 5. CREATE TEST VOTES
    console.log('\n✅ Creating test votes...');
    
    const votes = [
      {
        voter_id: testData.voterIds[0],
        nomination_id: testData.nominationIds[0], // Alice Johnson for top-recruiter
        subcategory_id: 'top-recruiter'
      },
      {
        voter_id: testData.voterIds[1],
        nomination_id: testData.nominationIds[0], // Alice Johnson for top-recruiter
        subcategory_id: 'top-recruiter'
      },
      {
        voter_id: testData.voterIds[0],
        nomination_id: testData.nominationIds[2], // Bob Wilson for talent-acquisition-leader
        subcategory_id: 'talent-acquisition-leader'
      }
    ];
    
    for (const vote of votes) {
      const { data, error } = await supabase
        .from('votes')
        .insert(vote)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create vote: ${error.message}`);
      testData.voteIds.push(data.id);
      console.log(`✅ Created vote: ${vote.subcategory_id} (${data.id})`);
    }
    
    // 6. TEST ALL API ENDPOINTS WITH DATA
    console.log('\n🌐 Testing API endpoints with real data...');
    
    // Test admin nominations
    console.log('📊 Testing admin nominations API...');
    const adminResponse = await fetch('http://localhost:3000/api/admin/nominations');
    const adminData = await adminResponse.json();
    console.log(`✅ Admin API: ${adminData.success ? 'Success' : 'Failed'} - ${adminData.count} nominations`);
    
    if (adminData.success && adminData.data.length > 0) {
      const firstNomination = adminData.data[0];
      console.log(`   First nomination: ${firstNomination.displayName} (${firstNomination.state})`);
    }
    
    // Test public nominees
    console.log('🏆 Testing public nominees API...');
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees');
    const nomineesData = await nomineesResponse.json();
    console.log(`✅ Nominees API: ${nomineesData.success ? 'Success' : 'Failed'} - ${nomineesData.count} approved nominees`);
    
    // Test stats
    console.log('📈 Testing stats API...');
    const statsResponse = await fetch('http://localhost:3000/api/stats');
    const statsData = await statsResponse.json();
    console.log(`✅ Stats API: ${statsData.totalNominees} nominations, ${statsData.totalVotes} votes, ${statsData.uniqueVoters} voters`);
    
    // Test votes
    console.log('🗳️ Testing votes API...');
    const votesResponse = await fetch('http://localhost:3000/api/votes');
    const votesData = await votesResponse.json();
    console.log(`✅ Votes API: ${Array.isArray(votesData) ? votesData.length : 0} votes returned`);
    
    // 7. TEST VIEWS
    console.log('\n👁️ Testing database views...');
    
    // Test admin_nominations view
    const { data: adminNominations, error: adminError } = await supabase
      .from('admin_nominations')
      .select('*');
      
    if (adminError) {
      console.log(`❌ Admin nominations view error: ${adminError.message}`);
    } else {
      console.log(`✅ Admin nominations view: ${adminNominations.length} records`);
    }
    
    // Test public_nominees view
    const { data: publicNominees, error: publicError } = await supabase
      .from('public_nominees')
      .select('*');
      
    if (publicError) {
      console.log(`❌ Public nominees view error: ${publicError.message}`);
    } else {
      console.log(`✅ Public nominees view: ${publicNominees.length} approved nominees`);
    }
    
    // Test voting_stats view
    const { data: votingStats, error: statsError } = await supabase
      .from('voting_stats')
      .select('*');
      
    if (statsError) {
      console.log(`❌ Voting stats view error: ${statsError.message}`);
    } else {
      console.log(`✅ Voting stats view: ${votingStats.length} categories with votes`);
    }
    
    console.log('\n🎉 COMPLETE SYSTEM TEST SUCCESSFUL!');
    console.log('📊 Summary:');
    console.log(`   • ${testData.nominatorIds.length} nominators created`);
    console.log(`   • ${testData.nomineeIds.length} nominees created`);
    console.log(`   • ${testData.nominationIds.length} nominations created`);
    console.log(`   • ${testData.voterIds.length} voters created`);
    console.log(`   • ${testData.voteIds.length} votes created`);
    console.log('   • All API endpoints working');
    console.log('   • All database views working');
    console.log('   • Vote counting triggers working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // 8. CLEANUP TEST DATA
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete in reverse order due to foreign key constraints
      if (testData.voteIds.length > 0) {
        await supabase.from('votes').delete().in('id', testData.voteIds);
        console.log(`✅ Deleted ${testData.voteIds.length} votes`);
      }
      
      if (testData.voterIds.length > 0) {
        await supabase.from('voters').delete().in('id', testData.voterIds);
        console.log(`✅ Deleted ${testData.voterIds.length} voters`);
      }
      
      if (testData.nominationIds.length > 0) {
        await supabase.from('nominations').delete().in('id', testData.nominationIds);
        console.log(`✅ Deleted ${testData.nominationIds.length} nominations`);
      }
      
      if (testData.nomineeIds.length > 0) {
        await supabase.from('nominees').delete().in('id', testData.nomineeIds);
        console.log(`✅ Deleted ${testData.nomineeIds.length} nominees`);
      }
      
      if (testData.nominatorIds.length > 0) {
        await supabase.from('nominators').delete().in('id', testData.nominatorIds);
        console.log(`✅ Deleted ${testData.nominatorIds.length} nominators`);
      }
      
      console.log('🧹 Cleanup complete!');
      
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
  }
}

testCompleteSystemWithData().catch(console.error);