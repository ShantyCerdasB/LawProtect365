const fs = require('fs');
const path = require('path');

/**
 * Script para limpiar referencias específicas de tenantId en comentarios JSDoc y llamadas a funciones
 */

function cleanTenantIdReferences(content) {
  let cleaned = content;
  
  // Limpiar comentarios JSDoc con tenantId
  cleaned = cleaned.replace(/\s*\*\s*@param\s+tenantId[^\n]*\n/g, '');
  cleaned = cleaned.replace(/\s*\*\s*@param\s+tenantId[^\n]*\n/g, '');
  
  // Limpiar referencias en llamadas a funciones
  cleaned = cleaned.replace(/,\s*tenantId[,\s]*/g, ', ');
  cleaned = cleaned.replace(/{\s*tenantId[,\s]*/g, '{ ');
  cleaned = cleaned.replace(/tenantId[,\s]*}/g, '}');
  cleaned = cleaned.replace(/tenantId[,\s]*\)/g, ')');
  
  // Limpiar objetos con solo tenantId
  cleaned = cleaned.replace(/{\s*tenantId\s*}/g, '{}');
  cleaned = cleaned.replace(/{\s*tenantId\s*,/g, '{');
  cleaned = cleaned.replace(/,\s*tenantId\s*}/g, '}');
  
  // Limpiar arrays con tenantId
  cleaned = cleaned.replace(/\[\s*tenantId[,\s]*\]/g, '[]');
  cleaned = cleaned.replace(/\[\s*tenantId[,\s]*/g, '[');
  cleaned = cleaned.replace(/,\s*tenantId\s*\]/g, ']');
  
  // Limpiar llamadas específicas como publishStandardizedEvent
  cleaned = cleaned.replace(/await\s+this\.publishStandardizedEvent\(\s*"([^"]+)",\s*{\s*envelopeId[,\s]*partyId[,\s]*tenantId[,\s]*}\s*,/g, 
    'await this.publishStandardizedEvent("$1", { envelopeId, partyId },');
  
  // Limpiar llamadas con solo tenantId
  cleaned = cleaned.replace(/await\s+this\.publishStandardizedEvent\(\s*"([^"]+)",\s*{\s*tenantId[,\s]*}\s*,/g, 
    'await this.publishStandardizedEvent("$1", {},');
  
  // Limpiar comas dobles
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/{\s*,/g, '{');
  cleaned = cleaned.replace(/,\s*}/g, '}');
  cleaned = cleaned.replace(/\(\s*,/g, '(');
  cleaned = cleaned.replace(/,\s*\)/g, ')');
  
  return cleaned;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = cleanTenantIdReferences(content);
    
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
        // Saltar node_modules y otros directorios no relevantes
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          processedCount += processDirectory(fullPath);
        }
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.tsx') || item.endsWith('.jsx'))) {
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
console.log(`🧹 Limpiando referencias específicas de tenantId en: ${targetPath}`);

const processedCount = processDirectory(targetPath);
console.log(`✨ Proceso completado!`);
console.log(`📊 Archivos procesados: ${processedCount}`);
