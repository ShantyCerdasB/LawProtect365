#!/usr/bin/env node

/**
 * @file analyze-ts-usage.js
 * @summary Script para analizar uso de archivos TypeScript
 * @description Usa el compilador de TypeScript para detectar archivos no utilizados
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Ejecuta tsc y obtiene la lista de archivos
 */
function getTypeScriptFiles() {
  try {
    console.log('🔍 Compilando TypeScript para analizar archivos...\n');
    
    // Ejecutar tsc con --listFiles para obtener todos los archivos
    const output = execSync('npx tsc --noEmit --listFiles', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    const files = output
      .split('\n')
      .filter(line => line.trim() && !line.includes('node_modules'))
      .map(line => line.trim())
      .filter(line => line.endsWith('.ts') || line.endsWith('.tsx'));
    
    return files;
  } catch (error) {
    console.error('❌ Error ejecutando TypeScript:', error.message);
    return [];
  }
}

/**
 * Obtiene todos los archivos .ts en src
 */
function getAllSourceFiles() {
  const srcDir = 'src';
  const allFiles = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        allFiles.push(path.resolve(filePath));
      }
    });
  }
  
  if (fs.existsSync(srcDir)) {
    walkDir(srcDir);
  }
  
  return allFiles;
}

/**
 * Analiza archivos no utilizados
 */
function analyzeUnusedFiles() {
  console.log('📊 Analizando archivos TypeScript...\n');
  
  const tsFiles = getTypeScriptFiles();
  const allSourceFiles = getAllSourceFiles();
  
  console.log(`📁 Archivos en src/: ${allSourceFiles.length}`);
  console.log(`🔧 Archivos compilados por TypeScript: ${tsFiles.length}\n`);
  
  // Encontrar archivos no compilados
  const unusedFiles = allSourceFiles.filter(file => {
    const normalizedFile = file.replace(/\\/g, '/');
    return !tsFiles.some(tsFile => tsFile.includes(normalizedFile));
  });
  
  // Encontrar archivos de test/configuración
  const testFiles = allSourceFiles.filter(file => 
    file.includes('.test.') || 
    file.includes('.spec.') || 
    file.includes('.config.') ||
    file.includes('.setup.')
  );
  
  // Filtrar archivos de test de los no utilizados
  const actualUnusedFiles = unusedFiles.filter(file => 
    !testFiles.some(testFile => testFile === file)
  );
  
  console.log('📋 RESULTADOS:');
  console.log(`✅ Archivos utilizados: ${allSourceFiles.length - actualUnusedFiles.length}`);
  console.log(`🧪 Archivos de test: ${testFiles.length}`);
  console.log(`❌ Archivos no utilizados: ${actualUnusedFiles.length}\n`);
  
  if (actualUnusedFiles.length > 0) {
    console.log('🗑️  ARCHIVOS NO UTILIZADOS:');
    actualUnusedFiles.forEach(file => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`   - ${relativePath}`);
    });
    
    console.log('\n💡 RECOMENDACIONES:');
    console.log('   1. Verificar si estos archivos son necesarios');
    console.log('   2. Revisar si son archivos de configuración');
    console.log('   3. Considerar eliminarlos si no se usan');
  } else {
    console.log('🎉 ¡Todos los archivos están siendo utilizados!');
  }
  
  return actualUnusedFiles;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  try {
    analyzeUnusedFiles();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { analyzeUnusedFiles };
