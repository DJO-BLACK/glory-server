/* ============================================
   GLORY – Composants partagés v2
   Nav + Footer + Modal Auth + Notifications
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ===== NAV =====
  const navHTML = `
  <nav>
    <a class="logo" href="index.html">GLORY</a>
    <ul class="nav-links" id="navLinks">
      <li><a href="index.html" data-i18n="nav_home">Accueil</a></li>
      <li><a href="apropos.html" data-i18n="nav_about">À Propos</a></li>
      <li><a href="messages.html" data-i18n="nav_messages">Messages</a></li>
      <li><a href="lives.html" data-i18n="nav_lives">Lives</a></li>
      <li><a href="dime.html" data-i18n="nav_tithe">Dîme</a></li>
      <li><a href="evenements.html" data-i18n="evt_title">Événements</a></li>
      <li><a href="sondages.html" data-i18n="poll_title">Sondages</a></li>
      <li><a href="services.html" data-i18n="nav_services">Services</a></li>
    </ul>
    <div class="nav-auth">
      <button class="lang-btn" id="langToggle" onclick="toggleLang()">🌐 EN</button>
      <!-- Cloche notifications -->
      <div class="notif-wrap" id="notifWrap" style="display:none;position:relative;">
        <button class="notif-bell" onclick="toggleNotifPanel()" title="Notifications">🔔</button>
        <span class="notif-badge" id="notifBadge" style="display:none;">0</span>
        <!-- Panel notifications -->
        <div class="notif-panel" id="notifPanel">
          <div class="notif-header">
            <span>🔔 Notifications</span>
            <button onclick="markAllRead()" style="background:none;border:none;color:var(--gold);font-size:.75rem;cursor:pointer;">Tout lire</button>
          </div>
          <div class="notif-list" id="notifList"></div>
        </div>
      </div>
      <span class="user-info" id="userGreet" style="display:none;cursor:pointer;" onclick="window.location.href='profil.html'"></span>
      <button class="btn-login" id="btnLogin" onclick="openModal('login')" data-i18n="nav_login">Connexion</button>
      <button class="btn-signup" id="btnSignup" onclick="openModal('signup')" data-i18n="nav_signup">S'inscrire</button>
      <button class="btn-login" id="btnAdmin" style="display:none;border-color:#ff9800;color:#ff9800;" onclick="window.location.href='admin.html'">⚙ Admin</button>
      <button class="btn-login" id="btnLogout" style="display:none;" onclick="logout()" data-i18n="nav_logout">Déconnexion</button>
    </div>
    <div class="hamburger" onclick="document.getElementById('navLinks').classList.toggle('open')">
      <span></span><span></span><span></span>
    </div>
  </nav>`;

  // ===== VERSET DU JOUR =====
  const verseHTML = `
  <div class="verse-banner" id="verseBanner">
    <div class="verse-banner-inner">
      <span class="verse-tag" data-i18n="verse_tag">✦ Parole du Jour ✦</span>
      <p class="verse-text" id="verseText">Chargement...</p>
      <span class="verse-ref" id="verseRef"></span>
    </div>
  </div>`;

  // ===== AUTH MODAL =====
  const modalHTML = `
  <div class="modal-overlay" id="authModal">
    <div class="modal">
      <button class="modal-close" onclick="closeModal()">×</button>
      <div class="modal-logo">✞ GLORY</div>
      <div class="modal-tabs">
        <button class="modal-tab active" id="tabLogin" onclick="switchTab('login')" data-i18n="login_title">Connexion</button>
        <button class="modal-tab" id="tabSignup" onclick="switchTab('signup')" data-i18n="signup_title">Inscription</button>
      </div>
      <div class="tab-content active" id="tcLogin">
        <div class="form-group"><label data-i18n="login_email">Email</label><input type="email" id="lEmail" placeholder="ton@email.com"/></div>
        <div class="form-group"><label data-i18n="login_pass">Mot de passe</label><input type="password" id="lPass" placeholder="••••••••"/></div>
        <button class="btn-submit" onclick="doLogin()" data-i18n="login_btn">Se Connecter</button>
      </div>
      <div class="tab-content" id="tcSignup">
        <div class="form-group"><label data-i18n="signup_name">Prénom & Nom</label><input type="text" id="rName" placeholder="Ton nom complet"/></div>
        <div class="form-group"><label data-i18n="login_email">Email</label><input type="email" id="rEmail" placeholder="ton@email.com"/></div>
        <div class="form-group"><label data-i18n="signup_country">Pays</label><input type="text" id="rCountry" placeholder="France, Côte d'Ivoire, Canada..."/></div>
        <div class="form-group"><label data-i18n="login_pass">Mot de passe</label><input type="password" id="rPass" placeholder="••••••••"/></div>
        <button class="btn-submit" onclick="doSignup()" data-i18n="signup_btn">Rejoindre GLORY ✦</button>
      </div>
    </div>
  </div>`;

  // ===== FOOTER =====
  const footerHTML = `
  <footer>
    <div class="footer-logo">GLORY</div>
    <div class="footer-verse" data-i18n="footer_verse">"À lui soient la gloire et la force, aux siècles des siècles." — Apocalypse 1:6</div>
    <ul class="footer-links">
      <li><a href="index.html" data-i18n="nav_home">Accueil</a></li>
      <li><a href="apropos.html" data-i18n="nav_about">À Propos</a></li>
      <li><a href="messages.html" data-i18n="nav_messages">Messages</a></li>
      <li><a href="lives.html" data-i18n="nav_lives">Lives</a></li>
      <li><a href="dime.html" data-i18n="nav_tithe">Dîme</a></li>
      <li><a href="evenements.html">Événements</a></li>
      <li><a href="sondages.html">Sondages</a></li>
      <li><a href="services.html" data-i18n="nav_services">Services</a></li>
    </ul>
    <!-- PWA Install -->
    <div id="pwaInstallWrap" style="margin-bottom:1rem;display:none;">
      <button id="pwaInstallBtn" onclick="installPWA()" style="background:rgba(212,175,55,0.15);border:1px solid var(--gold);color:var(--gold);padding:.5rem 1.5rem;border-radius:4px;cursor:pointer;font-size:.82rem;letter-spacing:1px;">📱 Installer l'Application</button>
    </div>
    <div class="footer-copy" data-i18n="footer_copy">© 2025 GLORY – Réunis dans Sa Présence. Tous droits réservés.</div>
  </footer>`;

  const toastHTML   = `<div class="toast" id="toast"></div>`;
  const particlesHTML = `<div id="particles"></div>`;

  document.body.insertAdjacentHTML('afterbegin', particlesHTML + navHTML + verseHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML + modalHTML + toastHTML);

  // ===== VERSET DU JOUR =====
  const VERSES = [
    { text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.", ref: "Jean 3:16" },
    { text: "Je puis tout par celui qui me fortifie.", ref: "Philippiens 4:13" },
    { text: "L'Éternel est mon berger : je ne manquerai de rien.", ref: "Psaume 23:1" },
    { text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", ref: "Proverbes 3:5" },
    { text: "Ne crains rien, car je suis avec toi ; ne promène pas des regards inquiets, car je suis ton Dieu.", ref: "Ésaïe 41:10" },
    { text: "Cherchez premièrement le royaume et la justice de Dieu ; et toutes ces choses vous seront données par-dessus.", ref: "Matthieu 6:33" },
    { text: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.", ref: "Psaume 91:1" },
    { text: "Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne.", ref: "Jean 14:27" },
    { text: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?", ref: "Psaume 27:1" },
    { text: "Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres.", ref: "Éphésiens 2:10" },
    { text: "Réjouissez-vous toujours dans le Seigneur ; je le répète, réjouissez-vous.", ref: "Philippiens 4:4" },
    { text: "Mais ceux qui se confient en l'Éternel renouvellent leur force.", ref: "Ésaïe 40:31" },
    { text: "Invoque-moi, et je te répondrai ; je t'annoncerai de grandes choses.", ref: "Jérémie 33:3" },
    { text: "L'amour est patient, il est plein de bonté ; l'amour n'est point envieux.", ref: "1 Corinthiens 13:4" },
    { text: "Toutes choses concourent au bien de ceux qui aiment Dieu.", ref: "Romains 8:28" },
    { text: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", ref: "Matthieu 11:28" },
    { text: "Que la paix de Dieu, qui surpasse toute intelligence, garde vos cœurs.", ref: "Philippiens 4:7" },
    { text: "Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.", ref: "Jean 14:6" },
    { text: "Dieu résiste aux orgueilleux, mais il fait grâce aux humbles.", ref: "Jacques 4:6" },
    { text: "Car mes pensées ne sont pas vos pensées, et vos voies ne sont pas mes voies, dit l'Éternel.", ref: "Ésaïe 55:8" },
    { text: "Remets ton sort à l'Éternel, il agira.", ref: "Psaume 37:5" },
    { text: "Je vous ai dit ces choses, afin que vous ayez la paix en moi.", ref: "Jean 16:33" },
    { text: "Si Dieu est pour nous, qui sera contre nous ?", ref: "Romains 8:31" },
    { text: "Heureux les cœurs purs, car ils verront Dieu.", ref: "Matthieu 5:8" },
    { text: "Et maintenant ces trois choses demeurent : la foi, l'espérance, l'amour ; mais la plus grande, c'est l'amour.", ref: "1 Corinthiens 13:13" },
    { text: "L'Éternel bénira son peuple et lui donnera la paix.", ref: "Psaume 29:11" },
    { text: "Mais moi et ma maison, nous servirons l'Éternel.", ref: "Josué 24:15" },
    { text: "Soyez forts et courageux. Ne craignez point, ne vous effrayez point devant eux.", ref: "Deutéronome 31:6" },
    { text: "La vérité vous affranchira.", ref: "Jean 8:32" },
    { text: "Que vos lumières brillent devant les hommes, afin qu'ils voient vos bonnes œuvres.", ref: "Matthieu 5:16" },
    { text: "Dieu est notre refuge et notre force, un secours qui ne manque jamais dans la détresse.", ref: "Psaume 46:1" },
  ];

  function loadVerse() {
    const day   = new Date().getDate() + new Date().getMonth() * 31;
    const verse = VERSES[day % VERSES.length];
    const vt = document.getElementById('verseText');
    const vr = document.getElementById('verseRef');
    if (vt) vt.textContent = `"${verse.text}"`;
    if (vr) vr.textContent = `— ${verse.ref}`;
  }
  loadVerse();
});

// ===== PWA INSTALL =====
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const wrap = document.getElementById('pwaInstallWrap');
  if (wrap) wrap.style.display = 'block';
});
function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    const wrap = document.getElementById('pwaInstallWrap');
    if (wrap) wrap.style.display = 'none';
  });
}
