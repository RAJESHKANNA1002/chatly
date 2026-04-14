import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks'; // Install this: npm install remark-breaks
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // Change 'esm' to 'cjs'

const Chat = () => {
  // --- State Management ---
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('groq');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState([]); 
  const [botStatus, setBotStatus] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // --- Effects ---
  useEffect(() => {
    if (!token) navigate('/');
    loadConversations();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, botStatus]);

  // --- Task Actions (MongoDB Backed) ---
  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) { console.error("Load Tasks Error", err); }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/api/chat/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) { console.error("Delete Task Error:", err); }
  };

  // --- API Actions ---
  const loadConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) { console.error("Load Conv Error:", err); }
  };

  const loadConversation = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
      setCurrentConvId(id);
    } catch (err) { console.error("Load Single Conv Error:", err); }
  };

  const handleSummarize = async () => {
    if (!currentConvId) return;
    setBotStatus('Summarizing content');
    try {
      const res = await axios.post(`${API_URL}/api/chat/summarize`, 
        { conversationId: currentConvId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `📝 **Academic Summary:**\n\n${res.data.summary}` 
      }]);
    } catch (err) { console.error("Summary failed", err); }
    finally { setBotStatus(''); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput('');
    setLoading(true);
    
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' }
    ]);

    let accumulatedAiResponse = '';

    try {
      const response = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage, conversationId: currentConvId, provider })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') { setLoading(false); break; }

            try {
              const parsed = JSON.parse(data);
              if (parsed.conversationId) { 
                setCurrentConvId(parsed.conversationId); 
                loadConversations(); 
              }
              if (parsed.newTask) {
                setTasks(prev => [parsed.newTask, ...prev]);
                setBotStatus(`Logged: ${parsed.newTask.name}`);
                setTimeout(() => setBotStatus(''), 4000);
              }
            } catch (e) {
              accumulatedAiResponse += data;
              const currentText = accumulatedAiResponse;
              setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                  updated[updated.length - 1].content = currentText;
                }
                return updated;
              });
            }
          }
        }
      }
    } catch (err) { 
      console.error("Fetch Error:", err);
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: '⚠️ Connection lost.' }]);
    } finally { setLoading(false); }
  };

  const newChat = () => { setMessages([]); setCurrentConvId(null); inputRef.current?.focus(); };
  const logout = () => { localStorage.clear(); navigate('/'); };
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="chat-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .chat-root { display: flex; height: 100vh; width: 100vw; background: #0a0a0f; font-family: 'DM Sans', sans-serif; color: #fff; overflow: hidden; }
        
        /* Sidebar */
        .sidebar { width: 280px; height: 100%; background: rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; transition: 0.35s ease; z-index: 20; }
        .sidebar.closed { width: 0; min-width: 0; overflow: hidden; border: none; }
        .conv-section-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.2); }

        /* Main Content Box */
        .main { flex: 1; display: flex; flex-direction: column; height: 100%; min-width: 0; background: #0a0a0f; position: relative; }
        .main-header { height: 64px; min-height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.06); background: rgba(10, 10, 15, 0.8); backdrop-filter: blur(10px); }

        /* Messages */
        .messages-area { flex: 1; overflow-y: auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 20px; scrollbar-width: thin; }
        .msg-bubble { 
  max-width: 85%; 
  padding: 14px 20px; 
  border-radius: 18px; 
  font-size: 14.5px; 
  line-height: 1.6;
  /* ADD THESE TWO LINES */
  white-space: pre-line; 
  word-wrap: break-word;
}

.msg-bubble p {
  margin-bottom: 15px; /* Adds space between paragraphs */
}
        .msg-row.user { justify-content: flex-end; display: flex; }
        .msg-row.assistant { justify-content: flex-start; display: flex; }
        .msg-row.user .msg-bubble { background: linear-gradient(135deg, #6c63ff, #8b84ff); }
        .msg-row.assistant .msg-bubble { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }

        /* Input */
        .input-area { padding: 20px; background: #0a0a0f; border-top: 1px solid rgba(255,255,255,0.06); }
        .input-box { display: flex; gap: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 8px 16px; align-items: center; }
        .text-input { flex: 1; background: transparent; border: none; color: #fff; outline: none; font-size: 14px; height: 40px; }
        .send-btn { background: #6c63ff; border: none; color: #fff; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-weight: 600; }
        
        pre { border-radius: 8px !important; margin: 15px 0 !important; font-size: 13px !important; }
      `}</style>

      {/* Sidebar Section */}
      <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <span style={{ fontFamily: 'Syne', fontWeight: '800', letterSpacing: '2px' }}>CHATLY</span>
          </div>
          <button style={{ background: '#6c63ff', border: 'none', color: '#fff', width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={newChat}>+ New Chat</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px' }}>
          <span className="conv-section-label">Active Tasks</span>
          {tasks.length > 0 && <span onClick={() => setTasks([])} style={{ fontSize: '9px', color: '#ef4444', cursor: 'pointer' }}>CLEAR</span>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {tasks.map((task) => (
            <div key={task._id} className="task-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderLeft: '3px solid #6c63ff', background: 'rgba(255,255,255,0.03)', marginBottom: '8px', borderRadius: '0 8px 8px 0' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                <div style={{ fontSize: '10px', color: '#a78bfa' }}>📅 {task.date}</div>
              </div>
              <button onClick={() => deleteTask(task._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
          ))}
          <div className="conv-section-label" style={{ padding: '20px 10px 10px' }}>Recent History</div>
          {conversations.map(conv => (
            <div key={conv._id} onClick={() => loadConversation(conv._id)} style={{ padding: '10px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', color: currentConvId === conv._id ? '#fff' : 'rgba(255,255,255,0.5)', background: currentConvId === conv._id ? 'rgba(108,99,255,0.1)' : 'transparent' }}>
              {conv.title}
            </div>
          ))}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '35px', height: '35px', background: '#6c63ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{getInitials(user.name)}</div>
          <div style={{ fontSize: '13px', flex: 1 }}>{user.name}</div>
          <button onClick={logout} style={{ fontSize: '11px', opacity: 0.5, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main">
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'Syne' }}>{currentConvId ? 'Active Session' : 'New Interaction'}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentConvId && <button onClick={handleSummarize} style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid #6c63ff', color: '#a78bfa', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>✨ Summarize</button>}
            <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ background: '#1a1a24', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', fontSize: '12px' }}>
              <option value="groq">Llama 3.3 (Groq)</option>
            </select>
          </div>
        </header>

        <div className="messages-area">
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <div style={{ fontSize: '50px' }}>✦</div>
              <h2 style={{ fontFamily: 'Syne' }}>Chatly AI</h2>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`msg-row ${msg.role}`}>
                <div className="msg-bubble">
                  <ReactMarkdown 
  remarkPlugins={[remarkGfm, remarkBreaks]} // Uses remarkBreaks
  components={{
    // Fixes paragraph spacing
    p: ({children}) => <p style={{ marginBottom: '16px', display: 'block' }}>{children}</p>,
    
    // Uses SyntaxHighlighter and vscDarkPlus
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div style={{ position: 'relative', margin: '15px 0' }}>
          <button 
            onClick={() => navigator.clipboard.writeText(String(children))}
            style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
          >
            Copy
          </button>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  }}
>
  {msg.content}
</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {botStatus && (
            <div className="msg-row assistant">
              <div className="msg-bubble" style={{ fontSize: '12px', border: '1px dashed #6c63ff', color: '#a78bfa' }}>
                🤖 Agent: {botStatus}...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-box">
            <input ref={inputRef} className="text-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ask anything..." />
            <button className="send-btn" onClick={sendMessage} disabled={loading}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;