// ============================================
// GLORY – Service Worker Firebase Messaging
// firebase-messaging-sw.js
// ============================================
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA1WoF-d-TfzeGCObK6ofdyiuo8pDmZh7c",
  authDomain: "glory-xxxxxxx.firebaseapp.com",
  projectId: "glory-xxxxxxx",
  messagingSenderId: "898685246327",
  appId: "1:898685246327:web:0ad564aa4e968dd6525f72"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log('🔔 Notification reçue en arrière-plan:', payload);
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
