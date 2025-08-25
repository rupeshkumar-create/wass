#!/usr/bin/env node

/**
 * Integration Status Checker
 * Quickly verify all integrations are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Integration Status Check\n');

// Check environment variables
function checkEnvironmentVariables() {
  console.log('1. Environment Variables:');
  
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env file not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'HUBSPOT_PRIVATE_APP_TOKEN',
    'HUBSPOT_CLIENT_SECRET',
    'HUBSPOT_BASE_URL',
    'WSA_YEAR',
    'HUBSPOT_ASSOCIATION_TYPE_ID'
  ];

  const optionalVars = [
    'LOOPS_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  let allRequired = true;
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
      console.log(`   ✅ ${varName}: Configured`);
    } else {
      console.log(`   ❌ ${varName}: Missing or not configured`);
      allRequired = false;
    }
  });

  optionalVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
      console.log(`   ✅ ${varName}: Configured`);
    } else {
      console.log(`   ⚠️  ${varName}: Not configured (optional)`);
    }
  });

  return allRequired;
}

// Check integration files
function checkIntegrationFiles() {
  console.log('\n2. Integration Files:');
  
  const files = [
    'src/lib/hubspot-wsa.ts',
    'src/lib/loops.ts',
    'src/app/api/nominations/route.ts',
    'src/app/api/votes/route.ts'
  ];

  let allExist = true;

  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}: Exists`);
    } else {
      console.log(`   ❌ ${file}: Missing`);
      allExist = false;
    }
  });

  return allExist;
}

// Check HubSpot integration
function checkHubSpotIntegration() {
  console.log('\n3. HubSpot Integration:');
  
  const hubspotPath = path.join(__dirname, '../src/lib/hubspot-wsa.ts');
  if (!fs.existsSync(hubspotPath)) {
    console.log('   ❌ HubSpot integration file missing');
    return false;
  }

  const content = fs.readFileSync(hubspotPath, 'utf8');
  
  const checks = [
    { name: 'syncNominator function', pattern: 'export async function syncNominator' },
    { name: 'syncVoter function', pattern: 'export async function syncVoter' },
    { name: 'syncNomination function', pattern: 'export async function syncNomination' },
    { name: 'WSA_SEGMENTS config', pattern: 'WSA_SEGMENTS = {' },
    { name: 'Token usage', pattern: 'process.env.HUBSPOT_PRIVATE_APP_TOKEN' }
  ];

  let allPassed = true;
  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`   ✅ ${check.name}: Found`);
    } else {
      console.log(`   ❌ ${check.name}: Missing`);
      allPassed = false;
    }
  });

  return allPassed;
}

// Check Loops integration
function checkLoopsIntegration() {
  console.log('\n4. Loops Integration:');
  
  const loopsPath = path.join(__dirname, '../src/lib/loops.ts');
  if (!fs.existsSync(loopsPath)) {
    console.log('   ❌ Loops integration file missing');
    return false;
  }

  const content = fs.readFileSync(loopsPath, 'utf8');
  
  const checks = [
    { name: 'syncVoter function', pattern: 'async syncVoter(' },
    { name: 'syncNominee function', pattern: 'async syncNominee(' },
    { name: 'syncNominator function', pattern: 'async syncNominator(' },
    { name: 'addToList function', pattern: 'async addToList(' },
    { name: 'LIST_IDS config', pattern: 'LIST_IDS = {' },
    { name: 'Voters list ID', pattern: 'cmegxu1fc0gw70i1d7g35gqb0' },
    { name: 'Nominees list ID', pattern: 'cmegxubbj0jr60h33ahctgicr' },
    { name: 'Nominators list ID', pattern: 'cmegxuqag0jth0h334yy17csd' }
  ];

  let allPassed = true;
  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`   ✅ ${check.name}: Found`);
    } else {
      console.log(`   ❌ ${check.name}: Missing`);
      allPassed = false;
    }
  });

  return allPassed;
}

// Check API integration
function checkAPIIntegration() {
  console.log('\n5. API Integration:');
  
  const nominationsPath = path.join(__dirname, '../src/app/api/nominations/route.ts');
  const votesPath = path.join(__dirname, '../src/app/api/votes/route.ts');
  
  let allPassed = true;

  // Check nominations API
  if (fs.existsSync(nominationsPath)) {
    const content = fs.readFileSync(nominationsPath, 'utf8');
    if (content.includes('loopsService.syncNominator') && content.includes('syncNominator(')) {
      console.log('   ✅ Nominations API: HubSpot & Loops integration found');
    } else {
      console.log('   ❌ Nominations API: Integration missing');
      allPassed = false;
    }
  } else {
    console.log('   ❌ Nominations API: File missing');
    allPassed = false;
  }

  // Check votes API
  if (fs.existsSync(votesPath)) {
    const content = fs.readFileSync(votesPath, 'utf8');
    if (content.includes('loopsService.syncVoter') && content.includes('syncVoter(')) {
      console.log('   ✅ Votes API: HubSpot & Loops integration found');
    } else {
      console.log('   ❌ Votes API: Integration missing');
      allPassed = false;
    }
  } else {
    console.log('   ❌ Votes API: File missing');
    allPassed = false;
  }

  return allPassed;
}

// Check test scripts
function checkTestScripts() {
  console.log('\n6. Test Scripts:');
  
  const scripts = [
    'scripts/test-hubspot-new-credentials.js',
    'scripts/test-loops-integration.js',
    'scripts/update-hubspot-env.js'
  ];

  let allExist = true;
  scripts.forEach(script => {
    const scriptPath = path.join(__dirname, '..', script);
    if (fs.existsSync(scriptPath)) {
      console.log(`   ✅ ${script}: Available`);
    } else {
      console.log(`   ❌ ${script}: Missing`);
      allExist = false;
    }
  });

  return allExist;
}

// Main execution
async function main() {
  const results = [];
  
  results.push(checkEnvironmentVariables());
  results.push(checkIntegrationFiles());
  results.push(checkHubSpotIntegration());
  results.push(checkLoopsIntegration());
  results.push(checkAPIIntegration());
  results.push(checkTestScripts());

  const allPassed = results.every(Boolean);
  
  console.log('\n📊 Integration Status Summary:');
  console.log('================================');
  console.log(`Environment Variables: ${results[0] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Integration Files: ${results[1] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`HubSpot Integration: ${results[2] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Loops Integration: ${results[3] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Integration: ${results[4] ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test Scripts: ${results[5] ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ READY FOR TESTING' : '❌ NEEDS ATTENTION'}`);

  if (allPassed) {
    console.log('\n🚀 Next Steps:');
    console.log('1. Run integration tests:');
    console.log('   node scripts/test-hubspot-new-credentials.js');
    console.log('   node scripts/test-loops-integration.js');
    console.log('');
    console.log('2. Start manual testing:');
    console.log('   npm run dev');
    console.log('   Follow MANUAL_TESTING_GUIDE.md');
    console.log('');
    console.log('3. Check admin dashboard:');
    console.log('   http://localhost:3000/admin');
  } else {
    console.log('\n⚠️  Issues found. Please review the failed checks above.');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);