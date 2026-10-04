import React, { useState, useEffect, useRef } from 'react';

interface PinScreenProps {
  onSuccess: (token: string) => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({ onSuccess }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    if (error) setError('');
    
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    
    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 4 digits are filled
    if (value && index === 3) {
      const pin = next.join('');
      if (pin.length === 4) {
        submitPin(pin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const next = pasted.split('');
      setDigits(next);
      inputRefs.current[3]?.focus();
      submitPin(pasted);
    }
  };

  const submitPin = async (pin: string) => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/dashboard-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => onSuccess(data.token), 800);
      } else {
        setError(data.message || 'Invalid PIN');
        setDigits(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pin-scene ${success ? 'pin-scene--success' : ''}`}>
      {/* Animated mesh gradient background */}
      <div className="pin-bg">
        <div className="pin-orb pin-orb--1" />
        <div className="pin-orb pin-orb--2" />
        <div className="pin-orb pin-orb--3" />
        <div className="pin-orb pin-orb--4" />
        <div className="pin-grid-overlay" />
      </div>

      {/* Floating particles */}
      <div className="pin-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="pin-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>

      {/* Glass card */}
      <div className={`pin-card ${shake ? 'pin-card--shake' : ''}`}>
        {/* Logo */}
        <div className="pin-logo-wrap">
          <div className="pin-logo-glow" />
          <img src="/technika_logo.jpg" alt="Technika 6.0" className="pin-logo-img" />
        </div>

        {/* Heading */}
        <h1 className="pin-heading">
          <span className="pin-heading-sub">TECHNIKA 6.0</span>
          Dashboard Access
        </h1>
        <p className="pin-desc">Enter your 4-digit security PIN to continue</p>

        {/* Error message */}
        {error && (
          <div className="pin-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* PIN digit boxes */}
        <div className="pin-digits">
          {digits.map((digit, i) => (
            <div key={i} className={`pin-digit-box ${digit ? 'pin-digit-box--filled' : ''} ${success ? 'pin-digit-box--success' : ''}`}>
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit ? '●' : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  handleDigitChange(i, raw.slice(-1));
                }}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="pin-digit-input"
                disabled={loading || success}
                autoComplete="off"
              />
              <div className="pin-digit-line" />
            </div>
          ))}
        </div>

        {/* Status */}
        {loading && (
          <div className="pin-verifying">
            <div className="pin-spinner" />
            <span>Verifying...</span>
          </div>
        )}
        {success && (
          <div className="pin-success-msg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.15" />
              <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Access Granted — Redirecting...
          </div>
        )}

        {/* Footer */}
        <div className="pin-footer">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="6" width="12" height="7" rx="2" stroke="#64748b" strokeWidth="1.2" />
            <path d="M4 6V4a3 3 0 016 0v2" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Protected by Role-Based JWT Encryption
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');

        .pin-scene {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Grotesk', sans-serif;
          transition: opacity 0.5s ease;
          overflow: hidden;
        }
        .pin-scene--success { pointer-events: none; }

        /* ── Background ── */
        .pin-bg {
          position: absolute;
          inset: 0;
          background: #0a0e1a;
          overflow: hidden;
        }
        .pin-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .pin-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          will-change: transform;
        }
        .pin-orb--1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
          top: -15%; left: -10%;
          animation: orbFloat1 14s ease-in-out infinite alternate;
        }
        .pin-orb--2 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          bottom: -20%; right: -15%;
          animation: orbFloat2 16s ease-in-out infinite alternate;
        }
        .pin-orb--3 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #ec4899 0%, transparent 70%);
          top: 40%; left: 55%;
          animation: orbFloat3 12s ease-in-out infinite alternate;
        }
        .pin-orb--4 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
          top: 15%; right: 25%;
          animation: orbFloat4 18s ease-in-out infinite alternate;
        }
        @keyframes orbFloat1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { opacity: 0.7; }
          100% { transform: translate(80px, 60px) scale(1.15); opacity: 0.5; }
        }
        @keyframes orbFloat2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          100% { transform: translate(-60px, -80px) scale(1.2); opacity: 0.6; }
        }
        @keyframes orbFloat3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.35; }
          100% { transform: translate(-40px, 50px) scale(0.9); opacity: 0.5; }
        }
        @keyframes orbFloat4 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          100% { transform: translate(30px, -40px) scale(1.1); opacity: 0.45; }
        }

        /* ── Particles ── */
        .pin-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .pin-particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          animation: particleDrift ease-in-out infinite alternate;
        }
        @keyframes particleDrift {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-80px) translateX(30px); opacity: 0; }
        }

        /* ── Card ── */
        .pin-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 3rem 2.5rem 2rem;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(40px) saturate(1.5);
          -webkit-backdrop-filter: blur(40px) saturate(1.5);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05) inset,
            0 32px 64px rgba(0, 0, 0, 0.4),
            0 0 80px rgba(59, 130, 246, 0.08);
          text-align: center;
          animation: cardEntry 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pin-card--shake {
          animation: cardShake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes cardShake {
          10%, 90% { transform: translate3d(-3px, 0, 0); }
          20%, 80% { transform: translate3d(5px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-10px, 0, 0); }
          40%, 60% { transform: translate3d(10px, 0, 0); }
        }

        /* ── Logo ── */
        .pin-logo-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 1.8rem;
        }
        .pin-logo-glow {
          position: absolute;
          inset: -12px;
          background: radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%);
          border-radius: 24px;
          animation: logoGlow 3s ease-in-out infinite alternate;
        }
        @keyframes logoGlow {
          0% { opacity: 0.4; transform: scale(1); }
          100% { opacity: 0.8; transform: scale(1.15); }
        }
        .pin-logo-img {
          position: relative;
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 18px;
          border: 2px solid rgba(255,255,255,0.15);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        /* ── Headings ── */
        .pin-heading {
          font-size: 1.8rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.5rem;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }
        .pin-heading-sub {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #3b82f6;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .pin-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          margin: 0 0 2rem;
          line-height: 1.5;
        }

        /* ── Error ── */
        .pin-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          animation: errorSlide 0.3s ease-out;
        }
        @keyframes errorSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Digit Boxes ── */
        .pin-digits {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-bottom: 2rem;
        }
        .pin-digit-box {
          position: relative;
          width: 68px;
          height: 76px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.6);
          border: 2px solid rgba(255,255,255,0.08);
          transition: all 0.25s ease;
          overflow: hidden;
        }
        .pin-digit-box--filled {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.08);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
        }
        .pin-digit-box--success {
          border-color: rgba(16, 185, 129, 0.5) !important;
          background: rgba(16, 185, 129, 0.08) !important;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.15) !important;
        }
        .pin-digit-box:focus-within {
          border-color: rgba(59, 130, 246, 0.7);
          box-shadow: 0 0 24px rgba(59, 130, 246, 0.25), inset 0 0 12px rgba(59, 130, 246, 0.05);
        }
        .pin-digit-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          text-align: center;
          font-size: 1.8rem;
          font-weight: 900;
          color: #ffffff;
          background: transparent;
          border: none;
          outline: none;
          caret-color: #3b82f6;
          font-family: 'Space Grotesk', sans-serif;
        }
        .pin-digit-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        .pin-digit-box--filled .pin-digit-line {
          transform: scaleX(1);
        }

        /* ── Status ── */
        .pin-verifying {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          animation: fadeIn 0.3s ease;
        }
        .pin-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.1);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .pin-success-msg {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #10b981;
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── Footer ── */
        .pin-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #475569;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        /* ── Responsive ── */
        @media (max-width: 500px) {
          .pin-card { margin: 1rem; padding: 2rem 1.5rem 1.5rem; }
          .pin-digit-box { width: 58px; height: 66px; }
          .pin-heading { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};
