/**
 * @fileoverview Copy PDF.js Worker Script
 * @summary Copies PDF.js worker to public folder
 * @description
 * This script copies the PDF.js worker file from node_modules to the public folder
 * so it can be served statically by Vite.
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const publicDir = join(rootDir, 'public');
const workerSource = join(rootDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const workerDest = join(publicDir, 'pdf.worker.min.mjs');

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

if (existsSync(workerSource)) {
  copyFileSync(workerSource, workerDest);
  console.log('✓ PDF.js worker copied to public folder');
} else {
  console.warn('⚠ PDF.js worker not found in node_modules');
}


