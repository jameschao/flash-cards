#!/usr/bin/env node
/**
 * Verifies dist/sw.js precache URLs exist on disk (run after inject-precache.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const swPath = path.join(dist, 'sw.js');

function main() {
  if (!fs.existsSync(swPath)) {
    console.error('verify-dist-precache: missing dist/sw.js');
    process.exit(1);
  }

  const sw = fs.readFileSync(swPath, 'utf8');
  const m = sw.match(/const BUILD_PRECACHE_URLS = (\[[\s\S]*?\]);/);
  if (!m) {
    console.error('verify-dist-precache: could not parse BUILD_PRECACHE_URLS in dist/sw.js');
    process.exit(1);
  }

  let urls;
  try {
    urls = JSON.parse(m[1]);
  } catch {
    console.error('verify-dist-precache: BUILD_PRECACHE_URLS is not valid JSON');
    process.exit(1);
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    console.error('verify-dist-precache: expected non-empty BUILD_PRECACHE_URLS array');
    process.exit(1);
  }

  const check = (u) => {
    const rel = u.replace(/^\.\//, '');
    const abs = path.join(dist, rel);
    if (!fs.existsSync(abs)) {
      console.error(`verify-dist-precache: missing file for ${u}`);
      process.exit(1);
    }
  };

  for (const u of urls) check(u);
  check('./sw.js');
  check('./index.html');

  console.log(`verify-dist-precache: OK (${urls.length} build URL(s) + shell)`);
}

main();
