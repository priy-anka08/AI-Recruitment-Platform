import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/jobs', icon: '💼', label: 'Jobs' },
    { path: '/candidates', icon: '👥', label: 'Candidates' },
    { path: '/resume-upload', icon: '📄', label: 'Resume Screening' },
    { path: '/interviews', icon: '📅', label: 'Interviews' },
    { path: '/projects', icon: '📋', label: 'Projects' },
    { path: '/analytics', icon: '📊', label: 'Analytics' },
  ];

  return (
    <div style={{
      width: '250px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2027 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{
          color: '#fff',
          margin: 0,
          fontSize: '18px',
          fontWeight: '700',
        }}>🤖 AI Recruitment</h2>
        <p style={{ color: '#8ab4d4', fontSize: '12px', margin: '4px 0 0' }}>
          B2World Platform
        </p>
      </div>

      {/* User Info */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: '700',
          fontSize: '14px',
        }}>
          {(user?.full_name || user?.email)?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <p style={{ color: '#fff', margin: 0, fontSize: '13px', fontWeight: '600' }}>
            {user?.full_name || user?.email?.split('@')[0] || 'User'}
          </p>
          <p style={{ color: '#8ab4d4', margin: 0, fontSize: '11px' }}>
            {user?.role || 'HR Manager'}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              color: isActive ? '#fff' : '#8ab4d4',
              textDecoration: 'none',
              background: isActive
                ? 'linear-gradient(90deg, rgba(102,126,234,0.3), transparent)'
                : 'transparent',
              borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              transition: 'all 0.2s',
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,99,99,0.2)',
            border: '1px solid rgba(255,99,99,0.3)',
            borderRadius: '8px',
            color: '#ff6b6b',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;