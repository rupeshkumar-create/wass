#!/usr/bin/env node

/**
 * Generate bcrypt hashes for admin passwords
 * Usage: node scripts/generate-admin-hash.js [password]
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function generateHash(password) {
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

function generateSecrets() {
  return {
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    cronSecret: crypto.randomBytes(16).toString('hex'),
    syncSecret: crypto.randomBytes(16).toString('hex')
  };
}

async function main() {
  const password = process.argv[2];
  
  if (!password) {
    console.log('Usage: node scripts/generate-admin-hash.js [password]');
    console.log('');
    console.log('This script generates secure hashes and secrets for admin authentication.');
    console.log('');
    
    // Generate sample secrets
    const secrets = generateSecrets();
    console.log('Sample secrets for your .env file:');
    console.log('');
    console.log(`SERVER_SESSION_SECRET=${secrets.sessionSecret}`);
    console.log(`CRON_SECRET=${secrets.cronSecret}`);
    console.log(`SYNC_SECRET=${secrets.syncSecret}`);
    console.log('');
    console.log('To generate a password hash:');
    console.log('node scripts/generate-admin-hash.js "your-secure-password"');
    return;
  }
  
  try {
    const hash = await generateHash(password);
    console.log('Password hash generated:');
    console.log(hash);
    console.log('');
    console.log('Add this to your ADMIN_PASSWORD_HASHES environment variable.');
    console.log('For multiple admins, separate hashes with commas.');
  } catch (error) {
    console.error('Error generating hash:', error);
    process.exit(1);
  }
}

main();