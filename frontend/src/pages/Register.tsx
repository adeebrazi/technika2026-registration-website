import React, { useEffect } from 'react';
import { MAIN_WEBSITE_URL } from '../components/Navbar';

export const OFFICIAL_GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeSEsTz8-w8P47xiPyfjaR8He-bPhE3aG-l_7ds9hkwTRMjCA/viewform?usp=header';

export const Register: React.FC = () => {
  useEffect(() => {
    // Automatically redirect users to the official Google Form after 1.5 seconds
    const timer = setTimeout(() => {
      window.location.href = OFFICIAL_GOOGLE_FORM_URL;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="container"
      style={{
        maxWidth: '720px',
        margin: '12vh auto 8vh auto',
        padding: '0 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '4px solid #000000',
          boxShadow: '8px 8px 0px 0px #000000',
          borderRadius: '16px',
          padding: '48px 32px',
        }}
      >
        {/* Banner badge */}
        <div
          style={{
            display: 'inline-block',
            background: 'var(--brut-pink, #ff6b8b)',
            color: '#000000',
            border: '2.5px solid #000000',
            boxShadow: '3px 3px 0px 0px #000000',
            padding: '6px 16px',
            fontWeight: 900,
            fontSize: '0.82rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '22px',
          }}
        >
          Registration Notice · Technika 6.0
        </div>

        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            lineHeight: 1.15,
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            margin: '0 0 16px 0',
          }}
        >
          REGISTRATIONS HAVE MOVED TO GOOGLE FORM
        </h1>

        <p
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.6,
            color: '#334155',
            margin: '0 0 28px 0',
          }}
        >
          Direct registrations on this portal are permanently closed. All official registrations, event entries, and fee verifications are now conducted exclusively through our official Google Form.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <a
            href={OFFICIAL_GOOGLE_FORM_URL}
            target="_self"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'var(--brut-lime, #ffe600)',
              color: '#000000',
              border: '3px solid #000000',
              boxShadow: '5px 5px 0px 0px #000000',
              padding: '16px 32px',
              fontSize: '1.05rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.02em',
              transition: 'all 0.15s ease',
            }}
          >
            Continue to Official Google Form →
          </a>

          <a
            href={MAIN_WEBSITE_URL}
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#64748b',
              textDecoration: 'underline',
              marginTop: '12px',
            }}
          >
            ← Return to Main Website
          </a>
        </div>
      </div>
    </div>
  );
};
