#!/usr/bin/env node

/**
 * HubSpot Setup Verification Script
 * 
 * This script helps verify your HubSpot setup step by step
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvToken() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found', 'red');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('HUBSPOT_PRIVATE_APP_TOKEN=your-hubspot-token-here')) {
    log('⚠️  HubSpot token not configured (still using placeholder)', 'yellow');
    return false;
  }
  
  if (envContent.includes('HUBSPOT_PRIVATE_APP_TOKEN=pat-')) {
    log('✅ HubSpot token appears to be configured', 'green');
    return true;
  }
  
  log('❌ HubSpot token not found in .env', 'red');
  return false;
}

async function main() {
  log('🔍 HubSpot Setup Verification', 'cyan');
  log('=' .repeat(40), 'cyan');
  
  // Step 1: Check token
  log('\\n1️⃣  Checking HubSpot Token Configuration:', 'blue');
  const tokenConfigured = checkEnvToken();
  
  if (!tokenConfigured) {
    log('\\n📋 Next Steps:', 'yellow');
    log('1. Create a HubSpot Private App:', 'reset');
    log('   - Go to HubSpot Settings → Integrations → Private Apps', 'reset');
    log('   - Create app with name: "World Staffing Awards 2026"', 'reset');
    log('   - Enable scopes: contacts.read, contacts.write, companies.read, companies.write', 'reset');
    log('   - Copy the access token', 'reset');
    log('\\n2. Update .env file:', 'reset');
    log('   - Replace "your-hubspot-token-here" with your actual token', 'reset');
    log('   - Token should start with "pat-na2-"', 'reset');
    log('\\n3. Run bootstrap script:', 'reset');
    log('   - npx tsx scripts/hubspot/bootstrap.ts', 'reset');
    return;
  }
  
  // Step 2: Test connection
  log('\\n2️⃣  Testing HubSpot API Connection:', 'blue');
  log('Run: npx tsx scripts/hubspot/bootstrap.ts', 'cyan');
  
  // Step 3: Check admin panel
  log('\\n3️⃣  Check Admin Panel:', 'blue');
  log('1. Go to http://localhost:3010/admin', 'reset');
  log('2. Click on the "HubSpot" tab', 'reset');
  log('3. Verify connection status shows "Connected"', 'reset');
  
  // Step 4: Test sync
  log('\\n4️⃣  Test Integration:', 'blue');
  log('1. Create a test nomination', 'reset');
  log('2. Approve it in the admin panel', 'reset');
  log('3. Check HubSpot for the new contact/company', 'reset');
  
  log('\\n✨ Setup verification complete!', 'cyan');
}

main().catch(error => {
  log(`\\n💥 Verification failed: ${error.message}`, 'red');
  process.exit(1);
});