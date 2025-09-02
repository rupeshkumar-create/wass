#!/usr/bin/env node

/**
 * Security Setup Script for World Staffing Awards
 * This script helps configure the security environment
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class SecuritySetup {
  constructor() {
    this.envPath = '.env';
    this.envExamplePath = '.env.example';
  }

  async run() {
    console.log('🔒 World Staffing Awards - Security Setup');
    console.log('==========================================\n');

    // Generate credentials
    const credentials = await this.generateCredentials();
    
    // Check current environment
    this.checkEnvironment();
    
    // Show setup instructions
    this.showSetupInstructions(credentials);
    
    // Run security audit
    await this.runSecurityAudit();
  }

  async generateCredentials() {
    console.log('🔑 Generating secure credentials...\n');
    
    const password = 'WSA2026Admin!Secure';
    const hash = await bcrypt.hash(password, 12);
    
    const secrets = {
      sessionSecret: crypto.randomBytes(32).toString('hex'),
      cronSecret: crypto.randomBytes(16).toString('hex'),
      syncSecret: crypto.randomBytes(16).toString('hex')
    };

    return {
      email: 'admin@worldstaffingawards.com',
      password,
      hash,
      ...secrets
    };
  }

  checkEnvironment() {
    console.log('📁 Checking environment files...\n');
    
    if (fs.existsSync(this.envPath)) {
      console.log('✅ .env file exists');
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      
      const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'HUBSPOT_ACCESS_TOKEN',
        'LOOPS_API_KEY'
      ];
      
      const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
      
      if (missingVars.length > 0) {
        console.log('⚠️  Missing required variables:', missingVars.join(', '));
      } else {
        console.log('✅ All basic environment variables present');
      }
    } else {
      console.log('❌ .env file not found - you need to create one');
    }
    
    console.log('');
  }

  showSetupInstructions(credentials) {
    console.log('🚀 SETUP INSTRUCTIONS');
    console.log('=====================\n');
    
    console.log('1. ADD THESE SECURITY VARIABLES TO YOUR .env FILE:');
    console.log('---------------------------------------------------');
    console.log(`ADMIN_EMAILS=${credentials.email}`);
    console.log(`ADMIN_PASSWORD_HASHES=${credentials.hash}`);
    console.log(`SERVER_SESSION_SECRET=${credentials.sessionSecret}`);
    console.log(`CRON_SECRET=${credentials.cronSecret}`);
    console.log(`SYNC_SECRET=${credentials.syncSecret}`);
    console.log('');
    
    console.log('2. ADMIN LOGIN CREDENTIALS:');
    console.log('---------------------------');
    console.log(`Email: ${credentials.email}`);
    console.log(`Password: ${credentials.password}`);
    console.log('');
    
    console.log('3. ENSURE THESE EXISTING VARIABLES ARE SET:');
    console.log('-------------------------------------------');
    console.log('SUPABASE_URL=https://your-project.supabase.co');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    console.log('HUBSPOT_ACCESS_TOKEN=your_hubspot_token');
    console.log('LOOPS_API_KEY=your_loops_key');
    console.log('NEXT_PUBLIC_APP_URL=https://your-domain.com');
    console.log('');
    
    console.log('4. SUPABASE STORAGE SETUP:');
    console.log('--------------------------');
    console.log('• Go to Supabase Dashboard → Storage');
    console.log('• Create new bucket: "wsa-uploads"');
    console.log('• Set appropriate RLS policies');
    console.log('');
    
    console.log('5. PRODUCTION DEPLOYMENT:');
    console.log('-------------------------');
    console.log('• Rotate ALL API keys and secrets');
    console.log('• Use strong, unique passwords');
    console.log('• Enable HTTPS');
    console.log('• Run security audit before deployment');
    console.log('');
  }

  async runSecurityAudit() {
    console.log('🔍 Running security audit...\n');
    
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve) => {
        const audit = spawn('node', ['scripts/security-audit.js'], {
          stdio: 'inherit'
        });
        
        audit.on('close', (code) => {
          console.log('\n');
          if (code === 0) {
            console.log('✅ Security audit passed!');
            console.log('🎉 Your application is ready for deployment.');
          } else {
            console.log('❌ Security audit found issues.');
            console.log('🔧 Please fix the issues before deployment.');
          }
          resolve();
        });
      });
    } catch (error) {
      console.log('⚠️  Could not run security audit automatically.');
      console.log('   Run manually: node scripts/security-audit.js');
    }
  }
}

// Run setup
const setup = new SecuritySetup();
setup.run().catch(console.error);