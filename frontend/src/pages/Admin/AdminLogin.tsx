import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type AdminRoleOption = 'Administration' | 'Faculty Coordinator' | 'Student Coordinator';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<AdminRoleOption>('Faculty Coordinator');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleOptions: { key: AdminRoleOption; label: string; icon: string; desc: string }[] = [
    { key: 'Faculty Coordinator', label: 'Faculty Coordinator', icon: '🎓', desc: 'Faculty event advisors' },
    { key: 'Administration', label: 'Administration', icon: '🛡️', desc: 'Core organizing committee' },
    { key: 'Student Coordinator', label: 'Student Coordinator', icon: '⚡', desc: 'Event heads & coordinators' },
  ];

  const currentRoleObj = roleOptions.find((r) => r.key === selectedRole) || roleOptions[0];

  // Prevent scrollbar on login page to fit exact one screen height
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminRole', data.role);
        localStorage.setItem('adminName', data.name || 'Administrator');
        localStorage.setItem('adminDesignation', data.designation || selectedRole);
        navigate('/admin/users');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clay-login-page">
      {/* ── Background Floating Clay Elements ── */}
      <div className="clay-floating-orb orb-1" />
      <div className="clay-floating-orb orb-2" />
      <div className="clay-floating-orb orb-3" />
      <div className="clay-floating-orb orb-4" />

      {/* ── Main Compact Claymorphism Login Card ── */}
      <div className="clay-card">
        {/* Top 3D Clay Emblem */}
        <div className="clay-emblem-wrapper">
          <div className="clay-emblem">
            <span className="clay-emblem-icon">🔐</span>
          </div>
        </div>

        <div className="clay-card-header">
          <span className="clay-badge-tag">TECHNIKA 6.0 PORTAL</span>
          <h1 className="clay-title">ADMIN LOGIN</h1>
          <p className="clay-subtitle">Enter your official credentials and select your authorized role</p>
        </div>

        {error && (
          <div className="clay-error-box">
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="clay-form">
          {/* ── Category 01: Login Credentials (Moved to 01) ── */}
          <div className="clay-category-section">
            <div className="clay-category-header">
              <span className="clay-category-num">01</span>
              <span className="clay-category-title">LOGIN CREDENTIALS</span>
            </div>

            {/* Email Field with updated label */}
            <div className="clay-field-group">
              <label className="clay-label">
                <span>Enter Your @technika2026.online email</span>
              </label>
              <div className="clay-input-box">
                <div className="clay-input-badge">
                  <span>✉️</span>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@technika2026.online"
                  required
                  autoComplete="email"
                  className="clay-pure-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="clay-field-group">
              <label className="clay-label">
                <span>ACCOUNT PASSWORD</span>
              </label>
              <div className="clay-input-box">
                <div className="clay-input-badge">
                  <span>🔒</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="clay-pure-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="clay-eye-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Category 02: Specify Your Role (Dropdown on 02) ── */}
          <div className="clay-category-section" style={{ position: 'relative', zIndex: 10 }}>
            <div className="clay-category-header">
              <span className="clay-category-num">02</span>
              <span className="clay-category-title">SPECIFY YOUR ROLE</span>
            </div>

            <div className="clay-dropdown-wrapper" ref={dropdownRef}>
              <label className="clay-label">
                <span>ASSIGNED DESIGNATION</span>
              </label>

              {/* Clay Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`clay-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <div className="clay-dropdown-current">
                  <span className="dropdown-current-icon">{currentRoleObj.icon}</span>
                  <div className="dropdown-current-info">
                    <span className="dropdown-current-name">{currentRoleObj.label}</span>
                    <span className="dropdown-current-desc">{currentRoleObj.desc}</span>
                  </div>
                </div>

                <div className="clay-chevron-pill">
                  <span className={`clay-chevron-arrow ${isDropdownOpen ? 'rotated' : ''}`}>▼</span>
                </div>
              </button>

              {/* Clay Dropdown Options Menu */}
              {isDropdownOpen && (
                <div className="clay-dropdown-menu" role="listbox">
                  {roleOptions.map((opt) => {
                    const isSelected = selectedRole === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedRole(opt.key);
                          setIsDropdownOpen(false);
                          setError('');
                        }}
                        className={`clay-dropdown-item ${isSelected ? 'selected' : ''}`}
                      >
                        <span className="item-icon">{opt.icon}</span>
                        <div className="item-text">
                          <span className="item-label">{opt.label}</span>
                          <span className="item-desc">{opt.desc}</span>
                        </div>
                        {isSelected && <span className="item-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Action Submit Button ── */}
          <button
            type="submit"
            disabled={loading}
            className={`clay-submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <span className="btn-content">
                <span className="clay-spinner" />
                VERIFYING...
              </span>
            ) : (
              <span className="btn-content">
                ACCESS ADMIN PORTAL →
              </span>
            )}
          </button>
        </form>

        <div className="clay-footer-note">
          <span>🔒 Protected by Role-Based JWT Encryption • Technika 2026</span>
        </div>
      </div>

      {/* ── Claymorphism Stylesheet (Compact Viewport Fit) ── */}
      <style>{`
        .clay-login-page {
          height: calc(100vh - 64px);
          max-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          background: #e6ecf5;
          position: relative;
          overflow: hidden;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
          box-sizing: border-box;
        }

        /* ── Floating 3D Clay Spheres ── */
        .clay-floating-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.08));
        }

        .orb-1 {
          width: 170px;
          height: 170px;
          top: 6%;
          left: 7%;
          background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
          box-shadow: 
            inset -10px -10px 20px rgba(99, 102, 241, 0.45),
            inset 10px 10px 20px rgba(255, 255, 255, 0.7);
          animation: floatOrb 8s ease-in-out infinite alternate;
        }

        .orb-2 {
          width: 140px;
          height: 140px;
          bottom: 6%;
          right: 7%;
          background: linear-gradient(135deg, #6ee7b7 0%, #34d399 100%);
          box-shadow: 
            inset -10px -10px 20px rgba(16, 185, 129, 0.45),
            inset 10px 10px 20px rgba(255, 255, 255, 0.7);
          animation: floatOrb 10s ease-in-out 1s infinite alternate-reverse;
        }

        .orb-3 {
          width: 90px;
          height: 90px;
          top: 12%;
          right: 15%;
          background: linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%);
          box-shadow: 
            inset -6px -6px 14px rgba(236, 72, 153, 0.45),
            inset 6px 6px 14px rgba(255, 255, 255, 0.7);
          animation: floatOrb 7s ease-in-out 0.5s infinite alternate;
        }

        .orb-4 {
          width: 100px;
          height: 100px;
          bottom: 10%;
          left: 12%;
          background: linear-gradient(135deg, #fde047 0%, #eab308 100%);
          box-shadow: 
            inset -7px -7px 16px rgba(202, 138, 4, 0.45),
            inset 7px 7px 16px rgba(255, 255, 255, 0.7);
          animation: floatOrb 9s ease-in-out 2s infinite alternate-reverse;
        }

        @keyframes floatOrb {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-16px) rotate(6deg); }
        }

        /* ── Compact Claymorphism Card ── */
        .clay-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 440px;
          background: #eef3f9;
          border-radius: 28px;
          padding: 1.4rem 1.6rem 1.1rem 1.6rem;
          border: 2.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            20px 24px 44px rgba(162, 178, 201, 0.52),
            -16px -16px 36px rgba(255, 255, 255, 0.95),
            inset 3px 3px 8px rgba(255, 255, 255, 0.9),
            inset -5px -5px 10px rgba(162, 178, 201, 0.3);
          box-sizing: border-box;
        }

        /* ── Top 3D Clay Emblem (Compact) ── */
        .clay-emblem-wrapper {
          display: flex;
          justify-content: center;
          margin-top: -3.2rem;
          margin-bottom: 0.45rem;
        }

        .clay-emblem {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: 3.5px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            8px 12px 22px rgba(37, 99, 235, 0.4),
            inset 4px 4px 8px rgba(255, 255, 255, 0.65),
            inset -4px -4px 8px rgba(15, 23, 42, 0.35);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .clay-emblem-icon {
          font-size: 1.65rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        /* ── Compact Header ── */
        .clay-card-header {
          text-align: center;
          margin-bottom: 0.85rem;
        }

        .clay-badge-tag {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #2563eb;
          background: #dbeafe;
          padding: 2px 10px;
          border-radius: 9999px;
          box-shadow: 
            inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.8),
            inset -1.5px -1.5px 3px rgba(37, 99, 235, 0.2),
            2px 2px 5px rgba(37, 99, 235, 0.1);
          margin-bottom: 0.25rem;
        }

        .clay-title {
          font-size: 1.45rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .clay-subtitle {
          font-size: 0.74rem;
          color: #64748b;
          margin-top: 0.2rem;
          margin-bottom: 0;
          line-height: 1.3;
          font-weight: 500;
        }

        /* ── Compact Error Box ── */
        .clay-error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          color: #991b1b;
          padding: 0.55rem 0.85rem;
          border-radius: 14px;
          font-size: 0.78rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(239, 68, 68, 0.2);
          box-shadow:
            4px 6px 12px rgba(239, 68, 68, 0.15),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(239, 68, 68, 0.18);
        }

        /* ── Form Layout ── */
        .clay-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* ── Categorized Sections (Compact) ── */
        .clay-category-section {
          background: #f4f8fd;
          border-radius: 18px;
          padding: 0.75rem 0.95rem;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            6px 8px 18px rgba(162, 178, 201, 0.22),
            -5px -5px 14px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.18);
          box-sizing: border-box;
        }

        .clay-category-header {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 0.5rem;
        }

        .clay-category-num {
          font-size: 0.6rem;
          font-weight: 900;
          background: #2563eb;
          color: #ffffff;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 1px 1px 3px rgba(37, 99, 235, 0.3);
        }

        .clay-category-title {
          font-size: 0.68rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Compact Input Groups ── */
        .clay-field-group {
          margin-bottom: 0.5rem;
          width: 100%;
          box-sizing: border-box;
        }

        .clay-field-group:last-child {
          margin-bottom: 0;
        }

        .clay-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 800;
          color: #334155;
          letter-spacing: 0.02em;
          margin-bottom: 0.25rem;
          padding-left: 2px;
        }

        .clay-input-box {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          background: #e2eaf4 !important;
          border-radius: 14px !important;
          padding: 4px 8px !important;
          border: 2px solid transparent !important;
          box-sizing: border-box !important;
          width: 100% !important;
          box-shadow:
            inset 3px 3px 6px rgba(162, 178, 201, 0.5),
            inset -3px -3px 6px rgba(255, 255, 255, 0.95) !important;
          transition: all 0.2s ease !important;
          overflow: hidden !important;
        }

        .clay-input-box:focus-within {
          border-color: #3b82f6 !important;
          background: #ffffff !important;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.18),
            inset 2px 2px 4px rgba(162, 178, 201, 0.25),
            inset -2px -2px 4px rgba(255, 255, 255, 0.9) !important;
        }

        .clay-input-badge {
          width: 30px !important;
          height: 30px !important;
          border-radius: 10px !important;
          background: #f1f5fa !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 0.95rem !important;
          flex-shrink: 0 !important;
          box-shadow:
            2px 2px 4px rgba(162, 178, 201, 0.35),
            inset 1px 1px 2px rgba(255, 255, 255, 0.8) !important;
        }

        .clay-pure-input {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          width: 100% !important;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          background-color: transparent !important;
          color: #0f172a !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          font-family: inherit !important;
          padding: 5px 3px !important;
          height: auto !important;
          box-shadow: none !important;
        }

        .clay-pure-input::placeholder {
          color: #94a3b8 !important;
          font-weight: 400 !important;
        }

        .clay-pure-input:-webkit-autofill,
        .clay-pure-input:-webkit-autofill:hover, 
        .clay-pure-input:-webkit-autofill:focus,
        .clay-pure-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #e2eaf4 inset !important;
          -webkit-text-fill-color: #0f172a !important;
          caret-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .clay-eye-btn {
          border: none !important;
          background: #f1f5fa !important;
          cursor: pointer !important;
          font-size: 0.95rem !important;
          width: 28px !important;
          height: 28px !important;
          border-radius: 9px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow:
            2px 2px 4px rgba(162, 178, 201, 0.3),
            inset 1px 1px 2px rgba(255, 255, 255, 0.8) !important;
          transition: transform 0.15s !important;
          flex-shrink: 0 !important;
        }

        .clay-eye-btn:hover {
          transform: scale(1.06) !important;
        }

        /* ── Compact Dropdown Specifics ── */
        .clay-dropdown-wrapper {
          position: relative;
        }

        .clay-dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.5rem 0.85rem;
          background: #e2eaf4;
          border-radius: 14px;
          border: 2px solid transparent;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          box-shadow:
            inset 3px 3px 6px rgba(162, 178, 201, 0.45),
            inset -3px -3px 6px rgba(255, 255, 255, 0.9);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }

        .clay-dropdown-trigger:hover {
          background: #e8f0fa;
        }

        .clay-dropdown-trigger.open {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.15),
            inset 2px 2px 4px rgba(162, 178, 201, 0.25),
            inset -2px -2px 4px rgba(255, 255, 255, 0.8);
        }

        .clay-dropdown-current {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .dropdown-current-icon {
          font-size: 1.2rem;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
        }

        .dropdown-current-info {
          display: flex;
          flex-direction: column;
        }

        .dropdown-current-name {
          font-size: 0.84rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.15;
        }

        .dropdown-current-desc {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 500;
        }

        .clay-chevron-pill {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            2px 2px 4px rgba(162, 178, 201, 0.4),
            -1.5px -1.5px 3px rgba(255, 255, 255, 0.8),
            inset 1px 1px 2px rgba(255, 255, 255, 0.8);
          flex-shrink: 0;
        }

        .clay-chevron-arrow {
          font-size: 0.55rem;
          color: #475569;
          transition: transform 0.25s ease;
        }

        .clay-chevron-arrow.rotated {
          transform: rotate(180deg);
        }

        /* Dropdown Menu Overlay */
        .clay-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 999;
          background: #eef4fb;
          border-radius: 16px;
          padding: 0.45rem;
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            12px 16px 32px rgba(162, 178, 201, 0.6),
            -6px -6px 20px rgba(255, 255, 255, 0.95),
            inset 2px 2px 4px rgba(255, 255, 255, 0.85);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          animation: dropdownSlideIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .clay-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.6rem 0.85rem;
          border-radius: 12px;
          border: none;
          background: #f4f8fd;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          width: 100%;
          transition: all 0.15s ease;
          box-shadow:
            1.5px 2px 4px rgba(162, 178, 201, 0.25),
            -1.5px -1.5px 3px rgba(255, 255, 255, 0.8);
        }

        .clay-dropdown-item:hover {
          transform: translateY(-1px);
          background: #e6effa;
          box-shadow:
            3px 4px 8px rgba(162, 178, 201, 0.35),
            -2px -2px 4px rgba(255, 255, 255, 0.9);
        }

        .clay-dropdown-item.selected {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow:
            5px 6px 14px rgba(37, 99, 235, 0.38),
            inset 2px 2px 3px rgba(255, 255, 255, 0.4),
            inset -2px -2px 4px rgba(15, 23, 42, 0.3);
        }

        .clay-dropdown-item.selected .item-desc {
          color: rgba(255, 255, 255, 0.85);
        }

        .item-icon {
          font-size: 1.15rem;
          flex-shrink: 0;
        }

        .item-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-label {
          font-size: 0.82rem;
          font-weight: 800;
          line-height: 1.15;
        }

        .item-desc {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 500;
        }

        .item-check {
          font-size: 0.85rem;
          font-weight: 900;
          background: rgba(255, 255, 255, 0.25);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Compact 3D Clay Submit Button ── */
        .clay-submit-btn {
          width: 100%;
          padding: 0.8rem 1rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border-radius: 16px;
          border: 2px solid rgba(255, 255, 255, 0.65);
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow:
            8px 10px 20px rgba(37, 99, 235, 0.38),
            -3px -3px 8px rgba(255, 255, 255, 0.7),
            inset 2px 2px 4px rgba(255, 255, 255, 0.5),
            inset -3px -3px 6px rgba(15, 23, 42, 0.3);
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.1rem;
        }

        .clay-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            10px 14px 24px rgba(37, 99, 235, 0.44),
            -3px -3px 10px rgba(255, 255, 255, 0.8),
            inset 3px 3px 6px rgba(255, 255, 255, 0.6);
        }

        .clay-submit-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.99);
          box-shadow:
            3px 4px 10px rgba(37, 99, 235, 0.3),
            inset 3px 3px 6px rgba(15, 23, 42, 0.35);
        }

        .clay-submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .btn-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .clay-spinner {
          width: 15px;
          height: 15px;
          border: 2.5px solid rgba(255, 255, 255, 0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Footer ── */
        .clay-footer-note {
          text-align: center;
          margin-top: 0.65rem;
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 600;
        }

        @media (max-height: 700px) {
          .clay-login-page {
            padding: 0.35rem 0.5rem;
          }
          .clay-card {
            padding: 1.1rem 1.3rem 0.8rem 1.3rem;
            max-width: 410px;
          }
          .clay-emblem-wrapper {
            margin-top: -2.6rem;
            margin-bottom: 0.2rem;
          }
          .clay-emblem {
            width: 48px;
            height: 48px;
          }
          .clay-emblem-icon {
            font-size: 1.3rem;
          }
          .clay-title {
            font-size: 1.25rem;
          }
          .clay-subtitle {
            display: none;
          }
          .clay-form {
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};
