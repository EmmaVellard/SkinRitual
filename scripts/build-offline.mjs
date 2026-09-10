import { readdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
const root = `${base}/`;
const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'));
manifest.id = root; manifest.start_url = root; manifest.scope = root;
manifest.icons = manifest.icons.map(icon => ({ ...icon, src: `${base}${icon.src}` }));
await writeFile('out/manifest.webmanifest', JSON.stringify(manifest));
await writeFile('out/.nojekyll', '');
async function files(dir) { const entries = await readdir(dir, { withFileTypes: true }); return (await Promise.all(entries.map(e => e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`))).flat(); }
const paths = (await files('out')).filter(p => !p.endsWith('/sw.js'));
const digest = createHash('sha256').update(base);
for (const path of paths.sort()) { digest.update(path); digest.update(await readFile(path)); }
const assets = paths.filter(p => !p.endsWith('.txt') && !p.endsWith('.map')).map(p => `${base}/${p.slice(4)}`);
assets.push(root);
const prefix = `skin-ritual-${base.replaceAll('/', '') || 'local'}-`;
const worker = `const PREFIX = ${JSON.stringify(prefix)};
const CACHE = PREFIX + '${digest.digest('hex').slice(0, 12)}';
const ROOT = ${JSON.stringify(root)};
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(ROOT)) return;
 event.respondWith(caches.open(CACHE).then(async cache => {
   if (event.request.mode === 'navigate') {
     try { const response = await fetch(event.request); if (response.ok) return response; } catch {}
     return await cache.match(ROOT) || Response.error();
   }
   return await cache.match(event.request) || fetch(event.request);
 }));
});`;
await writeFile('out/sw.js', worker);
console.log(`Offline shell generated: ${assets.length} local assets for ${root}.`);
