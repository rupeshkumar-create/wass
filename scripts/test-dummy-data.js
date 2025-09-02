#!/usr/bin/env node

const { execSync } = require('child_process');

async function testDummyData() {
  console.log('🧪 Testing Comprehensive Dummy Data');
  console.log('=' .repeat(50));

  try {
    // Test 1: Check nominees count
    console.log('\n1️⃣ Testing Nominees API...');
    const nomineesResponse = execSync('curl -s "http://localhost:3000/api/nominees"', { encoding: 'utf8' });
    const nomineesData = JSON.parse(nomineesResponse);
    
    if (nomineesData.success && nomineesData.data.length === 16) {
      console.log(`✅ Found ${nomineesData.data.length} nominees`);
      
      // Check categories
      const categories = [...new Set(nomineesData.data.map(n => n.category))];
      console.log(`✅ Covering ${categories.length} categories:`);
      categories.forEach(cat => console.log(`   - ${cat}`));
      
      // Check types
      const personCount = nomineesData.data.filter(n => n.type === 'person').length;
      const companyCount = nomineesData.data.filter(n => n.type === 'company').length;
      console.log(`✅ ${personCount} person nominees, ${companyCount} company nominees`);
      
    } else {
      console.log('❌ Nominees API failed or wrong count');
    }

    // Test 2: Check stats
    console.log('\n2️⃣ Testing Stats API...');
    const statsResponse = execSync('curl -s "http://localhost:3000/api/stats"', { encoding: 'utf8' });
    const statsData = JSON.parse(statsResponse);
    
    if (statsData.totalNominees === 16 && statsData.totalVotes > 0) {
      console.log(`✅ Stats: ${statsData.totalNominees} nominees, ${statsData.totalVotes} votes`);
      console.log(`✅ Categories with data: ${Object.keys(statsData.byCategory).length}`);
    } else {
      console.log('❌ Stats API failed');
    }

    // Test 3: Check votes
    console.log('\n3️⃣ Testing Votes API...');
    const votesResponse = execSync('curl -s "http://localhost:3000/api/votes"', { encoding: 'utf8' });
    const votesData = JSON.parse(votesResponse);
    
    if (Array.isArray(votesData) && votesData.length > 0) {
      console.log(`✅ Found ${votesData.length} votes`);
      
      // Check vote distribution
      const votesByCategory = {};
      votesData.forEach(vote => {
        votesByCategory[vote.category] = (votesByCategory[vote.category] || 0) + 1;
      });
      console.log(`✅ Votes distributed across ${Object.keys(votesByCategory).length} categories`);
    } else {
      console.log('❌ Votes API failed');
    }

    // Test 4: Check podium for different categories
    console.log('\n4️⃣ Testing Podium API...');
    const testCategories = ['top-recruiter', 'top-ai-driven-platform', 'top-women-led-firm'];
    
    for (const category of testCategories) {
      try {
        const podiumResponse = execSync(`curl -s "http://localhost:3000/api/podium?category=${category}"`, { encoding: 'utf8' });
        const podiumData = JSON.parse(podiumResponse);
        
        if (podiumData.category === category && podiumData.items.length > 0) {
          console.log(`✅ ${category}: ${podiumData.items.length} podium items`);
        } else {
          console.log(`⚠️  ${category}: No podium data`);
        }
      } catch (error) {
        console.log(`❌ ${category}: Podium API failed`);
      }
    }

    // Test 5: Sample nominee details
    console.log('\n5️⃣ Testing Nominee Details...');
    const sampleNominees = nomineesData.data.slice(0, 3);
    
    sampleNominees.forEach((nominee, index) => {
      const hasRequiredFields = nominee.id && nominee.nominee?.name && nominee.category && nominee.imageUrl;
      if (hasRequiredFields) {
        console.log(`✅ Nominee ${index + 1}: ${nominee.nominee.name} (${nominee.category})`);
      } else {
        console.log(`❌ Nominee ${index + 1}: Missing required fields`);
      }
    });

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 DUMMY DATA TEST COMPLETE');
    console.log('=' .repeat(50));
    console.log('\n✅ Ready for manual testing:');
    console.log('   🏠 Homepage: http://localhost:3000');
    console.log('   📁 Directory: http://localhost:3000/directory');
    console.log('   📝 Nominate: http://localhost:3000/nominate');
    console.log('   ⚙️  Admin: http://localhost:3000/admin');
    
    console.log('\n📋 What to test:');
    console.log('   - Browse nominees in directory');
    console.log('   - Filter by category and type');
    console.log('   - Check podium on homepage');
    console.log('   - View individual nominee profiles');
    console.log('   - Test voting functionality');
    console.log('   - Check admin panel statistics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDummyData();