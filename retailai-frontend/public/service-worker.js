const CACHE_NAME = 'retailai-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

// Install — cache all static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch — network first for API, cache first for assets
self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/')) {
        // API calls — network first, cache fallback
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    // Static assets — cache first, network fallback
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request).then(resp => {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return resp;
            }))
            .catch(() => caches.match('/'))
    );
});

// Background sync for offline sales
self.addEventListener('sync', event => {
    if (event.tag === 'sync-sales') {
        event.waitUntil(syncOfflineSales());
    }
});

async function syncOfflineSales() {
    try {
        const pending = JSON.parse(localStorage.getItem('retailai-pending-sales') || '[]');
        for (const sale of pending) {
            await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) });
        }
        localStorage.removeItem('retailai-pending-sales');
    } catch (e) { /* Will retry on next sync */ }
}

// Push notifications
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : { title: 'RetailAI', body: 'Check your stock!' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: { url: data.url || '/' },
            actions: [
                { action: 'order', title: '📦 Order Now' },
                { action: 'dismiss', title: 'Later' }
            ]
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
