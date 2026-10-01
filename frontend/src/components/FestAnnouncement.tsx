import React from 'react';

export const FestAnnouncement: React.FC = () => {
  return (
    <div
      style={{
        margin: '0 auto 22px auto',
        width: '100%',
        maxWidth: '100%',
        background: '#FFE600',
        color: '#000000',
        border: '3px solid #000000',
        boxShadow: '4px 4px 0px 0px #000000',
        padding: '10px 16px',
        textAlign: 'center',
        fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxSizing: 'border-box',
      }}
    >
      <span>⚡</span>
      <span>ALL 45 EVENTS COST ₹150 ONLY</span>
      <span>⚡</span>
    </div>
  );
};
