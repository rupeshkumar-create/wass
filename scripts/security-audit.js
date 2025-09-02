#!/usr/bin/env node

/**
 * Security audit script for World Staffing Awards
 * Checks for common security issues and misconfigurations
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  addIssue(severity, message, file = null) {
    this.issues.push({ severity, message, file });
  }

  addWarning(message, file = null) {
    this.warnings.push({ message, file });
  }

  addPassed(message) {
    this.passed.push(message);
  }

  async audit() {
    console.log('🔍 Starting security audit...\n');

    await this.checkEnvironmentFiles();
    await this.checkHardcodedSecrets();
    await this.checkAdminAuthentication();
    await this.checkFilePermissions();
    await this.checkDependencies();
    await this.checkAPIEndpoints();

    this.printResults();
  }

  async checkEnvironmentFiles() {
    console.log('📁 Checking environment files...');

    // Check if .env files are in .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (gitignore.includes('.env')) {
        this.addPassed('Environment files are properly ignored in .gitignore');
      } else {
        this.addIssue('HIGH', 'Environment files not properly ignored in .gitignore', '.gitignore');
      }
    }

    // Check for committed .env files
    const envFiles = ['.env', '.env.local', '.env.production'];
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        this.addWarning(`Environment file ${envFile} exists - ensure it's not committed`, envFile);
      }
    }

    // Check .env.example
    const envExamplePath = '.env.example';
    if (fs.existsSync(envExamplePath)) {
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      if (envExample.includes('your_') || envExample.includes('your-')) {
        this.addPassed('Environment example uses placeholder values');
      } else {
        this.addWarning('Environment example may contain real values', envExamplePath);
      }
    }
  }

  async checkHardcodedSecrets() {
    console.log('🔐 Checking for hardcoded secrets...');

    const dangerousPatterns = [
      { pattern: /(?<!\/\/.*|\/\*.*|\*.*|#.*|'.*|".*)(admin123|wsa2026)(?!.*\*\/)/gi, name: 'Hardcoded admin passwords' },
      { pattern: /(?<!\/\/.*|\/\*.*|\*.*|#.*)'X-Admin-Passcode'/gi, name: 'Hardcoded admin passcode headers' },
      { pattern: /sk_live_[a-zA-Z0-9]{24,}/gi, name: 'Stripe live keys' },
      { pattern: /AKIA[0-9A-Z]{16}/gi, name: 'AWS access keys' },
      { pattern: /AIza[0-9A-Za-z\-_]{35}/gi, name: 'Google API keys' },
    ];

    const filesToCheck = this.getSourceFiles();
    
    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const { pattern, name } of dangerousPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.addIssue('CRITICAL', `${name} found in ${filePath}`, filePath);
        }
      }
    }

    if (this.issues.filter(i => i.severity === 'CRITICAL').length === 0) {
      this.addPassed('No hardcoded secrets found in source code');
    }
  }

  async checkAdminAuthentication() {
    console.log('🛡️ Checking admin authentication...');

    // Check if middleware exists
    const middlewarePath = 'middleware.ts';
    if (fs.existsSync(middlewarePath)) {
      const middleware = fs.readFileSync(middlewarePath, 'utf8');
      if (middleware.includes('verifyAdminSession')) {
        this.addPassed('JWT-based admin authentication implemented');
      } else {
        this.addIssue('HIGH', 'Admin authentication middleware missing JWT verification', middlewarePath);
      }
    } else {
      this.addIssue('CRITICAL', 'No middleware.ts found - admin routes are unprotected');
    }

    // Check for admin login endpoint
    const loginPath = 'src/app/api/admin/login/route.ts';
    if (fs.existsSync(loginPath)) {
      this.addPassed('Admin login endpoint exists');
    } else {
      this.addIssue('HIGH', 'Admin login endpoint missing');
    }

    // Check for logout endpoint
    const logoutPath = 'src/app/api/admin/logout/route.ts';
    if (fs.existsSync(logoutPath)) {
      this.addPassed('Admin logout endpoint exists');
    } else {
      this.addWarning('Admin logout endpoint missing');
    }
  }

  async checkFilePermissions() {
    console.log('📂 Checking file permissions...');

    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'scripts/generate-admin-hash.js'
    ];

    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const mode = stats.mode & parseInt('777', 8);
        if (mode > parseInt('600', 8)) {
          this.addWarning(`File ${file} has overly permissive permissions (${mode.toString(8)})`);
        }
      }
    }
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies...');

    const packagePath = 'package.json';
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for security-related dependencies
      const securityDeps = ['jose', 'bcryptjs'];
      const hasSecurity = securityDeps.every(dep => 
        pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]
      );
      
      if (hasSecurity) {
        this.addPassed('Security dependencies (JWT, bcrypt) are installed');
      } else {
        this.addIssue('HIGH', 'Missing security dependencies (jose, bcryptjs)');
      }
    }
  }

  async checkAPIEndpoints() {
    console.log('🌐 Checking API endpoints...');

    const apiDir = 'src/app/api';
    if (fs.existsSync(apiDir)) {
      const adminEndpoints = this.findFiles(path.join(apiDir, 'admin'), '.ts');
      const protectedEndpoints = [
        ...adminEndpoints,
        'src/app/api/nomination/approve/route.ts',
        'src/app/api/sync/hubspot/run/route.ts'
      ];

      for (const endpoint of protectedEndpoints) {
        if (fs.existsSync(endpoint)) {
          const content = fs.readFileSync(endpoint, 'utf8');
          
          // Check if endpoint has proper authentication
          if (content.includes('x-admin-user') || content.includes('verifyAdminSession') || content.includes('middleware')) {
            this.addPassed(`Endpoint ${endpoint} has authentication checks`);
          } else if (content.includes('X-Admin-Passcode')) {
            this.addIssue('HIGH', `Endpoint ${endpoint} uses deprecated passcode authentication`, endpoint);
          } else {
            this.addWarning(`Endpoint ${endpoint} may lack proper authentication`, endpoint);
          }
        }
      }
    }
  }

  getSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const dirs = ['src'];
    const files = [];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        files.push(...this.findFiles(dir, extensions));
      }
    }

    // Add specific script files but exclude test and audit scripts
    const scriptFiles = [
      'scripts/generate-admin-hash.js'
    ];
    
    for (const file of scriptFiles) {
      if (fs.existsSync(file)) {
        files.push(file);
      }
    }

    return files;
  }

  findFiles(dir, extensions) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findFiles(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (Array.isArray(extensions) ? extensions.includes(ext) : ext === extensions) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY AUDIT RESULTS');
    console.log('='.repeat(60));

    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      for (const issue of this.issues) {
        const severity = issue.severity === 'CRITICAL' ? '🚨' : '⚠️';
        console.log(`${severity} [${issue.severity}] ${issue.message}`);
        if (issue.file) {
          console.log(`   📁 ${issue.file}`);
        }
      }
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      for (const warning of this.warnings) {
        console.log(`⚠️  ${warning.message}`);
        if (warning.file) {
          console.log(`   📁 ${warning.file}`);
        }
      }
    }

    if (this.passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      for (const pass of this.passed) {
        console.log(`✅ ${pass}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL').length;
    const highIssues = this.issues.filter(i => i.severity === 'HIGH').length;
    
    console.log(`📊 SUMMARY:`);
    console.log(`   Critical Issues: ${criticalIssues}`);
    console.log(`   High Issues: ${highIssues}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Passed: ${this.passed.length}`);

    if (criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES MUST BE FIXED BEFORE PRODUCTION DEPLOYMENT!');
      process.exit(1);
    } else if (highIssues > 0) {
      console.log('\n⚠️  High priority issues should be addressed.');
      process.exit(1);
    } else {
      console.log('\n🎉 No critical security issues found!');
      process.exit(0);
    }
  }
}

// Run audit
const auditor = new SecurityAuditor();
auditor.audit().catch(console.error);