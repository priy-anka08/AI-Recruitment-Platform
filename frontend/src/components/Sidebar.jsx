import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Dashboard', roles: null },
    { path: '/jobs', icon: '💼', label: 'Jobs', roles: ['super_admin', 'hr_manager', 'recruiter'] },
    { path: '/candidates', icon: '👥', label: 'Candidates', roles: ['super_admin', 'hr_manager', 'recruiter'] },
    { path: '/resume-upload', icon: '📄', label: 'Resume Screening', roles: ['super_admin', 'hr_manager', 'recruiter'] },
    { path: '/interviews', icon: '📅', label: 'Interviews', roles: ['super_admin', 'hr_manager', 'recruiter'] },
    { path: '/projects', icon: '📋', label: 'Projects', roles: ['super_admin', 'project_manager', 'team_lead', 'developer'] },
    { path: '/analytics', icon: '📊', label: 'Analytics', roles: ['super_admin', 'hr_manager', 'project_manager', 'team_lead'] },
    { path: '/user-management', icon: '⚙️', label: 'User Management', roles: ['super_admin'] },
    { path: '/profile', icon: '👤', label: 'My Profile', roles: null },
  ];

  const visibleItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const roleLabel = ROLE_LABELS[user?.role] || user?.role || 'User';
  const roleColor = ROLE_COLORS[user?.role] || '#8ab4d4';

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
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: '700' }}>
          🤖 AI Recruitment
        </h2>
        <p style={{ color: '#8ab4d4', fontSize: '12px', margin: '4px 0 0' }}>
          B2World Platform
        </p>
      </div>

      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0,
        }}>
          {(user?.full_name || user?.email)?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            color: '#fff', margin: 0, fontSize: '13px', fontWeight: '600',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.full_name || user?.email?.split('@')[0] || 'User'}
          </p>
          <span style={{
            display: 'inline-block', marginTop: '4px', padding: '2px 8px',
            borderRadius: '10px', fontSize: '10px', fontWeight: '700',
            color: '#fff', background: roleColor, letterSpacing: '0.3px',
          }}>
            {roleLabel}
          </span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 20px',
              color: isActive ? '#fff' : '#8ab4d4',
              textDecoration: 'none',
              background: isActive ? 'linear-gradient(90deg, rgba(102,126,234,0.3), transparent)' : 'transparent',
              borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
              fontSize: '14px', fontWeight: isActive ? '600' : '400',
              transition: 'all 0.2s',
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '10px',
            background: 'rgba(255,99,99,0.2)',
            border: '1px solid rgba(255,99,99,0.3)',
            borderRadius: '8px', color: '#ff6b6b',
            cursor: 'pointer', fontSize: '14px', fontWeight: '600',
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;