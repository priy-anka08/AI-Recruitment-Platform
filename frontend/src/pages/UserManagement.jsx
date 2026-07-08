import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      setMessage('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await axios.patch(
        `http://127.0.0.1:8000/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage('Role updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update role.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ marginLeft: '250px', padding: '32px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 8px' }}>
          👥 User Management
        </h1>
        <p style={{ color: '#666', margin: 0 }}>Manage all users and their roles</p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          background: message.includes('success') ? '#f0fdf4' : '#fff5f5',
          border: `1px solid ${message.includes('success') ? '#86efac' : '#fed7d7'}`,
          color: message.includes('success') ? '#166534' : '#c53030',
          fontSize: '14px',
        }}>
          {message.includes('success') ? '✅' : '❌'} {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          ⏳ Loading users...
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #1e3a5f, #2c5364)' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Current Role</th>
                <th style={thStyle}>Change Role</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} style={{
                  borderBottom: '1px solid #f0f0f0',
                  background: index % 2 === 0 ? '#fff' : '#fafafa',
                }}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0,
                      }}>
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '600', color: '#1e3a5f' }}>{user.full_name}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                      fontWeight: '700', color: '#fff',
                      background: ROLE_COLORS[user.role] || '#94a3b8',
                    }}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updating === user.id}
                      style={{
                        padding: '6px 10px', borderRadius: '8px',
                        border: '2px solid #e2e8f0', fontSize: '13px',
                        cursor: 'pointer', outline: 'none',
                        opacity: updating === user.id ? 0.6 : 1,
                      }}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {updating === user.id && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>⏳</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                      fontWeight: '600',
                      background: user.is_active ? '#f0fdf4' : '#fff5f5',
                      color: user.is_active ? '#166534' : '#c53030',
                    }}>
                      {user.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '14px 16px', textAlign: 'left',
  color: '#fff', fontSize: '13px', fontWeight: '600',
};

const tdStyle = {
  padding: '14px 16px', fontSize: '14px', color: '#333',
};

export default UserManagement;