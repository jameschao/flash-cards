#!/usr/bin/env node
/**
 * Serves dist/ with vite preview and GETs index + precache assets (requires `npm run build` first).
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPrecacheUrlsFromHtml } from './extract-precache-urls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distIndex = path.join(root, 'dist', 'index.html');

const PORT = 4173;
const HOST = '127.0.0.1';
const ORIGIN = `http://${HOST}:${PORT}`;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200) {
            reject(new Error(`GET ${url} -> ${res.statusCode}`));
            return;
          }
          resolve(body);
        });
      })
      .on('error', reject);
  });
}

async function waitForServer(deadline) {
  while (Date.now() < deadline) {
    try {
      await httpGet(`${ORIGIN}/`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  throw new Error(`Server did not respond on ${ORIGIN} within timeout`);
}

async function main() {
  if (!fs.existsSync(distIndex)) {
    console.error('offline-smoke: run `npm run build` first (dist/index.html missing)');
    process.exit(1);
  }

  const child = spawn('npx', ['vite', 'preview', '--host', HOST, '--strictPort', '--port', String(PORT)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1' },
  });

  let stderr = '';
  child.stderr?.on('data', (d) => {
    stderr += d.toString();
  });

  const kill = () => {
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  };

  process.on('SIGINT', () => {
    kill();
    process.exit(130);
  });

  try {
    await waitForServer(Date.now() + 20_000);

    const html = await httpGet(`${ORIGIN}/`);
    const assets = extractPrecacheUrlsFromHtml(html);
    for (const rel of assets) {
      const url = new URL(rel, `${ORIGIN}/`).href;
      await httpGet(url);
    }

    await httpGet(`${ORIGIN}/sw.js`);

    console.log(`offline-smoke: OK (index + ${assets.length} asset(s) + sw.js)`);
  } catch (e) {
    console.error('offline-smoke:', e instanceof Error ? e.message : e);
    if (stderr.trim()) console.error(stderr.trim());
    process.exitCode = 1;
  } finally {
    kill();
    await new Promise((r) => setTimeout(r, 300));
  }
}

await main();
