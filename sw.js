// ============================================================
// sw.js — Service Worker (makes app work offline + notifications)
// ============================================================

const CACHE_NAME = 'checkmed-v1'
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/app.js',
  '/js/auth.js',
  '/js/search.js',
  '/js/reminders.js',
  '/js/interactions.js',
  '/js/scanner.js'
]

// Install — cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  )
})

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
})

// Fetch — serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  )
})

// Push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'CheckMed', {
      body: data.body || 'Time to take your medication!',
      icon: '/icon.png',
      badge: '/icon.png'
    })
  )
})