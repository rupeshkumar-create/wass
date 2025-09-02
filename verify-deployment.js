#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies that all security measures are properly configured
 */

const fs = require('fs');
const https = require('https');

class DeploymentVerifier {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  async verify() {
    console.log('🔍 Deployment Security Verification');
    console.log('===================================\n');

    await this.checkEnvironmentVariables();
    await this.checkSecurityFiles();
    await this.runSecurityAudit();
    
    this.printResults();
  }

  async checkEnvironmentVariables() {
    console.log('📋 Checking environment variables...');
    
    const requiredSecurityVars = [
      'ADMIN_EMAILS',
      'ADMIN_PASSWORD_HASHES', 
      'SERVER_SESSION_SECRET',
      'CRON_SECRET',
      'SYNC_SECRET'
    ];

    const requiredAppVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'HUBSPOT_ACCESS_TOKEN',
      'LOOPS_API_KEY'
    ];

    if (!fs.existsSync('.env')) {
      this.errors.push('❌ .env file not found');
      return;
    }

    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Check security variables
    const missingSecurityVars = requiredSecurityVars.filter(varName => 
      !envContent.includes(varName + '=')
    );
    
    if (missingSecurityVars.length === 0) {
      this.checks.push('✅ All security environment variables present');
    } else {
      this.errors.push(`❌ Missing security variables: ${missingSecurityVars.join(', ')}`);
    }

    // Check app variables
    const missingAppVars = requiredAppVars.filter(varName => 
      !envContent.includes(varName + '=') || envContent.includes(varName + '=your_')
    );
    
    if (missingAppVars.length === 0) {
      this.checks.push('✅ All application environment variables configured');
    } else {
      this.warnings.push(`⚠️  Check these variables: ${missingAppVars.join(', ')}`);
    }

    // Check for placeholder values
    if (envContent.includes('your_') || envContent.includes('your-')) {
      this.warnings.push('⚠️  Some variables still have placeholder values');
    }

    console.log('');
  }

  async checkSecurityFiles() {
    console.log('🔒 Checking security implementation...');
    
    const requiredFiles = [
      { path: 'middleware.ts', name: 'Authentication middleware' },
      { path: 'src/lib/auth/session.ts', name: 'JWT session management' },
      { path: 'src/app/api/admin/login/route.ts', name: 'Admin login endpoint' },
      { path: 'src/app/api/admin/logout/route.ts', name: 'Admin logout endpoint' },
      { path: 'src/lib/rate-limit.ts', name: 'Rate limiting utilities' },
      { path: 'src/lib/secure-upload.ts', name: 'Secure upload utilities' }
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file.path)) {
        this.checks.push(`✅ ${file.name} implemented`);
      } else {
        this.errors.push(`❌ Missing: ${file.name} (${file.path})`);
      }
    }

    // Check robots.txt
    if (fs.existsSync('public/robots.txt')) {
      const robotsContent = fs.readFileSync('public/robots.txt', 'utf8');
      if (robotsContent.includes('Disallow: /admin')) {
        this.checks.push('✅ Admin routes blocked in robots.txt');
      } else {
        this.warnings.push('⚠️  Admin routes not blocked in robots.txt');
      }
    } else {
      this.warnings.push('⚠️  robots.txt not found');
    }

    console.log('');
  }

  async runSecurityAudit() {
    console.log('🔍 Running security audit...');
    
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve) => {
        const audit = spawn('node', ['scripts/security-audit.js'], {
          stdio: 'pipe'
        });
        
        let output = '';
        audit.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        audit.stderr.on('data', (data) => {
          output += data.toString();
        });
        
        audit.on('close', (code) => {
          if (code === 0) {
            this.checks.push('✅ Security audit passed');
          } else {
            this.errors.push('❌ Security audit failed - check issues above');
          }
          console.log('');
          resolve();
        });
      });
    } catch (error) {
      this.warnings.push('⚠️  Could not run security audit');
      console.log('');
    }
  }

  printResults() {
    console.log('📊 DEPLOYMENT VERIFICATION RESULTS');
    console.log('==================================\n');

    if (this.checks.length > 0) {
      console.log('✅ PASSED CHECKS:');
      this.checks.forEach(check => console.log(check));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(warning));
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(error));
      console.log('');
    }

    console.log('📋 SUMMARY:');
    console.log(`   Passed: ${this.checks.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log('');

    if (this.errors.length === 0) {
      console.log('🎉 DEPLOYMENT READY!');
      console.log('Your application meets security requirements.');
      console.log('');
      console.log('📝 NEXT STEPS:');
      console.log('1. Deploy to your hosting platform');
      console.log('2. Test admin login functionality');
      console.log('3. Verify security headers in production');
      console.log('4. Monitor for security issues');
    } else {
      console.log('🚨 NOT READY FOR DEPLOYMENT');
      console.log('Please fix the errors above before deploying.');
      process.exit(1);
    }
  }
}

// Run verification
const verifier = new DeploymentVerifier();
verifier.verify().catch(console.error);