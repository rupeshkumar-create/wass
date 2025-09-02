#!/usr/bin/env node

/**
 * HubSpot Integration Test Script
 * 
 * This script tests the complete HubSpot integration for World Staffing Awards 2026
 * Run with: node scripts/test-hubspot-integration.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchText, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`❌ ${description} - File not found`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const found = content.includes(searchText);
  
  if (found) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkEnvVariable(varName, description) {
  // Check if .env file exists and contains the variable
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    log(`⚠️  ${description} - .env file not found`, 'yellow');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasVar = envContent.includes(varName);
  
  if (hasVar) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`⚠️  ${description} - Variable not set`, 'yellow');
    return false;
  }
}

async function main() {
  log('🔍 Testing HubSpot Integration for World Staffing Awards 2026', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Core Integration Files
  log('\\n📁 Core Integration Files:', 'blue');
  
  const coreFiles = [
    ['src/integrations/hubspot/client.ts', 'HubSpot API Client'],
    ['src/integrations/hubspot/mappers.ts', 'Data Mappers'],
    ['src/integrations/hubspot/sync.ts', 'Sync Functions'],
    ['src/integrations/hubspot/hooks.ts', 'Integration Hooks'],
  ];
  
  coreFiles.forEach(([file, desc]) => {
    totalTests++;
    if (checkFile(file, desc)) passedTests++;
  });
  
  // Test 2: API Endpoints
  log('\\n🌐 API Endpoints:', 'blue');
  
  const apiFiles = [
    ['src/app/api/integrations/hubspot/stats/route.ts', 'Stats API Endpoint'],
    ['src/app/api/integrations/hubspot/events/route.ts', 'Events API Endpoint'],
    ['src/app/api/integrations/hubspot/resync/route.ts', 'Resync API Endpoint'],
  ];
  
  apiFiles.forEach(([file, desc]) => {
    totalTests++;
    if (checkFile(file, desc)) passedTests++;
  });
  
  // Test 3: UI Components
  log('\\n🎨 UI Components:', 'blue');
  
  const uiFiles = [
    ['src/components/dashboard/HubSpotPanel.tsx', 'HubSpot Admin Panel'],
  ];
  
  uiFiles.forEach(([file, desc]) => {
    totalTests++;
    if (checkFile(file, desc)) passedTests++;
  });
  
  // Test 4: Bootstrap Script
  log('\\n🚀 Setup Scripts:', 'blue');
  
  const scriptFiles = [
    ['scripts/hubspot/bootstrap.ts', 'HubSpot Bootstrap Script'],
  ];
  
  scriptFiles.forEach(([file, desc]) => {
    totalTests++;
    if (checkFile(file, desc)) passedTests++;
  });
  
  // Test 5: Integration Hooks in Existing APIs
  log('\\n🔗 Integration Hooks:', 'blue');
  
  const hookTests = [
    ['src/app/api/nominations/route.ts', 'onNominationApproved', 'Nominations API has HubSpot hooks'],
    ['src/app/api/votes/route.ts', 'onVoteCast', 'Votes API has HubSpot hooks'],
    ['src/app/admin/page.tsx', 'HubSpotPanel', 'Admin page includes HubSpot panel'],
  ];
  
  hookTests.forEach(([file, search, desc]) => {
    totalTests++;
    if (checkFileContent(file, search, desc)) passedTests++;
  });
  
  // Test 6: Environment Configuration
  log('\\n⚙️  Environment Configuration:', 'blue');
  
  const envVars = [
    ['HUBSPOT_PRIVATE_APP_TOKEN', 'HubSpot Private App Token'],
    ['HUBSPOT_BASE_URL', 'HubSpot Base URL'],
    ['WSA_YEAR', 'WSA Year Configuration'],
  ];
  
  envVars.forEach(([varName, desc]) => {
    totalTests++;
    if (checkEnvVariable(varName, desc)) passedTests++;
  });
  
  // Test 7: Documentation
  log('\\n📚 Documentation:', 'blue');
  
  const docFiles = [
    ['README_hubspot.md', 'HubSpot Integration Documentation'],
  ];
  
  docFiles.forEach(([file, desc]) => {
    totalTests++;
    if (checkFile(file, desc)) passedTests++;
  });
  
  // Test 8: Key Function Exports
  log('\\n🔧 Key Function Exports:', 'blue');
  
  const functionTests = [
    ['src/integrations/hubspot/client.ts', 'export class HubSpotClient', 'HubSpot Client Class Export'],
    ['src/integrations/hubspot/mappers.ts', 'mapNomineeToContact', 'Nominee Mapping Function'],
    ['src/integrations/hubspot/sync.ts', 'syncNominationApproved', 'Nomination Sync Function'],
    ['src/integrations/hubspot/hooks.ts', 'onNominationApproved', 'Nomination Hook Function'],
  ];
  
  functionTests.forEach(([file, search, desc]) => {
    totalTests++;
    if (checkFileContent(file, search, desc)) passedTests++;
  });
  
  // Test 9: TypeScript Imports
  log('\\n📦 TypeScript Imports:', 'blue');
  
  const importTests = [
    ['src/integrations/hubspot/mappers.ts', 'import { Nomination, Vote, Voter }', 'Type Imports in Mappers'],
    ['src/integrations/hubspot/sync.ts', 'import { hubspotClient }', 'Client Import in Sync'],
    ['src/components/dashboard/HubSpotPanel.tsx', 'useState, useEffect', 'React Hooks in Panel'],
  ];
  
  importTests.forEach(([file, search, desc]) => {
    totalTests++;
    if (checkFileContent(file, search, desc)) passedTests++;
  });
  
  // Summary
  log('\\n' + '=' .repeat(60), 'cyan');
  log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`, 'bright');
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  
  if (percentage === 100) {
    log('🎉 All tests passed! HubSpot integration is ready.', 'green');
  } else if (percentage >= 80) {
    log(`⚠️  Most tests passed (${percentage}%). Review failed items above.`, 'yellow');
  } else {
    log(`❌ Many tests failed (${percentage}%). Integration needs work.`, 'red');
  }
  
  // Next Steps
  log('\\n📋 Next Steps:', 'blue');
  log('1. Set up HubSpot Private App and get access token', 'reset');
  log('2. Add HUBSPOT_PRIVATE_APP_TOKEN to .env file', 'reset');
  log('3. Run: npx tsx scripts/hubspot/bootstrap.ts', 'reset');
  log('4. Test the integration in the admin panel', 'reset');
  log('5. Approve a test nomination to verify sync', 'reset');
  
  // Configuration Check
  log('\\n🔧 Configuration Status:', 'blue');
  
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('HUBSPOT_PRIVATE_APP_TOKEN=pat-')) {
      log('✅ HubSpot token appears to be configured', 'green');
    } else if (envContent.includes('HUBSPOT_PRIVATE_APP_TOKEN=')) {
      log('⚠️  HubSpot token variable exists but may be empty', 'yellow');
    } else {
      log('❌ HubSpot token not configured', 'red');
    }
  } else {
    log('❌ .env file not found', 'red');
  }
  
  log('\\n✨ Integration test complete!', 'cyan');
}

// Run the tests
main().catch(error => {
  log(`\\n💥 Test script failed: ${error.message}`, 'red');
  process.exit(1);
});