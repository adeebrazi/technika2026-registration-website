import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  registrationId: string;
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  course: string;
  semester: string;
  paymentUTR: string;
  gender: string;
}

interface EnrolledEvent {
  eventId: string;
  registrationType: 'INDIVIDUAL' | 'TEAM';
  teamId?: string;
}

interface EventItem {
  eventId: string;
  name: string;
  category: string;
  description?: string;
  individualAllowed: boolean;
  teamAllowed: boolean;
  minMembers: number;
  maxMembers: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Guard routing on mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');

  // Core Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<EnrolledEvent[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const loadDashboardData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Profile and Registrations
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meRes.ok) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const meData = await meRes.json();
      setCurrentUser(meData.user);
      const regList = meData.registeredEvents || [];
      setRegisteredEvents(regList);

      // 2. Fetch Events List
      const evRes = await fetch('/api/events');
      if (evRes.ok) {
        const evData = await evRes.json();
        setAllEvents(evData);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!token) return null;

  return (
    <div className="container" style={{ marginTop: '4.8vh' }}>
      {/* Dynamic Alert Banner */}
      {alert && (
        <div
          className="error-panel"
          style={{
            position: 'fixed',
            top: '90px',
            right: '20px',
            zIndex: 1100,
            maxWidth: '380px',
            boxShadow: '4px 4px 0 var(--border-color)',
            background: alert.type === 'success' ? '#064e3b' : '#7f1d1d',
            borderColor: alert.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            display: 'flex',
          }}
        >
          <i
            className={alert.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}
            style={{ color: alert.type === 'success' ? 'var(--success)' : 'var(--error)' }}
          ></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Main Dashboard Subnav Card */}
      <div className="card glassmorphism dashboard-nav">
        {/* TECHNIKA 6.0 Logo — Sleek integrated cyber branding */}
        <div
          className="dashboard-brand"
          onClick={() => setActiveTab('dashboard')}
          title="Technika 6.0 Dashboard"
        >
          <span className="dashboard-brand-tech">TECH</span>
          <span className="dashboard-brand-nika">NIKA</span>
          <span className="dashboard-brand-ver">6.0</span>
        </div>

        <div className="nav-tabs">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fa-solid fa-gauge-high"></i>
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fa-solid fa-user-gear"></i>
            <span>Profile</span>
          </button>
          <a
            href="/brochure.pdf"
            target="_blank"
            rel="noreferrer"
            className="nav-tab-btn nav-tab-brochure"
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span>Brochure</span>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem', opacity: 0.85 }}></i>
          </a>
        </div>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Logout</span>
        </button>
      </div>

      {loadingData ? (
        <div className="card glassmorphism text-center" style={{ padding: '60px' }}>
          <div className="events-loader">
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem' }}></i> Loading account information...
          </div>
        </div>
      ) : (
        <>
          {/* 1. DASHBOARD SECTION (Participated Events) */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-section" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div className="card glassmorphism" style={{ padding: '25px' }}>
                <div className="info-title">
                  <span>
                    <i className="fa-solid fa-square-poll-horizontal"></i> My Participated Events
                  </span>
                </div>

                <p className="section-subtitle" style={{ marginTop: '8px', marginBottom: '15px' }}>
                  Below are the events you are officially enrolled in. Your event pass and entry QR code will verify these entries.
                </p>

                <div>
                  {registeredEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '30px 10px', background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-receipt" style={{ fontSize: '2.2rem', color: 'var(--text-muted)' }}></i>
                      <p style={{ margin: 0, fontWeight: 600 }}>You have not registered for any events yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {registeredEvents.map((reg) => {
                        const event = allEvents.find((e) => e.eventId === reg.eventId);
                        const isGroupEvent = (event?.maxMembers ?? 1) > 1 || Boolean(event?.teamAllowed);

                        return (
                          <div
                            key={reg.eventId}
                            className="dashboard-event-card"
                            style={{
                              padding: '16px 20px',
                              background: 'var(--card)',
                              border: '3px solid var(--border-color)',
                              boxShadow: '5px 5px 0px 0px var(--border-color)',
                              color: 'var(--text-main)',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 800 }}>
                                  {event ? event.name : reg.eventId}
                                </h4>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Event ID: {reg.eventId}</small>
                              </div>
                              <span
                                className="badge-indiv"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  borderRadius: '0px',
                                  border: '2px solid #000000',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  background: '#8aebee',
                                  color: '#000000',
                                  boxShadow: '2px 2px 0px 0px #000000',
                                }}
                              >
                                ✓ Confirmed (Individual)
                              </span>
                            </div>

                            {/* Group / Team Event On-Spot Notice */}
                            {isGroupEvent && (
                              <div style={{ marginTop: '12px', borderTop: '1.5px dashed var(--border-color)', paddingTop: '10px' }}>
                                <div style={{
                                  background: 'rgba(255, 230, 0, 0.12)',
                                  border: '1.5px solid #FFE600',
                                  padding: '8px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: 'var(--text-main)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <span style={{ fontSize: '1.1rem' }}>👥</span>
                                  <span>
                                    <strong>Group / Team Event:</strong> Teams will be formed directly on-spot with your friends at the event venue during reporting!
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PROFILE SECTION */}
          {activeTab === 'profile' && currentUser && (
            <div className="dashboard-section">
              <div className="card glassmorphism" style={{ padding: '25px', maxWidth: '650px', margin: '0 auto' }}>
                <div className="info-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>
                    <i className="fa-solid fa-user-astronaut"></i> Personal Details
                  </span>
                </div>

                <p className="section-subtitle" style={{ marginTop: '8px', marginBottom: '15px' }}>
                  Your verified student registration details. Profile details are strictly read-only.
                </p>

                <div className="profile-list" style={{ marginTop: '15px' }}>
                  <div className="profile-item">
                    <span>Registration ID</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--secondary)' }}>
                      {currentUser.registrationId}
                    </span>
                  </div>
                  <div className="profile-item">
                    <span>Full Name</span>
                    <span>{currentUser.name}</span>
                  </div>
                  <div className="profile-item">
                    <span>Gmail Address</span>
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="profile-item">
                    <span>WhatsApp Number</span>
                    <span>{currentUser.whatsapp}</span>
                  </div>
                  <div className="profile-item">
                    <span>Institution</span>
                    <span>{currentUser.institution}</span>
                  </div>
                  <div className="profile-item">
                    <span>Course & Standard</span>
                    <span>{`${currentUser.course} - Sem ${currentUser.semester}`}</span>
                  </div>
                  <div className="profile-item">
                    <span>Payment UTR</span>
                    <span style={{ fontFamily: 'monospace' }}>{currentUser.paymentUTR}</span>
                  </div>
                  <div className="profile-item">
                    <span>Gender</span>
                    <span>{currentUser.gender}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
