#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying World Staffing Awards to Vercel...\n');

// Check if vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
} catch (error) {
  console.log('📦 Installing Vercel CLI...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
}

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this from the project root.');
  process.exit(1);
}

// Verify environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'HUBSPOT_ACCESS_TOKEN',
  'LOOPS_API_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD_HASH'
];

console.log('🔍 Checking environment variables...');
const missingVars = [];

// Check local .env files
const envFiles = ['.env.local', '.env'];
let hasEnvFile = false;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    hasEnvFile = true;
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    for (const varName of requiredEnvVars) {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    }
    break;
  }
}

if (!hasEnvFile) {
  console.log('⚠️  No local environment file found. Make sure to set environment variables in Vercel dashboard.');
} else if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables:', missingVars.join(', '));
  console.log('   Make sure to set these in Vercel dashboard after deployment.');
}

try {
  // Run build to ensure everything compiles
  console.log('🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Deploy to Vercel
  console.log('\n🚀 Deploying to Vercel...');
  
  // Check if this is the first deployment
  let deployCommand = 'vercel --prod';
  
  if (!fs.existsSync('.vercel')) {
    console.log('🆕 First time deployment detected');
    deployCommand = 'vercel --prod';
  }
  
  const deployResult = execSync(deployCommand, { 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  
  console.log('\n✅ Deployment successful!');
  
  // Provide post-deployment instructions
  console.log('\n📋 Post-deployment checklist:');
  console.log('1. ✅ Set environment variables in Vercel dashboard');
  console.log('2. ✅ Configure custom domain (if needed)');
  console.log('3. ✅ Test the live application');
  console.log('4. ✅ Verify database connections');
  console.log('5. ✅ Test admin panel access');
  
  console.log('\n🔗 Useful links:');
  console.log('- Vercel Dashboard: https://vercel.com/dashboard');
  console.log('- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables');
  
  console.log('\n🎉 World Staffing Awards is now live!');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Make sure you\'re logged into Vercel: vercel login');
  console.log('2. Check that all environment variables are set');
  console.log('3. Verify the build passes locally: npm run build');
  console.log('4. Check Vercel dashboard for detailed error logs');
  
  process.exit(1);
}