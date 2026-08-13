import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { getEventPhoto, getEventDetails } from '../utils/eventHelpers';

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
  role: 'Leader' | 'Member';
}

interface PendingInvite {
  registrationId: string;
  name: string;
  email: string;
}

interface UserTeam {
  teamId: string;
  eventId: string;
  leaderId: string;
  status: 'forming' | 'registered';
  members: TeamMember[];
  pendingInvites: PendingInvite[];
  isLeader: boolean;
  memberCount: number;
  minMembers: number;
}

interface Notification {
  _id: string;
  type: 'TEAM_INVITE' | 'SYSTEM';
  message: string;
  createdAt: string;
  invitation?: {
    teamId: string;
    eventId: string;
    eventName: string;
    senderName: string;
    senderEmail: string;
    status: 'pending' | 'accepted' | 'declined';
  };
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [activeModalEvent, setActiveModalEvent] = useState<any>(null);

  // Guard routing on mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'alerts' | 'arenas'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeEnrollId, setActiveEnrollId] = useState<string | null>(null);

  // Core Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<EnrolledEvent[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [myTeams, setMyTeams] = useState<UserTeam[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Inputs
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveEnrollId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

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
      setRegisteredEventIds(new Set(regList.map((r: any) => r.eventId)));

      // 2. Fetch Notifications
      const notifRes = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }

      // 3. Fetch Events List
      const evRes = await fetch('/api/events');
      if (evRes.ok) {
        const evData = await evRes.json();
        setAllEvents(evData);
      }

      // 4. Fetch My Teams
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

  // Compute pending notification badge count
  const pendingInvitesCount = useMemo(() => {
    return notifications.filter((n) => n.type === 'TEAM_INVITE' && n.invitation?.status === 'pending').length;
  }, [notifications]);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Edit WhatsApp number actions
  const openEditWhatsappModal = () => {
    if (!currentUser) return;
    setEditWhatsappNumber(currentUser.whatsapp || '');
    setEditModalOpen(true);
  };

  const handleEditWhatsappSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWhatsappNumber.trim()) {
      window.alert('Please enter a valid WhatsApp number.');
      return;
    }
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whatsapp: editWhatsappNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update WhatsApp number.');

      window.alert('WhatsApp number updated successfully!');
      setEditModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      window.alert(err.message || 'Error updating WhatsApp number.');
    }
  };

  // Respond to invitation
  const respondToInvite = async (notifId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to respond.');

      window.alert(data.message);
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      window.alert(err.message || 'Error updating response.');
    }
  };

  // Individual Event Registration
  const enrollIndividual = async (eventId: string) => {
    setAlert(null);
    try {
      const res = await fetch('/api/events/register-individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed.');

      setAlert({ message: 'Successfully registered solo!', type: 'success' });
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error enrolling in event.', type: 'error' });
    }
  };

  // Team Operations
  const handleCreateTeam = async (eventId: string) => {
    setAlert(null);
    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create team.');

      setAlert({ message: 'Team successfully created! You are the Team Leader.', type: 'success' });
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error creating team.', type: 'error' });
    }
  };

  const handleSendInvitation = async (teamId: string) => {
    setAlert(null);
    const email = inviteEmails[teamId]?.trim();
    if (!email) {
      setAlert({ message: 'Please enter an email address to invite.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId, inviteeEmail: email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send invite.');

      setAlert({ message: data.message, type: 'success' });
      setInviteEmails((prev) => ({ ...prev, [teamId]: '' }));
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error sending invite.', type: 'error' });
    }
  };

  const handleLockTeam = async (teamId: string) => {
    setAlert(null);
    try {
      const res = await fetch('/api/teams/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to lock team.');

      setAlert({ message: data.message, type: 'success' });
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error locking team.', type: 'error' });
    }
  };

  const handleConvertToTeam = async (eventId: string) => {
    setAlert(null);
    if (!window.confirm('Are you sure you want to convert your individual registration into a team? This action cannot be reversed.')) {
      return;
    }

    try {
      const res = await fetch('/api/teams/convert-from-individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to convert.');

      setAlert({ message: 'Successfully converted! You are now the Team Leader.', type: 'success' });
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error converting registration.', type: 'error' });
    }
  };

  const handleConvertToSolo = async (teamId: string, eventName: string) => {
    setAlert(null);
    const msg = `Are you sure you want to convert your team registration for "${eventName}" to a Solo registration? The team will be disbanded and pending invites cancelled. This action cannot be reversed.`;
    if (!window.confirm(msg)) {
      return;
    }

    try {
      const res = await fetch('/api/teams/convert-to-individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to convert.');

      setAlert({ message: 'Successfully converted registration to Solo!', type: 'success' });
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error converting registration.', type: 'error' });
    }
  };

  const handleRemoveRosterMember = async (teamId: string, targetId: string, name: string, isInvite = false) => {
    setAlert(null);
    const msg = isInvite
      ? `Are you sure you want to cancel the pending invitation for "${name}"?`
      : `Are you sure you want to remove "${name}" from your team?`;

    if (!window.confirm(msg)) return;

    try {
      const res = await fetch('/api/teams/remove-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId, targetUserId: targetId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed.');

      setAlert({ message: data.message, type: 'success' });
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error updating team roster.', type: 'error' });
    }
  };

  const handleCancelTeamRegistration = async (teamId: string, isLeader: boolean) => {
    setAlert(null);
    const msg = isLeader
      ? "Are you sure you want to disband this team? All members' registrations for this event will be cancelled and the team dissolved."
      : "Are you sure you want to leave this team? Your registration for this event will be cancelled.";

    if (!window.confirm(msg)) return;

    try {
      const res = await fetch('/api/teams/cancel-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed.');

      setAlert({ message: data.message, type: 'success' });
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      setAlert({ message: err.message || 'Error cancelling registration.', type: 'error' });
    }
  };



  // Filter lists based on search
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return allEvents;
    const q = searchQuery.toLowerCase().trim();
    return allEvents.filter(
      (ev) => ev.name.toLowerCase().includes(q) || ev.category.toLowerCase().includes(q)
    );
  }, [allEvents, searchQuery]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(filteredEvents.map((e) => e.category)));
    return ['All', ...unique];
  }, [filteredEvents]);

  const categorizedEvents = useMemo(() => {
    return selectedCategory === 'All' ? filteredEvents : filteredEvents.filter((e) => e.category === selectedCategory);
  }, [filteredEvents, selectedCategory]);

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
        {/* TECHNIKA 6.0 Logo — matches the hero branding */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, userSelect: 'none', margin: 0, gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.55rem',
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
            }}>TECH</span>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.55rem',
              color: '#000000',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              background: 'var(--brut-lime, #8aebee)',
              border: '2px solid var(--foreground)',
              padding: '0 8px',
              display: 'inline-block',
            }}>NIKA</span>
          </div>
          <div>
            <span style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '1.1rem',
              letterSpacing: '-0.02em',
              padding: '0 8px',
              display: 'inline-block',
              color: 'var(--background)',
              background: 'var(--foreground)',
              border: '2px solid var(--foreground)',
            }}>6.0</span>
          </div>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fa-solid fa-gauge-high"></i> Dashboard
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fa-solid fa-user-gear"></i> Profile
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <i className="fa-solid fa-bell"></i> Alerts{' '}
            {pendingInvitesCount > 0 && <span className="badge">{pendingInvitesCount}</span>}
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'arenas' ? 'active' : ''}`}
            onClick={() => setActiveTab('arenas')}
          >
            <i className="fa-solid fa-trophy"></i> Technika 6.0 Arenas
          </button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
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
          {/* 1. DASHBOARD SECTION (Participated Events + Add More Events) */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-section" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* Part A: Participated Events & Receipt Download */}
              <div className="card glassmorphism" style={{ padding: '25px' }}>
                <div className="info-title">
                  <span>
                    <i className="fa-solid fa-square-poll-horizontal"></i> My Participated Events
                  </span>
                </div>

                <p className="section-subtitle" style={{ marginTop: '8px', marginBottom: '15px' }}>
                  Below are the events you are officially enrolled in. Your attendance QR code will contain these events.
                </p>

                <div>
                  {registeredEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '25px 10px', background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-receipt" style={{ fontSize: '2rem', marginBottom: '4px', color: 'var(--text-muted)' }}></i>
                      <p style={{ margin: 0 }}>You have not registered for any events yet.</p>
                      <button
                        type="button"
                        className="submit-btn"
                        style={{
                          width: 'auto',
                          padding: '6px 14px',
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          background: 'var(--brut-lime, #8aebee)',
                          color: '#000000',
                          border: '2.5px solid #000000',
                          boxShadow: '2px 2px 0px 0px #000000',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                        onClick={() => setActiveTab('arenas')}
                      >
                        <i className="fa-solid fa-trophy"></i> Explore Events & Arenas
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {registeredEvents.map((reg) => {
                        const event = allEvents.find((e) => e.eventId === reg.eventId);
                        const isTeam = reg.registrationType === 'TEAM';
                        const userTeam = myTeams.find((t) => t.eventId === reg.eventId);
                        const isHybrid = event && event.individualAllowed && event.teamAllowed;
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
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 800 }}>{event ? event.name : reg.eventId}</h4>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Event ID: {reg.eventId}</small>
                              </div>
                              <span
                                className={isTeam ? 'badge-team' : 'badge-indiv'}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {isTeam ? `Team (${reg.teamId})` : 'Individual'}
                              </span>
                            </div>

                            {/* Convert to Team Option for Hybrid Events */}
                            {!isTeam && isHybrid && (
                              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  <i className="fa-solid fa-circle-info"></i> Registered individually. Convert to team to play with friends.
                                </small>
                                <button
                                  className="submit-btn"
                                  style={{ width: 'auto', padding: '4px 10px', fontSize: '0.72rem', background: '#FFE600', color: '#000', margin: 0 }}
                                  onClick={() => handleConvertToTeam(reg.eventId)}
                                >
                                  <i className="fa-solid fa-users-gear"></i> Convert to Team
                                </button>
                              </div>
                            )}

                            {/* Team Roster details */}
                            {isTeam && userTeam && (
                              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 900, color: '#FFE600' }}>
                                    TEAM ID: {userTeam.teamId}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {userTeam.status === 'registered' ? (
                                      <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', border: '1px solid #000' }}>REGISTERED (LOCKED)</span>
                                    ) : (
                                      <span style={{ background: '#FFE600', color: '#000', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', border: '1px solid #000' }}>FORMING</span>
                                    )}
                                    {userTeam.status === 'forming' && (
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        {userTeam.isLeader && event?.individualAllowed && (
                                          <button
                                            type="button"
                                            className="submit-btn"
                                            onClick={() => handleConvertToSolo(userTeam.teamId, event.name)}
                                            style={{
                                              padding: '2px 8px',
                                              fontSize: '0.68rem',
                                              background: '#FFE600',
                                              color: '#000',
                                              marginTop: 0,
                                              border: '1.5px solid #000',
                                              boxShadow: 'none',
                                              width: 'auto',
                                              fontWeight: 800,
                                            }}
                                          >
                                            <i className="fa-solid fa-user"></i> Go Solo
                                          </button>
                                        )}
                                        <button
                                          className="logout-btn"
                                          onClick={() => handleCancelTeamRegistration(userTeam.teamId, userTeam.isLeader)}
                                          style={{ padding: '2px 8px', fontSize: '0.68rem', background: '#ef4444', color: '#fff', marginTop: 0 }}
                                        >
                                          {userTeam.isLeader ? 'Disband' : 'Leave'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Team Roster</div>
                                {userTeam.members.map((member) => {
                                  const showRemove = userTeam.isLeader && userTeam.status === 'forming' && member.role !== 'Leader';
                                  return (
                                    <div key={member.registrationId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-color)', marginBottom: '4px', fontSize: '0.8rem' }}>
                                      <span><strong>{member.name}</strong> ({member.email})</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ background: member.role === 'Leader' ? '#FFE600' : '#8aebee', color: '#000', fontSize: '0.65rem', fontWeight: 900, padding: '1px 4px' }}>{member.role}</span>
                                        {showRemove && (
                                          <button onClick={() => handleRemoveRosterMember(userTeam.teamId, member.registrationId, member.name)} style={{ background: '#ef4444', color: '#fff', border: 'none', fontSize: '0.7rem', cursor: 'pointer', padding: '1px 4px' }}>✕</button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {userTeam.pendingInvites.map((inv) => {
                                  const showCancel = userTeam.isLeader && userTeam.status === 'forming';
                                  return (
                                    <div key={inv.registrationId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'transparent', border: '1px dashed var(--border-color)', marginBottom: '4px', fontSize: '0.78rem', opacity: 0.85 }}>
                                      <span>{inv.name} ({inv.email})</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ background: '#64748b', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '1px 4px' }}>INVITED</span>
                                        {showCancel && (
                                          <button onClick={() => handleRemoveRosterMember(userTeam.teamId, inv.registrationId, inv.name, true)} style={{ background: '#ef4444', color: '#fff', border: 'none', fontSize: '0.7rem', cursor: 'pointer', padding: '1px 4px' }}>✕</button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {userTeam.isLeader && userTeam.status === 'forming' && (
                                  <div style={{ marginTop: '12px' }}>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                      <input
                                        type="email"
                                        placeholder="Enter friend's Gmail address"
                                        value={inviteEmails[userTeam.teamId] || ''}
                                        onChange={(e) => setInviteEmails((prev) => ({ ...prev, [userTeam.teamId]: e.target.value }))}
                                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem', background: '#ffffff', color: '#000', border: '1.5px solid #000' }}
                                      />
                                      <button style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 900, background: '#FFE600', color: '#000', border: '1.5px solid #000', cursor: 'pointer' }} onClick={() => handleSendInvitation(userTeam.teamId)}>
                                        INVITE
                                      </button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Min {userTeam.minMembers} to lock ({userTeam.memberCount})</small>
                                      <button
                                        disabled={userTeam.memberCount < userTeam.minMembers}
                                        onClick={() => handleLockTeam(userTeam.teamId)}
                                        style={{ padding: '6px 16px', fontSize: '0.78rem', fontWeight: 900, background: userTeam.memberCount >= userTeam.minMembers ? '#10b981' : '#475569', color: '#fff', border: '1.5px solid #000', cursor: userTeam.memberCount >= userTeam.minMembers ? 'pointer' : 'not-allowed' }}
                                      >
                                        🔒 LOCK TEAM
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <button
                          type="button"
                          className="submit-btn"
                          style={{
                            width: 'auto',
                            padding: '6px 16px',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            background: 'var(--brut-lime, #8aebee)',
                            color: '#000000',
                            border: '2px solid #000000',
                            boxShadow: '3px 3px 0px 0px #000000',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                          }}
                          onClick={() => setActiveTab('arenas')}
                        >
                          <i className="fa-solid fa-plus"></i> Participate in More Events
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 1.5. Technika 6.0 Arenas tab block */}
          {activeTab === 'arenas' && (
            <div className="dashboard-section" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div className="card glassmorphism" style={{ padding: '30px' }}>
                <div className="card-header" style={{ marginBottom: '20px', paddingBottom: '15px' }}>
                  <h2>Technika 6.0 Arenas</h2>
                  <p>Explore all available competitions. Enroll in individual events directly or create teams and invite friends!</p>
                </div>

                {/* Search query */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="input-wrapper" style={{ maxWidth: '450px', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--panel-border)' }}>
                    <i className="fa-solid fa-magnifying-glass input-icon" style={{ color: 'var(--text-dark)' }}></i>
                    <input
                      type="text"
                      placeholder="Search events by name or category..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedCategory('All');
                      }}
                      style={{ background: 'transparent', border: 'none', width: '100%', color: '#fff', padding: '10px 10px 10px 40px', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {/* Category tags selector */}
                <div className="category-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Events listing */}
                <div style={{ marginTop: '20px' }}>
                  {categorizedEvents.length === 0 ? (
                    <p className="help-text">No active events found in this category.</p>
                  ) : (
                    <div className="events-grid">
                      {categorizedEvents.map((event, evtIdx) => {
                        const isEnrolled = registeredEventIds.has(event.eventId);
                        const evtDetail = getEventDetails(event.eventId || event.name);
                        const dateText = evtDetail?.date || 'Day 1';
                        const timeText = evtDetail?.time || '10:30 AM';
                        const venueText = evtDetail?.venue || 'Campus Arena';
                        const descText = evtDetail?.description || event.description;
                        
                        let regTypeBadge = 'SOLO';
                        if (event.individualAllowed && event.teamAllowed) {
                          regTypeBadge = 'SOLO / TEAM';
                        } else if (!event.individualAllowed && event.teamAllowed) {
                          regTypeBadge = 'TEAM ONLY';
                        }

                        return (
                          <div
                            key={event.eventId}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              minHeight: '300px',
                              padding: '12px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              textAlign: 'left',
                              color: '#ffffff',
                              border: '3px solid #ffffff',
                              boxShadow: '5px 5px 0px 0px #ffffff',
                              background: '#000000',
                              borderRadius: '4px',
                            }}
                          >
                            {/* Background Image & Gradient */}
                            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                              <img
                                src={getEventPhoto(event.name || event.eventId, evtIdx)}
                                alt={event.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 100%)'
                              }} />
                            </div>

                            {/* Card Content Layer */}
                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: '#ffffff', textShadow: '2px 2px 0px #000000', lineHeight: 1 }}>
                                  {String(evtIdx + 1).padStart(2, '0')}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span
                                    style={{
                                      fontSize: '0.62rem',
                                      textTransform: 'uppercase',
                                      fontWeight: 900,
                                      letterSpacing: '0.08em',
                                      padding: '2px 6px',
                                      color: '#000000',
                                      border: '1.5px solid #000000',
                                      boxShadow: '2px 2px 0px 0px #000000',
                                      background: '#8aebee'
                                    }}
                                  >
                                    {event.category}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.62rem',
                                      textTransform: 'uppercase',
                                      fontWeight: 900,
                                      letterSpacing: '0.08em',
                                      padding: '2px 6px',
                                      color: '#000000',
                                      border: '1.5px solid #000000',
                                      boxShadow: '2px 2px 0px 0px #000000',
                                      background: '#FFE600'
                                    }}
                                  >
                                    {regTypeBadge}
                                  </span>
                                </div>
                              </div>

                              <div style={{ marginTop: 'auto' }}>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', margin: '0 0 4px 0', textShadow: '2px 2px 0px #000000' }}>
                                  {event.name}
                                </h3>
                                <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#e2e8f0', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                                  {descText}
                                </p>
                              </div>

                              <div>
                                {/* Date & Time and Venue Pill Badges */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                                  <span style={{ background: 'rgba(0,0,0,0.9)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.6)', padding: '2px 5px' }}>
                                    📅 {dateText} · {timeText}
                                  </span>
                                  <span style={{ background: '#ffffff', color: '#000000', border: '1px solid #000000', padding: '2px 5px' }}>
                                    📍 {venueText}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveModalEvent(evtDetail || { title: event.name, category: event.category, description: descText, date: dateText, time: timeText, venue: venueText })}
                                    style={{
                                      fontSize: '0.65rem',
                                      textTransform: 'uppercase',
                                      fontWeight: 900,
                                      background: '#8aebee',
                                      color: '#000000',
                                      border: '1.5px solid #000000',
                                      boxShadow: '2px 2px 0px 0px #000000',
                                      padding: '4px 8px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    View details →
                                  </button>

                                  {isEnrolled ? (
                                    <button className="submit-btn" disabled style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', boxShadow: 'none', padding: '4px 8px', fontSize: '0.65rem', width: 'auto' }}>
                                      <i className="fa-solid fa-circle-check"></i> Enrolled
                                    </button>
                                  ) : event.individualAllowed && event.teamAllowed ? (
                                    <div className={`enroll-container ${activeEnrollId === event.eventId ? 'active' : ''}`}>
                                      <button
                                        type="button"
                                        className="submit-btn"
                                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.65rem', background: '#FFE600', color: '#000', margin: 0 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveEnrollId(activeEnrollId === event.eventId ? null : event.eventId);
                                        }}
                                      >
                                        Enroll →
                                      </button>
                                      <div className="enroll-options">
                                        <button
                                          type="button"
                                          className="enroll-option-btn"
                                          style={{ background: '#8aebee', color: '#000' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            enrollIndividual(event.eventId);
                                            setActiveEnrollId(null);
                                          }}
                                        >
                                          Solo
                                        </button>
                                        <button
                                          type="button"
                                          className="enroll-option-btn"
                                          style={{ background: '#FF7A00', color: '#000' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCreateTeam(event.eventId);
                                            setActiveEnrollId(null);
                                          }}
                                        >
                                          Team
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      className="submit-btn"
                                      style={{ width: 'auto', padding: '4px 8px', fontSize: '0.65rem', background: '#FFE600', color: '#000' }}
                                      onClick={() => {
                                        if (event.individualAllowed) {
                                          enrollIndividual(event.eventId);
                                        } else {
                                          handleCreateTeam(event.eventId);
                                        }
                                      }}
                                    >
                                      Enroll →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
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
                  <div className="profile-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>WhatsApp Number</span>
                      <button
                        type="button"
                        onClick={openEditWhatsappModal}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--secondary)',
                          color: 'var(--secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{currentUser.whatsapp}</span>
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

          {/* 3. ALERTS SECTION */}
          {activeTab === 'alerts' && (
            <div className="dashboard-section">
              <div className="card glassmorphism" style={{ padding: '30px' }}>
                <div className="card-header" style={{ marginBottom: '25px', paddingBottom: '15px' }}>
                  <h2>Team Invitations & Notifications Inbox</h2>
                  <p>Accept invitations from team leaders to join team events. Accepting will enroll you in the event immediately.</p>
                </div>

                <div>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '40px 10px' }}>
                      <i className="fa-solid fa-envelope-open" style={{ fontSize: '2.2rem', marginBottom: '12px' }}></i>
                      <p>Your inbox is empty. No invitations or notifications received yet.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const dateStr = new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                      if (notif.type === 'TEAM_INVITE' && notif.invitation) {
                        const inv = notif.invitation;
                        if (inv.status === 'pending') {
                          return (
                            <div key={notif._id} className="notif-card">
                              <div className="notif-info">
                                <h4>Team Invitation: {inv.eventName}</h4>
                                <p>Leader <strong>{inv.senderName}</strong> invited you to join team <strong>{inv.teamId}</strong>.</p>
                                <small style={{ color: 'var(--text-dark)', fontSize: '0.75rem' }}>
                                  <i className="fa-regular fa-clock"></i> {dateStr}
                                </small>
                              </div>
                              <div className="notif-actions">
                                <button className="notif-btn-accept" onClick={() => respondToInvite(notif._id, 'accept')}>
                                  <i className="fa-solid fa-check"></i> Accept
                                </button>
                                <button className="notif-btn-decline" onClick={() => respondToInvite(notif._id, 'decline')}>
                                  <i className="fa-solid fa-xmark"></i> Decline
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          const isAccepted = inv.status === 'accepted';
                          return (
                            <div key={notif._id} className="notif-card" style={{ opacity: 0.65 }}>
                              <div className="notif-info">
                                <h4>Team Invitation: {inv.eventName}</h4>
                                <p>Invitation to team <strong>{inv.teamId}</strong> was <strong>{inv.status}</strong>.</p>
                                <small style={{ color: 'var(--text-dark)', fontSize: '0.75rem' }}>
                                  <i className="fa-regular fa-clock"></i> {dateStr}
                                </small>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  color: isAccepted ? 'var(--success)' : 'var(--error)',
                                }}
                              >
                                {isAccepted ? (
                                  <>
                                    Accepted <i className="fa-solid fa-circle-check"></i>
                                  </>
                                ) : (
                                  <>
                                    Declined <i className="fa-solid fa-circle-xmark"></i>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }
                      }

                      return (
                        <div key={notif._id} className="notif-card" style={{ opacity: 0.85 }}>
                          <div className="notif-info" style={{ flex: 1 }}>
                            <h4>Notification Log</h4>
                            <p>{notif.message}</p>
                            <small style={{ color: 'var(--text-dark)', fontSize: '0.75rem' }}>
                              <i className="fa-regular fa-clock"></i> {dateStr}
                            </small>
                          </div>
                          <div style={{ color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                            <i className="fa-regular fa-bell"></i>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit WhatsApp Number Modal */}
      {editModalOpen && (
        <div
          className="modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
          }}
        >
          <div className="card glassmorphism" style={{ width: '90%', maxWidth: '420px', padding: '25px', borderColor: 'var(--secondary)' }}>
            <div className="card-header" style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3>Edit WhatsApp Number</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Only your WhatsApp number can be updated.</p>
            </div>
            <form onSubmit={handleEditWhatsappSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="edit-whatsapp">WhatsApp Number</label>
                <div className="input-wrapper">
                  <i className="fa-brands fa-whatsapp input-icon"></i>
                  <input
                    type="tel"
                    id="edit-whatsapp"
                    required
                    placeholder="Enter WhatsApp Number"
                    value={editWhatsappNumber}
                    onChange={(e) => setEditWhatsappNumber(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="logout-btn"
                  onClick={() => setEditModalOpen(false)}
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', marginTop: 0 }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" style={{ width: 'auto', padding: '8px 20px' }}>
                  Save Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EventDetailsModal event={activeModalEvent} onClose={() => setActiveModalEvent(null)} />
    </div>
  );
};
