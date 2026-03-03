const express = require('express');
const jwt     = require('jsonwebtoken');
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

// ── GET /api/tasks ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ day: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/tasks — accepts single or array ────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const docs = data.map(t => ({ ...t, userId: req.userId }));
    const created = await Task.insertMany(docs);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/tasks/completed — MUST be before /:id ───────────────────────
router.delete('/completed', auth, async (req, res) => {
  try {
    const result = await Task.deleteMany({ userId: req.userId, completed: true });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/tasks/:id ───────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;