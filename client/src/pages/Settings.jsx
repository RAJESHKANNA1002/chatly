import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [provider, setProvider] = useState(localStorage.getItem('preferredProvider') || 'groq');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    localStorage.setItem('preferredProvider', provider);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .settings-root {
          min-height: 100vh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%);
          top: -80px; right: -80px;
        }
        .orb2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%);
          bottom: -60px; left: -60px;
        }

        .settings-card {
          position: relative;
          z-index: 10;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 480px;
          backdrop-filter: blur(20px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 36px;
        }

        .back-btn {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .back-btn:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.15);
          transform: translateX(-2px);
        }

        .settings-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
        }

        .section {
          margin-bottom: 28px;
          animation: fadeUp 0.5s 0.1s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.3);
          margin-bottom: 12px;
        }

        .provider-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .provider-option {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .provider-option:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }

        .provider-option.selected {
          background: rgba(108,99,255,0.1);
          border-color: rgba(108,99,255,0.35);
        }

        .provider-radio {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .provider-option.selected .provider-radio {
          border-color: #6c63ff;
          background: rgba(108,99,255,0.1);
        }

        .provider-radio-dot {
          width: 8px; height: 8px;
          background: #6c63ff;
          border-radius: 50%;
          opacity: 0;
          transform: scale(0);
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }

        .provider-option.selected .provider-radio-dot {
          opacity: 1;
          transform: scale(1);
        }

        .provider-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .provider-info { flex: 1; }

        .provider-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.85);
          margin-bottom: 2px;
        }

        .provider-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        .provider-badge {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 20px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .badge-fast {
          background: rgba(0,212,100,0.12);
          color: rgba(0,212,100,0.8);
          border: 1px solid rgba(0,212,100,0.2);
        }

        .badge-powerful {
          background: rgba(108,99,255,0.12);
          color: rgba(167,139,250,0.9);
          border: 1px solid rgba(108,99,255,0.2);
        }

        .save-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #6c63ff, #8b84ff);
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          animation: fadeUp 0.5s 0.2s both;
        }

        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(108,99,255,0.45);
        }

        .save-btn:active { transform: translateY(0); }

        .save-btn.saved {
          background: linear-gradient(135deg, #059669, #10b981);
          box-shadow: 0 8px 24px rgba(16,185,129,0.3);
        }

        .checkmark {
          display: inline-block;
          animation: pop 0.3s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes pop {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>

      <div className="settings-root">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />

        <div className="settings-card">
          <div className="settings-header">
            <button className="back-btn" onClick={() => navigate('/chat')}>←</button>
            <span className="settings-title">Settings</span>
          </div>

          <div className="section">
            <div className="section-label">Default AI Provider</div>
            <div className="provider-options">
              <div
                className={`provider-option ${provider === 'groq' ? 'selected' : ''}`}
                onClick={() => setProvider('groq')}
              >
                <div className="provider-radio">
                  <div className="provider-radio-dot" />
                </div>
                <span className="provider-icon">⚡</span>
                <div className="provider-info">
                  <div className="provider-name">Groq</div>
                  <div className="provider-desc">LLaMA 3.3 70B · Ultra-fast inference</div>
                </div>
                <span className="provider-badge badge-fast">Free</span>
              </div>

              <div
                className={`provider-option ${provider === 'openai' ? 'selected' : ''}`}
                onClick={() => setProvider('openai')}
              >
                <div className="provider-radio">
                  <div className="provider-radio-dot" />
                </div>
                <span className="provider-icon">✦</span>
                <div className="provider-info">
                  <div className="provider-name">OpenAI</div>
                  <div className="provider-desc">GPT-3.5 Turbo · High accuracy</div>
                </div>
                <span className="provider-badge badge-powerful">Pro</span>
              </div>
            </div>
          </div>

          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? <span className="checkmark">✓ Saved!</span> : 'Save Settings'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;