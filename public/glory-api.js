// GLORY API - Connexion Frontend <-> Backend
const API_URL = window.location.origin;
let socket = null;

// ===== INIT SOCKET =====
function initSocket() {
  if (typeof io !== 'undefined' && !socket) {
    socket = io(API_URL);
  }
  return socket;
}

// ===== AUTH =====
const GloryAuth = {
  getToken: () => localStorage.getItem('glory_token'),
  getUser: () => JSON.parse(localStorage.getItem('glory_user') || 'null'),
  isLoggedIn: () => !!localStorage.getItem('glory_token'),
  isAdmin: () => {
    const u = GloryAuth.getUser();
    return u && (u.role === 'admin' || u.role === 'subadmin');
  },
  logout: () => {
    localStorage.removeItem('glory_token');
    localStorage.removeItem('glory_user');
    window.location.href = '/index.html';
  }
};

// ===== API HELPER =====
async function apiCall(method, endpoint, data = null, isFormData = false) {
  const token = GloryAuth.getToken();
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (data) options.body = isFormData ? data : JSON.stringify(data);

  const res = await fetch(API_URL + endpoint, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erreur serveur');
  return json;
}

// ===== AUTH API =====
async function registerUser(name, email, password) {
  const data = await apiCall('POST', '/api/auth/register', { name, email, password });
  localStorage.setItem('glory_token', data.token);
  localStorage.setItem('glory_user', JSON.stringify(data.user));
  return data;
}

async function loginUser(email, password) {
  const data = await apiCall('POST', '/api/auth/login', { email, password });
  localStorage.setItem('glory_token', data.token);
  localStorage.setItem('glory_user', JSON.stringify(data.user));
  return data;
}

// ===== POSTS API =====
async function getPosts() { return apiCall('GET', '/api/posts'); }
async function createPost(formData) { return apiCall('POST', '/api/posts', formData, true); }
async function likePost(id) { return apiCall('POST', `/api/posts/${id}/like`); }
async function commentPost(id, text) { return apiCall('POST', `/api/posts/${id}/comment`, { text }); }
async function deletePost(id) { return apiCall('DELETE', `/api/posts/${id}`); }

// ===== MESSAGES API =====
async function getMessages(channel) { return apiCall('GET', `/api/messages/${channel}`); }
async function sendMessage(channel, text) { return apiCall('POST', '/api/messages', { channel, text }); }
async function sendVoiceMessage(channel, audioBlob) {
  const formData = new FormData();
  formData.append('channel', channel);
  formData.append('audio', audioBlob, 'voice.webm');
  return apiCall('POST', '/api/messages', formData, true);
}
async function reactToMessage(id, emoji) { return apiCall('POST', `/api/messages/${id}/react`, { emoji }); }

// ===== USERS API =====
async function getUsers() { return apiCall('GET', '/api/users'); }
async function updateProfile(formData) { return apiCall('PUT', '/api/users/profile', formData, true); }
async function changeUserRole(id, role) { return apiCall('PUT', `/api/users/${id}/role`, { role }); }
async function suspendUser(id, suspended, suspendedUntil) { return apiCall('PUT', `/api/users/${id}/suspend`, { suspended, suspendedUntil }); }

// ===== EVENTS API =====
async function getEvents() { return apiCall('GET', '/api/events'); }
async function createEvent(data) { return apiCall('POST', '/api/events', data); }
async function attendEvent(id) { return apiCall('POST', `/api/events/${id}/attend`); }
async function deleteEvent(id) { return apiCall('DELETE', `/api/events/${id}`); }

// ===== POLLS API =====
async function getPolls() { return apiCall('GET', '/api/polls'); }
async function createPoll(data) { return apiCall('POST', '/api/polls', data); }
async function votePoll(id, optionIndex) { return apiCall('POST', `/api/polls/${id}/vote`, { optionIndex }); }

// ===== NOTIFICATIONS API =====
async function getNotifications() { return apiCall('GET', '/api/notifications'); }
async function markNotificationsRead(ids) { return apiCall('POST', '/api/notifications/read', { ids }); }
async function sendNotification(message) { return apiCall('POST', '/api/notifications/send', { message }); }

// ===== LIVE API =====
async function getLiveStatus() { return apiCall('GET', '/api/live'); }
async function startLive(title, type) { return apiCall('POST', '/api/live/start', { title, type }); }
async function stopLive() { return apiCall('POST', '/api/live/stop'); }

// ===== CHECK AUTH ON EVERY PAGE =====
(function checkAuth() {
  const publicPages = ['login.html', 'register.html'];
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (!publicPages.includes(page) && !GloryAuth.isLoggedIn()) {
    window.location.href = '/login.html';
  }
})();
