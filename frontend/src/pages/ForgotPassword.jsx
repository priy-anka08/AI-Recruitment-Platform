import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.post('http://127.0.0.1:8000/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', margin: '0 0 8px' }}>🔐</h1>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#1e3a5f' }}>
            Forgot Password
          </h2>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {message && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '8px', padding: '12px', marginBottom: '20px',
            color: '#166534', fontSize: '14px',
          }}>
            ✅ {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fed7d7',
            borderRadius: '8px', padding: '12px', marginBottom: '20px',
            color: '#c53030', fontSize: '14px',
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', marginBottom: '6px',
              fontSize: '14px', fontWeight: '600', color: '#333',
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '12px 16px',
                border: '2px solid #e2e8f0', borderRadius: '10px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '16px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#666' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: '#667eea', fontWeight: '600' }}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;