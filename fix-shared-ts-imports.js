#!/usr/bin/env node

/**
 * Script to fix internal imports in shared-ts package
 * Replaces @/ imports with relative imports
 */

const fs = require('fs');
const path = require('path');

const sharedTsSrcPath = path.join(__dirname, 'packages', 'shared-ts', 'src');

// Map of @/ imports to relative imports
const importMappings = {
  '@/': '../',
  '@utils/': '../utils/',
  '@http/': '../http/',
  '@errors/': '../errors/',
  '@app/': '../app/',
  '@auth/': '../auth/',
  '@aws/': '../aws/',
  '@config/': '../config/',
  '@db/': '../db/',
  '@observability/': '../observability/',
  '@validation/': '../validation/',
  '@types/': '../types/',
  '@cache/': '../cache/',
  '@contracts/': '../contracts/',
  '@events/': '../events/',
  '@messaging/': '../messaging/',
  '@storage/': '../storage/'};

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // Replace imports
  for (const [alias, relative] of Object.entries(importMappings)) {
    const regex = new RegExp(`from "${alias}([^"]+)"`, 'g');
    newContent = newContent.replace(regex, (match, importPath) => {
      // Calculate relative path based on file location
      const fileDir = path.dirname(filePath);
      const targetPath = path.join(sharedTsSrcPath, importPath);
      const relativePath = path.relative(fileDir, targetPath);
      return `from "${relativePath}"`;
    });
  }
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixImportsInFile(filePath);
    }
  }
}

console.log('Fixing imports in shared-ts package...');
walkDirectory(sharedTsSrcPath);
console.log('Done!');