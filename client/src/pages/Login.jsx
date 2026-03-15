import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = isRegister
  ? `${API_URL}/api/auth/register`
  : `${API_URL}/api/auth/login`;
      const response = await axios.post(url, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: drift 8s ease-in-out infinite alternate;
        }
        .bg-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .bg-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
          bottom: -80px; right: -80px;
          animation-delay: -4s;
        }
        .bg-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(255,99,190,0.10) 0%, transparent 70%);
          top: 50%; left: 60%;
          animation-delay: -2s;
        }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, 20px) scale(1.05); }
        }

        .login-card {
          position: relative;
          z-index: 10;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 48px 44px;
          width: 100%;
          max-width: 420px;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 0 1px rgba(108,99,255,0.1), 0 32px 80px rgba(0,0,0,0.6);
          animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .logo-wrap {
          text-align: center;
          margin-bottom: 32px;
          animation: fadeUp 0.6s 0.1s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 12px;
          box-shadow: 0 8px 32px rgba(108,99,255,0.4);
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,100% { box-shadow: 0 8px 32px rgba(108,99,255,0.4); }
          50% { box-shadow: 0 8px 48px rgba(108,99,255,0.6); }
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .logo-text span {
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          text-align: center;
          margin-bottom: 28px;
          animation: fadeUp 0.6s 0.15s both;
        }

        .error-box {
          background: rgba(255,80,80,0.1);
          border: 1px solid rgba(255,80,80,0.3);
          color: #ff8080;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 20px;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .form-group {
          margin-bottom: 16px;
          animation: fadeUp 0.6s both;
        }
        .form-group:nth-child(1) { animation-delay: 0.2s; }
        .form-group:nth-child(2) { animation-delay: 0.25s; }
        .form-group:nth-child(3) { animation-delay: 0.3s; }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #fff;
          outline: none;
          transition: all 0.25s ease;
        }

        .form-input::placeholder { color: rgba(255,255,255,0.2); }

        .form-input:focus {
          border-color: rgba(108,99,255,0.6);
          background: rgba(108,99,255,0.05);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.12);
        }

        .form-input:hover:not(:focus) {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
        }

        .submit-btn {
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
          margin-top: 8px;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          animation: fadeUp 0.6s 0.35s both;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .submit-btn:hover::before { opacity: 1; }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(108,99,255,0.5);
        }

        .submit-btn:active {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(108,99,255,0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .toggle-text {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          animation: fadeUp 0.6s 0.4s both;
        }

        .toggle-link {
          color: #a78bfa;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s;
          text-decoration: none;
          margin-left: 4px;
        }

        .toggle-link:hover { color: #6c63ff; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          animation: fadeUp 0.6s 0.3s both;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .divider-text {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="login-root">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />

        <div className="login-card">
          <div className="logo-wrap">
            <div className="logo-icon">💬</div>
            <div className="logo-text">CHAT<span>LY</span></div>
          </div>

          <div className="card-title">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </div>

          {error && <div className="error-box">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="toggle-text">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <span className="toggle-link" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Sign in' : 'Sign up'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;