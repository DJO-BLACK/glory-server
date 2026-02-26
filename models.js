// ============================================
// GLORY – Modèles MongoDB (models.js)
// ============================================
const mongoose = require('mongoose');

// ====== UTILISATEUR ======
const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true },
  country:      { type: String, default: '' },
  role:         { type: String, enum: ['member', 'admin', 'subadmin'], default: 'member' },
  avatar:       { type: String, default: '' },   // URL de la photo
  bio:          { type: String, default: '' },
  suspended:    { type: Boolean, default: false },
  suspendedReason: { type: String, default: '' },
  restoreDate:  { type: Date, default: null },
  joinedAt:     { type: Date, default: Date.now }
}, { timestamps: true });

// ====== POST ======
const PostSchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, default: 'Message' },  // Message, Prière, etc.
  postType:  { type: String, enum: ['texte','photo','video'], default: 'texte' },
  title:     { type: String, default: '' },
  content:   { type: String, default: '' },
  mediaUrl:  { type: String, default: '' },         // URL du média uploadé
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:  [{
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:    String,
    role:    String,
    text:    String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// ====== MESSAGE ======
const MessageSchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      String,
  role:      String,
  text:      { type: String, default: '' },
  audioUrl:  { type: String, default: '' },  // URL audio si message vocal
  duration:  { type: Number, default: 0 },
  type:      { type: String, enum: ['text','audio'], default: 'text' },
  conv:      { type: String, enum: ['general','admin'], default: 'general' },
  reactions: { type: Map, of: [String], default: {} }
}, { timestamps: true });

// ====== ÉVÉNEMENT ======
const EventSchema = new mongoose.Schema({
  type:         { type: String, default: 'Culte' },
  title:        { type: String, required: true },
  date:         { type: String, required: true },
  time:         { type: String, default: '' },
  lieu:         { type: String, default: '' },
  description:  { type: String, default: '' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// ====== SONDAGE ======
const PollSchema = new mongoose.Schema({
  question:   { type: String, required: true },
  options:    [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  expiresAt:  { type: Date, default: null },
  closed:     { type: Boolean, default: false }
}, { timestamps: true });

// ====== NOTIFICATION ======
const NotifSchema = new mongoose.Schema({
  type:    { type: String, default: 'post' },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  url:     { type: String, default: '/' },
  readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = {
  User:         mongoose.model('User', UserSchema),
  Post:         mongoose.model('Post', PostSchema),
  Message:      mongoose.model('Message', MessageSchema),
  Event:        mongoose.model('Event', EventSchema),
  Poll:         mongoose.model('Poll', PollSchema),
  Notification: mongoose.model('Notification', NotifSchema)
};
