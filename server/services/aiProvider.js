const OpenAI = require('openai');
const Groq = require('groq-sdk');

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

const getAIResponse = async (messages, provider = 'groq') => {
  try {
    if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 1000
      });
      return response.choices[0].message.content;

    } else {
      // Groq (default)
      const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: messages,
        max_tokens: 1000
      });
      return response.choices[0].message.content;
    }

  } catch (error) {
    throw new Error(`AI Provider Error: ${error.message}`);
  }
};

const streamAIResponse = async (messages, provider = 'groq', onToken) => {
  try {
    if (provider === 'openai') {
      const stream = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        stream: true,
        max_tokens: 1000
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullResponse += token;
          onToken(token);
        }
      }
      return fullResponse;

    } else {
      // Groq streaming (default)
      const stream = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: messages,
        stream: true,
        max_tokens: 1000
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullResponse += token;
          onToken(token);
        }
      }
      return fullResponse;
    }

  } catch (error) {
    throw new Error(`AI Stream Error: ${error.message}`);
  }
};

module.exports = { getAIResponse, streamAIResponse };
