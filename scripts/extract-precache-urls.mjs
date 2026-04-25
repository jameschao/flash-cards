/**
 * Collect same-origin relative asset URLs from a built Vite index.html for SW precaching.
 * @param {string} html
 * @returns {string[]}
 */
export function extractPrecacheUrlsFromHtml(html) {
  const urls = new Set();

  for (const m of html.matchAll(/<script[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi)) {
    const u = m[1].trim();
    if (isPrecacheableUrl(u)) urls.add(u);
  }

  for (const m of html.matchAll(/<link[^>]*>/gi)) {
    const tag = m[0];
    if (!/\brel\s*=\s*["'](?:stylesheet|modulepreload)["']/i.test(tag)) continue;
    const hm = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hm) continue;
    const u = hm[1].trim();
    if (isPrecacheableUrl(u)) urls.add(u);
  }

  return [...urls].sort();
}

function isPrecacheableUrl(u) {
  if (!u || u.startsWith('data:') || u.startsWith('blob:')) return false;
  if (/^https?:\/\//i.test(u)) return false;
  return u.startsWith('./') || u.startsWith('../');
}
