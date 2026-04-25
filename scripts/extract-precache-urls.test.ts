import { describe, expect, it } from 'vitest';
import { extractPrecacheUrlsFromHtml } from './extract-precache-urls.mjs';

describe('extractPrecacheUrlsFromHtml', () => {
  it('collects module script and stylesheet from Vite index.html', () => {
    const html = `<!doctype html>
<head>
<link rel="manifest" href="./manifest.webmanifest" />
<script type="module" crossorigin src="./assets/index-CWZscclj.js"></script>
<link rel="stylesheet" crossorigin href="./assets/index-uwXYkz5q.css">
</head>`;

    expect(extractPrecacheUrlsFromHtml(html)).toEqual([
      './assets/index-CWZscclj.js',
      './assets/index-uwXYkz5q.css',
    ]);
  });

  it('includes modulepreload links', () => {
    const html = `<link rel="modulepreload" href="./assets/chunk-abc.js">`;
    expect(extractPrecacheUrlsFromHtml(html)).toEqual(['./assets/chunk-abc.js']);
  });

  it('ignores external and data URLs', () => {
    const html = `
<script src="https://cdn.example.com/x.js"></script>
<script src="data:application/javascript,void0"></script>
<script src="./local.js"></script>`;
    expect(extractPrecacheUrlsFromHtml(html)).toEqual(['./local.js']);
  });

  it('dedupes and sorts', () => {
    const html = `
<script src="./b.js"></script>
<script src="./a.js"></script>
<script src="./b.js"></script>`;
    expect(extractPrecacheUrlsFromHtml(html)).toEqual(['./a.js', './b.js']);
  });
});
