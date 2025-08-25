#!/usr/bin/env node

/**
 * Script to properly add static export configuration to all API routes
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(process.cwd(), 'src/app/api');

function findApiRoutes(dir) {
  const routes = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item === 'route.ts') {
        routes.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return routes;
}

function fixApiRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has the configuration in the right place
  if (content.includes('export const dynamic') && content.includes('export const revalidate')) {
    const lines = content.split('\n');
    
    // Check if it's in the right place (after imports, before functions)
    let hasImports = false;
    let dynamicIndex = -1;
    let firstFunctionIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ')) {
        hasImports = true;
      }
      if (line.includes('export const dynamic')) {
        dynamicIndex = i;
      }
      if (line.startsWith('export async function') && firstFunctionIndex === -1) {
        firstFunctionIndex = i;
      }
    }
    
    // If dynamic export is after the first function, it's in the wrong place
    if (dynamicIndex > firstFunctionIndex && firstFunctionIndex !== -1) {
      console.log(`🔧 Fixing placement: ${filePath}`);
      // Remove the misplaced exports
      const cleanedLines = lines.filter(line => 
        !line.includes('export const dynamic') && 
        !line.includes('export const revalidate')
      );
      
      // Find the right place to insert (after imports, before first function)
      let insertIndex = 0;
      for (let i = 0; i < cleanedLines.length; i++) {
        const line = cleanedLines[i].trim();
        if (line.startsWith('export async function')) {
          insertIndex = i;
          break;
        }
      }
      
      // Insert the configuration
      const configLines = [
        'export const dynamic = \'force-static\';',
        'export const revalidate = false;',
        ''
      ];
      
      cleanedLines.splice(insertIndex, 0, ...configLines);
      
      const newContent = cleanedLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    } else {
      console.log(`✅ Already correct: ${filePath}`);
      return false;
    }
  }
  
  // Add the configuration if it doesn't exist
  const lines = content.split('\n');
  
  // Find the right place to insert (after imports, before first function)
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('export async function')) {
      insertIndex = i;
      break;
    }
  }
  
  // Insert the configuration
  const configLines = [
    'export const dynamic = \'force-static\';',
    'export const revalidate = false;',
    ''
  ];
  
  lines.splice(insertIndex, 0, ...configLines);
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log(`✅ Added config: ${filePath}`);
  return true;
}

console.log('🔧 Fixing API routes for static export...\n');

const routes = findApiRoutes(apiDir);
console.log(`Found ${routes.length} API routes\n`);

let updated = 0;
for (const route of routes) {
  if (fixApiRoute(route)) {
    updated++;
  }
}

console.log(`\n✅ Fixed ${updated} API routes`);
console.log('🎯 All API routes are now properly configured for static export');