#!/usr/bin/env node

/**
 * Script to clean up duplicate dynamic exports in API routes
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

function cleanDuplicateExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let hasDuplicates = false;
  let dynamicCount = 0;
  let revalidateCount = 0;
  
  // Count occurrences
  for (const line of lines) {
    if (line.includes('export const dynamic')) dynamicCount++;
    if (line.includes('export const revalidate')) revalidateCount++;
  }
  
  if (dynamicCount > 1 || revalidateCount > 1) {
    hasDuplicates = true;
    console.log(`🔧 Cleaning duplicates: ${filePath}`);
    
    // Remove all dynamic and revalidate exports first
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
    
    // Insert the configuration once
    const configLines = [
      'export const dynamic = \'force-static\';',
      'export const revalidate = false;',
      ''
    ];
    
    cleanedLines.splice(insertIndex, 0, ...configLines);
    
    const newContent = cleanedLines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
  } else {
    console.log(`✅ Clean: ${filePath}`);
  }
  
  return hasDuplicates;
}

console.log('🧹 Cleaning duplicate exports in API routes...\n');

const routes = findApiRoutes(apiDir);
console.log(`Found ${routes.length} API routes\n`);

let cleaned = 0;
for (const route of routes) {
  if (cleanDuplicateExports(route)) {
    cleaned++;
  }
}

console.log(`\n✅ Cleaned ${cleaned} API routes`);
console.log('🎯 All duplicate exports have been removed');