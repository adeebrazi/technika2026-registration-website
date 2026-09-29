import React, { useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    { name: 'Participants', path: '/admin/users', icon: '👤', desc: 'View all registrations' },
    { name: 'Teams', path: '/admin/teams', icon: '👥', desc: 'Team formations & rosters' },
  ];

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin': return { bg: '#dbeafe', color: '#2563eb', shadow: 'rgba(37, 99, 235, 0.15)' };
      case 'faculty': return { bg: '#ede9fe', color: '#7c3aed', shadow: 'rgba(124, 58, 237, 0.15)' };
      case 'coordinator': return { bg: '#d1fae5', color: '#059669', shadow: 'rgba(5, 150, 105, 0.15)' };
      default: return { bg: '#dbeafe', color: '#2563eb', shadow: 'rgba(37, 99, 235, 0.15)' };
    }
  };

  const roleBadge = getRoleBadgeColor();

  return (
    <div className="clay-admin-shell">
      {/* ── Background Floating Orbs ── */}
      <div className="clay-bg-orb clay-bg-orb-1" />
      <div className="clay-bg-orb clay-bg-orb-2" />
      <div className="clay-bg-orb clay-bg-orb-3" />

      {/* ── Sidebar ── */}
      <aside className={`clay-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="clay-sidebar-brand">
          <div className="clay-brand-row">
            <div className="clay-brand-logo">
              <span className="clay-brand-t">T</span>
            </div>
            {!sidebarCollapsed && (
              <div className="clay-brand-text">
                <span className="clay-brand-name">TECHNIKA</span>
                <span className="clay-brand-ver">6.0</span>
              </div>
            )}
          </div>
          <button 
            className="clay-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Profile Card */}
        <div className="clay-profile-card">
          <div className="clay-avatar">
            <span className="clay-avatar-initials">{getInitials(name)}</span>
            <span className="clay-avatar-status" />
          </div>
          {!sidebarCollapsed && (
            <div className="clay-profile-info">
              <span className="clay-profile-name">{name}</span>
              <span className="clay-profile-role" style={{ 
                background: roleBadge.bg, 
                color: roleBadge.color,
                boxShadow: `2px 2px 6px ${roleBadge.shadow}, inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 2px ${roleBadge.shadow}`
              }}>
                {designation}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="clay-nav">
          <div className="clay-nav-label">{!sidebarCollapsed && 'NAVIGATION'}</div>
          <ul className="clay-nav-list">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`clay-nav-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <span className="clay-nav-icon">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <div className="clay-nav-text">
                        <span className="clay-nav-name">{item.name}</span>
                        <span className="clay-nav-desc">{item.desc}</span>
                      </div>
                    )}
                    {isActive && !sidebarCollapsed && <span className="clay-nav-active-dot" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="clay-main-content">
        <Outlet />
      </main>

      {/* ── Claymorphism Admin Shell Styles ── */}
      <style>{`
        .clay-admin-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #e6ecf5;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
          position: relative;
          overflow: hidden;
        }

        /* ── Background Orbs ── */
        .clay-bg-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.06));
        }

        .clay-bg-orb-1 {
          width: 300px;
          height: 300px;
          top: -5%;
          right: 5%;
          background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
          box-shadow: 
            inset -12px -12px 24px rgba(99, 102, 241, 0.4),
            inset 12px 12px 24px rgba(255, 255, 255, 0.65);
          animation: floatAdmin 10s ease-in-out infinite alternate;
          opacity: 0.5;
        }

        .clay-bg-orb-2 {
          width: 220px;
          height: 220px;
          bottom: 5%;
          right: 15%;
          background: linear-gradient(135deg, #6ee7b7 0%, #34d399 100%);
          box-shadow: 
            inset -10px -10px 20px rgba(16, 185, 129, 0.4),
            inset 10px 10px 20px rgba(255, 255, 255, 0.65);
          animation: floatAdmin 12s ease-in-out 1s infinite alternate-reverse;
          opacity: 0.4;
        }

        .clay-bg-orb-3 {
          width: 160px;
          height: 160px;
          bottom: 30%;
          left: 40%;
          background: linear-gradient(135deg, #fde047 0%, #eab308 100%);
          box-shadow: 
            inset -8px -8px 16px rgba(202, 138, 4, 0.4),
            inset 8px 8px 16px rgba(255, 255, 255, 0.65);
          animation: floatAdmin 8s ease-in-out 2s infinite alternate;
          opacity: 0.35;
        }

        @keyframes floatAdmin {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(5deg); }
        }

        /* ── Sidebar ── */
        .clay-sidebar {
          width: 270px;
          min-width: 270px;
          background: #eef3f9;
          border-right: 2.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            8px 0 30px rgba(162, 178, 201, 0.2),
            inset -4px 0 12px rgba(162, 178, 201, 0.08),
            inset 4px 0 12px rgba(255, 255, 255, 0.6);
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .clay-sidebar.collapsed {
          width: 76px;
          min-width: 76px;
        }

        /* ── Brand ── */
        .clay-sidebar-brand {
          padding: 1.1rem 1rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .clay-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clay-brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2.5px solid #ffffff;
          box-shadow:
            4px 6px 14px rgba(37, 99, 235, 0.35),
            inset 3px 3px 6px rgba(255, 255, 255, 0.5),
            inset -3px -3px 6px rgba(15, 23, 42, 0.3);
        }

        .clay-brand-t {
          font-weight: 900;
          font-size: 1.15rem;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .clay-brand-text {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .clay-brand-name {
          font-weight: 900;
          font-size: 1.05rem;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .clay-brand-ver {
          font-weight: 900;
          font-size: 0.65rem;
          color: #2563eb;
          background: #dbeafe;
          padding: 1px 6px;
          border-radius: 6px;
          box-shadow:
            inset 1px 1px 2px rgba(255, 255, 255, 0.8),
            inset -1px -1px 2px rgba(37, 99, 235, 0.15),
            2px 2px 4px rgba(37, 99, 235, 0.1);
        }

        .clay-sidebar-toggle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.8);
          background: #e2eaf4;
          color: #475569;
          font-weight: 900;
          font-size: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.3),
            3px 3px 8px rgba(162, 178, 201, 0.25);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .clay-sidebar-toggle:hover {
          background: #dbeafe;
          color: #2563eb;
          transform: scale(1.08);
        }

        /* ── Profile Card ── */
        .clay-profile-card {
          padding: 1rem;
          margin: 0.8rem 0.75rem;
          background: #f4f8fd;
          border-radius: 18px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            6px 8px 18px rgba(162, 178, 201, 0.22),
            -5px -5px 14px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.18);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clay-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2.5px solid #ffffff;
          position: relative;
          box-shadow:
            4px 5px 12px rgba(59, 130, 246, 0.35),
            inset 3px 3px 6px rgba(255, 255, 255, 0.45),
            inset -3px -3px 6px rgba(15, 23, 42, 0.25);
        }

        .clay-avatar-initials {
          font-weight: 900;
          font-size: 0.82rem;
          color: #ffffff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .clay-avatar-status {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2.5px solid #eef3f9;
          box-shadow: 0 2px 4px rgba(34, 197, 94, 0.4);
        }

        .clay-profile-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          overflow: hidden;
        }

        .clay-profile-name {
          font-weight: 800;
          font-size: 0.85rem;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .clay-profile-role {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 8px;
          letter-spacing: 0.02em;
          width: fit-content;
        }

        /* ── Navigation ── */
        .clay-nav {
          flex: 1;
          padding: 0.5rem 0.75rem;
        }

        .clay-nav-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 0.5rem;
        }

        .clay-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .clay-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.7rem 0.85rem;
          border-radius: 14px;
          text-decoration: none;
          color: #475569;
          background: transparent;
          border: 2px solid transparent;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .clay-nav-item:hover {
          background: #f4f8fd;
          color: #1e293b;
          border-color: rgba(255, 255, 255, 0.7);
          box-shadow:
            4px 5px 12px rgba(162, 178, 201, 0.2),
            -3px -3px 8px rgba(255, 255, 255, 0.7),
            inset 1px 1px 3px rgba(255, 255, 255, 0.7),
            inset -1px -1px 3px rgba(162, 178, 201, 0.12);
          transform: translateY(-1px);
        }

        .clay-nav-item.active {
          background: #f4f8fd;
          color: #2563eb;
          border-color: rgba(255, 255, 255, 0.9);
          font-weight: 700;
          box-shadow:
            6px 8px 18px rgba(162, 178, 201, 0.25),
            -5px -5px 14px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.18);
          transform: translateY(-1px);
        }

        .clay-nav-icon {
          font-size: 1.15rem;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
        }

        .clay-nav-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .clay-nav-name {
          font-weight: 700;
          font-size: 0.85rem;
        }

        .clay-nav-desc {
          font-size: 0.62rem;
          color: #94a3b8;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .clay-nav-active-dot {
          position: absolute;
          right: 12px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
        }

        /* ── Footer / Logout ── */
        .clay-sidebar-footer {
          padding: 0.75rem;
          border-top: 2px solid rgba(255, 255, 255, 0.7);
        }

        .clay-logout-btn {
          width: 100%;
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 2px solid rgba(239, 68, 68, 0.15);
          border-radius: 14px;
          background: #fef2f2;
          color: #dc2626;
          font-weight: 800;
          font-size: 0.78rem;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          box-shadow:
            4px 5px 12px rgba(239, 68, 68, 0.1),
            -3px -3px 8px rgba(255, 255, 255, 0.7),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(239, 68, 68, 0.08);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .clay-logout-btn:hover {
          background: #fee2e2;
          transform: translateY(-1px);
          box-shadow:
            6px 7px 16px rgba(239, 68, 68, 0.15),
            -4px -4px 10px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(239, 68, 68, 0.12);
        }

        .clay-logout-icon {
          font-size: 1rem;
        }

        .clay-logout-text {
          font-size: 0.75rem;
        }

        /* ── Main Content ── */
        .clay-main-content {
          flex: 1;
          padding: 1.5rem 2rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        /* ── Scrollbar Styles ── */
        .clay-main-content::-webkit-scrollbar {
          width: 8px;
        }

        .clay-main-content::-webkit-scrollbar-track {
          background: #e6ecf5;
        }

        .clay-main-content::-webkit-scrollbar-thumb {
          background: #c8d5e3;
          border-radius: 10px;
          border: 2px solid #e6ecf5;
        }

        .clay-main-content::-webkit-scrollbar-thumb:hover {
          background: #a2b5c8;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .clay-sidebar {
            width: 76px;
            min-width: 76px;
          }

          .clay-brand-text,
          .clay-profile-info,
          .clay-nav-text,
          .clay-nav-active-dot,
          .clay-nav-label,
          .clay-logout-text,
          .clay-sidebar-toggle {
            display: none !important;
          }

          .clay-main-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};
