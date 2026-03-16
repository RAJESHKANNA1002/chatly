import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('groq');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

useEffect(() => {
  if (!token) navigate('/');
  loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) { console.log(err); }
  };

  const loadConversation = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
      setCurrentConvId(id);
    } catch (err) { console.log(err); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('http://localhost:5000/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage, conversationId: currentConvId, provider })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.conversationId) { setCurrentConvId(parsed.conversationId); loadConversations(); }
          } catch {
  // eslint-disable-next-line no-loop-func
  const currentResponse = aiResponse + data;
  aiResponse = currentResponse;
  setMessages(prev => {
    const updated = [...prev];
    updated[updated.length - 1].content = currentResponse;
    return updated;
  });
}
          }
        }
      }
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const newChat = () => { setMessages([]); setCurrentConvId(null); inputRef.current?.focus(); };
  const logout = () => { localStorage.clear(); navigate('/'); };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-root {
          display: flex;
          height: 100vh;
          background: #0a0a0f;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          overflow: hidden;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 280px;
          min-width: 280px;
          background: rgba(255,255,255,0.02);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
          position: relative;
          z-index: 20;
        }

        .sidebar.closed {
          width: 0;
          min-width: 0;
          overflow: hidden;
          border: none;
        }

        .sidebar-header {
          padding: 14px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .logo-dot {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 16px rgba(108,99,255,0.4);
          flex-shrink: 0;
        }

        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: 3px;
        }

        .new-chat-btn {
          width: 100%;
          padding: 11px;
          background: rgba(108,99,255,0.12);
          border: 1px solid rgba(108,99,255,0.25);
          border-radius: 10px;
          color: #a78bfa;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .new-chat-btn:hover {
          background: rgba(108,99,255,0.2);
          border-color: rgba(108,99,255,0.5);
          color: #c4b5fd;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(108,99,255,0.2);
        }

        .new-chat-btn:active { transform: translateY(0); }

        .conv-section-label {
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.2);
          padding: 16px 20px 8px;
        }

        .conv-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }

        .conv-list::-webkit-scrollbar { width: 4px; }
        .conv-list::-webkit-scrollbar-track { background: transparent; }
        .conv-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        .conv-item {
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          margin-bottom: 2px;
          transition: all 0.18s ease;
          border: 1px solid transparent;
        }

        .conv-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.06);
        }

        .conv-item.active {
          background: rgba(108,99,255,0.12);
          border-color: rgba(108,99,255,0.2);
        }

        .conv-title {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 3px;
        }

        .conv-item.active .conv-title { color: #c4b5fd; }

        .conv-date {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(108,99,255,0.3);
        }

        .user-name {
          flex: 1;
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .logout-btn {
          padding: 6px 10px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .logout-btn:hover {
          border-color: rgba(255,80,80,0.3);
          color: rgba(255,100,100,0.8);
          background: rgba(255,80,80,0.05);
        }

        /* ── MAIN ── */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
        }

        .main-header {
          padding: 0 20px;
          height: 56px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .toggle-sidebar-btn {
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .toggle-sidebar-btn:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
        }

        .header-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
        }

        .provider-select {
          padding: 8px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: rgba(255,255,255,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
          appearance: none;
          padding-right: 28px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }

        .provider-select:hover {
          border-color: rgba(108,99,255,0.3);
          background-color: rgba(108,99,255,0.05);
        }

        .provider-select option { background: #1a1a2e; }

        /* ── MESSAGES ── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
        }

        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }

        .welcome-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 40px;
          animation: fadeUp 0.6s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .welcome-icon {
          font-size: 48px;
          margin-bottom: 20px;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .welcome-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          margin-bottom: 10px;
        }

        .welcome-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.3);
          max-width: 320px;
          line-height: 1.6;
        }

        .msg-row {
          display: flex;
          animation: msgIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-row.user { justify-content: flex-end; }
        .msg-row.assistant { justify-content: flex-start; }

        .msg-bubble {
          max-width: 68%;
          padding: 13px 18px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.65;
          transition: box-shadow 0.2s;
        }

        .msg-bubble:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .msg-row.user .msg-bubble {
          background: linear-gradient(135deg, #6c63ff, #8b84ff);
          color: white;
          border-bottom-right-radius: 6px;
          box-shadow: 0 4px 16px rgba(108,99,255,0.3);
        }

        .msg-row.assistant .msg-bubble {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.88);
          border-bottom-left-radius: 6px;
        }

        .typing-indicator {
          display: flex;
          gap: 5px;
          align-items: center;
          padding: 4px 0;
        }

        .typing-dot {
          width: 7px; height: 7px;
          background: rgba(255,255,255,0.4);
          border-radius: 50%;
          animation: typingBounce 1.2s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        /* ── INPUT ── */
        .input-area {
          padding: 12px 20px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .input-box {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 10px 10px 10px 18px;
          transition: all 0.25s ease;
        }

        .input-box:focus-within {
          border-color: rgba(108,99,255,0.4);
          background: rgba(108,99,255,0.04);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.08);
        }

        .text-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: rgba(255,255,255,0.9);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          resize: none;
          min-height: 22px;
          max-height: 120px;
          line-height: 1.5;
          padding: 2px 0;
        }

        .text-input::placeholder { color: rgba(255,255,255,0.2); }

        .send-btn {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #6c63ff, #8b84ff);
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(108,99,255,0.3);
        }

        .send-btn:hover {
          transform: translateY(-1px) scale(1.05);
          box-shadow: 0 6px 20px rgba(108,99,255,0.5);
        }

        .send-btn:active { transform: scale(0.96); }

        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .send-btn svg { width: 16px; height: 16px; }

        .input-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.15);
          text-align: center;
          margin-top: 8px;
        }
          .text-input {
          padding-bottom: 9px;
      }
      `}</style>

      <div className="chat-root">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
          <div className="sidebar-header">
            <div className="logo-row">
              <div className="logo-dot">💬</div>
              <span className="logo-name">CHATLY</span>
            </div>
            <button className="new-chat-btn" onClick={newChat}>
              <span>+</span> New Chat
            </button>
          </div>

          {conversations.length > 0 && (
            <div className="conv-section-label">Recent</div>
          )}

          <div className="conv-list">
            {conversations.map(conv => (
              <div
                key={conv._id}
                className={`conv-item ${currentConvId === conv._id ? 'active' : ''}`}
                onClick={() => loadConversation(conv._id)}
              >
                <div className="conv-title">{conv.title}</div>
                <div className="conv-date">{new Date(conv.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <span className="user-name">{user.name}</span>
            <button className="logout-btn" onClick={logout}>Out</button>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="main-header">
            <div className="header-left">
              <button className="toggle-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
              </button>
              <span className="header-title">
                {currentConvId ? 'Conversation' : 'New Chat'}
              </span>
            </div>
            <select
              className="provider-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="groq">⚡ Groq (Fast)</option>
              <option value="openai">✦ OpenAI</option>
            </select>
          </div>

          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                <div className="welcome-icon">✦</div>
                <div className="welcome-title">How can I help?</div>
                <div className="welcome-sub">Ask me anything — I'm powered by state-of-the-art AI</div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.role}`}>
                  <div className="msg-bubble">
                    {msg.role === 'assistant' && !msg.content && loading && i === messages.length - 1 ? (
                      <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-box">
              <input
              
                ref={inputRef}
                className="text-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Message CHATLY..."
                disabled={loading}
              />
              <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;