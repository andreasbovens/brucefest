// Service worker for the demo page: caches everything so Bruce works offline (and installs as an app).
// After changing any file below, bump VERSION so visitors get the new files.
const VERSION = "bruce-36";
// On localhost, fetch from the network first so edits show up straight away; the cache is only the offline fallback.
const DEV = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const FILES = [
  "./", "demo.css", "demo.js", "manifest.webmanifest", "src/bruce-lawson.js",
  ...["cheeky", "glare", "happy1", "happy2", "innocent", "jaded", "orly", "quizzical", "sceptical", "smirk", "talk", "viking", "visionary"].map(h => `assets/heads/${h}.webp`),
  ...["gallery", "oslo", "irises", "stage", "cma", "eu"].map(b => `assets/backgrounds/${b}.webp`),
  "assets/extras/alex.webp",
  "assets/audio/hoedown.mp4",
  "assets/icons/icon-192.webp", "assets/icons/icon-512.webp", "assets/icons/icon-maskable-512.webp",
  "assets/icons/apple-touch-icon.png", "assets/icons/favicon-32.png", "assets/icons/favicon-48.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Audio elements ask for byte ranges, and Safari insists on a 206 answer, so cut the range from the cached file.
async function ranged(request, response) {
  const buf = await response.arrayBuffer();
  const [, from, to] = /bytes=(\d*)-(\d*)/.exec(request.headers.get("range")) || [];
  const start = Number(from) || 0, end = to ? Math.min(Number(to), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { "Content-Type": response.headers.get("Content-Type") || "video/mp4",
               "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`, "Content-Length": String(end - start + 1) }
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Google Fonts: use the network when there is one, keep a copy for offline
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSION).then(async c => {
      try { const res = await fetch(req); c.put(req, res.clone()); return res; }
      catch { return (await c.match(req)) || Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // our own files: cache first (the page itself by its directory URL), then the network
  e.respondWith((async () => {
    // only the demo page itself is stored under its directory URL; other pages (the slides) are looked up as they are
    const root = new URL("./", self.registration.scope);
    const key = req.mode === "navigate" && [root.pathname, root.pathname + "index.html"].includes(url.pathname) ? root.href : req;
    if (DEV && !req.headers.has("range")) {
      try {
        const res = await fetch(req.url, { cache: "no-cache" });  // revalidate, so the HTTP cache can’t serve stale files
        if (res.ok) (await caches.open(VERSION)).put(key, res.clone());
        return res;
      } catch { /* offline: fall through to the cache */ }
    }
    const hit = await caches.match(key, { ignoreSearch: true });
    if (hit) return req.headers.has("range") ? ranged(req, hit) : hit;
    return fetch(req);
  })());
});
