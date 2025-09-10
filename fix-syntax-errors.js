const fs = require('fs');
const path = require('path');

/**
 * Script para arreglar errores de sintaxis específicos después de la limpieza de tenantId
 */

function fixSyntaxErrors(content) {
  let fixed = content;
  
  // Arreglar puntos y comas sueltos en interfaces
  fixed = fixed.replace(/{\s*;\s*}/g, '{}');
  fixed = fixed.replace(/{\s*;\s*,/g, '{');
  fixed = fixed.replace(/,\s*;\s*}/g, '}');
  fixed = fixed.replace(/,\s*;\s*,/g, ',');
  
  // Arreglar objetos con espacios vacíos
  fixed = fixed.replace(/{\s*;\s*actor:/g, '{ actor:');
  fixed = fixed.replace(/{\s*;\s*envelopeId:/g, '{ envelopeId:');
  fixed = fixed.replace(/{\s*;\s*limit:/g, '{ limit:');
  fixed = fixed.replace(/{\s*;\s*cursor:/g, '{ cursor:');
  
  // Arreglar template strings vacíos
  fixed = fixed.replace(/\$\{\s*\}/g, '');
  fixed = fixed.replace(/\$\{\s*:\s*\}/g, '');
  
  // Arreglar strings con espacios vacíos
  fixed = fixed.replace(/`([^`]*)\$\{\s*\}([^`]*)`/g, '`$1$2`');
  fixed = fixed.replace(/`([^`]*)\$\{\s*:\s*\}([^`]*)`/g, '`$1$2`');
  
  // Arreglar comas dobles
  fixed = fixed.replace(/,\s*,/g, ',');
  fixed = fixed.replace(/{\s*,/g, '{');
  fixed = fixed.replace(/,\s*}/g, '}');
  fixed = fixed.replace(/\(\s*,/g, '(');
  fixed = fixed.replace(/,\s*\)/g, ')');
  
  // Arreglar espacios en template strings
  fixed = fixed.replace(/`([^`]*):\$\{([^}]*)\}([^`]*)`/g, '`$1:$2$3`');
  
  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixSyntaxErrors(content);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✅ Arreglado: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let processedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          processedCount += processDirectory(fullPath);
        }
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
        if (processFile(fullPath)) {
          processedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error procesando directorio ${dirPath}:`, error.message);
  }
  
  return processedCount;
}

// Ejecutar el script
const targetPath = process.argv[2] || '.';
console.log(`🔧 Arreglando errores de sintaxis en: ${targetPath}`);

const processedCount = processDirectory(targetPath);
console.log(`✨ Proceso completado!`);
console.log(`📊 Archivos procesados: ${processedCount}`);
