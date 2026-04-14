const OpenAI = require('openai');
const Groq = require('groq-sdk');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * CORE SYSTEM PROMPT
 * Ensures the AI uses Markdown, emojis, and structured points for that "ChatGPT" feel.
 */
const CHATLY_SYSTEM_PROMPT = {
  role: 'system',
  content: `You are Chatly, an academic AI assistant.
  
  STRICT FORMATTING RULES:
  1. ALWAYS use a double line break between paragraphs, headers, and list items.
  2. Use "# Header" for titles and "### Header" for sub-sections.
  3. Use "- " for bullet points and "1. " for numbered lists.
  4. NEVER output a wall of text. 
  5. Use emojis at the start of headers to make them visible.`
};

/**
 * 1. STANDARD RESPONSE (Non-streaming)
 */
const getAIResponse = async (messages, provider = 'groq') => {
  try {
    const isOpenAI = provider === 'openai';
    const model = isOpenAI ? 'gpt-3.5-turbo' : 'llama-3.3-70b-versatile';
    const client = isOpenAI ? openai : groq;
    
    // Inject system prompt for consistent formatting
    const formattedMessages = [CHATLY_SYSTEM_PROMPT, ...messages];

    const response = await client.chat.completions.create({
      model: model,
      messages: formattedMessages,
      max_tokens: 1500,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(`AI Provider Error (${provider}):`, error.message);
    throw new Error(`Failed to get response: ${error.message}`);
  }
};

/**
 * 2. STREAMING RESPONSE
 * Designed for real-time "word-by-word" rendering in the UI.
 */
const streamAIResponse = async (messages, provider = 'groq', onToken) => {
  try {
    const isOpenAI = provider === 'openai';
    const model = isOpenAI ? 'gpt-3.5-turbo' : 'llama-3.3-70b-versatile';
    const client = isOpenAI ? openai : groq;

    const formattedMessages = [CHATLY_SYSTEM_PROMPT, ...messages];

    const stream = await client.chat.completions.create({
      model: model,
      messages: formattedMessages,
      stream: true,
      max_tokens: 2000,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullText += token;
        onToken(token);
      }
    }
    return fullText;
  } catch (error) {
    console.error(`Stream Error (${provider}):`, error.message);
    throw new Error(`Streaming failed: ${error.message}`);
  }
};

/**
 * 3. INTENT EXTRACTION AGENT (Proactive Sidebar)
 * Upgraded to identify specific subjects for better task names.
 */
const extractIntent = async (message) => {
  const agentPrompt = `You are a Task Extraction Agent. 
    Analyze the message: "${message}"

    Return JSON:
    {
      "action": "task",
      "name": "Task Name",
      "date": "Extracted Date",
      "urgency": "high" or "normal" 
    }

    CRITICAL: Set urgency to "high" ONLY if the user mentions:
    - "today", "tonight", "in [X] hours", "urgent", "due now", or "asap".
    Otherwise, set to "normal".
  `;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: agentPrompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    return { action: "none" };
  }
};

module.exports = { getAIResponse, streamAIResponse, extractIntent };