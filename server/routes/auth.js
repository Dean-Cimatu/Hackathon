const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Task    = require('../models/Task');

const router = express.Router();

// ── Auth middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function userPayload(u) {
  return {
    id:             u._id,
    name:           u.name,
    email:          u.email,
    xp:             u.xp,
    level:          u.level,
    streak:         u.streak,
    lastActiveDate: u.lastActiveDate,
    achievements:   u.achievements,
  };
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already registered' });

    await User.create({ name, email, password });
    res.json({ success: true, message: 'Account created! Please log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: makeToken(user._id), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/auth/user — update gamification stats ───────────────────────────
router.put('/user', auth, async (req, res) => {
  try {
    const { xp, level, streak, lastActiveDate, achievements } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { xp, level, streak, lastActiveDate, achievements },
      { new: true }
    );
    res.json({ success: true, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me — get current user ──────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(userPayload(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/seed-demo — seed/reset demo account ───────────────────────
router.get('/seed-demo', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'demo@studybuddy.com' });

    if (user) {
      await Task.deleteMany({ userId: user._id });
      user.xp             = 150;
      user.level          = 2;
      user.streak         = 3;
      user.lastActiveDate = new Date();
      user.achievements   = ['firstTask', 'streak3'];
      // Don't modify password — pre-save hook would re-hash unnecessarily
      await User.findByIdAndUpdate(user._id, {
        xp: 150, level: 2, streak: 3,
        lastActiveDate: new Date(),
        achievements: ['firstTask', 'streak3'],
      });
    } else {
      user = await User.create({
        name: 'Demo User', email: 'demo@studybuddy.com',
        password: 'demo123', xp: 150, level: 2, streak: 3,
        lastActiveDate: new Date(), achievements: ['firstTask', 'streak3'],
      });
    }

    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfter  = new Date(today); dayAfter.setDate(today.getDate() + 2);
    const day3      = new Date(today); day3.setDate(today.getDate() + 3);

    await Task.insertMany([
      { userId: user._id, title: 'Research database normalisation', description: 'Read lecture notes on 1NF, 2NF, and 3NF.',                  estimatedMinutes: 45, day: today,    priority: 'high',   completed: true,  completedAt: new Date(), projectName: 'Databases Project' },
      { userId: user._id, title: 'Sketch initial ER diagram',       description: 'Draft entities, attributes and relationships on paper.',     estimatedMinutes: 50, day: today,    priority: 'high',   completed: true,  completedAt: new Date(), projectName: 'Databases Project' },
      { userId: user._id, title: 'Create ER diagram in draw.io',    description: 'Convert paper sketch to clean digital format.',              estimatedMinutes: 45, day: tomorrow, priority: 'high',   completed: false, projectName: 'Databases Project' },
      { userId: user._id, title: 'Write report introduction',        description: 'Introduce the business scenario and design approach.',       estimatedMinutes: 30, day: dayAfter, priority: 'medium', completed: false, projectName: 'Databases Project' },
      { userId: user._id, title: 'Review normalisation with team',   description: 'Walk through normal forms together and check for errors.',   estimatedMinutes: 40, day: day3,     priority: 'medium', completed: false, projectName: 'Databases Project' },
    ]);

    const freshUser = await User.findOne({ email: 'demo@studybuddy.com' });
    res.json({ token: makeToken(freshUser._id), user: userPayload(freshUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;