#!/usr/bin/env node
/**
 * Post-build: inject dist/index.html script/link URLs into dist/sw.js precache list.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPrecacheUrlsFromHtml } from './extract-precache-urls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const indexPath = path.join(dist, 'index.html');
const swPath = path.join(dist, 'sw.js');

const MARKER = '/*__BUILD_PRECACHE__*/[]';

function main() {
  if (!fs.existsSync(indexPath)) {
    console.error('inject-precache: missing dist/index.html (run vite build first)');
    process.exit(1);
  }
  if (!fs.existsSync(swPath)) {
    console.error('inject-precache: missing dist/sw.js');
    process.exit(1);
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const fromHtml = extractPrecacheUrlsFromHtml(html);

  for (const u of fromHtml) {
    const abs = path.join(dist, u.replace(/^\.\//, ''));
    if (!fs.existsSync(abs)) {
      console.error(`inject-precache: referenced file missing on disk: ${u} -> ${abs}`);
      process.exit(1);
    }
  }

  let sw = fs.readFileSync(swPath, 'utf8');
  if (!sw.includes(MARKER)) {
    console.error('inject-precache: dist/sw.js missing precache marker (outdated public/sw.js?)');
    process.exit(1);
  }

  const replacement = JSON.stringify(fromHtml);
  sw = sw.replace(MARKER, replacement);
  fs.writeFileSync(swPath, sw, 'utf8');

  console.log(`inject-precache: injected ${fromHtml.length} URL(s) into dist/sw.js`);
}

main();
