import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logoPng from '@/assets/logo.png';
import technikaLogoJpg from '@/assets/technika_logo.jpg';

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
            <img src={logoPng} alt="ARKA JAIN University" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* 3-Way Theme Switcher (Hidden on Admin pages) */}
            {!isAdminRoute && (
              <div
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
                      style={{
                        padding: '2px 8px',
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
                      }}
                    >
                      {t.toUpperCase()}
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
                  color: 'var(--foreground, #000)',
                  background: 'var(--background, #fff)',
                  border: '2px solid var(--foreground, #000)',
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

            {/* Home button */}
            <button
              onClick={handleHomeClick}
              className={isAdminRoute ? 'clay-nav-btn' : 'nav-btn-register'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: isAdminRoute ? '8px 18px' : '6px 16px',
                fontSize: '0.75rem',
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#ffffff',
                background: isAdminRoute ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'var(--foreground, #000)',
                borderRadius: isAdminRoute ? '14px' : '0',
                border: isAdminRoute ? '2px solid rgba(255, 255, 255, 0.7)' : '2px solid var(--foreground, #000)',
                boxShadow: isAdminRoute
                  ? '4px 6px 14px rgba(37, 99, 235, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.45), inset -2px -2px 4px rgba(15, 23, 42, 0.25)'
                  : '2px 2px 0px rgba(0,0,0,1)',
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
                  el.style.transform = 'translate(1px, 1px)';
                  el.style.boxShadow = 'none';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                if (isAdminRoute) {
                  el.style.transform = 'none';
                  el.style.boxShadow = '4px 6px 14px rgba(37, 99, 235, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.45), inset -2px -2px 4px rgba(15, 23, 42, 0.25)';
                } else {
                  el.style.transform = 'none';
                  el.style.boxShadow = '2px 2px 0px rgba(0,0,0,1)';
                }
              }}
            >
              HOME →
            </button>
          </div>
        </div>
      </header>

      {/* ── SPACER to offset fixed header ─────────────────────────── */}
      <div style={{ height: '64px' }} aria-hidden="true" />

      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav-links { display: none !important; }
          .hidden-mobile { display: none !important; }
          .nav-btn-brochure { display: none !important; }
        }
      `}</style>
    </>
  );
};
