import { useState } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api';

export default function LoginButton({ user, onAuthChange }) {
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await apiLogin(username, password);
      onAuthChange(loggedInUser);
      setShowModal(false);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiLogout();
    onAuthChange(null);
  };

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Rajdhani, sans-serif', fontSize: '13px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff6a', display: 'inline-block', boxShadow: '0 0 6px rgba(0,255,106,0.5)' }} />
        <span style={{ color: '#ccc', fontWeight: 600 }}>{user}</span>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: '#666', fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{ background: 'none', border: 'none', color: '#666', fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', cursor: 'pointer', padding: '4px 8px', letterSpacing: '1px' }}
      >
        Login
      </button>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleLogin}
            style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '6px', padding: '32px', width: '320px', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)' }} />
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontWeight: 700, color: '#00ff6a', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px', textAlign: 'center' }}>
              Login
            </div>

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '10px 14px', marginBottom: '12px', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '3px', color: '#f0f0f0', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', marginBottom: '16px', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '3px', color: '#f0f0f0', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />

            {error && (
              <div style={{ color: '#ff3b3b', fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '10px', background: loading ? '#1e1e1e' : '#00ff6a', border: 'none', borderRadius: '3px', color: '#0a0a0a', fontFamily: 'Orbitron, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
