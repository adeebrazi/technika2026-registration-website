import React from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export const AdminLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  const token = localStorage.getItem('adminToken');
  const role = localStorage.getItem('adminRole');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Participants', path: '/admin/users', icon: '👤' },
    { name: 'Teams', path: '/admin/teams', icon: '👥' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: isDark ? '#111827' : '#f3f4f6' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isDark ? '#f9fafb' : '#111827', margin: 0 }}>
            Admin Portal
          </h1>
          <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
            Role: {role}
          </span>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: isActive ? (isDark ? '#ffffff' : '#4f46e5') : (isDark ? '#d1d5db' : '#4b5563'),
                      backgroundColor: isActive ? (isDark ? '#374151' : '#e0e7ff') : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ padding: '1rem', borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginBottom: '0.5rem',
              backgroundColor: 'transparent',
              border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
              color: isDark ? '#f9fafb' : '#111827',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};
