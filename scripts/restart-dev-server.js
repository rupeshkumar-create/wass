#!/usr/bin/env node

/**
 * Script to restart the development server
 */

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🔄 Restarting development server...\n');

// Kill any existing Next.js processes
console.log('1. Stopping existing processes...');
exec('pkill -f "next dev"', (error) => {
  if (error && !error.message.includes('No matching processes')) {
    console.log('   No existing processes found');
  } else {
    console.log('   ✅ Stopped existing processes');
  }
  
  // Wait a moment then start new server
  setTimeout(() => {
    console.log('\n2. Starting fresh development server...');
    
    const devServer = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    devServer.on('error', (error) => {
      console.error('❌ Failed to start dev server:', error);
      process.exit(1);
    });

    console.log('✅ Development server starting...');
    console.log('🌐 Server will be available at: http://localhost:3000');
    console.log('🔧 Admin panel: http://localhost:3000/admin');
    console.log('\n📝 Recent fixes applied:');
    console.log('   • Fixed URL generation to use localhost');
    console.log('   • Added nominee photos to admin panel');
    console.log('   • Fixed Top 3 nominees display');
    console.log('   • Improved vote count consistency');
    console.log('\nPress Ctrl+C to stop the server');

  }, 1000);
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Stopping development server...');
  exec('pkill -f "next dev"', () => {
    process.exit(0);
  });
});