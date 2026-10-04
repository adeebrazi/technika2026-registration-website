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

  // Team Member Management States
  const [addMemberInputs, setAddMemberInputs] = useState<Record<string, string>>({});
  const [addingMember, setAddingMember] = useState<Record<string, boolean>>({});
  const [formingTeam, setFormingTeam] = useState<Record<string, boolean>>({});
  const [removingMember, setRemovingMember] = useState<Record<string, boolean>>({});
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleAddMember = async (teamId: string) => {
    const input = (addMemberInputs[teamId] || '').trim();
    if (!input) {
      setAlert({ message: "Please enter your friend's Registration ID (e.g. SCLA3P) or Gmail address.", type: 'error' });
      return;
    }

    setAddingMember(prev => ({ ...prev, [teamId]: true }));
    try {
      const res = await fetch('/api/teams/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamId, memberIdentifier: input })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add member to team.');
      }

      setAlert({ message: data.message || 'Teammate added successfully!', type: 'success' });
      setAddMemberInputs(prev => ({ ...prev, [teamId]: '' }));
      await loadDashboardData();
    } catch (err: any) {
      setAlert({ message: err.message || 'Error adding teammate.', type: 'error' });
    } finally {
      setAddingMember(prev => ({ ...prev, [teamId]: false }));
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} (${memberId}) from your team roster?`)) {
      return;
    }

    const key = `${teamId}_${memberId}`;
    setRemovingMember(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/teams/remove-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamId, targetUserId: memberId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove member.');
      }

      setAlert({ message: data.message || 'Member removed successfully.', type: 'success' });
      await loadDashboardData();
    } catch (err: any) {
      setAlert({ message: err.message || 'Error removing member.', type: 'error' });
    } finally {
      setRemovingMember(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleFormTeam = async (teamId: string, teamName: string, eventName: string, memberCount: number, minMembers: number) => {
    if (memberCount < minMembers) {
      setAlert({
        message: `Cannot form team yet. Minimum required is ${minMembers} members (currently ${memberCount}/${minMembers}). Please add your teammates or share your Team Code (${teamId}) to complete the roster.`,
        type: 'error'
      });
      return;
    }

    if (!window.confirm(`Lock and officially form team "${teamName}" (${teamId}) for "${eventName}" with ${memberCount} members? Once finalized, your team roster is officially locked for Technika 6.0.`)) {
      return;
    }

    setFormingTeam(prev => ({ ...prev, [teamId]: true }));
    try {
      const res = await fetch('/api/teams/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to finalize team.');
      }

      setAlert({ message: data.message || 'Team successfully formed and officially registered!', type: 'success' });
      await loadDashboardData();
    } catch (err: any) {
      setAlert({ message: err.message || 'Error finalizing team.', type: 'error' });
    } finally {
      setFormingTeam(prev => ({ ...prev, [teamId]: false }));
    }
  };

  const handleCopyTeamCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTeamId(code);
    setTimeout(() => setCopiedTeamId(null), 2500);
  };

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
                                className={isTeam ? 'badge-team' : 'badge-indiv'}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  borderRadius: '0px',
                                  border: '2px solid #000000',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  background: isTeam ? '#FFE600' : '#8aebee',
                                  color: '#000000',
                                  boxShadow: '2px 2px 0px 0px #000000',
                                }}
                              >
                                {isTeam ? `Team (${reg.teamId})` : 'Individual'}
                              </span>
                            </div>

                            {/* Team Roster & Details (Interactive Formation & Management) */}
                            {isTeam && (() => {
                              const minRequired = userTeam?.minMembers || event?.minMembers || 2;
                              const maxAllowed = userTeam?.maxMembers || event?.maxMembers || 4;
                              const currentMembers = userTeam?.members || [];
                              const memberCount = currentMembers.length > 0 ? currentMembers.length : 1;
                              const isFormed = userTeam?.status === 'registered';
                              const isReady = !isFormed && memberCount >= minRequired;
                              const isIncomplete = !isFormed && memberCount < minRequired;
                              const isLeader = userTeam ? (userTeam.isLeader || userTeam.leaderId === currentUser?.registrationId) : true;
                              const teamId = reg.teamId || userTeam?.teamId || '';

                              return (
                                <div style={{ marginTop: '14px', borderTop: '2px solid var(--border-color)', paddingTop: '14px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                      <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                                        TEAM NAME: <span style={{ color: 'var(--accent, #f5a201)' }}>{userTeam?.teamName || 'Team'}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 900, color: '#000000', background: '#FFE600', padding: '2px 8px', border: '1.5px solid #000000', boxShadow: '2px 2px 0px #000000' }}>
                                          TEAM ID: {teamId}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                                          Required: {minRequired} to {maxAllowed} Players
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      {isFormed ? (
                                        <span style={{ background: '#10b981', color: '#000000', fontSize: '0.72rem', fontWeight: 900, padding: '4px 10px', border: '1.5px solid #000000', boxShadow: '2px 2px 0px #000', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                          <i className="fa-solid fa-circle-check"></i> REGISTERED &amp; LOCKED
                                        </span>
                                      ) : isReady ? (
                                        <span style={{ background: '#3ce6fc', color: '#000000', fontSize: '0.72rem', fontWeight: 900, padding: '4px 10px', border: '1.5px solid #000000', boxShadow: '2px 2px 0px #000', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                          <i className="fa-solid fa-bolt"></i> READY TO FORM ({memberCount}/{minRequired} MET)
                                        </span>
                                      ) : (
                                        <span style={{ background: '#ff7a00', color: '#000000', fontSize: '0.72rem', fontWeight: 900, padding: '4px 10px', border: '1.5px solid #000000', boxShadow: '2px 2px 0px #000', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                          <i className="fa-solid fa-triangle-exclamation"></i> INCOMPLETE ({memberCount}/{minRequired} REQUIRED)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Team Criteria Guidance Alert */}
                                  {isIncomplete && (
                                    <div style={{ background: 'rgba(255, 122, 0, 0.12)', border: '2px dashed #ff7a00', padding: '10px 14px', marginTop: '10px', marginBottom: '14px', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                      <strong style={{ color: '#ff7a00' }}><i className="fa-solid fa-triangle-exclamation"></i> Minimum Players Required:</strong> This competition requires at least <strong>{minRequired} team members</strong> (max {maxAllowed}). You currently have <strong>{memberCount} member{memberCount === 1 ? '' : 's'}</strong>. A team cannot be formed with only 1 member. Add your teammates below or share your Team Code with friends to enable team formation.
                                    </div>
                                  )}

                                  {isReady && (
                                    <div style={{ background: 'rgba(60, 230, 252, 0.12)', border: '2px solid #3ce6fc', padding: '10px 14px', marginTop: '10px', marginBottom: '14px', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                      <strong style={{ color: '#3ce6fc' }}><i className="fa-solid fa-circle-check"></i> Criteria Satisfied:</strong> Your team has <strong>{memberCount} members</strong> (minimum {minRequired} met). You can now click <strong>"Form &amp; Finalize Team"</strong> below to lock your team, or continue adding members up to {maxAllowed}.
                                    </div>
                                  )}

                                  {isFormed && (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '2px solid #10b981', padding: '10px 14px', marginTop: '10px', marginBottom: '14px', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                      <strong style={{ color: '#10b981' }}><i className="fa-solid fa-shield-halved"></i> Team Formed &amp; Locked:</strong> This team is officially confirmed and locked for Technika 6.0 competition day.
                                    </div>
                                  )}

                                  {/* Team Roster List */}
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Team Roster ({memberCount} {memberCount === 1 ? 'Member' : 'Members'})
                                  </div>

                                  {currentMembers.length > 0 ? (
                                    currentMembers.map((member) => (
                                      <div
                                        key={member.registrationId}
                                        className="team-roster-row"
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '8px 12px',
                                          background: 'rgba(0,0,0,0.2)',
                                          border: '1px solid var(--border-color)',
                                          marginBottom: '6px',
                                          fontSize: '0.8rem',
                                          flexWrap: 'wrap',
                                          gap: '8px'
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

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span
                                            style={{
                                              background: member.role === 'Leader' ? '#FFE600' : '#8aebee',
                                              color: '#000',
                                              fontSize: '0.65rem',
                                              fontWeight: 900,
                                              padding: '2px 8px',
                                              border: '1px solid #000'
                                            }}
                                          >
                                            {member.role === 'Leader' ? '👑 LEADER' : '👤 MEMBER'}
                                          </span>

                                          {/* Leader can remove non-leader members before locking */}
                                          {isLeader && !isFormed && member.role !== 'Leader' && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveMember(teamId, member.registrationId, member.name)}
                                              disabled={removingMember[`${teamId}_${member.registrationId}`]}
                                              style={{
                                                background: '#ef4444',
                                                color: '#ffffff',
                                                border: '1px solid #000000',
                                                padding: '3px 8px',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                boxShadow: '1px 1px 0px #000',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                              }}
                                              title="Remove member from team"
                                            >
                                              <i className="fa-solid fa-xmark"></i> Remove
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--border-color)',
                                        marginBottom: '6px',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <div>
                                        <strong>{currentUser?.name || 'Leader'}</strong>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '6px' }}>
                                          ({currentUser?.registrationId})
                                        </span>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          {currentUser?.email} {currentUser?.whatsapp ? `· 📞 ${currentUser.whatsapp}` : ''}
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          background: '#FFE600',
                                          color: '#000',
                                          fontSize: '0.65rem',
                                          fontWeight: 900,
                                          padding: '2px 8px',
                                          border: '1px solid #000'
                                        }}
                                      >
                                        👑 LEADER
                                      </span>
                                    </div>
                                  )}

                                  {/* Leader Interactive Add & Invite Box */}
                                  {isLeader && !isFormed && (
                                    <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.05)', border: '2px solid var(--border-color)', padding: '16px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                        <span style={{ background: '#FFE600', color: '#000000', fontWeight: 900, fontSize: '0.72rem', padding: '2px 8px', border: '1px solid #000' }}>
                                          👑 LEADER ACTIONS
                                        </span>
                                        <span style={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase' }}>
                                          Add Friends &amp; Fill Roster
                                        </span>
                                      </div>

                                      {/* Option 1: Add registered participant directly */}
                                      <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-muted)' }}>
                                          Option 1: Add Registered Friend (By Registration ID or Gmail)
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          <input
                                            type="text"
                                            placeholder="e.g. SCLA3P or friend@gmail.com"
                                            value={addMemberInputs[teamId] || ''}
                                            onChange={(e) => setAddMemberInputs({ ...addMemberInputs, [teamId]: e.target.value })}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember(teamId); }}
                                            style={{
                                              flex: '1 1 240px',
                                              padding: '8px 12px',
                                              background: 'var(--input-bg, #000)',
                                              color: 'var(--text-main, #fff)',
                                              border: '2px solid var(--border-color, #000)',
                                              fontSize: '0.82rem',
                                              fontWeight: 700
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleAddMember(teamId)}
                                            disabled={addingMember[teamId]}
                                            style={{
                                              background: '#FFE600',
                                              color: '#000000',
                                              border: '2px solid #000000',
                                              boxShadow: '2px 2px 0px #000000',
                                              padding: '8px 16px',
                                              fontSize: '0.8rem',
                                              fontWeight: 900,
                                              cursor: 'pointer',
                                              textTransform: 'uppercase',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '6px'
                                            }}
                                          >
                                            <i className="fa-solid fa-user-plus"></i>
                                            {addingMember[teamId] ? 'ADDING...' : '+ ADD TO TEAM'}
                                          </button>
                                        </div>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
                                          * If your friend has already registered on Technika, enter their 6-character Registration ID or Gmail above.
                                        </small>
                                      </div>

                                      {/* Option 2: Friends haven't registered yet? Share Team Code */}
                                      <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-muted)' }}>
                                          Option 2: Friends Haven't Registered Yet? Share Team Code
                                        </label>
                                        <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1.5px solid var(--border-color)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                          <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                              Your Team Code:
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 900, color: '#FFE600', letterSpacing: '0.05em', marginTop: '2px' }}>
                                              {teamId}
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                              type="button"
                                              onClick={() => handleCopyTeamCode(teamId)}
                                              style={{
                                                background: copiedTeamId === teamId ? '#10b981' : '#ffffff',
                                                color: '#000000',
                                                border: '2px solid #000000',
                                                boxShadow: '2px 2px 0px #000000',
                                                padding: '6px 12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 900,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}
                                            >
                                              <i className={copiedTeamId === teamId ? 'fa-solid fa-check' : 'fa-solid fa-copy'}></i>
                                              {copiedTeamId === teamId ? 'COPIED!' : 'COPY CODE'}
                                            </button>

                                            <a
                                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey! Join my team *${userTeam?.teamName || 'Team'}* for *${event?.name || 'Technika 6.0'}*! \n\n👉 Join using Team Code: *${teamId}*\nRegister here: ${window.location.origin}/register?teamCode=${teamId}`)}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              style={{
                                                background: '#25D366',
                                                color: '#ffffff',
                                                border: '2px solid #000000',
                                                boxShadow: '2px 2px 0px #000000',
                                                padding: '6px 12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 900,
                                                textDecoration: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}
                                            >
                                              <i className="fa-brands fa-whatsapp"></i>
                                              SHARE ON WHATSAPP
                                            </a>
                                          </div>
                                        </div>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                          💡 <strong>Unregistered friends:</strong> When your friends register at the website, they select <strong>{event?.name || 'this event'}</strong> &rarr; <em>"Join Friend's Team"</em> and enter <strong>{teamId}</strong>. Once submitted, they are automatically linked to your roster above!
                                        </p>
                                      </div>

                                      {/* Form / Finalize Team Button */}
                                      <div style={{ marginTop: '18px', borderTop: '2px solid var(--border-color)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>
                                            FINAL TEAM SUBMISSION
                                          </div>
                                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {isIncomplete
                                              ? `Requires at least ${minRequired - memberCount} more member${minRequired - memberCount > 1 ? 's' : ''} to unlock team formation.`
                                              : `Criteria met (${memberCount}/${minRequired} players). You can now officially form and lock your team.`}
                                          </div>
                                        </div>

                                        {isIncomplete ? (
                                          <button
                                            type="button"
                                            disabled
                                            style={{
                                              background: '#374151',
                                              color: '#9ca3af',
                                              border: '2px solid #4b5563',
                                              padding: '10px 18px',
                                              fontSize: '0.8rem',
                                              fontWeight: 800,
                                              cursor: 'not-allowed',
                                              textTransform: 'uppercase',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}
                                            title={`Add at least ${minRequired - memberCount} more member(s) to form team.`}
                                          >
                                            <i className="fa-solid fa-lock"></i>
                                            FORM TEAM (NEEDS {minRequired - memberCount} MORE)
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleFormTeam(teamId, userTeam?.teamName || 'Team', event?.name || 'Event', memberCount, minRequired)}
                                            disabled={formingTeam[teamId]}
                                            style={{
                                              background: '#10b981',
                                              color: '#000000',
                                              border: '2.5px solid #000000',
                                              boxShadow: '3px 3px 0px #000000',
                                              padding: '10px 20px',
                                              fontSize: '0.85rem',
                                              fontWeight: 900,
                                              cursor: 'pointer',
                                              textTransform: 'uppercase',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}
                                          >
                                            <i className="fa-solid fa-flag-checkered"></i>
                                            {formingTeam[teamId] ? 'FORMING TEAM...' : `⚡ FORM & FINALIZE TEAM (${memberCount} PLAYERS)`}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
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
