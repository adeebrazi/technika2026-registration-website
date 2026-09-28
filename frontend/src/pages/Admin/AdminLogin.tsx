import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type AdminRoleOption = 'Administration' | 'Faculty Coordinator' | 'Student Coordinator';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<AdminRoleOption>('Administration');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleOptions: { key: AdminRoleOption; label: string; icon: string; desc: string }[] = [
    { key: 'Administration', label: 'Administration', icon: '🛡️', desc: 'Core organizing committee' },
    { key: 'Faculty Coordinator', label: 'Faculty Coordinator', icon: '🎓', desc: 'Faculty event advisors' },
    { key: 'Student Coordinator', label: 'Student Coordinator', icon: '⚡', desc: 'Event heads & coordinators' },
  ];

  const currentRoleObj = roleOptions.find((r) => r.key === selectedRole) || roleOptions[0];

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

      {/* ── Main Claymorphism Login Card ── */}
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
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
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

            {/* Email Field */}
            <div className="clay-field-group">
              <label className="clay-label">
                <span>OFFICIAL EMAIL ADDRESS</span>
              </label>
              <div className="clay-input-inset">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@technika2026.online"
                  required
                  autoComplete="email"
                  className="clay-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="clay-field-group">
              <label className="clay-label">
                <span>ACCOUNT PASSWORD</span>
              </label>
              <div className="clay-input-inset">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="clay-input"
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
                VERIFYING PERMISSIONS...
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

      {/* ── Claymorphism Stylesheet ── */}
      <style>{`
        .clay-login-page {
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1rem;
          background: #e6ecf5;
          position: relative;
          overflow: hidden;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
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
          width: 220px;
          height: 220px;
          top: 5%;
          left: 8%;
          background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
          box-shadow: 
            inset -14px -14px 28px rgba(99, 102, 241, 0.45),
            inset 14px 14px 28px rgba(255, 255, 255, 0.7);
          animation: floatOrb 8s ease-in-out infinite alternate;
        }

        .orb-2 {
          width: 180px;
          height: 180px;
          bottom: 8%;
          right: 8%;
          background: linear-gradient(135deg, #6ee7b7 0%, #34d399 100%);
          box-shadow: 
            inset -12px -12px 24px rgba(16, 185, 129, 0.45),
            inset 12px 12px 24px rgba(255, 255, 255, 0.7);
          animation: floatOrb 10s ease-in-out 1s infinite alternate-reverse;
        }

        .orb-3 {
          width: 110px;
          height: 110px;
          top: 15%;
          right: 18%;
          background: linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%);
          box-shadow: 
            inset -8px -8px 18px rgba(236, 72, 153, 0.45),
            inset 8px 8px 18px rgba(255, 255, 255, 0.7);
          animation: floatOrb 7s ease-in-out 0.5s infinite alternate;
        }

        .orb-4 {
          width: 130px;
          height: 130px;
          bottom: 12%;
          left: 15%;
          background: linear-gradient(135deg, #fde047 0%, #eab308 100%);
          box-shadow: 
            inset -9px -9px 20px rgba(202, 138, 4, 0.45),
            inset 9px 9px 20px rgba(255, 255, 255, 0.7);
          animation: floatOrb 9s ease-in-out 2s infinite alternate-reverse;
        }

        @keyframes floatOrb {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-24px) rotate(8deg); }
        }

        /* ── Claymorphism Card ── */
        .clay-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 490px;
          background: #eef3f9;
          border-radius: 36px;
          padding: 2.5rem 2.2rem 2rem 2.2rem;
          border: 3px solid rgba(255, 255, 255, 0.85);
          box-shadow:
            24px 28px 48px rgba(162, 178, 201, 0.55),
            -20px -20px 40px rgba(255, 255, 255, 0.95),
            inset 4px 4px 10px rgba(255, 255, 255, 0.9),
            inset -6px -6px 14px rgba(162, 178, 201, 0.35);
          transition: transform 0.2s ease;
        }

        /* ── Top 3D Clay Emblem ── */
        .clay-emblem-wrapper {
          display: flex;
          justify-content: center;
          margin-top: -4.5rem;
          margin-bottom: 1.25rem;
        }

        .clay-emblem {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: 4px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            10px 14px 28px rgba(37, 99, 235, 0.4),
            inset 5px 5px 10px rgba(255, 255, 255, 0.65),
            inset -6px -6px 12px rgba(15, 23, 42, 0.35);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .clay-emblem:hover {
          transform: scale(1.08) rotate(5deg);
        }

        .clay-emblem-icon {
          font-size: 2.2rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        /* ── Header ── */
        .clay-card-header {
          text-align: center;
          margin-bottom: 1.8rem;
        }

        .clay-badge-tag {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2563eb;
          background: #dbeafe;
          padding: 4px 12px;
          border-radius: 9999px;
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(37, 99, 235, 0.2),
            2px 3px 6px rgba(37, 99, 235, 0.12);
          margin-bottom: 0.6rem;
        }

        .clay-title {
          font-size: 1.95rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .clay-subtitle {
          font-size: 0.84rem;
          color: #64748b;
          margin-top: 0.4rem;
          margin-bottom: 0;
          line-height: 1.4;
          font-weight: 500;
        }

        /* ── Error Box ── */
        .clay-error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fee2e2;
          color: #991b1b;
          padding: 0.85rem 1.1rem;
          border-radius: 18px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.4rem;
          border: 1px solid rgba(239, 68, 68, 0.2);
          box-shadow:
            6px 8px 16px rgba(239, 68, 68, 0.15),
            inset 3px 3px 6px rgba(255, 255, 255, 0.8),
            inset -3px -3px 6px rgba(239, 68, 68, 0.18);
        }

        /* ── Form Layout ── */
        .clay-form {
          display: flex;
          flex-direction: column;
          gap: 1.3rem;
        }

        /* ── Categorized Sections ── */
        .clay-category-section {
          background: #f4f8fd;
          border-radius: 24px;
          padding: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            8px 10px 22px rgba(162, 178, 201, 0.25),
            -6px -6px 16px rgba(255, 255, 255, 0.8),
            inset 2px 2px 6px rgba(255, 255, 255, 0.8),
            inset -3px -3px 6px rgba(162, 178, 201, 0.2);
        }

        .clay-category-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 0.9rem;
        }

        .clay-category-num {
          font-size: 0.65rem;
          font-weight: 900;
          background: #2563eb;
          color: #ffffff;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 1px 2px 4px rgba(37, 99, 235, 0.3);
        }

        .clay-category-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Dropdown Specifics ── */
        .clay-dropdown-wrapper {
          position: relative;
        }

        .clay-dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1rem;
          background: #e2eaf4;
          border-radius: 18px;
          border: 2px solid transparent;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          box-shadow:
            inset 4px 4px 8px rgba(162, 178, 201, 0.45),
            inset -3px -3px 6px rgba(255, 255, 255, 0.9);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .clay-dropdown-trigger:hover {
          background: #e8f0fa;
        }

        .clay-dropdown-trigger.open {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.15),
            inset 2px 2px 4px rgba(162, 178, 201, 0.25),
            inset -2px -2px 4px rgba(255, 255, 255, 0.8);
        }

        .clay-dropdown-current {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-current-icon {
          font-size: 1.4rem;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
        }

        .dropdown-current-info {
          display: flex;
          flex-direction: column;
        }

        .dropdown-current-name {
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .dropdown-current-desc {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 500;
          margin-top: 1px;
        }

        .clay-chevron-pill {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            2px 3px 6px rgba(162, 178, 201, 0.4),
            -2px -2px 4px rgba(255, 255, 255, 0.8),
            inset 1px 1px 2px rgba(255, 255, 255, 0.8);
          flex-shrink: 0;
        }

        .clay-chevron-arrow {
          font-size: 0.65rem;
          color: #475569;
          transition: transform 0.25s ease;
        }

        .clay-chevron-arrow.rotated {
          transform: rotate(180deg);
        }

        /* Dropdown Menu Overlay */
        .clay-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 999;
          background: #eef4fb;
          border-radius: 20px;
          padding: 0.55rem;
          border: 2.5px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            14px 18px 36px rgba(162, 178, 201, 0.6),
            -8px -8px 24px rgba(255, 255, 255, 0.95),
            inset 2px 2px 6px rgba(255, 255, 255, 0.85);
          animation: dropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .clay-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          border: none;
          background: #f4f8fd;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          width: 100%;
          transition: all 0.15s ease;
          box-shadow:
            2px 3px 6px rgba(162, 178, 201, 0.25),
            -2px -2px 4px rgba(255, 255, 255, 0.8);
        }

        .clay-dropdown-item:hover {
          transform: translateY(-1px);
          background: #e6effa;
          box-shadow:
            4px 6px 12px rgba(162, 178, 201, 0.35),
            -2px -2px 6px rgba(255, 255, 255, 0.9);
        }

        .clay-dropdown-item.selected {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow:
            6px 8px 18px rgba(37, 99, 235, 0.38),
            inset 2px 2px 4px rgba(255, 255, 255, 0.4),
            inset -3px -3px 6px rgba(15, 23, 42, 0.3);
        }

        .clay-dropdown-item.selected .item-desc {
          color: rgba(255, 255, 255, 0.85);
        }

        .item-icon {
          font-size: 1.35rem;
          flex-shrink: 0;
        }

        .item-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-label {
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .item-desc {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 1px;
          font-weight: 500;
        }

        .item-check {
          font-size: 0.95rem;
          font-weight: 900;
          background: rgba(255, 255, 255, 0.25);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Input Groups ── */
        .clay-field-group {
          margin-bottom: 0.85rem;
        }

        .clay-field-group:last-child {
          margin-bottom: 0;
        }

        .clay-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
          padding-left: 4px;
        }

        .clay-input-inset {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #e2eaf4;
          border-radius: 18px;
          padding: 0.45rem 1rem;
          border: 2px solid transparent;
          box-shadow:
            inset 4px 4px 8px rgba(162, 178, 201, 0.45),
            inset -3px -3px 6px rgba(255, 255, 255, 0.9);
          transition: all 0.2s ease;
        }

        .clay-input-inset:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.15),
            inset 2px 2px 4px rgba(162, 178, 201, 0.25),
            inset -2px -2px 4px rgba(255, 255, 255, 0.8);
        }

        .input-icon {
          font-size: 1.15rem;
          opacity: 0.8;
          flex-shrink: 0;
        }

        .clay-input {
          flex: 1;
          border: none;
          background: transparent;
          color: #0f172a;
          font-size: 0.92rem;
          font-weight: 600;
          font-family: inherit;
          padding: 0.5rem 0;
          outline: none;
          width: 100%;
        }

        .clay-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .clay-eye-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 4px;
          border-radius: 8px;
          opacity: 0.7;
          transition: opacity 0.15s;
        }

        .clay-eye-btn:hover {
          opacity: 1;
        }

        /* ── 3D Clay Submit Button ── */
        .clay-submit-btn {
          width: 100%;
          padding: 1.05rem;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border-radius: 22px;
          border: 2px solid rgba(255, 255, 255, 0.65);
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow:
            10px 14px 28px rgba(37, 99, 235, 0.42),
            -4px -4px 10px rgba(255, 255, 255, 0.7),
            inset 3px 3px 6px rgba(255, 255, 255, 0.5),
            inset -4px -4px 8px rgba(15, 23, 42, 0.35);
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.2rem;
        }

        .clay-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            12px 18px 32px rgba(37, 99, 235, 0.48),
            -4px -4px 12px rgba(255, 255, 255, 0.8),
            inset 4px 4px 8px rgba(255, 255, 255, 0.6),
            inset -4px -4px 8px rgba(15, 23, 42, 0.35);
        }

        .clay-submit-btn:active:not(:disabled) {
          transform: translateY(2px) scale(0.99);
          box-shadow:
            4px 6px 16px rgba(37, 99, 235, 0.35),
            inset 4px 4px 10px rgba(15, 23, 42, 0.4),
            inset -2px -2px 6px rgba(255, 255, 255, 0.3);
        }

        .clay-submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .btn-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clay-spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.4);
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
          margin-top: 1.4rem;
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .clay-card {
            padding: 2.2rem 1.4rem 1.6rem 1.4rem;
            border-radius: 28px;
          }
          .clay-title {
            font-size: 1.65rem;
          }
          .clay-floating-orb {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
