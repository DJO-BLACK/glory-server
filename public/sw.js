const CACHE = 'glory-v2';
const ASSETS = ['./index.html','./apropos.html','./messages.html','./lives.html','./dime.html','./services.html','./admin.html','./profil.html','./evenements.html','./sondages.html','./style.css','./auth.js','./components.js','./i18n.js','./notifications.js'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(()=>caches.match('./index.html')))); });
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {title:'GLORY', body:'Notification'};
  e.waitUntil(self.registration.showNotification('GLORY – '+d.title, {body:d.body, icon:'./icon-192.png', vibrate:[200,100,200], data:{url:d.url||'./index.html'}}));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(clients.openWindow(e.notification.data.url)); });
