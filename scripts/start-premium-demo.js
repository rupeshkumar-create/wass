#!/usr/bin/env node

/**
 * Premium UI/UX Demo Starter
 * Starts the development server and provides testing instructions
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🎨 World Staffing Awards 2026 - Premium UI/UX Demo');
console.log('==================================================\n');

// Check if all animation components exist
console.log('✅ Checking Premium Components...');
const components = [
  'src/components/animations/AnimatedHero.tsx',
  'src/components/animations/ScrollReveal.tsx', 
  'src/components/animations/StatCard.tsx',
  'src/components/animations/Podium.tsx',
  'src/components/animations/CategoryCard.tsx',
  'src/components/animations/Timeline.tsx',
  'src/components/animations/NomineeCard.tsx',
  'src/components/animations/VoteButton.tsx',
  'src/components/animations/VoteConfetti.tsx',
  'src/components/animations/MotionProvider.tsx'
];

let allExist = true;
components.forEach(comp => {
  if (fs.existsSync(comp)) {
    console.log(`   ✅ ${comp.split('/').pop()}`);
  } else {
    console.log(`   ❌ ${comp.split('/').pop()} - MISSING`);
    allExist = false;
  }
});

if (!allExist) {
  console.log('\n❌ Some components are missing. Please check the implementation.');
  process.exit(1);
}

console.log('\n🚀 Starting Development Server...');
console.log('   This may take a moment...\n');

// Start the dev server
const devServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Handle server startup
setTimeout(() => {
  console.log('\n🎯 Premium UI/UX Testing Guide');
  console.log('==============================\n');
  
  console.log('📱 Open your browser to: http://localhost:3000\n');
  
  console.log('🎨 Features to Test:');
  console.log('');
  console.log('🏠 HOME PAGE (/)');
  console.log('   • Hero section with animated gradient background');
  console.log('   • "2026" shimmer effect (one-time animation)');
  console.log('   • Floating CTA buttons with hover effects');
  console.log('   • Stats section with CountUp animations');
  console.log('   • Podium with floating medals and vote tickers');
  console.log('   • Category cards with gradient borders');
  console.log('   • Timeline with animated progress line');
  console.log('   • ScrollReveal animations throughout');
  console.log('');
  
  console.log('📂 DIRECTORY PAGE (/directory)');
  console.log('   • Enhanced nominee cards with trending badges');
  console.log('   • Sticky "Vote Now" button after 600px scroll');
  console.log('   • Smooth filter animations');
  console.log('   • Card hover effects with image scaling');
  console.log('   • Progress bars to category leaders');
  console.log('');
  
  console.log('📝 NOMINATION FLOW (/nominate)');
  console.log('   • Animated progress bar with smooth transitions');
  console.log('   • Step completion micro-animations');
  console.log('   • Success confetti celebration');
  console.log('   • Animated share buttons');
  console.log('');
  
  console.log('👤 PROFILE PAGES (/nominee/[slug])');
  console.log('   • Vote counter with tick animations');
  console.log('   • Small confetti burst on successful vote');
  console.log('   • Enhanced share buttons with tooltips');
  console.log('   • Suggested profiles with staggered entrance');
  console.log('');
  
  console.log('♿ ACCESSIBILITY FEATURES');
  console.log('   • Reduce Motion toggle in footer');
  console.log('   • Automatic prefers-reduced-motion detection');
  console.log('   • Focus-visible rings on all interactive elements');
  console.log('   • ARIA live regions for vote updates');
  console.log('');
  
  console.log('🎛️ MOTION CONTROLS');
  console.log('   • Toggle "Reduce motion" in the footer');
  console.log('   • Test with system preference changes');
  console.log('   • Verify animations disable/enable instantly');
  console.log('');
  
  console.log('📱 RESPONSIVE TESTING');
  console.log('   • Test on mobile devices');
  console.log('   • Verify touch interactions');
  console.log('   • Check animation performance');
  console.log('');
  
  console.log('⚡ PERFORMANCE TESTING');
  console.log('   • Run Lighthouse audit (aim for 90+ performance)');
  console.log('   • Check accessibility score (aim for 95+)');
  console.log('   • Test with slow network conditions');
  console.log('');
  
  console.log('🎯 KEY INTERACTIONS TO TEST:');
  console.log('   1. Scroll through home page - watch animations trigger');
  console.log('   2. Hover over category cards - see gradient borders');
  console.log('   3. Visit directory - scroll to see sticky vote button');
  console.log('   4. Hover over nominee cards - see enhanced overlays');
  console.log('   5. Toggle reduce motion - see animations disable');
  console.log('   6. Vote on a nominee - see confetti celebration');
  console.log('   7. Check timeline animations and progress');
  console.log('   8. Test podium medal floating animations');
  console.log('');
  
  console.log('🔧 TROUBLESHOOTING:');
  console.log('   • If animations seem choppy, check browser performance');
  console.log('   • If confetti doesn\'t work, check browser console');
  console.log('   • If reduce motion doesn\'t work, check localStorage');
  console.log('   • For build issues, check TypeScript errors');
  console.log('');
  
  console.log('📖 Documentation: PREMIUM_UI_UX_README.md');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping development server...');
  devServer.kill('SIGINT');
  process.exit(0);
});

devServer.on('close', (code) => {
  console.log(`\n📊 Development server exited with code ${code}`);
  process.exit(code);
});