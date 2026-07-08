import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { token, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ full_name: '', email: '' });

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setFormData({ full_name: res.data.full_name, email: res.data.email });
    } catch (err) {
      setMessage('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.patch('http://127.0.0.1:8000/users/me', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      login(res.data, token);
      setEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage('New passwords do not match!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (passwordData.new_password.length < 6) {
      setMessage('New password must be at least 6 characters!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSavingPassword(true);
    try {
      await axios.patch('http://127.0.0.1:8000/users/me/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Password changed successfully!');
      setChangingPassword(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to change password.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSavingPassword(false);
    }
  };

  const ROLE_LABELS = {
    super_admin: 'Super Admin',
    hr_manager: 'HR Manager',
    recruiter: 'Recruiter',
    project_manager: 'Project Manager',
    team_lead: 'Team Lead',
    developer: 'Developer',
    candidate: 'Candidate',
  };

  const ROLE_COLORS = {
    super_admin: '#f59e0b',
    hr_manager: '#667eea',
    recruiter: '#10b981',
    project_manager: '#ec4899',
    team_lead: '#8b5cf6',
    developer: '#06b6d4',
    candidate: '#94a3b8',
  };

  if (loading) return (
    <div style={{ marginLeft: '250px', padding: '32px' }}>
      ⏳ Loading profile...
    </div>
  );

  return (
    <div style={{ marginLeft: '250px', padding: '32px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 8px' }}>
          👤 My Profile
        </h1>
        <p style={{ color: '#666', margin: 0 }}>View and manage your profile information</p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '24px',
          background: message.includes('success') ? '#f0fdf4' : '#fff5f5',
          border: `1px solid ${message.includes('success') ? '#86efac' : '#fed7d7'}`,
          color: message.includes('success') ? '#166534' : '#c53030',
          fontSize: '14px',
        }}>
          {message.includes('success') ? '✅' : '❌'} {message}
        </div>
      )}

      <div style={{ maxWidth: '600px' }}>
        {/* Avatar Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #2c5364)',
          borderRadius: '16px', padding: '32px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '24px',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '700', fontSize: '32px', flexShrink: 0,
          }}>
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: '22px', fontWeight: '700' }}>
              {profile?.full_name}
            </h2>
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: '12px',
              fontSize: '12px', fontWeight: '700', color: '#fff',
              background: ROLE_COLORS[profile?.role] || '#94a3b8',
            }}>
              {ROLE_LABELS[profile?.role] || profile?.role}
            </span>
          </div>
        </div>

        {/* Profile Info Card */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '32px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3a5f' }}>
              Profile Information
            </h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none', color: '#fff', fontWeight: '600',
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                ✏️ Edit
              </button>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
              Full Name
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '2px solid #667eea', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: '15px', color: '#1e3a5f', fontWeight: '600' }}>
                {profile?.full_name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
              Email Address
            </label>
            {editing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '2px solid #667eea', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: '15px', color: '#1e3a5f', fontWeight: '600' }}>
                {profile?.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
              Role
            </label>
            <p style={{ margin: 0, fontSize: '15px', color: '#1e3a5f', fontWeight: '600' }}>
              {ROLE_LABELS[profile?.role] || profile?.role}
              <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px', fontWeight: '400' }}>
                (cannot be changed here)
              </span>
            </p>
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none', color: '#fff', fontWeight: '600',
                  fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '⏳ Saving...' : '✅ Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({ full_name: profile.full_name, email: profile.email });
                }}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  color: '#666', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                }}
              >
                ❌ Cancel
              </button>
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: changingPassword ? '24px' : '0' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3a5f' }}>
              🔒 Change Password
            </h3>
            {!changingPassword && (
              <button
                onClick={() => setChangingPassword(true)}
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none', color: '#fff', fontWeight: '600',
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                🔑 Change
              </button>
            )}
          </div>

          {changingPassword && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '2px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '2px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '2px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handlePasswordChange}
                  disabled={savingPassword}
                  style={{
                    padding: '10px 24px', borderRadius: '8px',
                    background: savingPassword ? '#ccc' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    border: 'none', color: '#fff', fontWeight: '600',
                    fontSize: '14px', cursor: savingPassword ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingPassword ? '⏳ Saving...' : '🔒 Update Password'}
                </button>
                <button
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                  }}
                  style={{
                    padding: '10px 24px', borderRadius: '8px',
                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                    color: '#666', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;