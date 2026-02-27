// ============================================
// GLORY – Serveur principal (server.js)
// Express + Socket.io + MongoDB
// ============================================
require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const multer     = require('multer');

const { User, Post, Message, Event, Poll, Notification } = require('./models');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'))); // Fichiers front-end
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== UPLOAD FICHIERS ======
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,'-'))
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max

// ====== CONNEXION MONGODB ======
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté');
    // Créer l'admin principal si inexistant
    const adminExists = await User.findOne({ email: 'admin@glory.com' });
    if (!adminExists) {
      const hashed = await bcrypt.hash('glory2025', 10);
      await User.create({ name: 'Admin Glory', email: 'admin@glory.com', password: hashed, role: 'admin' });
      console.log('✅ Admin créé : admin@glory.com / glory2025');
    }
  })
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// ====== MIDDLEWARE AUTH ======
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'subadmin')
    return res.status(403).json({ error: 'Accès refusé' });
  next();
}

// ============================================
// ROUTES AUTH
// ============================================

// INSCRIPTION
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, country } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' });
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email déjà utilisé' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, country });
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, country: user.country } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CONNEXION
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    if (user.suspended) {
      const now = new Date();
      if (!user.restoreDate || now < user.restoreDate) {
        const msg = user.restoreDate
          ? `Compte suspendu jusqu'au ${user.restoreDate.toLocaleDateString('fr')}`
          : 'Compte suspendu. Contacte l\'administrateur.';
        return res.status(403).json({ error: msg });
      } else {
        user.suspended = false; user.restoreDate = null; await user.save();
      }
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, country: user.country, avatar: user.avatar, bio: user.bio } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PROFIL
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});
app.put('/api/auth/me', authMiddleware, async (req, res) => {
  const { bio, country } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { bio, country }, { new: true }).select('-password');
  res.json(user);
});
app.put('/api/auth/password', authMiddleware, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Minimum 6 caractères' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(req.user.id, { password: hashed });
  res.json({ success: true });
});

// UPLOAD AVATAR
app.post('/api/auth/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
  const url = '/uploads/' + req.file.filename;
  await User.findByIdAndUpdate(req.user.id, { avatar: url });
  res.json({ url });
});

// ============================================
// ROUTES POSTS
// ============================================
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'name avatar role').limit(50);
  res.json(posts);
});

app.post('/api/posts', authMiddleware, adminMiddleware, async (req, res) => {
  const { type, postType, title, content } = req.body;
  const post = await Post.create({ author: req.user.id, type, postType, title, content });
  const populated = await post.populate('author', 'name avatar role');
  io.emit('new_post', populated);
  // Notification à tous
  const notif = await Notification.create({ type:'post', title: title||'Nouvelle publication', message: content?.substring(0,80)||'', url:'/index.html' });
  io.emit('new_notif', notif);
  res.json(populated);
});

// Upload média pour post
app.post('/api/posts/media', authMiddleware, adminMiddleware, upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
  const url = '/uploads/' + req.file.filename;
  res.json({ url });
});

app.delete('/api/posts/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  io.emit('delete_post', req.params.id);
  res.json({ success: true });
});

// Like
app.post('/api/posts/:id/like', authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });
  const idx = post.likes.indexOf(req.user.id);
  if (idx === -1) post.likes.push(req.user.id);
  else post.likes.splice(idx, 1);
  await post.save();
  io.emit('update_likes', { postId: post._id, likes: post.likes });
  res.json({ likes: post.likes });
});

// Commentaire
app.post('/api/posts/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Texte requis' });
  const post = await Post.findById(req.params.id);
  post.comments.push({ author: req.user.id, name: req.user.name, role: req.user.role, text });
  await post.save();
  io.emit('new_comment', { postId: post._id, comment: post.comments[post.comments.length - 1] });
  res.json(post.comments);
});

// ============================================
// ROUTES MESSAGES
// ============================================
app.get('/api/messages/:conv', authMiddleware, async (req, res) => {
  const { conv } = req.params;
  if (conv === 'admin' && req.user.role === 'member') return res.status(403).json({ error: 'Accès refusé' });
  const msgs = await Message.find({ conv }).sort({ createdAt: 1 }).limit(100);
  res.json(msgs);
});

app.post('/api/messages', authMiddleware, async (req, res) => {
  const { text, conv, type, audioUrl, duration } = req.body;
  if (conv === 'admin' && req.user.role === 'member') return res.status(403).json({ error: 'Accès refusé' });
  const msg = await Message.create({ author: req.user.id, name: req.user.name, role: req.user.role, text, conv, type: type||'text', audioUrl, duration });
  io.to(conv).emit('new_message', msg);
  res.json(msg);
});

// Upload audio message
app.post('/api/messages/audio', authMiddleware, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
  const url = '/uploads/' + req.file.filename;
  res.json({ url });
});

// Réaction sur message
app.post('/api/messages/:id/react', authMiddleware, async (req, res) => {
  const { emoji } = req.body;
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message introuvable' });
  if (!msg.reactions.has(emoji)) msg.reactions.set(emoji, []);
  const users = msg.reactions.get(emoji);
  const idx = users.indexOf(req.user.name);
  if (idx === -1) users.push(req.user.name);
  else users.splice(idx, 1);
  msg.reactions.set(emoji, users);
  msg.markModified('reactions');
  await msg.save();
  io.to(msg.conv).emit('update_reactions', { msgId: msg._id, reactions: Object.fromEntries(msg.reactions) });
  res.json({ reactions: Object.fromEntries(msg.reactions) });
});

// ============================================
// ROUTES ÉVÉNEMENTS
// ============================================
app.get('/api/events', async (req, res) => {
  const events = await Event.find().sort({ date: 1 }).populate('participants', 'name');
  res.json(events);
});
app.post('/api/events', authMiddleware, adminMiddleware, async (req, res) => {
  const evt = await Event.create(req.body);
  const notif = await Notification.create({ type:'event', title:'Nouvel événement : '+evt.title, message: evt.date+(evt.time?' à '+evt.time:''), url:'/evenements.html' });
  io.emit('new_event', evt);
  io.emit('new_notif', notif);
  res.json(evt);
});
app.post('/api/events/:id/join', authMiddleware, async (req, res) => {
  const evt = await Event.findById(req.params.id);
  const idx = evt.participants.indexOf(req.user.id);
  if (idx === -1) evt.participants.push(req.user.id);
  else evt.participants.splice(idx, 1);
  await evt.save();
  io.emit('update_event', { id: evt._id, participants: evt.participants });
  res.json({ participants: evt.participants });
});
app.delete('/api/events/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id); io.emit('delete_event', req.params.id); res.json({ success: true });
});

// ============================================
// ROUTES SONDAGES
// ============================================
app.get('/api/polls', async (req, res) => {
  const polls = await Poll.find().sort({ createdAt: -1 });
  res.json(polls);
});
app.post('/api/polls', authMiddleware, adminMiddleware, async (req, res) => {
  const { question, options, expiresAt } = req.body;
  const poll = await Poll.create({ question, options: options.map(o=>({text:o,votes:[]})), expiresAt });
  const notif = await Notification.create({ type:'post', title:'Nouveau Sondage !', message: question, url:'/sondages.html' });
  io.emit('new_poll', poll); io.emit('new_notif', notif);
  res.json(poll);
});
app.post('/api/polls/:id/vote', authMiddleware, async (req, res) => {
  const { optIndex } = req.body;
  const poll = await Poll.findById(req.params.id);
  if (!poll || poll.closed) return res.status(400).json({ error: 'Sondage fermé' });
  poll.options.forEach(o => { const i = o.votes.indexOf(req.user.id); if (i!==-1) o.votes.splice(i,1); });
  poll.options[optIndex].votes.push(req.user.id);
  await poll.save();
  io.emit('update_poll', poll);
  res.json(poll);
});
app.patch('/api/polls/:id/close', authMiddleware, adminMiddleware, async (req, res) => {
  const poll = await Poll.findByIdAndUpdate(req.params.id, { closed: true }, { new: true });
  io.emit('update_poll', poll); res.json(poll);
});
app.delete('/api/polls/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await Poll.findByIdAndDelete(req.params.id); io.emit('delete_poll', req.params.id); res.json({ success: true });
});

// ============================================
// ROUTES NOTIFICATIONS
// ============================================
app.get('/api/notifs', authMiddleware, async (req, res) => {
  const notifs = await Notification.find().sort({ createdAt: -1 }).limit(30);
  res.json(notifs.map(n => ({ ...n.toObject(), read: n.readBy.includes(req.user.id) })));
});
app.post('/api/notifs/read', authMiddleware, async (req, res) => {
  await Notification.updateMany({ readBy: { $ne: req.user.id } }, { $push: { readBy: req.user.id } });
  res.json({ success: true });
});

// ============================================
// ROUTES ADMIN
// ============================================
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});
app.patch('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Seul l\'admin principal peut changer les rôles' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
  res.json(user);
});
app.patch('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  const { suspended, restoreDate, reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { suspended, restoreDate: restoreDate||null, suspendedReason: reason||'' }, { new: true }).select('-password');
  res.json(user);
});
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ============================================
// SOCKET.IO — Temps réel + WebRTC Signaling
// ============================================
const liveViewers  = new Map(); // socketId -> {name, role}
let   streamerSocketId = null;  // Socket du streamer actif
let   liveInfo     = null;      // { title, type }

io.on('connection', socket => {
  console.log('🔌 Connexion:', socket.id);

  // ── Messages ──
  socket.on('join_conv', conv => socket.join(conv));

  // ─────────────────────────────────────────
  // LIVE — Streamer démarre le live
  // ─────────────────────────────────────────
  socket.on('start_live', ({ title, liveType, userName, userRole }) => {
    streamerSocketId = socket.id;
    liveInfo = { title, liveType };
    socket.join('live_room');
    // Notifier tous les spectateurs qu'un live a démarré
    io.emit('live_started', { title, liveType, viewerCount: 0 });
    console.log(`🔴 Live démarré par ${userName}: ${title}`);
  });

  // ─────────────────────────────────────────
  // LIVE — Spectateur rejoint
  // ─────────────────────────────────────────
  socket.on('join_live', ({ userName, userRole }) => {
    socket.join('live_room');
    liveViewers.set(socket.id, { name: userName, role: userRole });

    // Mettre à jour le compteur
    const count = liveViewers.size;
    io.to('live_room').emit('viewer_count', count);

    // Dire au streamer qu'un nouveau spectateur veut regarder
    if (streamerSocketId) {
      socket.to(streamerSocketId).emit('viewer_joined', { viewerId: socket.id, name: userName });
    }

    // Envoyer les infos du live au nouveau spectateur
    if (liveInfo) {
      socket.emit('live_info', { ...liveInfo, viewerCount: count });
    }

    console.log(`👁 ${userName} rejoint le live. Total: ${count}`);
  });

  // ─────────────────────────────────────────
  // WebRTC Signaling — Échange entre streamer et spectateurs
  // ─────────────────────────────────────────

  // Streamer envoie une offre WebRTC à un spectateur
  socket.on('webrtc_offer', ({ offer, targetId }) => {
    socket.to(targetId).emit('webrtc_offer', { offer, streamerId: socket.id });
  });

  // Spectateur répond avec une réponse WebRTC au streamer
  socket.on('webrtc_answer', ({ answer, streamerId }) => {
    socket.to(streamerId).emit('webrtc_answer', { answer, viewerId: socket.id });
  });

  // Échange de candidats ICE (pour établir la connexion P2P)
  socket.on('ice_candidate', ({ candidate, targetId }) => {
    socket.to(targetId).emit('ice_candidate', { candidate, fromId: socket.id });
  });

  // ─────────────────────────────────────────
  // LIVE — Réactions et commentaires
  // ─────────────────────────────────────────
  socket.on('live_reaction', ({ emoji, userName }) => {
    io.to('live_room').emit('live_reaction', { emoji, userName });
  });

  socket.on('live_comment', ({ text, userName, userRole }) => {
    io.to('live_room').emit('live_comment', {
      text, userName, userRole,
      time: new Date().toLocaleTimeString('fr', { hour:'2-digit', minute:'2-digit' })
    });
  });

  // ─────────────────────────────────────────
  // LIVE — Streamer arrête le live
  // ─────────────────────────────────────────
  socket.on('stop_live', () => {
    if (socket.id === streamerSocketId) {
      io.to('live_room').emit('live_ended');
      streamerSocketId = null;
      liveInfo = null;
      liveViewers.clear();
      console.log('⏹ Live terminé');
    }
  });

  // ─────────────────────────────────────────
  // Déconnexion
  // ─────────────────────────────────────────
  socket.on('disconnect', () => {
    // Si le streamer se déconnecte
    if (socket.id === streamerSocketId) {
      io.to('live_room').emit('live_ended');
      streamerSocketId = null;
      liveInfo = null;
      liveViewers.clear();
      console.log('⏹ Streamer déconnecté — live terminé');
      return;
    }
    // Si un spectateur se déconnecte
    if (liveViewers.has(socket.id)) {
      const viewer = liveViewers.get(socket.id);
      liveViewers.delete(socket.id);
      const count = liveViewers.size;
      io.to('live_room').emit('viewer_count', count);
      // Notifier le streamer
      if (streamerSocketId) {
        socket.to(streamerSocketId).emit('viewer_left', { viewerId: socket.id });
      }
      console.log(`👁 ${viewer.name} quitte le live. Total: ${count}`);
    }
  });

  // Route pour savoir si un live est actif
  socket.on('check_live', () => {
    if (liveInfo && streamerSocketId) {
      socket.emit('live_info', { ...liveInfo, viewerCount: liveViewers.size });
    } else {
      socket.emit('no_live');
    }
  });
});

// ============================================
// DÉMARRAGE
// ============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Serveur GLORY démarré sur http://localhost:${PORT}`);
  console.log(`📦 MongoDB: ${process.env.MONGODB_URI ? 'Configuré' : '⚠️ Non configuré'}`);
});

// ============================================
// FIREBASE ADMIN — Notifications Push
// ============================================
let firebaseAdmin = null;
try {
  const admin = require('firebase-admin');
  const serviceAccount = require('./serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  firebaseAdmin = admin;
  console.log('✅ Firebase Admin initialisé');
} catch(e) {
  console.log('⚠️ Firebase Admin non disponible:', e.message);
}

// Sauvegarder le token FCM d'un utilisateur
app.post('/api/fcm-token', authMiddleware, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token requis' });
  await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
  res.json({ success: true });
});

// Envoyer une notification push à tous les membres
async function sendPushToAll(title, body, url = '/') {
  if (!firebaseAdmin) return;
  try {
    const users = await User.find({ fcmToken: { $exists: true, $ne: '' } });
    const tokens = users.map(u => u.fcmToken).filter(Boolean);
    if (tokens.length === 0) return;
    await firebaseAdmin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { url },
      webpush: {
        notification: { icon: '/icon-192.png', badge: '/icon-192.png', vibrate: [200, 100, 200] },
        fcmOptions: { link: url }
      }
    });
    console.log(`📱 Notification envoyée à ${tokens.length} membres`);
  } catch(e) {
    console.error('Erreur push:', e);
  }
}
