// ============================================
// GLORY – Notifications Push Firebase (firebase-push.js)
// ============================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

const firebaseConfig = {
  apiKey: "AIzaSyA1WoF-d-TfzeGCObK6ofdyiuo8pDmZh7c",
  authDomain: "glory-xxxxxxx.firebaseapp.com",
  projectId: "glory-xxxxxxx",
  messagingSenderId: "898685246327",
  appId: "1:898685246327:web:0ad564aa4e968dd6525f72"
};

const VAPID_KEY = "BJkNU0W0H4JBKfF7oCbb3oIKSfkoBANrPLYpyU3pGt1YAe_P9vAI3GXtwQTgZdedhOIl3th5g69tSOWVwl5nXaU";
const API_URL   = "https://glory-server-production.up.railway.app";

const app       = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Demander la permission et obtenir le token FCM
async function initPushNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission refusée pour les notifications');
      return;
    }

    // Enregistrer le service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Obtenir le token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ Token FCM:', token);
      // Envoyer le token au serveur
      const authToken = localStorage.getItem('glory_token');
      if (authToken) {
        await fetch(API_URL + '/api/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ token })
        });
      }
    }

    // Notifications quand l'app est ouverte
    onMessage(messaging, payload => {
      console.log('🔔 Notification reçue:', payload);
      const { title, body } = payload.notification;
      if (typeof toast === 'function') toast('🔔 ' + title + ' — ' + body);
      if (typeof createNotif === 'function') {
        createNotif('post', title, body, payload.data?.url || '/');
      }
    });

  } catch(e) {
    console.error('Erreur Firebase Push:', e);
  }
}

// Auto-initialiser si l'utilisateur est connecté
document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(localStorage.getItem('glory_session') || 'null');
  if (session && 'Notification' in window) {
    initPushNotifications();
  }
});

export { initPushNotifications };
