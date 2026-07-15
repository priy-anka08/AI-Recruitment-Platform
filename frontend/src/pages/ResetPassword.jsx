import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.post('https://ai-recruitment-platform-backend-uukb.onrender.com/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.');
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
          <h1 style={{ fontSize: '32px', margin: '0 0 8px' }}>🔑</h1>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#1e3a5f' }}>
            Reset Password
          </h2>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            Enter your new password below
          </p>
        </div>

        {message && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '8px', padding: '12px', marginBottom: '20px',
            color: '#166534', fontSize: '14px',
          }}>
            ✅ {message} Redirecting to login...
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

        {!token && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fed7d7',
            borderRadius: '8px', padding: '12px', marginBottom: '20px',
            color: '#c53030', fontSize: '14px',
          }}>
            ❌ Invalid reset link. Please request a new one.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', marginBottom: '6px',
              fontSize: '14px', fontWeight: '600', color: '#333',
            }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '12px 16px',
                border: '2px solid #e2e8f0', borderRadius: '10px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', marginBottom: '6px',
              fontSize: '14px', fontWeight: '600', color: '#333',
            }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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
            disabled={loading || !token}
            style={{
              width: '100%', padding: '14px',
              background: loading || !token ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '16px', fontWeight: '700',
              cursor: loading || !token ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Resetting...' : '✅ Reset Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#666' }}>
          <Link to="/login" style={{ color: '#667eea', fontWeight: '600' }}>
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;