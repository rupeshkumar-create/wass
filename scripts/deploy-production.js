#!/usr/bin/env node

/**
 * Production Deployment Script
 * Builds and deploys the World Staffing Awards application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 World Staffing Awards - Production Deployment');
console.log('================================================');

function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('\n🔍 Pre-deployment checks...');
    
    // Check if required files exist
    const requiredFiles = [
      '.env.local',
      'package.json',
      'netlify.toml',
      'next.config.js'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`⚠️  ${file} not found (may be optional)`);
      }
    }
    
    // Install dependencies
    if (!runCommand('npm install', 'Installing dependencies')) {
      process.exit(1);
    }
    
    // Run linting
    console.log('\n🔍 Running code quality checks...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Linting passed');
    } catch (error) {
      console.log('⚠️  Linting warnings (continuing with deployment)');
    }
    
    // Build the application
    if (!runCommand('npm run build', 'Building application')) {
      console.error('\n❌ Build failed. Please fix the errors and try again.');
      process.exit(1);
    }
    
    // Check if Netlify CLI is available
    console.log('\n🔍 Checking deployment options...');
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      console.log('✅ Netlify CLI is available');
      
      // Deploy to Netlify
      console.log('\n🚀 Deploying to Netlify...');
      console.log('📋 Running: netlify deploy --prod --dir=.next');
      
      try {
        execSync('netlify deploy --prod --dir=.next', { stdio: 'inherit' });
        console.log('\n🎉 Deployment successful!');
        console.log('🌐 Your application is now live on Netlify');
        
        // Get site info
        try {
          const siteInfo = execSync('netlify status', { encoding: 'utf8' });
          console.log('\n📊 Site Information:');
          console.log(siteInfo);
        } catch (error) {
          console.log('⚠️  Could not retrieve site information');
        }
        
      } catch (error) {
        console.log('\n⚠️  Netlify deployment failed. Trying alternative deployment...');
        
        // Alternative: Manual deployment instructions
        console.log('\n📋 Manual Deployment Instructions:');
        console.log('1. The application has been built successfully');
        console.log('2. Build output is in the .next directory');
        console.log('3. You can deploy manually by:');
        console.log('   - Uploading the .next folder to your hosting provider');
        console.log('   - Or using: netlify deploy --prod --dir=.next');
        console.log('   - Or connecting your Git repository to Netlify');
      }
      
    } catch (error) {
      console.log('⚠️  Netlify CLI not found');
      console.log('\n📋 Alternative Deployment Options:');
      console.log('1. Install Netlify CLI: npm install -g netlify-cli');
      console.log('2. Login to Netlify: netlify login');
      console.log('3. Deploy: netlify deploy --prod --dir=.next');
      console.log('\nOr:');
      console.log('1. Connect your Git repository to Netlify dashboard');
      console.log('2. Netlify will auto-deploy on every push');
    }
    
    // Start local server for immediate testing
    console.log('\n🖥️  Starting local production server...');
    console.log('📋 You can test the production build locally at: http://localhost:3000');
    console.log('📋 Press Ctrl+C to stop the server');
    
    try {
      execSync('npm start', { stdio: 'inherit' });
    } catch (error) {
      console.log('\n⚠️  Local server stopped');
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();