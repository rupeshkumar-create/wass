#!/usr/bin/env node

/**
 * Script to update HubSpot environment variables
 * Helps transition to new credentials safely
 */

const fs = require('fs');
const path = require('path');

const NEW_CREDENTIALS = {
  HUBSPOT_PRIVATE_APP_TOKEN: process.env.HUBSPOT_PRIVATE_APP_TOKEN,
  HUBSPOT_CLIENT_SECRET: process.env.HUBSPOT_CLIENT_SECRET,
  HUBSPOT_BASE_URL: 'https://api.hubapi.com',
  WSA_YEAR: '2026'
};

console.log('🔄 HubSpot Environment Variables Update Script\n');

function updateEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const envLocalPath = path.join(__dirname, '../.env.local');
  
  // Check which env file exists
  let targetFile = null;
  if (fs.existsSync(envPath)) {
    targetFile = envPath;
    console.log('📁 Found .env file');
  } else if (fs.existsSync(envLocalPath)) {
    targetFile = envLocalPath;
    console.log('📁 Found .env.local file');
  } else {
    console.log('📁 No .env file found, creating new one...');
    targetFile = envPath;
  }

  let envContent = '';
  let existingVars = {};

  // Read existing content if file exists
  if (fs.existsSync(targetFile)) {
    envContent = fs.readFileSync(targetFile, 'utf8');
    
    // Parse existing variables
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          existingVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }

  console.log('\n🔍 Current HubSpot Variables:');
  Object.keys(NEW_CREDENTIALS).forEach(key => {
    const current = existingVars[key];
    if (current) {
      console.log(`   ${key}: ${current.substring(0, 20)}${current.length > 20 ? '...' : ''}`);
    } else {
      console.log(`   ${key}: (not set)`);
    }
  });

  // Update variables
  console.log('\n🔄 Updating HubSpot Variables:');
  Object.entries(NEW_CREDENTIALS).forEach(([key, value]) => {
    const oldValue = existingVars[key];
    existingVars[key] = value;
    
    if (oldValue !== value) {
      console.log(`   ✅ ${key}: Updated`);
    } else {
      console.log(`   ➡️  ${key}: No change needed`);
    }
  });

  // Rebuild env content
  const updatedLines = [];
  const processedKeys = new Set();

  // Process existing lines, updating HubSpot vars
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key] = trimmed.split('=');
      const cleanKey = key?.trim();
      
      if (cleanKey && NEW_CREDENTIALS.hasOwnProperty(cleanKey)) {
        updatedLines.push(`${cleanKey}=${NEW_CREDENTIALS[cleanKey]}`);
        processedKeys.add(cleanKey);
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  });

  // Add any new HubSpot variables that weren't in the file
  const newVars = Object.keys(NEW_CREDENTIALS).filter(key => !processedKeys.has(key));
  if (newVars.length > 0) {
    updatedLines.push('');
    updatedLines.push('# HubSpot Integration - Updated Credentials');
    newVars.forEach(key => {
      updatedLines.push(`${key}=${NEW_CREDENTIALS[key]}`);
    });
  }

  // Write updated content
  const finalContent = updatedLines.join('\n');
  fs.writeFileSync(targetFile, finalContent);

  console.log(`\n✅ Environment file updated: ${targetFile}`);
  return targetFile;
}

function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`💾 Backup created: ${backupPath}`);
    return backupPath;
  }
  return null;
}

function validateUpdate() {
  console.log('\n🔍 Validating Update...');
  
  // Check if we can load the new variables
  try {
    require('dotenv').config();
    
    const checks = [
      { key: 'HUBSPOT_PRIVATE_APP_TOKEN', expected: NEW_CREDENTIALS.HUBSPOT_PRIVATE_APP_TOKEN },
      { key: 'HUBSPOT_CLIENT_SECRET', expected: NEW_CREDENTIALS.HUBSPOT_CLIENT_SECRET },
      { key: 'HUBSPOT_BASE_URL', expected: NEW_CREDENTIALS.HUBSPOT_BASE_URL },
      { key: 'WSA_YEAR', expected: NEW_CREDENTIALS.WSA_YEAR },
    ];

    let allValid = true;
    checks.forEach(({ key, expected }) => {
      const actual = process.env[key];
      if (actual === expected) {
        console.log(`   ✅ ${key}: Correct`);
      } else {
        console.log(`   ❌ ${key}: Expected "${expected}", got "${actual}"`);
        allValid = false;
      }
    });

    return allValid;
  } catch (error) {
    console.log(`   ❌ Validation error: ${error.message}`);
    return false;
  }
}

function showNextSteps() {
  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('1. Test the new credentials:');
  console.log('   node scripts/test-hubspot-new-credentials.js');
  console.log('');
  console.log('2. Update production environment variables:');
  console.log('   - Netlify: Site settings → Environment variables');
  console.log('   - Vercel: Project settings → Environment Variables');
  console.log('');
  console.log('3. Test the integration:');
  console.log('   - Submit a test nomination');
  console.log('   - Cast a test vote');
  console.log('   - Check HubSpot for new contacts');
  console.log('');
  console.log('4. Monitor the admin dashboard:');
  console.log('   - Check HubSpot connection status');
  console.log('   - Review sync events');
}

// Main execution
async function main() {
  try {
    console.log('🎯 This script will update your HubSpot credentials to:');
    console.log(`   Access Token: ${NEW_CREDENTIALS.HUBSPOT_PRIVATE_APP_TOKEN.substring(0, 20)}...`);
    console.log(`   Client Secret: ${NEW_CREDENTIALS.HUBSPOT_CLIENT_SECRET.substring(0, 10)}...`);
    console.log('');

    // Create backup
    const envPath = path.join(__dirname, '../.env');
    const envLocalPath = path.join(__dirname, '../.env.local');
    
    if (fs.existsSync(envPath)) {
      createBackup(envPath);
    }
    if (fs.existsSync(envLocalPath)) {
      createBackup(envLocalPath);
    }

    // Update env file
    const updatedFile = updateEnvFile();

    // Validate
    const isValid = validateUpdate();

    if (isValid) {
      console.log('\n🎉 HubSpot credentials updated successfully!');
      showNextSteps();
    } else {
      console.log('\n⚠️  Validation failed. Please check the environment file manually.');
    }

  } catch (error) {
    console.error('\n💥 Update failed:', error.message);
    process.exit(1);
  }
}

main();