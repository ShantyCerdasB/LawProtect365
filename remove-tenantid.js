#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Función para procesar un archivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let originalContent = content;

    // 1. Eliminar imports de TenantId
    content = content.replace(/import\s*{\s*([^}]*),\s*TenantId\s*([^}]*)\s*}\s*from\s*["'][^"']*["'];/g, (match, before, after) => {
      const cleanBefore = before.trim().replace(/,\s*$/, '');
      const cleanAfter = after.trim().replace(/^,\s*/, '');
      if (cleanBefore && cleanAfter) {
        return `import { ${cleanBefore}, ${cleanAfter} } from "${match.match(/from\s*["']([^"']*)["']/)[1]}";`;
      } else if (cleanBefore) {
        return `import { ${cleanBefore} } from "${match.match(/from\s*["']([^"']*)["']/)[1]}";`;
      } else if (cleanAfter) {
        return `import { ${cleanAfter} } from "${match.match(/from\s*["']([^"']*)["']/)[1]}";`;
      } else {
        return ''; // Eliminar import vacío
      }
    });

    // 2. Eliminar imports solo de TenantId
    content = content.replace(/import\s*{\s*TenantId\s*}\s*from\s*["'][^"']*["'];\s*\n?/g, '');

    // 3. Eliminar parámetros tenantId de funciones
    content = content.replace(/,\s*'');
    content = content.replace(/?\s*/g, '');
    content = content.replace(/,\s*'');
    content = content.replace(/?\s*/g, '');

    // 4. Eliminar propiedades tenantId de objetos
    content = content.replace(/,\s*\n}]+/g, '');
    content = content.replace(/\n}]+,?\s*/g, '');

    // 5. Eliminar referencias a input, context, etc.
    content = content.replace(/\/g, '');
    content = content.replace(/tenantId\s*=/g, '');

    // 6. Eliminar líneas que solo contienen tenantId
    content = content.replace(/^\s*tenantId\s*,?\s*$/gm, '');

    // 7. Limpiar comas dobles o mal formateadas
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/{\s*,/g, '{');
    content = content.replace(/,\s*}/g, '}');
    content = content.replace(/\(\s*,/g, '(');
    content = content.replace(/,\s*\)/g, ')');

    // 8. Eliminar líneas vacías múltiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Procesado: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Función para recorrer directorios recursivamente
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let processedCount = 0;

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Saltar node_modules y otros directorios no relevantes
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
        processedCount += processDirectory(fullPath);
      }
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
      if (processFile(fullPath)) {
        processedCount++;
      }
    }
  }

  return processedCount;
}

// Función principal
function main() {
  const startDir = process.argv[2] || './src';
  
  console.log(`🚀 Iniciando limpieza de tenantId en: ${startDir}`);
  console.log('📁 Procesando archivos TypeScript y JavaScript...\n');

  const processedCount = processDirectory(startDir);
  
  console.log(`\n✨ Proceso completado!`);
  console.log(`📊 Archivos procesados: ${processedCount}`);
  console.log(`🎯 Todos los tenantId han sido eliminados del código.`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { processFile, processDirectory };
