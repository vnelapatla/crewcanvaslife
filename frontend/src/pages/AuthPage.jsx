import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github } from 'lucide-react';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (isLogin) {
          localStorage.setItem('userId', data.id);
          localStorage.setItem('userEmail', data.email);
          localStorage.setItem('userName', data.name);
          setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
          setTimeout(() => window.location.href = '/', 1500); // Redirect to React Home
        } else {
          setMessage({ text: 'Account created! Please sign in.', type: 'success' });
          setTimeout(() => setIsLogin(true), 2000);
        }
      } else {
        const errorText = await response.text();
        setMessage({ text: errorText || 'Action failed. Please try again.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Connection error. Is the server running?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <div className="logo-container">
            <h1 className="logo-text">CrewCanvas</h1>
            <p className="logo-subtitle">Where all crafts connect</p>
          </div>
        </div>

        <div className="tab-switcher">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name"
                placeholder="Enter your name" 
                value={formData.name}
                onChange={handleInputChange}
                required 
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              placeholder="Enter your email" 
              value={formData.email}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              placeholder="Enter your password" 
              value={formData.password}
              onChange={handleInputChange}
              required 
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="Confirm your password" 
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required 
              />
            </div>
          )}

          {isLogin && (
            <div className="forgot-password">
              <a href="#forgot">Forgot password?</a>
            </div>
          )}

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="social-section">
          <div className="divider"><span>Or login with</span></div>
          <button className="social-btn-google">
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" />
          </button>
        </div>
      </div>
    </div>

  );
};

export default AuthPage;
