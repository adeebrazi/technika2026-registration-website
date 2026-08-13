import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MAIN_WEBSITE_URL } from '../components/Navbar';

export const Login: React.FC = () => {
  const [registrationIdOrEmail, setRegistrationIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard on mount
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

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
            <label htmlFor="password" style={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.05em' }}>
              PASSWORD
            </label>
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

      <footer className="main-footer">
        <p>&copy; 2026 Technika Core Operations. All rights reserved.</p>
      </footer>
    </div>
  );
};
