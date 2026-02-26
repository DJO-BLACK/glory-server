/* ============================================
   GLORY – auth.js v3
   Admin principal : admin@glory.com / glory2025
   ============================================ */

const ADMIN_EMAIL = 'admin@glory.com';
const ADMIN_PASS  = 'glory2025';

// ====== STORAGE ======
const getUsers    = () => JSON.parse(localStorage.getItem('g_users') || '[]');
const getPosts    = () => JSON.parse(localStorage.getItem('g_posts') || '[]');
const getMsgs     = () => JSON.parse(localStorage.getItem('g_msgs')  || '[]');
const saveUsers   = d => localStorage.setItem('g_users', JSON.stringify(d));
const savePosts   = d => localStorage.setItem('g_posts', JSON.stringify(d));
const saveMsgs    = d => localStorage.setItem('g_msgs',  JSON.stringify(d));
const getSession  = () => JSON.parse(sessionStorage.getItem('g_user') || 'null');
const saveSession = u => sessionStorage.setItem('g_user', JSON.stringify(u));
const clearSession= () => sessionStorage.removeItem('g_user');

// Admins secondaires
const getSubAdmins  = () => JSON.parse(localStorage.getItem('g_subadmins') || '[]');
const saveSubAdmins = d => localStorage.setItem('g_subadmins', JSON.stringify(d));

function isSubAdmin(email) { return getSubAdmins().includes(email); }

// ====== TOAST ======
function toast(msg) {
  const t = document.getElementById('toast'); if (!t) return;
  t.innerHTML = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ====== PARTICLES ======
function initParticles() {
  const c = document.getElementById('particles'); if (!c) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}vw;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;animation-duration:${8+Math.random()*14}s;animation-delay:${Math.random()*14}s;`;
    c.appendChild(p);
  }
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

// ====== LOGIN ======
function doLogin() {
  const email = document.getElementById('lEmail').value.trim();
  const pass  = document.getElementById('lPass').value;
  if (!email || !pass) { toast('Remplis tous les champs.'); return; }

  // Vérif suspension
  const users = getUsers();
  const u = users.find(u => u.email === email);
  if (u && u.suspended) {
    const now = new Date();
    const restoreDate = u.restoreDate ? new Date(u.restoreDate) : null;
    if (!restoreDate || now < restoreDate) {
      const msg = restoreDate
        ? `🚫 Compte suspendu jusqu'au ${restoreDate.toLocaleDateString('fr')}.`
        : '🚫 Compte suspendu indéfiniment. Contacte l\'admin.';
      toast(msg); return;
    } else {
      // Auto-restauration si date dépassée
      u.suspended = false; u.restoreDate = null;
      saveUsers(users);
    }
  }

  let user;
  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    user = { name:'Admin Glory', email, role:'admin' };
  } else if (isSubAdmin(email)) {
    const sa = users.find(u => u.email===email && u.pass===pass);
    if (!sa) { toast('❌ Email ou mot de passe incorrect.'); return; }
    user = { ...sa, role:'admin' };
  } else {
    if (!u || u.pass !== pass) { toast('❌ Email ou mot de passe incorrect.'); return; }
    user = { ...u, role:'member' };
  }
  saveSession(user); closeModal(); applySession();
  toast('✦ Bienvenue ' + user.name + ' !');
}

// ====== SIGNUP ======
function doSignup() {
  const name    = document.getElementById('rName').value.trim();
  const email   = document.getElementById('rEmail').value.trim();
  const country = document.getElementById('rCountry').value.trim();
  const pass    = document.getElementById('rPass').value;
  if (!name || !email || !pass) { toast('Remplis tous les champs.'); return; }
  const users = getUsers();
  if (users.find(u => u.email===email) || email===ADMIN_EMAIL) { toast('❌ Cet email est déjà utilisé.'); return; }
  const nu = { name, email, country, pass, joined: new Date().toLocaleDateString('fr'), suspended:false };
  users.push(nu); saveUsers(users);
  saveSession({ ...nu, role:'member' }); closeModal(); applySession();
  toast('🙏 Bienvenue dans GLORY, ' + name + ' !');
}

// ====== LOGOUT ======
function logout() {
  clearSession(); applySession();
  toast('Tu es déconnecté(e). À bientôt !');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

// ====== APPLY SESSION ======
function applySession() {
  const user = getSession();
  const on = !!user, isAdmin = on && user.role === 'admin';
  const el = id => document.getElementById(id);
  if (el('btnLogin'))  el('btnLogin').style.display  = on ? 'none' : '';
  if (el('btnSignup')) el('btnSignup').style.display = on ? 'none' : '';
  if (el('btnLogout')) el('btnLogout').style.display = on ? '' : 'none';
  if (el('btnAdmin'))  el('btnAdmin').style.display  = isAdmin ? '' : 'none';
  if (el('notifWrap')) el('notifWrap').style.display = on ? '' : 'none';
  if (el('userGreet')) { el('userGreet').style.display = on ? '' : 'none'; if(on) el('userGreet').textContent = user.name; }
  document.querySelectorAll('.admin-only').forEach(e => e.style.display = isAdmin ? '' : 'none');
  document.querySelectorAll('.auth-only').forEach(e => e.style.display = on ? '' : 'none');
  document.querySelectorAll('.guest-only').forEach(e => e.style.display = on ? 'none' : '');
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === page));
}

window.addEventListener('DOMContentLoaded', () => {
  initParticles(); applySession(); setActiveNav();
});
