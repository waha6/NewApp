const files = [
  "./",
  "./scripts/app.js",
  "./styles/style.css",
  "./manifest.json",
  "./assests/login.json",
  "./assests/submitads.json",
  "./scripts/signin-up.js",
  "./styles/signin-up.css",
  "./images/favorite.svg",
  "./images/icons/icon-72x72.png",
  "./images/icons/icon-96x96.png",
  "./images/icons/icon-128x128.png",
  "./images/icons/icon-144x144.png",
  "./images/icons/icon-152x152.png",
  "./images/icons/icon-192x192.png",
  "./images/icons/icon-384x384.png",
  "./images/icons/icon-512x512.png",
  "./scripts/firebase.js"
];
const currentver = "0.2.0";
const previousver = "0.1.0";
var CACHE = 'EX-' + currentver;
var dataCACHE = 'EXData-' + currentver;

self.addEventListener('install', function (evt) {
  console.log('SW installed');
  evt.waitUntil(precache());
});

self.addEventListener('activate', evt => {
  console.log("SW activate");
  caches.has('EX-' + previousver).then(() => {
    caches.delete('EX-' + previousver);
  })
})

self.addEventListener('fetch', function (evt) {
  console.log('Fetching\n' +(new URL(evt.request.url)).origin);
    evt.respondWith((location.origin==(new URL(evt.request.url)).origin)?fromCache(evt.request):fromNetwork(evt.request));
});

function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll(files);
  });
}
async function fromCache(req) {
  const cacheResponse = await caches.match((req.url.indexOf("?page") != -1) ? new Request("./") : req);
  return cacheResponse || "Error";
}

async function fromNetwork(req) {
  if(!navigator.onLine)
    return fromCache(req);
  const cache = await caches.open(dataCACHE);
  try {
    const res = await fetch(req);
    if(location.origin)
    cache.put(req.url, res.clone());
    return res;
  } catch (er) {
    return fromCache(req);
  }
}