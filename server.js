require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Uploads folder
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ MongoDB erreur:', err));

// ===== MODELS =====
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'member' }, // member, admin, subadmin
  avatar: String,
  bio: String,
  country: String,
  suspended: { type: Boolean, default: false },
  suspendedUntil: Date,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['text', 'photo', 'video'] },
  content: String,
  mediaUrl: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', PostSchema);

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  channel: { type: String, default: 'general' }, // general, admin
  text: String,
  audioUrl: String,
  reactions: [{ emoji: String, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

const EventSchema = new mongoose.Schema({
  title: String,
  type: String,
  date: Date,
  time: String,
  location: String,
  description: String,
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});
const Event = mongoose.model('Event', EventSchema);

const PollSchema = new mongoose.Schema({
  question: String,
  options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  endsAt: Date,
  createdAt: { type: Date, default: Date.now }
});
const Poll = mongoose.model('Poll', PollSchema);

const NotificationSchema = new mongoose.Schema({
  type: String,
  message: String,
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', NotificationSchema);

// ===== MIDDLEWARE =====
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'subadmin')
    return res.status(403).json({ error: 'Accès refusé' });
  next();
};

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 10);
    // First user becomes admin
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'member';
    const user = await User.create({ name, email, password: hash, role });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Utilisateur non trouvé' });
    if (user.suspended) {
      if (user.suspendedUntil && new Date() > user.suspendedUntil) {
        user.suspended = false;
        await user.save();
      } else {
        const until = user.suspendedUntil ? `jusqu'au ${user.suspendedUntil.toLocaleDateString()}` : 'indéfiniment';
        return res.status(403).json({ error: `Compte suspendu ${until}` });
      }
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Mot de passe incorrect' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => res.json(req.user));

// ===== POSTS ROUTES =====
app.get('/api/posts', authMiddleware, async (req, res) => {
  const posts = await Post.find().populate('author', 'name avatar role').populate('comments.author', 'name avatar').sort('-createdAt');
  res.json(posts);
});

app.post('/api/posts', authMiddleware, adminMiddleware, upload.single('media'), async (req, res) => {
  try {
    const { type, content } = req.body;
    const mediaUrl = req.file ? '/uploads/' + req.file.filename : null;
    const post = await Post.create({ author: req.user._id, type, content, mediaUrl });
    await post.populate('author', 'name avatar role');
    io.emit('new-post', post);
    // Create notification
    const notif = await Notification.create({ type: 'post', message: `Nouveau post de ${req.user.name}` });
    io.emit('new-notification', notif);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const idx = post.likes.indexOf(req.user._id);
  if (idx === -1) post.likes.push(req.user._id);
  else post.likes.splice(idx, 1);
  await post.save();
  io.emit('post-liked', { postId: post._id, likes: post.likes });
  res.json(post);
});

app.post('/api/posts/:id/comment', authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ author: req.user._id, text: req.body.text });
  await post.save();
  await post.populate('comments.author', 'name avatar');
  io.emit('post-commented', { postId: post._id, comments: post.comments });
  res.json(post);
});

app.delete('/api/posts/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  io.emit('post-deleted', req.params.id);
  res.json({ success: true });
});

// ===== MESSAGES ROUTES =====
app.get('/api/messages/:channel', authMiddleware, async (req, res) => {
  if (req.params.channel === 'admin' && req.user.role === 'member')
    return res.status(403).json({ error: 'Accès refusé' });
  const messages = await Message.find({ channel: req.params.channel })
    .populate('sender', 'name avatar role').sort('-createdAt').limit(50);
  res.json(messages.reverse());
});

app.post('/api/messages', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const { channel, text } = req.body;
    if (channel === 'admin' && req.user.role === 'member')
      return res.status(403).json({ error: 'Accès refusé' });
    const audioUrl = req.file ? '/uploads/' + req.file.filename : null;
    const msg = await Message.create({ sender: req.user._id, channel, text, audioUrl });
    await msg.populate('sender', 'name avatar role');
    io.emit('new-message-' + channel, msg);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages/:id/react', authMiddleware, async (req, res) => {
  const msg = await Message.findById(req.params.id);
  const { emoji } = req.body;
  const existing = msg.reactions.find(r => r.user.toString() === req.user._id.toString() && r.emoji === emoji);
  if (existing) msg.reactions = msg.reactions.filter(r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji));
  else msg.reactions.push({ emoji, user: req.user._id });
  await msg.save();
  io.emit('message-reacted', { msgId: msg._id, reactions: msg.reactions });
  res.json(msg);
});

// ===== USERS ROUTES =====
app.get('/api/users', authMiddleware, async (req, res) => {
  const users = await User.find().select('-password').sort('name');
  res.json(users);
});

app.put('/api/users/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.bio) updates.bio = req.body.bio;
  if (req.body.country) updates.country = req.body.country;
  if (req.file) updates.avatar = '/uploads/' + req.file.filename;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.json(user);
});

app.put('/api/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Seul le super admin peut changer les rôles' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
  res.json(user);
});

app.put('/api/users/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  const { suspended, suspendedUntil } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { suspended, suspendedUntil }, { new: true }).select('-password');
  res.json(user);
});

// ===== EVENTS ROUTES =====
app.get('/api/events', authMiddleware, async (req, res) => {
  const events = await Event.find().populate('attendees', 'name').sort('date');
  res.json(events);
});

app.post('/api/events', authMiddleware, adminMiddleware, async (req, res) => {
  const event = await Event.create(req.body);
  const notif = await Notification.create({ type: 'event', message: `Nouvel événement: ${event.title}` });
  io.emit('new-notification', notif);
  io.emit('new-event', event);
  res.json(event);
});

app.post('/api/events/:id/attend', authMiddleware, async (req, res) => {
  const event = await Event.findById(req.params.id);
  const idx = event.attendees.indexOf(req.user._id);
  if (idx === -1) event.attendees.push(req.user._id);
  else event.attendees.splice(idx, 1);
  await event.save();
  res.json(event);
});

app.delete('/api/events/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== POLLS ROUTES =====
app.get('/api/polls', authMiddleware, async (req, res) => {
  const polls = await Poll.find().sort('-createdAt');
  res.json(polls);
});

app.post('/api/polls', authMiddleware, adminMiddleware, async (req, res) => {
  const poll = await Poll.create(req.body);
  io.emit('new-poll', poll);
  res.json(poll);
});

app.post('/api/polls/:id/vote', authMiddleware, async (req, res) => {
  const poll = await Poll.findById(req.params.id);
  if (poll.endsAt && new Date() > poll.endsAt) return res.status(400).json({ error: 'Sondage terminé' });
  // Remove previous votes
  poll.options.forEach(opt => {
    opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString());
  });
  poll.options[req.body.optionIndex].votes.push(req.user._id);
  await poll.save();
  io.emit('poll-updated', poll);
  res.json(poll);
});

// ===== NOTIFICATIONS ROUTES =====
app.get('/api/notifications', authMiddleware, async (req, res) => {
  const notifs = await Notification.find().sort('-createdAt').limit(20);
  res.json(notifs);
});

app.post('/api/notifications/read', authMiddleware, async (req, res) => {
  await Notification.updateMany({ _id: { $in: req.body.ids } }, { $addToSet: { readBy: req.user._id } });
  res.json({ success: true });
});

app.post('/api/notifications/send', authMiddleware, adminMiddleware, async (req, res) => {
  const notif = await Notification.create({ type: 'manual', message: req.body.message });
  io.emit('new-notification', notif);
  res.json(notif);
});

// ===== LIVE ROUTES =====
let currentLive = null;
app.get('/api/live', authMiddleware, (req, res) => res.json(currentLive));
app.post('/api/live/start', authMiddleware, adminMiddleware, async (req, res) => {
  currentLive = { title: req.body.title, type: req.body.type, startedAt: new Date(), viewers: 0 };
  const notif = await Notification.create({ type: 'live', message: `Live démarré: ${currentLive.title}` });
  io.emit('live-started', currentLive);
  io.emit('new-notification', notif);
  res.json(currentLive);
});
app.post('/api/live/stop', authMiddleware, adminMiddleware, (req, res) => {
  currentLive = null;
  io.emit('live-stopped');
  res.json({ success: true });
});

// ===== SOCKET.IO =====
const liveViewers = new Set();
io.on('connection', (socket) => {
  socket.on('join-live', (userId) => {
    liveViewers.add(userId);
    io.emit('viewers-count', liveViewers.size);
  });
  socket.on('leave-live', (userId) => {
    liveViewers.delete(userId);
    io.emit('viewers-count', liveViewers.size);
  });
  socket.on('live-reaction', (data) => io.emit('live-reaction', data));
  socket.on('live-comment', (data) => io.emit('live-comment', data));
  socket.on('disconnect', () => {
    io.emit('viewers-count', liveViewers.size);
  });
});

// ===== START =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 GLORY Server démarré sur http://localhost:${PORT}`));
