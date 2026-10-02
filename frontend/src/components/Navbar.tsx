import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logoPng from '@/assets/logo.png';
import technikaLogoJpg from '@/assets/technika_logo.jpg';
import { Sparkles, Moon, Sun } from 'lucide-react';

export const MAIN_WEBSITE_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8080'
    : 'https://technika2026.online';

export const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleHomeClick = () => {
    window.location.href = MAIN_WEBSITE_URL;
  };

  return (
    <>
      {/* ── FIXED NAVBAR ───────────────────────────────────────────── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: isAdminRoute ? '#eef3f9' : 'var(--brut-yellow, #facc15)',
          borderBottom: isAdminRoute ? '2.5px solid rgba(255, 255, 255, 0.95)' : '3px solid var(--foreground, #000)',
          boxShadow: isAdminRoute ? '0 10px 30px rgba(162, 178, 201, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.9)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        <div
          className="navbar-inner"
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
          }}
        >
          {/* ── Logos ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              flexShrink: 0,
              background: isAdminRoute ? '#f4f8fd' : 'transparent',
              padding: isAdminRoute ? '5px 14px' : '0',
              borderRadius: isAdminRoute ? '16px' : '0',
              boxShadow: isAdminRoute ? 'inset 2px 2px 5px rgba(255, 255, 255, 0.9), inset -2px -2px 5px rgba(162, 178, 201, 0.3)' : 'none',
              border: isAdminRoute ? '1.5px solid rgba(255, 255, 255, 0.85)' : 'none',
            }}
            onClick={() => navigate('/')}
          >
            <img src={logoPng} alt="ARKA JAIN University" className="navbar-brand-logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
            <div
              style={{
                width: '2px',
                height: '24px',
                background: isAdminRoute ? '#94a3b8' : 'var(--foreground, #000)',
                opacity: isAdminRoute ? 0.4 : 0.3,
              }}
              className="hidden-mobile"
            />
            <img
              src={technikaLogoJpg}
              alt="Technika Logo"
              style={{
                height: '38px',
                width: 'auto',
                objectFit: 'contain',
                borderRadius: isAdminRoute ? '10px' : '0',
                border: isAdminRoute ? '2px solid rgba(255, 255, 255, 0.8)' : '2px solid var(--foreground, #000)',
                boxShadow: isAdminRoute ? '3px 4px 10px rgba(162, 178, 201, 0.35)' : '1.5px 1.5px 0px 0px rgba(0,0,0,1)',
              }}
              className="hidden-mobile"
            />
          </div>

          {/* ── Right Actions ── */}
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* 3-Way Theme Switcher (Hidden on Admin pages) */}
            {!isAdminRoute && (
              <div
                className="theme-switcher-group"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--background, #fff)',
                  border: '2px solid var(--foreground, #000)',
                  padding: '2px',
                  gap: '2px',
                }}
              >
                {(['main', 'dark', 'light'] as const).map(t => {
                  const isActive = theme === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className="theme-switch-btn"
                      style={{
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 900,
                        fontFamily: "'Space Grotesk', sans-serif",
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: isActive ? '1px solid #000000' : '1px solid transparent',
                        background: isActive ? 'var(--brut-yellow, #facc15)' : 'transparent',
                        color: isActive ? '#000000' : 'var(--muted-foreground, #888)',
                        boxShadow: isActive ? '1px 1px 0px 0px rgba(0,0,0,1)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      title={`Switch to ${t.toUpperCase()} theme`}
                      aria-label={`${t} theme`}
                    >
                      {t === 'main' && <Sparkles size={13} className="shrink-0" />}
                      {t === 'dark' && <Moon size={13} className="shrink-0" />}
                      {t === 'light' && <Sun size={13} className="shrink-0" />}
                      <span className="theme-text-label">{t.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Brochure button (Hidden on Admin pages) */}
            {!isAdminRoute && (
              <a
                href="/brochure.pdf"
                target="_blank"
                rel="noreferrer"
                className="nav-btn-brochure"
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  fontFamily: "'Space Grotesk', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#000000',
                  background: '#ffffff',
                  border: '2px solid #000000',
                  boxShadow: '2px 2px 0px rgba(0,0,0,1)',
                  textDecoration: 'none',
                  transition: 'all 0.1s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translate(1px, 1px)';
                  el.style.boxShadow = 'none';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'none';
                  el.style.boxShadow = '2px 2px 0px rgba(0,0,0,1)';
                }}
              >
                Brochure
              </a>
            )}

            {/* Home button - Ultra-prominent Neo-Brutalism Home button */}
            <button
              onClick={handleHomeClick}
              className={isAdminRoute ? 'clay-nav-btn' : 'nav-btn-home'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: isAdminRoute ? '8px 18px' : '7px 15px',
                fontSize: '0.78rem',
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isAdminRoute ? '#ffffff' : '#FFE600',
                background: isAdminRoute ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#000000',
                borderRadius: isAdminRoute ? '14px' : '0',
                border: isAdminRoute ? '2px solid rgba(255, 255, 255, 0.7)' : '2.5px solid #000000',
                boxShadow: isAdminRoute
                  ? '4px 6px 14px rgba(37, 99, 235, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.45), inset -2px -2px 4px rgba(15, 23, 42, 0.25)'
                  : '3px 3px 0px 0px rgba(0,0,0,1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                if (isAdminRoute) {
                  el.style.transform = 'translateY(-1px)';
                  el.style.boxShadow = '5px 8px 18px rgba(37, 99, 235, 0.45), inset 2px 2px 4px rgba(255, 255, 255, 0.5), inset -2px -2px 4px rgba(15, 23, 42, 0.25)';
                } else {
                  el.style.transform = 'translate(2px, 2px)';
                  el.style.boxShadow = '1px 1px 0px 0px rgba(0,0,0,1)';
                  el.style.background = '#FFE600';
                  el.style.color = '#000000';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                if (isAdminRoute) {
                  el.style.transform = 'none';
                  el.style.boxShadow = '4px 6px 14px rgba(37, 99, 235, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.45), inset -2px -2px 4px rgba(15, 23, 42, 0.25)';
                } else {
                  el.style.transform = 'none';
                  el.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
                  el.style.background = '#000000';
                  el.style.color = '#FFE600';
                }
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="nav-home-full-text">MAIN WEBSITE</span>
              <span className="nav-home-mobile-text">HOME</span>
            </button>

            {/* Sign Out button (Only on Admin pages, next to Home) */}
            {isAdminRoute && localStorage.getItem('adminToken') && (
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  localStorage.removeItem('adminRole');
                  localStorage.removeItem('adminName');
                  localStorage.removeItem('adminDesignation');
                  navigate('/admin/login');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  fontFamily: "'Space Grotesk', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#dc2626',
                  background: '#fee2e2',
                  borderRadius: '14px',
                  border: '2px solid rgba(239, 68, 68, 0.15)',
                  boxShadow: '4px 6px 14px rgba(239, 68, 68, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(239, 68, 68, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-1px)';
                  el.style.background = '#fecaca';
                  el.style.boxShadow = '5px 8px 18px rgba(239, 68, 68, 0.18), inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(239, 68, 68, 0.12)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'none';
                  el.style.background = '#fee2e2';
                  el.style.boxShadow = '4px 6px 14px rgba(239, 68, 68, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(239, 68, 68, 0.08)';
                }}
              >
                🚪 SIGN OUT
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── SPACER to offset fixed header ─────────────────────────── */}
      <div style={{ height: '64px' }} aria-hidden="true" />

      <style>{`
        .nav-home-mobile-text { display: none !important; }
        .nav-home-full-text { display: inline !important; }

        @media (max-width: 1024px) {
          .desktop-nav-links { display: none !important; }
          .hidden-mobile { display: none !important; }
          .nav-btn-brochure { display: none !important; }
        }

        @media (max-width: 640px) {
          .theme-text-label {
            display: none !important;
          }
          .navbar-inner {
            padding: 6px 10px !important;
          }
          .navbar-brand-logo {
            height: 25px !important;
            max-width: 105px !important;
          }
          .navbar-actions {
            gap: 4px !important;
            flex-shrink: 0 !important;
          }
          .theme-switch-btn {
            padding: 3px 5px !important;
          }
          .nav-btn-home {
            padding: 5px 8px !important;
            font-size: 0.7rem !important;
            gap: 3px !important;
            flex-shrink: 0 !important;
          }
          .nav-home-full-text { display: none !important; }
          .nav-home-mobile-text { display: inline !important; }
        }

        @media (max-width: 380px) {
          .navbar-inner {
            padding: 5px 6px !important;
          }
          .navbar-brand-logo {
            height: 22px !important;
            max-width: 90px !important;
          }
          .navbar-actions {
            gap: 3px !important;
          }
          .theme-switch-btn {
            padding: 2px 3.5px !important;
            font-size: 7.5px !important;
          }
          .nav-btn-home {
            padding: 4px 6px !important;
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </>
  );
};
