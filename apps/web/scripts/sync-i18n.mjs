/**
 * @fileoverview Sync i18n - Script to sync translations from frontend-core to apps/web
 * @summary Copies translation files from frontend-core to apps/web for TypeScript imports
 * @description
 * This script synchronizes translation JSON files from packages/frontend-core to apps/web
 * so that TypeScript can properly resolve the imports. The source of truth is frontend-core.
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '../../..');
const frontendCoreLocales = join(rootDir, 'packages/frontend-core/src/i18n/locales');
const webLocales = join(rootDir, 'apps/web/src/i18n/locales/shared');

function copyRecursive(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      copyFileSync(srcPath, destPath);
      console.log(`Copied: ${entry.name}`);
    }
  }
}

console.log('Syncing i18n files from frontend-core to apps/web...\n');

['en', 'es', 'ja', 'it'].forEach((lang) => {
  const srcLang = join(frontendCoreLocales, lang);
  const destLang = join(webLocales, lang);

  try {
    if (statSync(srcLang).isDirectory()) {
      mkdirSync(destLang, { recursive: true });
      copyRecursive(srcLang, destLang);
    }
  } catch (error) {
    console.warn(`Skipping ${lang}: directory not found`);
  }
});

console.log('\n✅ i18n sync completed!');

