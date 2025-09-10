const fs = require('fs');
const path = require('path');

/**
 * Script para eliminar todas las referencias a assertTenantBoundary
 */

function removeAssertTenantBoundary(content) {
  let cleaned = content;
  
  // Eliminar imports de assertTenantBoundary
  cleaned = cleaned.replace(/import\s*{\s*([^}]*),\s*assertTenantBoundary\s*([^}]*)\s*}\s*from\s*["'][^"']*["'];/g, (match, before, after) => {
    const beforeClean = before.replace(/,\s*$/, '').trim();
    const afterClean = after.replace(/^,\s*/, '').trim();
    const imports = [beforeClean, afterClean].filter(Boolean).join(', ');
    return `import { ${imports} } from "@lawprotect/shared-ts";`;
  });
  
  cleaned = cleaned.replace(/import\s*{\s*assertTenantBoundary\s*,\s*([^}]*)\s*}\s*from\s*["'][^"']*["'];/g, (match, rest) => {
    const restClean = rest.replace(/,\s*$/, '').trim();
    return `import { ${restClean} } from "@lawprotect/shared-ts";`;
  });
  
  cleaned = cleaned.replace(/import\s*{\s*assertTenantBoundary\s*}\s*from\s*["'][^"']*["'];/g, '');
  
  // Eliminar llamadas a assertTenantBoundary
  cleaned = cleaned.replace(/assertTenantBoundary\s*\(\s*[^)]+\s*,\s*[^)]+\s*\)\s*;?\s*/g, '');
  
  // Limpiar líneas vacías múltiples
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleaned;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = removeAssertTenantBoundary(content);
    
    if (content !== cleaned) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log(`✅ Limpiado: ${filePath}`);
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
console.log(`🧹 Eliminando referencias a assertTenantBoundary en: ${targetPath}`);

const processedCount = processDirectory(targetPath);
console.log(`✨ Proceso completado!`);
console.log(`📊 Archivos procesados: ${processedCount}`);
