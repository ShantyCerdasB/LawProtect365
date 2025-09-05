#!/usr/bin/env node

/**
 * @file find-unused-files.js
 * @summary Script para encontrar archivos no utilizados en el proyecto
 * @description Analiza imports y exports para identificar archivos que no se usan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const SRC_DIR = 'src';
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '*.test.ts',
  '*.spec.ts',
  '*.d.ts'
];

/**
 * Obtiene todos los archivos del directorio src
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Saltar directorios ignorados
      if (!IGNORE_PATTERNS.some(pattern => file.includes(pattern))) {
        getAllFiles(filePath, fileList);
      }
    } else {
      // Solo archivos con extensiones válidas
      const ext = path.extname(file);
      if (EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Extrae imports de un archivo
 */
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Regex para diferentes tipos de imports
    const importRegexes = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];
    
    importRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });
    
    return imports;
  } catch (error) {
    console.warn(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Verifica si un archivo es importado por otros archivos
 */
function isFileImported(filePath, allFiles) {
  const relativePath = path.relative(SRC_DIR, filePath);
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Posibles rutas de importación
  const possiblePaths = [
    `./${fileName}`,
    `../${fileName}`,
    `./${relativePath}`,
    `../${relativePath}`,
    `@/${relativePath}`,
    `@lawprotect/${relativePath}`,
    fileName
  ];
  
  for (const otherFile of allFiles) {
    if (otherFile === filePath) continue;
    
    const imports = extractImports(otherFile);
    
    for (const importPath of imports) {
      if (possiblePaths.some(possiblePath => 
        importPath.includes(possiblePath) || 
        importPath.endsWith(fileName) ||
        importPath.endsWith(relativePath)
      )) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica si un archivo es un punto de entrada (index.ts, main.ts, etc.)
 */
function isEntryPoint(filePath) {
  const fileName = path.basename(filePath);
  const entryPoints = ['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js'];
  return entryPoints.includes(fileName);
}

/**
 * Función principal
 */
function findUnusedFiles() {
  console.log('🔍 Analizando archivos no utilizados...\n');
  
  const allFiles = getAllFiles(SRC_DIR);
  const unusedFiles = [];
  const entryPoints = [];
  
  console.log(`📁 Total de archivos encontrados: ${allFiles.length}\n`);
  
  for (const file of allFiles) {
    const relativePath = path.relative(SRC_DIR, file);
    
    if (isEntryPoint(file)) {
      entryPoints.push(relativePath);
      console.log(`✅ Punto de entrada: ${relativePath}`);
    } else if (!isFileImported(file, allFiles)) {
      unusedFiles.push(relativePath);
      console.log(`❌ Archivo no utilizado: ${relativePath}`);
    } else {
      console.log(`✅ Archivo utilizado: ${relativePath}`);
    }
  }
  
  console.log('\n📊 RESUMEN:');
  console.log(`📁 Total archivos: ${allFiles.length}`);
  console.log(`✅ Archivos utilizados: ${allFiles.length - unusedFiles.length - entryPoints.length}`);
  console.log(`🚪 Puntos de entrada: ${entryPoints.length}`);
  console.log(`❌ Archivos no utilizados: ${unusedFiles.length}`);
  
  if (unusedFiles.length > 0) {
    console.log('\n🗑️  ARCHIVOS NO UTILIZADOS:');
    unusedFiles.forEach(file => console.log(`   - ${file}`));
    
    console.log('\n💡 RECOMENDACIONES:');
    console.log('   1. Revisar si estos archivos son realmente necesarios');
    console.log('   2. Verificar si son archivos de configuración o tipos');
    console.log('   3. Considerar eliminarlos si no se usan');
  }
  
  return unusedFiles;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  try {
    findUnusedFiles();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { findUnusedFiles };
