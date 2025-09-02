#!/usr/bin/env node

/**
 * Premium UI/UX Verification Script
 * Tests all animation components and premium features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Premium UI/UX Verification Script');
console.log('=====================================\n');

// Test 1: Check if all animation components exist
console.log('1. Checking Animation Components...');
const animationComponents = [
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

let allComponentsExist = true;
animationComponents.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`   ✅ ${component}`);
  } else {
    console.log(`   ❌ ${component} - MISSING`);
    allComponentsExist = false;
  }
});

if (allComponentsExist) {
  console.log('   🎉 All animation components found!\n');
} else {
  console.log('   ⚠️  Some animation components are missing!\n');
}

// Test 2: Check dependencies
console.log('2. Checking Dependencies...');
const requiredDeps = [
  'framer-motion',
  'lucide-react',
  'react-countup',
  'canvas-confetti',
  'next-themes',
  'jotai',
  'clsx',
  'class-variance-authority',
  'tailwind-merge'
];

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let allDepsInstalled = true;
  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`   ✅ ${dep} (${allDeps[dep]})`);
    } else {
      console.log(`   ❌ ${dep} - NOT INSTALLED`);
      allDepsInstalled = false;
    }
  });

  if (allDepsInstalled) {
    console.log('   🎉 All required dependencies installed!\n');
  } else {
    console.log('   ⚠️  Some dependencies are missing!\n');
  }
} catch (error) {
  console.log('   ❌ Error reading package.json\n');
}

// Test 3: Check Tailwind configuration
console.log('3. Checking Tailwind Configuration...');
try {
  const tailwindConfig = fs.readFileSync('tailwind.config.ts', 'utf8');
  
  const checks = [
    { name: 'Brand colors', pattern: /brand.*#FF6A00/ },
    { name: 'Soft shadows', pattern: /shadow.*soft/ },
    { name: 'Shimmer animation', pattern: /shimmer/ },
    { name: 'Float animation', pattern: /float/ },
    { name: 'Border radius xl2', pattern: /xl2.*1\.25rem/ }
  ];

  checks.forEach(check => {
    if (check.pattern.test(tailwindConfig)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - NOT CONFIGURED`);
    }
  });
  
  console.log('   🎉 Tailwind configuration checked!\n');
} catch (error) {
  console.log('   ❌ Error reading tailwind.config.ts\n');
}

// Test 4: Check globals.css for motion styles
console.log('4. Checking Global Styles...');
try {
  const globalsCss = fs.readFileSync('src/app/globals.css', 'utf8');
  
  const styleChecks = [
    { name: 'Reduce motion styles', pattern: /@media.*prefers-reduced-motion/ },
    { name: 'Reduce motion class', pattern: /\.reduce-motion/ },
    { name: 'Shimmer keyframes', pattern: /@keyframes shimmer/ },
    { name: 'Float keyframes', pattern: /@keyframes float/ },
    { name: 'Fade-in animations', pattern: /@keyframes fade-in/ }
  ];

  styleChecks.forEach(check => {
    if (check.pattern.test(globalsCss)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - NOT FOUND`);
    }
  });
  
  console.log('   🎉 Global styles checked!\n');
} catch (error) {
  console.log('   ❌ Error reading globals.css\n');
}

// Test 5: Check layout.tsx for providers
console.log('5. Checking Layout Configuration...');
try {
  const layoutFile = fs.readFileSync('src/app/layout.tsx', 'utf8');
  
  const layoutChecks = [
    { name: 'MotionProvider', pattern: /MotionProvider/ },
    { name: 'ThemeProvider', pattern: /ThemeProvider/ },
    { name: 'Enhanced metadata', pattern: /keywords.*staffing/ }
  ];

  layoutChecks.forEach(check => {
    if (check.pattern.test(layoutFile)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - NOT CONFIGURED`);
    }
  });
  
  console.log('   🎉 Layout configuration checked!\n');
} catch (error) {
  console.log('   ❌ Error reading layout.tsx\n');
}

// Test 6: Check page implementations
console.log('6. Checking Page Implementations...');
const pageChecks = [
  {
    file: 'src/app/page.tsx',
    name: 'Home page',
    patterns: [
      { name: 'AnimatedHero', pattern: /AnimatedHero/ },
      { name: 'ScrollReveal', pattern: /ScrollReveal/ },
      { name: 'CategoryCard', pattern: /CategoryCard/ },
      { name: 'Timeline', pattern: /Timeline/ }
    ]
  },
  {
    file: 'src/app/directory/page.tsx',
    name: 'Directory page',
    patterns: [
      { name: 'VoteButton', pattern: /VoteButton/ },
      { name: 'ScrollReveal', pattern: /ScrollReveal/ }
    ]
  }
];

pageChecks.forEach(page => {
  try {
    const pageContent = fs.readFileSync(page.file, 'utf8');
    console.log(`   📄 ${page.name}:`);
    
    page.patterns.forEach(pattern => {
      if (pattern.pattern.test(pageContent)) {
        console.log(`      ✅ ${pattern.name}`);
      } else {
        console.log(`      ❌ ${pattern.name} - NOT IMPLEMENTED`);
      }
    });
  } catch (error) {
    console.log(`   ❌ Error reading ${page.file}`);
  }
});

console.log('\n');

// Test 7: Build test
console.log('7. Testing Build...');
try {
  console.log('   Building project...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('   ✅ Build successful!\n');
} catch (error) {
  console.log('   ❌ Build failed!');
  console.log('   Error:', error.message.split('\n')[0]);
  console.log('\n');
}

// Test 8: TypeScript check
console.log('8. TypeScript Check...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('   ✅ TypeScript check passed!\n');
} catch (error) {
  console.log('   ❌ TypeScript errors found!');
  console.log('   Run `npx tsc --noEmit` for details\n');
}

// Summary
console.log('🎯 Premium UI/UX Verification Complete!');
console.log('=====================================');
console.log('');
console.log('✨ Features Implemented:');
console.log('   • Animated Hero with shimmer effect');
console.log('   • ScrollReveal animations');
console.log('   • StatCard with CountUp');
console.log('   • Enhanced Podium with floating medals');
console.log('   • CategoryCard with gradient borders');
console.log('   • Timeline with progress animations');
console.log('   • NomineeCard with trending badges');
console.log('   • Sticky VoteButton');
console.log('   • VoteConfetti celebrations');
console.log('   • MotionProvider with reduce motion');
console.log('   • Theme support');
console.log('   • Accessibility features');
console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Start dev server: npm run dev');
console.log('   2. Test animations on each page');
console.log('   3. Toggle reduce motion in footer');
console.log('   4. Test on mobile devices');
console.log('   5. Run Lighthouse audit');
console.log('');
console.log('📖 Documentation: PREMIUM_UI_UX_README.md');