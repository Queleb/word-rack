// Word Rack offline support: keeps a copy of the game on the device.
const CACHE = "gameroom-v10";
const FILES = ["./", "index.html", "wordrack.html", "hearts.html", "sudoku.html", "chess.html", "chess-engine.js", "cats.js", "words.txt", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "cat-sushi.jpg", "cat-squeex.jpg", "cat-mojito.jpg", "cat-glorg.jpg"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Serve from the device right away; quietly fetch a fresh copy for next time.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, {ignoreSearch: true});
    const fresh = fetch(e.request).then(res => { if (res && res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => null);
    return cached || (await fresh) || (e.request.mode === "navigate" ? cache.match("index.html") : Response.error());
  }));
});
