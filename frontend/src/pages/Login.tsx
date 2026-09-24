import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MAIN_WEBSITE_URL } from '../components/Navbar';

export const Login: React.FC = () => {
  const [registrationIdOrEmail, setRegistrationIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // If already logged in, redirect to dashboard on mount
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid Gmail address.');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code.');
      }

      setForgotSuccess(data.message || '6-digit OTP code sent to your Gmail!');
      setForgotStep('OTP');
    } catch (err: any) {
      setForgotError(err.message || 'Error sending reset code. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP sent to your Gmail.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.toLowerCase().trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setForgotSuccess('Password reset successfully! You can now log in.');
      setRegistrationIdOrEmail(forgotEmail);
      setPassword(forgotNewPassword);

      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('EMAIL');
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotSuccess('');
      }, 2000);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('EMAIL');
    setForgotError('');
    setForgotSuccess('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registrationIdOrEmail || !password) {
      setError('Please enter both your Registration ID/Email and Password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrationIdOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      // Login success
      localStorage.setItem('token', data.token);
      localStorage.setItem('registrationId', data.user.registrationId);
      localStorage.setItem('name', data.user.name);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', marginTop: '4.8vh' }}>
      <header className="main-header">
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '4px',
            lineHeight: 1,
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: '12px',
          }}
          onClick={() => window.location.href = MAIN_WEBSITE_URL}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '2.2rem',
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
            }}>TECH</span>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '2.2rem',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              color: '#000000',
              background: 'var(--brut-lime, #3ce6fc)',
              border: '3px solid var(--foreground)',
              boxShadow: '2px 2px 0px 0px var(--foreground)',
              padding: '1px 10px',
              display: 'inline-block',
              transform: 'rotate(-1deg)',
            }}>NIKA</span>
          </div>
          <div>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.3rem',
              letterSpacing: '-0.02em',
              color: 'var(--background)',
              background: 'var(--foreground)',
              border: '2px solid var(--foreground)',
              padding: '1px 10px',
              display: 'inline-block',
            }}>6.0</span>
          </div>
        </div>
        <p className="tagline">Sign in to manage your registrations, create teams, and check invitations.</p>
      </header>

      <div
        className="brut-card brut-login-card"
        style={{
          padding: '36px 30px',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="registrationIdOrEmail" style={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.05em' }}>
              REGISTRATION ID OR EMAIL
            </label>
            <input
              type="text"
              id="registrationIdOrEmail"
              required
              placeholder="A7K29Q or you@gmail.com"
              value={registrationIdOrEmail}
              onChange={(e) => setRegistrationIdOrEmail(e.target.value)}
              style={{
                background: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '0px',
                color: '#000000',
                fontWeight: 700,
                padding: '12px 14px',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                PASSWORD
              </label>
              <button
                type="button"
                className="btn-forgot-password"
                onClick={() => {
                  setForgotError('');
                  setForgotSuccess('');
                  if (registrationIdOrEmail.includes('@')) {
                    setForgotEmail(registrationIdOrEmail);
                  }
                  setShowForgotModal(true);
                }}
              >
                Forgot Password? →
              </button>
            </div>
            <input
              type="password"
              id="password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '0px',
                color: '#000000',
                fontWeight: 700,
                padding: '12px 14px',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {error && (
            <div className="error-panel" style={{ marginBottom: '15px', padding: '12px 16px', display: 'flex', background: '#ffffff', border: '2px solid #000000', color: '#ef4444' }}>
              <i className="fa-solid fa-circle-exclamation error-icon"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="brut-btn-pink"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {!loading ? (
              <span>
                LOG IN →
              </span>
            ) : (
              <span>
                <i className="fa-solid fa-circle-notch fa-spin"></i> AUTHENTICATING...
              </span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            No account?{' '}
            <Link to="/register" style={{ textDecoration: 'underline', fontWeight: 900 }}>
              Register now
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForgotModal();
          }}
        >
          <div
            className="brut-card"
            style={{
              background: '#FFFDF9',
              border: '4px solid #000000',
              boxShadow: '10px 10px 0px 0px #000000',
              maxWidth: '440px',
              width: '100%',
              padding: '30px 24px',
              position: 'relative',
            }}
          >
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span
                  style={{
                    background: 'var(--accent-neon-yellow, #D6FD52)',
                    color: '#000000',
                    border: '2px solid #000000',
                    boxShadow: '2px 2px 0px #000000',
                    fontWeight: 900,
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '6px',
                  }}
                >
                  Account Recovery
                </span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", color: '#000000' }}>
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                style={{
                  background: '#FF3B93',
                  color: '#ffffff',
                  border: '2px solid #000000',
                  boxShadow: '2px 2px 0px #000000',
                  fontWeight: 900,
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 12px',
                  background: '#ffffff',
                  border: '2.5px solid #000000',
                  boxShadow: '3px 3px 0px #ef4444',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️ {forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 12px',
                  background: '#ffffff',
                  border: '2.5px solid #000000',
                  boxShadow: '3px 3px 0px #22c55e',
                  color: '#15803d',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>✅ {forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 'EMAIL' ? (
              <form onSubmit={handleSendResetOtp}>
                <p style={{ fontSize: '0.85rem', color: '#444', marginBottom: '18px', fontWeight: 600 }}>
                  Enter your registered Gmail address. We'll send a 6-digit OTP code to verify your identity.
                </p>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="forgotEmail" style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    REGISTERED GMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    id="forgotEmail"
                    required
                    placeholder="you@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '3px solid #000000',
                      borderRadius: '0px',
                      color: '#000000',
                      fontWeight: 700,
                      padding: '12px 14px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'var(--brut-blue, #00364d)',
                    color: '#ffffff',
                    border: '3px solid #000000',
                    boxShadow: '4px 4px 0px #000000',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {forgotLoading ? 'SENDING CODE...' : 'SEND RESET OTP →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ background: '#f1f5f9', border: '2px solid #000', padding: '8px 12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>To: {forgotEmail}</span>
                  <button
                    type="button"
                    onClick={() => { setForgotStep('EMAIL'); setForgotError(''); setForgotSuccess(''); }}
                    style={{ background: 'none', border: 'none', color: '#000', fontWeight: 800, textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Change
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor="forgotOtp" style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    6-DIGIT OTP CODE
                  </label>
                  <input
                    type="text"
                    id="forgotOtp"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '3px solid #000000',
                      borderRadius: '0px',
                      color: '#000000',
                      fontWeight: 800,
                      letterSpacing: '4px',
                      padding: '12px 14px',
                      fontSize: '1.1rem',
                      textAlign: 'center',
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor="forgotNewPassword" style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    id="forgotNewPassword"
                    required
                    placeholder="Min 6 characters"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '3px solid #000000',
                      borderRadius: '0px',
                      color: '#000000',
                      fontWeight: 700,
                      padding: '11px 14px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="forgotConfirmPassword" style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    CONFIRM NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    id="forgotConfirmPassword"
                    required
                    placeholder="Re-enter new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    style={{
                      background: '#ffffff',
                      border: '3px solid #000000',
                      borderRadius: '0px',
                      color: '#000000',
                      fontWeight: 700,
                      padding: '11px 14px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'var(--accent-neon-yellow, #D6FD52)',
                    color: '#000000',
                    border: '3px solid #000000',
                    boxShadow: '4px 4px 0px #000000',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  {forgotLoading ? 'UPDATING PASSWORD...' : 'SET NEW PASSWORD →'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    disabled={forgotLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#000',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="main-footer">
        <p>&copy; 2026 Technika Core Operations. All rights reserved.</p>
      </footer>
    </div>
  );
};

