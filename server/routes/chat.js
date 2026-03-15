const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/authmiddleware');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, conversationId, provider = 'groq' } = req.body;
    const userId = req.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullResponse += token;
        res.write(`data: ${token}\n\n`);
      }
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
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

    res.write(`data: [DONE]\n\n`);
    res.write(`data: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);
    res.end();

  } catch (error) {
    console.log('Chat error:', error.message);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

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

router.get('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

module.exports = router;