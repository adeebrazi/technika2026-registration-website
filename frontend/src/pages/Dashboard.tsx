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

interface TeamMember {
  registrationId: string;
  name: string;
  email: string;
  whatsapp?: string;
  institution?: string;
  role: 'Leader' | 'Member';
}

interface UserTeam {
  teamId: string;
  teamName: string;
  eventId: string;
  eventName?: string;
  leaderId: string;
  status: 'forming' | 'registered';
  members: TeamMember[];
  isLeader: boolean;
  memberCount: number;
  minMembers: number;
  maxMembers?: number;
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
  const [myTeams, setMyTeams] = useState<UserTeam[]>([]);

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

      // 3. Fetch My Teams
      const teamRes = await fetch('/api/teams/my-teams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setMyTeams(teamData);
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
                        const isTeam = reg.registrationType === 'TEAM';
                        const userTeam = myTeams.find((t) => t.eventId === reg.eventId);

                        return (
                          <div
                            key={reg.eventId}
                            style={{
                              padding: '16px 20px',
                              background: 'var(--input-bg, #1e293b)',
                              border: '3px solid var(--foreground)',
                              boxShadow: '5px 5px 0px 0px var(--foreground)',
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
                                className={isTeam ? 'badge-team' : 'badge-indiv'}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {isTeam ? `Team (${reg.teamId})` : 'Individual'}
                              </span>
                            </div>

                            {/* Team Roster & Details (Confirmed & Read-Only) */}
                            {isTeam && (
                              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                  <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                                      TEAM: <span style={{ color: '#FFE600' }}>{userTeam?.teamName || 'Team'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 900, color: '#FFE600', background: '#000000', padding: '2px 8px', border: '1.5px solid #FFE600' }}>
                                        TEAM ID: {reg.teamId}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.68rem', fontWeight: 900, padding: '3px 8px', border: '1px solid #000' }}>
                                      ✓ REGISTERED TEAM
                                    </span>
                                  </div>
                                </div>

                                {userTeam && userTeam.members && userTeam.members.length > 0 && (
                                  <>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                      Team Roster ({userTeam.members.length} {userTeam.members.length === 1 ? 'Member' : 'Members'})
                                    </div>

                                    {userTeam.members.map((member) => (
                                      <div
                                        key={member.registrationId}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '7px 12px',
                                          background: 'rgba(0,0,0,0.2)',
                                          border: '1px solid var(--border-color)',
                                          marginBottom: '5px',
                                          fontSize: '0.8rem',
                                          flexWrap: 'wrap',
                                          gap: '6px'
                                        }}
                                      >
                                        <div>
                                          <strong>{member.name}</strong>
                                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '6px' }}>
                                            ({member.registrationId})
                                          </span>
                                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {member.email} {member.whatsapp ? `· 📞 ${member.whatsapp}` : ''}
                                          </div>
                                        </div>
                                        <span
                                          style={{
                                            background: member.role === 'Leader' ? '#FFE600' : '#8aebee',
                                            color: '#000',
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            padding: '2px 6px',
                                            border: '1px solid #000'
                                          }}
                                        >
                                          {member.role.toUpperCase()}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                )}
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
