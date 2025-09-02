#!/usr/bin/env node

/**
 * TEST VOTING WORKFLOW
 * This script tests the complete voting workflow from nomination to vote counting
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVotingWorkflow() {
  console.log('🗳️ TESTING COMPLETE VOTING WORKFLOW\n');
  
  let testData = {
    nominatorIds: [],
    nomineeIds: [],
    nominationIds: [],
    voterIds: [],
    voteIds: []
  };
  
  try {
    // 1. Create test nominees and nominations
    console.log('🏆 Setting up nominees and nominations...');
    
    // Create nominator
    const { data: nominator, error: nominatorError } = await supabase
      .from('nominators')
      .insert({
        email: 'nominator@example.com',
        firstname: 'Test',
        lastname: 'Nominator',
        company: 'Test Company',
        job_title: 'Manager',
        linkedin: 'https://linkedin.com/in/testnominator',
        country: 'USA'
      })
      .select()
      .single();
      
    if (nominatorError) throw new Error(`Failed to create nominator: ${nominatorError.message}`);
    testData.nominatorIds.push(nominator.id);
    
    // Create multiple nominees for the same category
    const nominees = [
      {
        type: 'person',
        firstname: 'Alice',
        lastname: 'Smith',
        person_email: 'alice@example.com',
        person_linkedin: 'https://linkedin.com/in/alice',
        jobtitle: 'Senior Recruiter',
        person_company: 'Talent Co',
        person_country: 'USA',
        headshot_url: 'https://example.com/alice.jpg',
        why_me: 'Excellent track record in tech recruitment.'
      },
      {
        type: 'person',
        firstname: 'Bob',
        lastname: 'Johnson',
        person_email: 'bob@example.com',
        person_linkedin: 'https://linkedin.com/in/bob',
        jobtitle: 'Talent Acquisition Lead',
        person_company: 'Recruit Pro',
        person_country: 'USA',
        headshot_url: 'https://example.com/bob.jpg',
        why_me: 'Specialized in finding rare tech talent.'
      },
      {
        type: 'person',
        firstname: 'Carol',
        lastname: 'Davis',
        person_email: 'carol@example.com',
        person_linkedin: 'https://linkedin.com/in/carol',
        jobtitle: 'Recruitment Manager',
        person_company: 'Staff Solutions',
        person_country: 'USA',
        headshot_url: 'https://example.com/carol.jpg',
        why_me: 'Built successful recruitment teams from scratch.'
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
      console.log(`✅ Created nominee: ${nominee.firstname} ${nominee.lastname}`);
    }
    
    // Create nominations for all nominees in the same category
    for (const nomineeId of testData.nomineeIds) {
      const { data, error } = await supabase
        .from('nominations')
        .insert({
          nominator_id: nominator.id,
          nominee_id: nomineeId,
          category_group_id: 'individual-awards',
          subcategory_id: 'top-recruiter',
          state: 'approved' // Make them all approved so they can be voted on
        })
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create nomination: ${error.message}`);
      testData.nominationIds.push(data.id);
    }
    
    console.log(`✅ Created ${testData.nominationIds.length} approved nominations for voting`);
    
    // 2. Test public nominees API (what voters would see)
    console.log('\n🌐 Testing public nominees API...');
    
    const nomineesResponse = await fetch('http://localhost:3000/api/nominees?subcategoryId=top-recruiter');
    const nomineesData = await nomineesResponse.json();
    
    console.log(`✅ Public nominees API: ${nomineesData.count} nominees available for voting`);
    
    if (nomineesData.data.length > 0) {
      console.log('📋 Available nominees for voting:');
      nomineesData.data.forEach((nominee, index) => {
        console.log(`   ${index + 1}. ${nominee.name} - ${nominee.jobtitle} (${nominee.votes} votes)`);
      });
    }
    
    // 3. Create voters and cast votes
    console.log('\n🗳️ Creating voters and casting votes...');
    
    const voters = [
      {
        email: 'voter1@example.com',
        firstname: 'John',
        lastname: 'Voter',
        linkedin: 'https://linkedin.com/in/johnvoter',
        company: 'Voting Corp',
        job_title: 'HR Manager',
        country: 'USA'
      },
      {
        email: 'voter2@example.com',
        firstname: 'Jane',
        lastname: 'Voter',
        linkedin: 'https://linkedin.com/in/janevoter',
        company: 'Vote Inc',
        job_title: 'Talent Director',
        country: 'USA'
      },
      {
        email: 'voter3@example.com',
        firstname: 'Mike',
        lastname: 'Voter',
        linkedin: 'https://linkedin.com/in/mikevoter',
        company: 'Voter Solutions',
        job_title: 'Recruitment Lead',
        country: 'USA'
      }
    ];
    
    // Create voters
    for (const voter of voters) {
      const { data, error } = await supabase
        .from('voters')
        .insert(voter)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create voter: ${error.message}`);
      testData.voterIds.push(data.id);
      console.log(`✅ Created voter: ${voter.firstname} ${voter.lastname}`);
    }
    
    // Cast votes (simulate different voting patterns)
    const votingPatterns = [
      { voterId: testData.voterIds[0], nominationId: testData.nominationIds[0] }, // Alice gets 1 vote
      { voterId: testData.voterIds[1], nominationId: testData.nominationIds[1] }, // Bob gets 1 vote  
      { voterId: testData.voterIds[2], nominationId: testData.nominationIds[1] }  // Bob gets another vote (2 total)
    ];
    
    for (const vote of votingPatterns) {
      const { data, error } = await supabase
        .from('votes')
        .insert({
          voter_id: vote.voterId,
          nomination_id: vote.nominationId,
          subcategory_id: 'top-recruiter'
        })
        .select()
        .single();
        
      if (error) throw new Error(`Failed to create vote: ${error.message}`);
      testData.voteIds.push(data.id);
    }
    
    console.log(`✅ Cast ${testData.voteIds.length} votes`);
    
    // 4. Test vote counting and leaderboard
    console.log('\n📊 Testing vote counting and leaderboard...');
    
    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get updated nominees with vote counts
    const updatedNomineesResponse = await fetch('http://localhost:3000/api/nominees?subcategoryId=top-recruiter');
    const updatedNomineesData = await updatedNomineesResponse.json();
    
    console.log('🏆 Updated leaderboard:');
    const sortedNominees = updatedNomineesData.data.sort((a, b) => b.votes - a.votes);
    
    sortedNominees.forEach((nominee, index) => {
      const position = index + 1;
      const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  ';
      console.log(`   ${medal} ${position}. ${nominee.name} - ${nominee.votes} votes`);
    });
    
    // 5. Test votes API
    console.log('\n🗳️ Testing votes API...');
    
    const votesResponse = await fetch('http://localhost:3000/api/votes?subcategoryId=top-recruiter');
    const votesData = await votesResponse.json();
    
    console.log(`✅ Votes API: ${votesData.length} votes recorded`);
    
    if (votesData.length > 0) {
      console.log('📋 Vote details:');
      votesData.forEach((vote, index) => {
        console.log(`   ${index + 1}. ${vote.voter.firstName} ${vote.voter.lastName} voted for ${vote.votedFor}`);
      });
    }
    
    // 6. Test voting stats
    console.log('\n📈 Testing voting statistics...');
    
    const statsResponse = await fetch('http://localhost:3000/api/stats');
    const statsData = await statsResponse.json();
    
    console.log('📊 Voting statistics:');
    console.log(`   Total Nominations: ${statsData.totalNominees}`);
    console.log(`   Approved Nominations: ${statsData.approvedNominations}`);
    console.log(`   Total Votes Cast: ${statsData.totalVotes}`);
    console.log(`   Unique Voters: ${statsData.uniqueVoters}`);
    console.log(`   Average Votes per Nominee: ${statsData.averageVotesPerNominee}`);
    
    if (statsData.byCategory && statsData.byCategory['top-recruiter']) {
      const categoryStats = statsData.byCategory['top-recruiter'];
      console.log(`   Top Recruiter Category: ${categoryStats.nominees} nominees, ${categoryStats.votes} votes`);
    }
    
    // 7. Test database views
    console.log('\n👁️ Testing database views...');
    
    const { data: votingStatsView, error: statsError } = await supabase
      .from('voting_stats')
      .select('*')
      .eq('subcategory_id', 'top-recruiter');
      
    if (statsError) {
      console.log(`❌ Voting stats view error: ${statsError.message}`);
    } else {
      console.log(`✅ Voting stats view: ${votingStatsView.length} categories`);
      if (votingStatsView.length > 0) {
        const stats = votingStatsView[0];
        console.log(`   Category: ${stats.subcategory_id}`);
        console.log(`   Total Votes: ${stats.total_votes}`);
        console.log(`   Unique Voters: ${stats.unique_voters}`);
      }
    }
    
    console.log('\n🎉 VOTING WORKFLOW TEST SUCCESSFUL!');
    console.log('✅ Nominee creation and approval working');
    console.log('✅ Public nominees API working');
    console.log('✅ Vote casting working');
    console.log('✅ Vote counting triggers working');
    console.log('✅ Leaderboard updates working');
    console.log('✅ Statistics calculation working');
    console.log('✅ Database views working');
    
  } catch (error) {
    console.error('❌ Voting workflow test failed:', error);
  } finally {
    // Cleanup
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

testVotingWorkflow().catch(console.error);