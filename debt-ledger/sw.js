/**
 * sw.js - مشغل الخدمة (Service Worker) لتطبيق PWA
 * يضمن تشغيل التطبيق بالكامل بدون إنترنت (Offline First)
 */

const CACHE_NAME = 'debt-ledger-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './js/store.js',
  './js/app.js',
  './js/firebase-service.js',
  './js/views/auth.js',
  './js/views/dashboard.js',
  './js/views/customers.js',
  './js/views/statement.js',
  './js/views/invoice.js',
  './js/views/payment.js',
  './js/views/transactions.js',
  './js/views/settings.js',
  './icons/favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] تم تخزين ملفات التطبيق بنجاح');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] تنظيف الكاش القديم:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // للطلبات المتجهة إلى CDN الخارجي الخاص بـ Firebase، نتركها تمر عبر الشبكة مباشرة
  if (event.request.url.includes('gstatic.com') || event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
    return;
  }

  // استراتيجية Cache First مع الرجوع للشبكة للأصول المحلية
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          networkResponse.type === 'basic' && 
          event.request.method === 'GET'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
