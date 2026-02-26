// ============================================
// GLORY – Système de Notifications (notifications.js)
// ============================================

// Sauvegarder / lire les notifications
const getNotifs = () => JSON.parse(localStorage.getItem('glory_notifs') || '[]');
const saveNotifs = d => localStorage.setItem('glory_notifs', JSON.stringify(d));

// Créer une notification (appelé par l'admin)
function createNotif(type, title, message, url) {
  const notifs = getNotifs();
  notifs.unshift({
    id: Date.now(),
    type,       // 'post' | 'live' | 'event' | 'message'
    title,
    message,
    url: url || './index.html',
    date: new Date().toLocaleString('fr'),
    read: false
  });
  // Max 50 notifs
  if (notifs.length > 50) notifs.pop();
  saveNotifs(notifs);
  updateNotifBadge();
  showToastNotif(title, message);
  // Notif navigateur si permission
  if (Notification.permission === 'granted') {
    new Notification('GLORY – ' + title, { body: message, icon: './icon-192.png' });
  }
}

function markAllRead() {
  const notifs = getNotifs();
  notifs.forEach(n => n.read = true);
  saveNotifs(notifs);
  updateNotifBadge();
  renderNotifPanel();
}

function deleteNotif(id) {
  saveNotifs(getNotifs().filter(n => n.id !== id));
  renderNotifPanel();
  updateNotifBadge();
}

function updateNotifBadge() {
  const unread = getNotifs().filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  badge.textContent = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
}

function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
  } else {
    panel.classList.add('open');
    renderNotifPanel();
    // Marquer comme lues après 2s
    setTimeout(markAllRead, 2000);
  }
}

function renderNotifPanel() {
  const list  = document.getElementById('notifList');
  if (!list) return;
  const notifs = getNotifs();
  if (notifs.length === 0) {
    list.innerHTML = '<div class="notif-empty">Aucune notification pour l\'instant.</div>';
    return;
  }
  list.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="window.location.href='${n.url}'">
      <div class="notif-icon">${getNotifIcon(n.type)}</div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-date">${n.date}</div>
      </div>
      <button class="notif-del" onclick="event.stopPropagation();deleteNotif(${n.id})">×</button>
    </div>`).join('');
}

function getNotifIcon(type) {
  const icons = { post:'📝', live:'🔴', event:'📅', message:'💬', tithe:'💛' };
  return icons[type] || '🔔';
}

function showToastNotif(title, msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<strong>${title}</strong><br><span style="font-size:.82rem;opacity:.8;">${msg}</span>`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

// Demander permission notifications navigateur
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Enregistrer le service worker PWA
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateNotifBadge();
  requestNotifPermission();
  registerSW();
});
