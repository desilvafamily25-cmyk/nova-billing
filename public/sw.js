// Minimal SW to enable install prompt; no offline caching yet
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
