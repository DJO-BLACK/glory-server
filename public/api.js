// ============================================
// GLORY – API Client (api.js)
// Connecte le front-end au serveur Node.js
// ============================================

const API = 'https://glory-server-production.up.railway.app';

// ====== TOKEN ======
const getToken  = () => localStorage.getItem('glory_token');
const setToken  = t  => localStorage.setItem('glory_token', t);
const clearToken= ()  => localStorage.removeItem('glory_token');

// ====== SESSION ======
const getSession  = () => JSON.parse(localStorage.getItem('glory_session') || 'null');
const saveSession = u  => localStorage.setItem('glory_session', JSON.stringify(u));
const clearSession= ()  => { localStorage.removeItem('glory_session'); clearToken(); };

// ====== REQUÊTE DE BASE ======
async function apiCall(method, path, body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = 'Bearer ' + getToken();
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// ====== AUTH ======
async function doLogin() {
  const email = document.getElementById('lEmail').value.trim();
  const pass  = document.getElementById('lPass').value;
  if (!email || !pass) { toast('Remplis tous les champs.'); return; }
  try {
    const data = await apiCall('POST', '/api/auth/login', { email, password: pass });
    setToken(data.token);
    saveSession(data.user);
    closeModal();
    applySession();
    toast('✦ Bienvenue ' + data.user.name + ' !');
    if (typeof onLoginSuccess === 'function') onLoginSuccess();
  } catch(e) { toast('❌ ' + e.message); }
}

async function doSignup() {
  const name    = document.getElementById('rName').value.trim();
  const email   = document.getElementById('rEmail').value.trim();
  const country = document.getElementById('rCountry').value.trim();
  const pass    = document.getElementById('rPass').value;
  if (!name || !email || !pass) { toast('Remplis tous les champs.'); return; }
  try {
    const data = await apiCall('POST', '/api/auth/signup', { name, email, password: pass, country });
    setToken(data.token);
    saveSession(data.user);
    closeModal();
    applySession();
    toast('🙏 Bienvenue dans GLORY, ' + name + ' !');
    if (typeof onLoginSuccess === 'function') onLoginSuccess();
  } catch(e) { toast('❌ ' + e.message); }
}

function logout() {
  clearSession();
  applySession();
  toast('Tu es déconnecté(e). À bientôt !');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

// ====== APPLY SESSION ======
function applySession() {
  const user = getSession();
  const on = !!user;
  const isAdmin = on && (user.role === 'admin' || user.role === 'subadmin');
  const el = id => document.getElementById(id);
  if (el('btnLogin'))  el('btnLogin').style.display  = on ? 'none' : '';
  if (el('btnSignup')) el('btnSignup').style.display = on ? 'none' : '';
  if (el('btnLogout')) el('btnLogout').style.display = on ? '' : 'none';
  if (el('btnAdmin'))  el('btnAdmin').style.display  = isAdmin ? '' : 'none';
  if (el('notifWrap')) el('notifWrap').style.display = on ? '' : 'none';
  if (el('userGreet')) {
    el('userGreet').style.display = on ? '' : 'none';
    if (on) el('userGreet').textContent = user.name;
  }
  document.querySelectorAll('.admin-only').forEach(e => e.style.display = isAdmin ? '' : 'none');
  document.querySelectorAll('.auth-only').forEach(e => e.style.display = on ? '' : 'none');
  document.querySelectorAll('.guest-only').forEach(e => e.style.display = on ? 'none' : '');
}

// ====== MODAL ======
function openModal(tab) { document.getElementById('authModal').classList.add('open'); switchTab(tab || 'login'); }
function closeModal()   { document.getElementById('authModal').classList.remove('open'); }
function switchTab(tab) {
  ['Login','Signup'].forEach(t => {
    document.getElementById('tab'+t).classList.toggle('active', t.toLowerCase()===tab);
    document.getElementById('tc'+t).classList.toggle('active', t.toLowerCase()===tab);
  });
}

// ====== POSTS ======
async function loadPosts() {
  try {
    return await apiCall('GET', '/api/posts');
  } catch(e) { console.error('Erreur posts:', e); return []; }
}

async function createPost(data) {
  return await apiCall('POST', '/api/posts', data, true);
}

async function likePost(id) {
  return await apiCall('POST', `/api/posts/${id}/like`, {}, true);
}

async function commentPost(id, text) {
  return await apiCall('POST', `/api/posts/${id}/comment`, { text }, true);
}

async function deletePost(id) {
  return await apiCall('DELETE', `/api/posts/${id}`, null, true);
}

// ====== MESSAGES ======
async function loadMessages(conv) {
  return await apiCall('GET', `/api/messages/${conv}`, null, true);
}

async function sendMessage(data) {
  return await apiCall('POST', '/api/messages', data, true);
}

// ====== EVENTS ======
async function loadEvents() {
  return await apiCall('GET', '/api/events');
}

// ====== POLLS ======
async function loadPolls() {
  return await apiCall('GET', '/api/polls');
}

// ====== INIT ======
function initParticles() {
  const c = document.getElementById('particles'); if (!c) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}vw;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;animation-duration:${8+Math.random()*14}s;animation-delay:${Math.random()*14}s;`;
    c.appendChild(p);
  }
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === page));
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function toast(msg) {
  const t = document.getElementById('toast'); if (!t) return;
  t.innerHTML = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  applySession();
  setActiveNav();
});
