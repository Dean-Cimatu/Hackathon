const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:            { type: String, required: true, trim: true },
  description:      { type: String, default: '' },
  estimatedMinutes: { type: Number, default: 30 },
  day:              { type: Date, required: true },
  priority:         { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  completed:        { type: Boolean, default: false },
  completedAt:      { type: Date, default: null },
  projectName:      { type: String, default: '' },
  createdAt:        { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
