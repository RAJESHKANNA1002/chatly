const express = require('express');
const router = express.Router();
const axios = require('axios');
const Conversation = require('../models/Conversation');
const Task = require('../models/Task'); 
const authMiddleware = require('../middleware/authmiddleware');
const { streamAIResponse, extractIntent } = require('../services/aiProvider');

/**
 * 1. CORE CHAT & AUTOMATION ENGINE
 * Manages: Streaming AI, MongoDB Persistence, Intent Analysis (Urgency),
 * and triggering the Assignment Panic Flow via Activepieces.
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, conversationId, provider = 'groq' } = req.body;
    console.log("DEBUG: User Email from token:", req.userEmail);
    // SSE Header Configuration
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullAIContent = '';

    // A. STREAM AI GENERATION
    await streamAIResponse([{ role: 'user', content: message }], provider, (token) => {
      fullAIContent += token;
      res.write(`data: ${token}\n\n`);
    });

    // B. SAVE CONVERSATION TO ATLAS
    let conversation = conversationId 
      ? await Conversation.findById(conversationId) 
      : new Conversation({ userId: req.userId, title: message.slice(0, 35), messages: [], provider });
    
    conversation.messages.push(
      { role: 'user', content: message }, 
      { role: 'assistant', content: fullAIContent }
    );
    await conversation.save();

    // C. AGENTIC LOGIC: EXTRACT INTENT & AUTOMATIC URGENCY
    const intent = await extractIntent(message);

    if (intent && intent.action === 'task') {
      // 1. Create Task in MongoDB with AI-assigned urgency
      const newTask = new Task({
        userId: req.userId,
        chatId: req.userChatId,
        email: req.userEmail || "no-email-found@test.com",
        name: intent.name || 'Untitled Task',
        date: intent.date || 'TBD',
        urgency: intent.urgency || 'normal' // Automatically assigned by AI
      });
      await newTask.save();

      // 2. Stream task data back to frontend for real-time sidebar update
      res.write(`data: ${JSON.stringify({ newTask })}\n\n`);

      // 3. Trigger Activepieces "Assignment Panic" Flow
      if (process.env.ACTIVEPIECES_WEBHOOK_URL) {
        axios.post(process.env.ACTIVEPIECES_WEBHOOK_URL, {
          userId: req.userId,
          chatId: req.userChatId,
          email: req.userEmail || "no-email-found@test.com",
          name: newTask.name,
          date: newTask.date,
          urgency: newTask.urgency, // This allows Activepieces to branch/route
          taskId: newTask._id,
          context: "academic_reminder"
        }).catch(() => console.log("Automation Webhook skipped: Connection error."));
      }
    }

    // D. CLOSE STREAM
    res.write(`data: [DONE]\n\n`);
    res.write(`data: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Critical Chat Error:", error);
    res.status(500).end();
  }
});

/**
 * 2. ACADEMIC CONTENT SUMMARIZER
 */
router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Session not found' });

    const recentLogs = conversation.messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = [
      { role: 'system', content: 'Summarize this academic conversation into 3 key takeaways using professional bullet points.' }, 
      { role: 'user', content: recentLogs }
    ];

    let summaryText = '';
    await streamAIResponse(prompt, 'groq', (token) => { summaryText += token; });
    res.json({ summary: summaryText });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

/**
 * 3. SESSION HISTORY
 */
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const list = await Conversation.find({ userId: req.userId })
      .select('title createdAt')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Failed to load history" }); }
});

router.get('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Conversation.findById(req.params.id);
    res.json(session);
  } catch (err) { res.status(500).json({ error: "Failed to load session" }); }
});

/**
 * 4. TASK PERSISTENCE
 */
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: "Tasks unavailable" }); }
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Deletion failed" }); }
});

module.exports = router;