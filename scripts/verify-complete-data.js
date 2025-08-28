#!/usr/bin/env node

const { execSync } = require('child_process');

async function verifyCompleteData() {
  console.log('🔍 VERIFYING COMPLETE DUMMY DATA');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check total nominees
    console.log('\n1️⃣ Checking Total Nominees...');
    const nomineesResponse = execSync('curl -s "http://localhost:3000/api/nominees"', { encoding: 'utf8' });
    const nomineesData = JSON.parse(nomineesResponse);
    
    if (nomineesData.success && nomineesData.data.length >= 40) {
      console.log(`✅ Found ${nomineesData.data.length} total nominees`);
      
      const personCount = nomineesData.data.filter(n => n.type === 'person').length;
      const companyCount = nomineesData.data.filter(n => n.type === 'company').length;
      console.log(`✅ ${personCount} person nominees, ${companyCount} company nominees`);
    } else {
      console.log('❌ Insufficient nominees found');
    }

    // Test 2: Check category coverage
    console.log('\n2️⃣ Checking Category Coverage...');
    const statsResponse = execSync('curl -s "http://localhost:3000/api/stats"', { encoding: 'utf8' });
    const statsData = JSON.parse(statsResponse);
    
    const categoriesWithData = Object.keys(statsData.byCategory);
    console.log(`✅ ${categoriesWithData.length} categories have nominees`);
    
    // Expected categories (all 23 from constants)
    const expectedCategories = [
      'top-recruiter', 'talent-acquisition-leader', 'recruitment-innovation-award',
      'top-executive-leader', 'top-staffing-influencer', 'rising-star',
      'best-staffing-firm', 'top-ai-driven-platform', 'top-digital-experience',
      'top-women-led-firm', 'fastest-growing-firm', 'best-process-at-scale',
      'thought-leadership', 'top-staffing-company-usa', 'top-recruiting-leader-usa',
      'top-ai-platform-usa', 'top-staffing-company-europe', 'top-recruiting-leader-europe',
      'top-ai-platform-europe', 'top-global-recruiter', 'top-global-staffing-leader',
      'special-recognition'
    ];
    
    const missingCategories = expectedCategories.filter(cat => !categoriesWithData.includes(cat));
    if (missingCategories.length === 0) {
      console.log('✅ All 22 categories have nominees!');
    } else {
      console.log(`⚠️  Missing categories: ${missingCategories.join(', ')}`);
    }

    // Test 3: Check votes distribution
    console.log('\n3️⃣ Checking Votes Distribution...');
    const votesResponse = execSync('curl -s "http://localhost:3000/api/votes"', { encoding: 'utf8' });
    const votesData = JSON.parse(votesResponse);
    
    if (Array.isArray(votesData) && votesData.length >= 50) {
      console.log(`✅ Found ${votesData.length} total votes`);
      
      const votesByCategory = {};
      votesData.forEach(vote => {
        votesByCategory[vote.category] = (votesByCategory[vote.category] || 0) + 1;
      });
      
      const categoriesWithVotes = Object.keys(votesByCategory).length;
      console.log(`✅ Votes distributed across ${categoriesWithVotes} categories`);
    } else {
      console.log('❌ Insufficient votes found');
    }

    // Test 4: Test podium for different categories
    console.log('\n4️⃣ Testing Podium Functionality...');
    const testCategories = [
      'top-recruiter', 'top-ai-driven-platform', 'top-women-led-firm',
      'rising-star', 'thought-leadership', 'best-staffing-firm'
    ];
    
    let podiumWorking = 0;
    for (const category of testCategories) {
      try {
        const podiumResponse = execSync(`curl -s "http://localhost:3000/api/podium?category=${category}"`, { encoding: 'utf8' });
        const podiumData = JSON.parse(podiumResponse);
        
        if (podiumData.category === category && podiumData.items.length > 0) {
          console.log(`✅ ${category}: ${podiumData.items.length} podium items`);
          podiumWorking++;
        } else {
          console.log(`⚠️  ${category}: No podium data`);
        }
      } catch (error) {
        console.log(`❌ ${category}: Podium API failed`);
      }
    }
    
    if (podiumWorking >= 4) {
      console.log(`✅ Podium working for ${podiumWorking}/${testCategories.length} test categories`);
    }

    // Test 5: Sample detailed nominees
    console.log('\n5️⃣ Checking Nominee Details Quality...');
    const sampleCategories = ['top-recruiter', 'top-ai-driven-platform', 'rising-star'];
    
    for (const category of sampleCategories) {
      const categoryNominees = nomineesData.data.filter(n => n.category === category);
      if (categoryNominees.length > 0) {
        const sample = categoryNominees[0];
        const hasDetails = sample.nominee?.name && sample.imageUrl && sample.liveUrl;
        console.log(`✅ ${category}: ${categoryNominees.length} nominees, sample has ${hasDetails ? 'complete' : 'incomplete'} details`);
      }
    }

    // Test 6: Check data variety
    console.log('\n6️⃣ Checking Data Variety...');
    const uniqueNominees = new Set(nomineesData.data.map(n => n.nominee.name));
    const uniqueImages = new Set(nomineesData.data.map(n => n.imageUrl));
    
    console.log(`✅ ${uniqueNominees.size} unique nominee names`);
    console.log(`✅ ${uniqueImages.size} unique avatar images`);
    
    if (uniqueNominees.size >= 40 && uniqueImages.size >= 40) {
      console.log('✅ Good data variety achieved');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 VERIFICATION COMPLETE');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Summary:');
    console.log(`   🎯 Total Nominees: ${nomineesData.data.length}`);
    console.log(`   🏆 Categories Covered: ${categoriesWithData.length}/22`);
    console.log(`   🗳️ Total Votes: ${votesData.length}`);
    console.log(`   ⚡ Podium Working: ${podiumWorking}/${testCategories.length} categories`);
    
    console.log('\n🌐 Ready for comprehensive testing:');
    console.log('   🏠 Homepage: http://localhost:3000');
    console.log('   📁 Directory: http://localhost:3000/directory');
    console.log('   📝 Nominate: http://localhost:3000/nominate');
    console.log('   ⚙️  Admin: http://localhost:3000/admin');
    
    console.log('\n🧪 Test scenarios to try:');
    console.log('   - Filter directory by different categories');
    console.log('   - Search for specific nominees');
    console.log('   - Check podium rankings on homepage');
    console.log('   - View individual nominee profiles');
    console.log('   - Test responsive design on mobile');
    console.log('   - Check admin panel statistics');
    console.log('   - Submit a test nomination');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyCompleteData();