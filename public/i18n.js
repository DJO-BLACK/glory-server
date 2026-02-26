// ============================================
// GLORY – Système multilingue (i18n.js)
// Français / English
// ============================================

const TRANSLATIONS = {
  fr: {
    // NAV
    nav_home: 'Accueil', nav_about: 'À Propos', nav_messages: 'Messages',
    nav_lives: 'Lives', nav_tithe: 'Dîme', nav_services: 'Services',
    nav_login: 'Connexion', nav_signup: "S'inscrire", nav_logout: 'Déconnexion',
    nav_admin: 'Admin', nav_profile: 'Mon Profil',
    // HERO
    hero_sub: 'Réunis dans Sa Présence',
    hero_desc: 'Une communauté mondiale pour adorer et parler du seul vrai DIEU. Peu importe ta dénomination, ta langue ou ton pays — ici, nous sommes UNS.',
    hero_cta: 'Rejoindre la Communauté',
    // SECTIONS
    feed_tag: '✦ Publications ✦', feed_title: 'La Parole du Jour',
    about_tag: '✦ Notre Mission ✦', about_title: 'À Propos de GLORY',
    msg_tag: '✦ Communauté ✦', msg_title: 'Espace Messages',
    live_tag: '✦ En Direct ✦', live_title: 'GLORY Live',
    tithe_tag: '✦ Offrandes ✦', tithe_title: 'Dîme & Offrandes',
    srv_tag: '✦ Conseil & Accompagnement ✦', srv_title: 'Services',
    evt_tag: '✦ Agenda ✦', evt_title: "Calendrier d'Événements",
    poll_tag: '✦ Communauté ✦', poll_title: 'Sondages & Votes',
    // VERSE
    verse_tag: '✦ Parole du Jour ✦', verse_loading: 'Chargement du verset...',
    // MESSAGES
    msg_general: 'Canal Général', msg_admin: 'Canal Admin',
    msg_send: 'Envoyer', msg_placeholder: 'Écris un message...',
    msg_login: 'Connecte-toi pour participer.',
    msg_locked: 'Ce canal est réservé aux administrateurs.',
    msg_empty: 'Aucun message. Sois le premier ! 🙏',
    // LIVE
    live_start_video: '🎥 Lancer Live Vidéo',
    live_start_audio: '🎙 Lancer Live Audio',
    live_stop: '⏹ Arrêter le Live',
    live_viewers: 'spectateur(s)',
    live_title_placeholder: 'Ex: Culte du Dimanche...',
    live_type_video: 'Vidéo + Audio', live_type_audio: 'Audio seulement',
    live_launch: '🔴 Lancer le Live',
    live_comments: 'Commentaires du Live',
    live_react: 'Réagir au live',
    // AUTH
    login_title: 'Connexion', signup_title: 'Inscription',
    login_email: 'Email', login_pass: 'Mot de passe',
    login_btn: 'Se Connecter', signup_btn: 'Rejoindre GLORY ✦',
    signup_name: 'Prénom & Nom', signup_country: 'Pays',
    // NOTIFICATIONS
    notif_new_post: '📝 Nouvelle publication de GLORY',
    notif_live: '🔴 Un live vient de démarrer !',
    notif_event: '📅 Nouvel événement ajouté',
    // FOOTER
    footer_verse: '"À lui soient la gloire et la force, aux siècles des siècles." — Apocalypse 1:6',
    footer_copy: '© 2025 GLORY – Réunis dans Sa Présence. Tous droits réservés.',
    // DIVERS
    send: 'Envoyer', save: 'Sauvegarder', cancel: 'Annuler',
    publish: 'Publier', vote: 'Voter', yes: 'Oui', no: 'Non',
    loading: 'Chargement...', success: 'Succès !', error: 'Erreur',
  },
  en: {
    // NAV
    nav_home: 'Home', nav_about: 'About', nav_messages: 'Messages',
    nav_lives: 'Lives', nav_tithe: 'Tithe', nav_services: 'Services',
    nav_login: 'Login', nav_signup: 'Sign Up', nav_logout: 'Logout',
    nav_admin: 'Admin', nav_profile: 'My Profile',
    // HERO
    hero_sub: 'United in His Presence',
    hero_desc: 'A global community to worship and speak about the one true GOD. No matter your denomination, language or country — here, we are ONE.',
    hero_cta: 'Join the Community',
    // SECTIONS
    feed_tag: '✦ Publications ✦', feed_title: "Today's Word",
    about_tag: '✦ Our Mission ✦', about_title: 'About GLORY',
    msg_tag: '✦ Community ✦', msg_title: 'Messages',
    live_tag: '✦ Live ✦', live_title: 'GLORY Live',
    tithe_tag: '✦ Offerings ✦', tithe_title: 'Tithe & Offerings',
    srv_tag: '✦ Counseling ✦', srv_title: 'Services',
    evt_tag: '✦ Agenda ✦', evt_title: 'Events Calendar',
    poll_tag: '✦ Community ✦', poll_title: 'Polls & Votes',
    // VERSE
    verse_tag: '✦ Verse of the Day ✦', verse_loading: 'Loading verse...',
    // MESSAGES
    msg_general: 'General Channel', msg_admin: 'Admin Channel',
    msg_send: 'Send', msg_placeholder: 'Write a message...',
    msg_login: 'Log in to participate.',
    msg_locked: 'This channel is for administrators only.',
    msg_empty: 'No messages yet. Be the first! 🙏',
    // LIVE
    live_start_video: '🎥 Start Video Live',
    live_start_audio: '🎙 Audio Only Live',
    live_stop: '⏹ Stop Live',
    live_viewers: 'viewer(s)',
    live_title_placeholder: 'Ex: Sunday Service...',
    live_type_video: 'Video + Audio', live_type_audio: 'Audio only',
    live_launch: '🔴 Go Live',
    live_comments: 'Live Comments',
    live_react: 'React to the live',
    // AUTH
    login_title: 'Login', signup_title: 'Sign Up',
    login_email: 'Email', login_pass: 'Password',
    login_btn: 'Log In', signup_btn: 'Join GLORY ✦',
    signup_name: 'Full Name', signup_country: 'Country',
    // NOTIFICATIONS
    notif_new_post: '📝 New post from GLORY',
    notif_live: '🔴 A live just started!',
    notif_event: '📅 New event added',
    // FOOTER
    footer_verse: '"To him be glory and power forever and ever." — Revelation 1:6',
    footer_copy: '© 2025 GLORY – United in His Presence. All rights reserved.',
    // DIVERS
    send: 'Send', save: 'Save', cancel: 'Cancel',
    publish: 'Publish', vote: 'Vote', yes: 'Yes', no: 'No',
    loading: 'Loading...', success: 'Success!', error: 'Error',
  }
};

// Langue courante
let currentLang = localStorage.getItem('glory_lang') || 'fr';

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS['fr'][key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('glory_lang', lang);
  applyTranslations();
  updateLangBtn();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) el.setAttribute(attr, t(key));
    else el.textContent = t(key);
  });
}

function updateLangBtn() {
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = currentLang === 'fr' ? '🌐 EN' : '🌐 FR';
}

function toggleLang() {
  setLang(currentLang === 'fr' ? 'en' : 'fr');
}

window.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  updateLangBtn();
});
