import React from 'react';

export const FestAnnouncement: React.FC = () => {
  return (
    <div
      className="fest-announcement-banner"
      style={{
        margin: '0 auto 16px auto',
        width: '100%',
        maxWidth: '100%',
        background: '#FFE600',
        color: '#000000',
        border: '3px solid #000000',
        boxShadow: '4px 4px 0px 0px #000000',
        padding: '8px 12px',
        textAlign: 'center',
        fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(0.75rem, 3.4vw, 1rem)',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        boxSizing: 'border-box',
        lineHeight: 1.3,
      }}
    >
      <span className="shrink-0">⚡</span>
      <span className="text-center">REGISTRATION FEE FOR ALL EVENTS : ₹150 ONLY</span>
      <span className="shrink-0">⚡</span>
    </div>
  );
};
