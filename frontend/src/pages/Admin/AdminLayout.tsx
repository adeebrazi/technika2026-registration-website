import React from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('adminToken');
  const role = localStorage.getItem('adminRole');
  const name = localStorage.getItem('adminName') || 'Administrator';
  const designation = localStorage.getItem('adminDesignation') || (role === 'admin' ? 'Administration' : 'Coordinator');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminDesignation');
    navigate('/admin/login');
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const navItems = [
    { name: 'Participants', path: '/admin/users', icon: '👤' },
    { name: 'Teams', path: '/admin/teams', icon: '👥' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(ellipse at bottom, #111827 0%, #030712 100%)',
      fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background neon glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'rgba(168, 85, 247, 0.1)',
        borderRadius: '50%',
        filter: 'blur(120px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '10%',
        width: '350px',
        height: '350px',
        background: 'rgba(60, 230, 252, 0.08)',
        borderRadius: '50%',
        filter: 'blur(110px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', margin: 0, letterSpacing: '-0.02em', textShadow: '0 0 10px rgba(60, 230, 252, 0.2)' }}>
              TECHNIKA 6.0
            </h1>
            <span style={{ fontSize: '0.62rem', background: 'rgba(60, 230, 252, 0.15)', color: '#3ce6fc', padding: '2px 7px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
              ADMIN
            </span>
          </div>

          {/* User Profile Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3ce6fc 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.85rem',
              color: '#000000',
              flexShrink: 0
            }}>
              {getInitials(name)}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {name}
              </div>
              <div style={{
                color: '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                {designation}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                      padding: '0.8rem 1.2rem',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: '#ffffff',
                      background: isActive ? 'linear-gradient(135deg, rgba(60, 230, 252, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'transparent',
                      border: isActive ? '1px solid rgba(60, 230, 252, 0.3)' : '1px solid transparent',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 4px 15px rgba(60, 230, 252, 0.1)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              letterSpacing: '0.03em',
              transition: 'all 0.2s'
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};
