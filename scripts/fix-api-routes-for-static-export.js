#!/usr/bin/env node

/**
 * Script to add static export configuration to all API routes
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

function addStaticExportConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has the configuration
  if (content.includes('export const dynamic') || content.includes('export const revalidate')) {
    console.log(`✅ Already configured: ${filePath}`);
    return false;
  }
  
  // Find the first import statement
  const lines = content.split('\n');
  let insertIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('export ')) {
      insertIndex = i;
      break;
    }
  }
  
  // Find the end of imports
  for (let i = insertIndex; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('import ') && 
        !lines[i].trim().startsWith('export ') && 
        lines[i].trim() !== '') {
      insertIndex = i;
      break;
    }
  }
  
  // Insert the configuration
  const configLines = [
    '',
    'export const dynamic = \'force-static\';',
    'export const revalidate = false;',
    ''
  ];
  
  lines.splice(insertIndex, 0, ...configLines);
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log(`✅ Updated: ${filePath}`);
  return true;
}

console.log('🔧 Adding static export configuration to API routes...\n');

const routes = findApiRoutes(apiDir);
console.log(`Found ${routes.length} API routes\n`);

let updated = 0;
for (const route of routes) {
  if (addStaticExportConfig(route)) {
    updated++;
  }
}

console.log(`\n✅ Updated ${updated} API routes for static export`);
console.log('🎯 All API routes are now configured for Netlify deployment');