#!/usr/bin/env node

/**
 * Complete WSA HubSpot Integration Test
 * Tests the full nomination and voting flow with HubSpot sync
 */

async function testCompleteWSAIntegration() {
  console.log('🧪 Testing Complete WSA HubSpot Integration...');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Check HubSpot connection
    console.log('\n1️⃣ Testing HubSpot connection...');
    
    const statsResponse = await fetch('http://localhost:3000/api/integrations/hubspot/stats');
    if (!statsResponse.ok) {
      console.error('❌ HubSpot stats API failed');
      return;
    }
    
    const stats = await statsResponse.json();
    console.log('✅ HubSpot Status:', stats.hubspotStatus);
    console.log('   Last Sync:', stats.lastSyncTime);
    
    // Test 2: Create a person nomination
    console.log('\n2️⃣ Creating person nomination...');
    
    const personNomination = {
      category: 'Top Recruiter',
      nominator: {
        name: 'John Nominator',
        email: 'john.nominator@example.com',
        phone: '+1-555-123-4567'
      },
      nominee: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@testcompany.com',
        title: 'Senior Recruiter',
        country: 'USA',
        linkedin: 'https://www.linkedin.com/in/sarah-johnson-wsa-test',
        imageUrl: 'https://example.com/sarah-headshot.jpg',
        whyVoteForMe: 'Sarah is an exceptional recruiter who has transformed our hiring process.'
      }
    };
    
    const nominationResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personNomination)
    });
    
    if (!nominationResponse.ok) {
      const error = await nominationResponse.text();
      console.error('❌ Failed to create nomination:', error);
      return;
    }
    
    const nominationResult = await nominationResponse.json();
    console.log('✅ Person nomination created:', nominationResult.id);
    console.log('   Expected HubSpot sync: Nominator tagged as "Voters 2026"');
    
    // Test 3: Approve the nomination
    console.log('\n3️⃣ Approving nomination...');
    
    const approvalResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: nominationResult.id,
        status: 'approved'
      })
    });
    
    if (!approvalResponse.ok) {
      const error = await approvalResponse.text();
      console.error('❌ Failed to approve nomination:', error);
      return;
    }
    
    console.log('✅ Nomination approved');
    console.log('   Expected HubSpot sync: Nominee tagged as "Nominees 2026"');
    
    // Test 4: Create a company nomination
    console.log('\n4️⃣ Creating company nomination...');
    
    const companyNomination = {
      category: 'Top Staffing Company - USA',
      nominator: {
        name: 'Jane Nominator',
        email: 'jane.nominator@example.com',
        phone: ''
      },
      nominee: {
        name: 'TechStaff Solutions',
        website: 'https://techstaff.com',
        country: 'USA',
        linkedin: 'https://www.linkedin.com/company/techstaff-solutions',
        imageUrl: 'https://example.com/techstaff-logo.jpg',
        whyVoteForMe: 'TechStaff Solutions has revolutionized the staffing industry with innovative solutions.'
      }
    };
    
    const companyNominationResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyNomination)
    });
    
    if (!companyNominationResponse.ok) {
      const error = await companyNominationResponse.text();
      console.error('❌ Failed to create company nomination:', error);
      return;
    }
    
    const companyResult = await companyNominationResponse.json();
    console.log('✅ Company nomination created:', companyResult.id);
    
    // Test 5: Approve company nomination
    console.log('\n5️⃣ Approving company nomination...');
    
    const companyApprovalResponse = await fetch('http://localhost:3000/api/nominations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: companyResult.id,
        status: 'approved'
      })
    });
    
    if (!companyApprovalResponse.ok) {
      const error = await companyApprovalResponse.text();
      console.error('❌ Failed to approve company nomination:', error);
      return;
    }
    
    console.log('✅ Company nomination approved');
    console.log('   Expected HubSpot sync: Company tagged as "Nominees 2026"');
    
    // Test 6: Cast a vote
    console.log('\n6️⃣ Casting a vote...');
    
    const voteData = {
      nomineeId: nominationResult.id,
      category: 'Top Recruiter',
      voter: {
        firstName: 'Mike',
        lastName: 'Voter',
        email: 'mike.voter@example.com',
        linkedin: 'https://linkedin.com/in/mike-voter',
        phone: '+1-555-987-6543'
      }
    };
    
    const voteResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData)
    });
    
    if (!voteResponse.ok) {
      const error = await voteResponse.text();
      console.error('❌ Failed to cast vote:', error);
      return;
    }
    
    const voteResult = await voteResponse.json();
    console.log('✅ Vote cast successfully');
    console.log('   Total votes:', voteResult.total);
    console.log('   Expected HubSpot sync: Voter tagged as "Voters 2026"');
    
    // Test 7: Check HubSpot stats after operations
    console.log('\n7️⃣ Checking HubSpot stats after operations...');
    
    // Wait a moment for async operations
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalStatsResponse = await fetch('http://localhost:3000/api/integrations/hubspot/stats');
    const finalStats = await finalStatsResponse.json();
    
    console.log('✅ Final HubSpot Status:', finalStats.hubspotStatus);
    console.log('   Last Sync:', finalStats.lastSyncTime);
    console.log('   Total Synced:', finalStats.totalSynced);
    
    console.log('\n🎉 Complete WSA Integration Test Completed!');
    console.log('\n📋 What to check in HubSpot:');
    console.log('1. Contacts:');
    console.log('   - john.nominator@example.com (Voters 2026)');
    console.log('   - sarah.johnson@testcompany.com (Nominees 2026)');
    console.log('   - jane.nominator@example.com (Voters 2026)');
    console.log('   - mike.voter@example.com (Voters 2026)');
    console.log('2. Companies:');
    console.log('   - TechStaff Solutions (Nominees 2026)');
    console.log('3. Properties should be populated with WSA data');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testCompleteWSAIntegration();