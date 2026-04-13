const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/authmiddleware');
const { streamAIResponse } = require('../services/aiProvider');

// POST: Send message and stream AI response
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, conversationId, provider = 'groq' } = req.body;
    const userId = req.userId;

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    // Call the streaming service (handles Groq or OpenAI)
    await streamAIResponse([{ role: 'user', content: message }], provider, (token) => {
      fullResponse += token;
      res.write(`data: ${token}\n\n`);
    });

    // Save conversation to MongoDB Atlas
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new Error("Conversation not found");
      
      conversation.messages.push(
        { role: 'user', content: message },
        { role: 'assistant', content: fullResponse }
      );
      await conversation.save();
    } else {
      conversation = new Conversation({
        userId,
        title: message.substring(0, 50),
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: fullResponse }
        ],
        provider
      });
      await conversation.save();
    }

    // Signal end of stream and send the conversation ID
    res.write(`data: [DONE]\n\n`);
    res.write(`data: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Chat error:', error.message);
    // If the stream already started, we can't send a JSON error
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error', error: error.message });
    } else {
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    }
  }
});

// GET: Fetch all conversations for the logged-in user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .select('title createdAt provider')
      .sort({ createdAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// GET: Fetch a specific conversation by ID
router.get('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Not found' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

module.exports = router;