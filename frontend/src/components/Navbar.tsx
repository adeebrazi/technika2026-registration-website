import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logoPng from '@/assets/logo.png';
import technikaLogoJpg from '@/assets/technika_logo.jpg';

export const MAIN_WEBSITE_URL = 'http://localhost:8080';

export const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

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
          background: 'var(--brut-yellow, #facc15)',
          borderBottom: '3px solid var(--foreground, #000)',
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
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/')}
          >
            <img src={logoPng} alt="ARKA JAIN University" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
            <div style={{ width: '2px', height: '24px', background: 'var(--foreground, #000)', opacity: 0.3 }} className="hidden-mobile" />
            <img
              src={technikaLogoJpg}
              alt="Technika Logo"
              style={{
                height: '38px',
                width: 'auto',
                objectFit: 'contain',
                border: '2px solid var(--foreground, #000)',
                boxShadow: '1.5px 1.5px 0px 0px rgba(0,0,0,1)',
              }}
              className="hidden-mobile"
            />
          </div>



          {/* ── Right Actions ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* 3-Way Theme Switcher */}
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
              {(['main', 'dark', 'light'] as const).map(t => (
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
                    border: theme === t ? '1px solid var(--foreground, #000)' : '1px solid transparent',
                    background: theme === t ? 'var(--brut-yellow, #facc15)' : 'transparent',
                    color: theme === t ? 'var(--foreground, #000)' : 'var(--muted-foreground, #888)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Brochure button */}
            <a
              href="https://technika.example.com/brochure.pdf"
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

            {/* Home button */}
            <button
              onClick={handleHomeClick}
              className="nav-btn-register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 16px',
                fontSize: '0.75rem',
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--background, #fff)',
                background: 'var(--foreground, #000)',
                border: '2px solid var(--foreground, #000)',
                boxShadow: '2px 2px 0px rgba(0,0,0,1)',
                cursor: 'pointer',
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
