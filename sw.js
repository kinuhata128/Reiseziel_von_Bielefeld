const PREFIX = `next-stop-${self.registration.scope}-`;
const CACHE = `${PREFIX}v12`;
const FILES = ['./','./index.html','./styles.css','./app.js','./core.js','./manifest.webmanifest','./assets/city-names.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable.png','./assets/leaflet/leaflet.js','./assets/leaflet/leaflet.css','./data/cities.json','./data/routes.json','./data/locations.json'];
const ALLOWED = new Set(FILES.map(path => new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);url.search='';
  if(!ALLOWED.has(url.href))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{const response=await fetch(event.request);if(response.ok)await cache.put(url.href,response.clone());return response;}
    catch{const cached=await cache.match(url.href);if(cached)return cached;return new Response('Offline asset unavailable',{status:503});}
  })());
});
