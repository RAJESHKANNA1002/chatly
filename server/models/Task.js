const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { 
    type: String, 
    required: true // Added this to store the user's email
  },
  name: { type: String, required: true },
  date: { type: String },
  telegramChatId: { type: String },
  urgency: { type: String, default: 'normal' }, // ADD THIS LINE
  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Task', TaskSchema);