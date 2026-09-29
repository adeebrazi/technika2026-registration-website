import React, { useEffect, useState } from 'react';

export const TeamsView: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      } else {
        setError('Failed to fetch teams');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  // Group teams by Event
  const groupedTeams = teams.reduce((acc, team) => {
    const eventName = team.eventId?.name || 'Unknown Event';
    if (!acc[eventName]) acc[eventName] = [];
    acc[eventName].push(team);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="clay-loading-state">
        <div className="clay-loader-orb">
          <span className="clay-loader-icon">⏳</span>
        </div>
        <span className="clay-loader-text">Loading teams...</span>
        <style>{`
          .clay-loading-state {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 16px; padding: 80px 20px;
            font-family: 'Space Grotesk', sans-serif;
          }
          .clay-loader-orb {
            width: 64px; height: 64px; border-radius: 50%;
            background: linear-gradient(135deg, #6ee7b7 0%, #34d399 100%);
            border: 3px solid #ffffff;
            display: flex; align-items: center; justify-content: center;
            box-shadow:
              8px 10px 22px rgba(16, 185, 129, 0.35),
              inset 4px 4px 8px rgba(255, 255, 255, 0.5),
              inset -4px -4px 8px rgba(6, 95, 70, 0.3);
            animation: pulseOrb 1.5s ease-in-out infinite;
          }
          .clay-loader-icon { font-size: 1.6rem; }
          .clay-loader-text { font-weight: 700; color: #475569; font-size: 0.95rem; }
          @keyframes pulseOrb { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clay-error-state">
        <div className="clay-error-orb">⚠️</div>
        <span>{error}</span>
        <style>{`
          .clay-error-state {
            display: flex; flex-direction: column; align-items: center; gap: 12px;
            padding: 60px; font-family: 'Space Grotesk', sans-serif;
          }
          .clay-error-orb {
            width: 56px; height: 56px; border-radius: 50%;
            background: #fee2e2; display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; border: 2px solid rgba(239, 68, 68, 0.2);
            box-shadow: 4px 6px 14px rgba(239, 68, 68, 0.15),
              inset 2px 2px 4px rgba(255, 255, 255, 0.8),
              inset -2px -2px 4px rgba(239, 68, 68, 0.12);
          }
          .clay-error-state span { color: #dc2626; font-weight: 700; }
        `}</style>
      </div>
    );
  }

  const eventColors = [
    { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', chipBg: '#dbeafe', chipColor: '#2563eb', shadow: 'rgba(37, 99, 235, 0.3)' },
    { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', chipBg: '#ede9fe', chipColor: '#6d28d9', shadow: 'rgba(109, 40, 217, 0.3)' },
    { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', chipBg: '#d1fae5', chipColor: '#059669', shadow: 'rgba(5, 150, 105, 0.3)' },
    { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', chipBg: '#fef3c7', chipColor: '#d97706', shadow: 'rgba(217, 119, 6, 0.3)' },
    { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', chipBg: '#fee2e2', chipColor: '#dc2626', shadow: 'rgba(220, 38, 38, 0.3)' },
    { bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', chipBg: '#fce7f3', chipColor: '#be185d', shadow: 'rgba(190, 24, 93, 0.3)' },
  ];

  return (
    <div className="clay-teams-page">
      {/* ── Page Header ── */}
      <div className="clay-page-header">
        <div className="clay-header-left">
          <div className="clay-header-emblem" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '6px 8px 18px rgba(5, 150, 105, 0.3), inset 3px 3px 6px rgba(255,255,255,0.5), inset -3px -3px 6px rgba(6, 95, 70, 0.3)'
          }}>👥</div>
          <div>
            <h2 className="clay-page-title">REGISTERED TEAMS</h2>
            <p className="clay-page-subtitle">Team formations across all events</p>
          </div>
        </div>
        <div className="clay-count-badge">
          <span className="clay-count-num">{teams.length}</span>
          <span className="clay-count-label">Teams</span>
        </div>
      </div>

      {/* ── Empty State ── */}
      {Object.keys(groupedTeams).length === 0 && (
        <div className="clay-empty-card">
          <span style={{ fontSize: '2.5rem' }}>🏟️</span>
          <span className="clay-empty-text">No teams registered yet</span>
          <span className="clay-empty-sub">Teams will appear here once participants form groups</span>
        </div>
      )}

      {/* ── Event Groups ── */}
      <div className="clay-events-container">
        {Object.entries(groupedTeams).map(([eventName, eventTeams]: [string, any], eventIdx) => {
          const colorScheme = eventColors[eventIdx % eventColors.length];
          
          return (
            <div key={eventName} className="clay-event-group">
              {/* Event Header */}
              <div className="clay-event-header">
                <div className="clay-event-icon" style={{ 
                  background: colorScheme.bg,
                  boxShadow: `4px 5px 12px ${colorScheme.shadow}, inset 2px 2px 5px rgba(255,255,255,0.5), inset -2px -2px 5px rgba(0,0,0,0.15)`
                }}>
                  🎯
                </div>
                <div className="clay-event-info">
                  <span className="clay-event-name">{eventName}</span>
                </div>
                <span className="clay-team-count-pill" style={{
                  background: colorScheme.chipBg,
                  color: colorScheme.chipColor,
                  boxShadow: `inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 2px ${colorScheme.shadow}, 2px 2px 6px ${colorScheme.shadow}`
                }}>
                  {eventTeams.length} {eventTeams.length === 1 ? 'team' : 'teams'}
                </span>
              </div>

              {/* Teams Grid */}
              <div className="clay-teams-grid">
                {eventTeams.map((team: any) => {
                  const isExpanded = expandedTeams.has(team._id);
                  return (
                    <div key={team._id} className="clay-team-card">
                      {/* Team Header Row */}
                      <div className="clay-team-header" onClick={() => toggleTeam(team._id)}>
                        <div className="clay-team-title">
                          <span className="clay-team-name">{team.name || team.teamName || 'Unnamed'}</span>
                          <span className="clay-join-code" style={{ background: colorScheme.chipBg, color: colorScheme.chipColor }}>
                            Code: {team.joinCode || team.teamId}
                          </span>
                        </div>
                        <button className={`clay-expand-btn ${isExpanded ? 'expanded' : ''}`}>
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>

                      {/* Leader (Always Visible) */}
                      <div className="clay-leader-row">
                        <div className="clay-leader-avatar">
                          <span>👑</span>
                        </div>
                        <div className="clay-leader-info">
                          <span className="clay-leader-badge">TEAM LEADER</span>
                          <span className="clay-leader-name">{team.leaderId?.name || 'Unknown'}</span>
                          <span className="clay-leader-detail">{team.leaderId?.email}</span>
                          {team.leaderId?.whatsapp && (
                            <span className="clay-leader-detail">📞 {team.leaderId.whatsapp}</span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Members Section */}
                      {isExpanded && (
                        <div className="clay-members-section">
                          <div className="clay-members-header">
                            <span className="clay-members-label">
                              ✅ ACCEPTED MEMBERS ({team.members?.length || 0})
                            </span>
                          </div>
                          {team.members?.length > 0 ? (
                            <div className="clay-members-list">
                              {team.members.map((m: any) => (
                                <div key={m._id} className="clay-member-row">
                                  <div className="clay-member-dot" />
                                  <div className="clay-member-info">
                                    <span className="clay-member-name">{m.userId?.name || 'Unknown'}</span>
                                    <span className="clay-member-inst">{m.userId?.institution || ''}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="clay-no-members">No members have joined yet</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Claymorphism Styles ── */}
      <style>{`
        .clay-teams-page {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        /* ── Page Header ── */
        .clay-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .clay-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .clay-header-emblem {
          width: 48px; height: 48px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; border: 2.5px solid #ffffff; flex-shrink: 0;
        }

        .clay-page-title {
          font-size: 1.5rem; font-weight: 900; color: #0f172a;
          margin: 0; letter-spacing: -0.02em;
        }

        .clay-page-subtitle {
          font-size: 0.78rem; color: #64748b; margin: 2px 0 0 0; font-weight: 500;
        }

        .clay-count-badge {
          display: flex; align-items: baseline; gap: 6px;
          background: #f4f8fd; padding: 8px 16px; border-radius: 16px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            6px 8px 18px rgba(162, 178, 201, 0.22),
            -5px -5px 14px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.18);
        }

        .clay-count-num { font-size: 1.5rem; font-weight: 900; color: #059669; }
        .clay-count-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

        /* ── Empty State ── */
        .clay-empty-card {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 60px 20px;
          background: #eef3f9; border-radius: 22px;
          border: 2.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            12px 16px 36px rgba(162, 178, 201, 0.3),
            -10px -10px 28px rgba(255, 255, 255, 0.85),
            inset 3px 3px 8px rgba(255, 255, 255, 0.85),
            inset -3px -3px 8px rgba(162, 178, 201, 0.12);
        }

        .clay-empty-text { font-weight: 800; font-size: 1.1rem; color: #334155; }
        .clay-empty-sub { font-size: 0.82rem; color: #94a3b8; }

        /* ── Event Groups ── */
        .clay-events-container {
          display: flex; flex-direction: column; gap: 1.5rem;
        }

        .clay-event-group {
          background: #eef3f9;
          border-radius: 22px;
          border: 2.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            12px 16px 36px rgba(162, 178, 201, 0.3),
            -10px -10px 28px rgba(255, 255, 255, 0.85),
            inset 3px 3px 8px rgba(255, 255, 255, 0.85),
            inset -3px -3px 8px rgba(162, 178, 201, 0.12);
          overflow: hidden;
        }

        .clay-event-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 1rem 1.25rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.7);
          background: #f4f8fd;
        }

        .clay-event-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; border: 2px solid #ffffff; flex-shrink: 0;
        }

        .clay-event-info { flex: 1; min-width: 0; }

        .clay-event-name {
          font-weight: 900; font-size: 1.05rem; color: #0f172a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          display: block;
        }

        .clay-team-count-pill {
          font-size: 0.72rem; font-weight: 800; padding: 4px 12px;
          border-radius: 10px; white-space: nowrap; flex-shrink: 0;
        }

        /* ── Teams Grid ── */
        .clay-teams-grid {
          padding: 1rem 1.25rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
        }

        .clay-team-card {
          background: #f4f8fd;
          border-radius: 18px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            6px 8px 18px rgba(162, 178, 201, 0.2),
            -5px -5px 14px rgba(255, 255, 255, 0.75),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.15);
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .clay-team-card:hover {
          transform: translateY(-2px);
          box-shadow:
            8px 10px 22px rgba(162, 178, 201, 0.28),
            -6px -6px 16px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.18);
        }

        .clay-team-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.85rem 1rem;
          cursor: pointer;
          border-bottom: 1.5px solid rgba(226, 234, 244, 0.6);
        }

        .clay-team-title {
          display: flex; flex-direction: column; gap: 4px;
        }

        .clay-team-name {
          font-weight: 900; font-size: 0.95rem; color: #0f172a;
        }

        .clay-join-code {
          font-size: 0.65rem; font-weight: 800; padding: 2px 8px;
          border-radius: 6px; width: fit-content; letter-spacing: 0.02em;
        }

        .clay-expand-btn {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.8);
          background: #e2eaf4; color: #475569;
          font-size: 0.6rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow:
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.3),
            2px 2px 6px rgba(162, 178, 201, 0.2);
          transition: all 0.2s;
        }

        .clay-expand-btn.expanded {
          background: #dbeafe;
          color: #2563eb;
        }

        /* ── Leader Row ── */
        .clay-leader-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 0.75rem 1rem;
        }

        .clay-leader-avatar {
          width: 36px; height: 36px; border-radius: 12px;
          background: linear-gradient(135deg, #fde047 0%, #eab308 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; border: 2px solid #ffffff; flex-shrink: 0;
          box-shadow:
            3px 4px 10px rgba(202, 138, 4, 0.25),
            inset 2px 2px 4px rgba(255, 255, 255, 0.6),
            inset -2px -2px 4px rgba(161, 98, 7, 0.2);
        }

        .clay-leader-info {
          display: flex; flex-direction: column; gap: 2px; min-width: 0;
        }

        .clay-leader-badge {
          font-size: 0.58rem; font-weight: 900; color: #d97706;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .clay-leader-name {
          font-weight: 800; font-size: 0.88rem; color: #0f172a;
        }

        .clay-leader-detail {
          font-size: 0.75rem; color: #64748b;
        }

        /* ── Members ── */
        .clay-members-section {
          border-top: 1.5px solid rgba(226, 234, 244, 0.6);
          padding: 0.75rem 1rem;
        }

        .clay-members-header {
          margin-bottom: 0.5rem;
        }

        .clay-members-label {
          font-size: 0.62rem; font-weight: 800; color: #059669;
          letter-spacing: 0.08em; text-transform: uppercase;
        }

        .clay-members-list {
          display: flex; flex-direction: column; gap: 6px;
        }

        .clay-member-row {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 10px;
          background: #eef3f9;
          border-radius: 10px;
          border: 1.5px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            inset 1px 1px 3px rgba(255, 255, 255, 0.7),
            inset -1px -1px 3px rgba(162, 178, 201, 0.12);
        }

        .clay-member-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981; flex-shrink: 0;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
        }

        .clay-member-info {
          display: flex; flex-direction: column; gap: 1px; min-width: 0;
        }

        .clay-member-name {
          font-weight: 700; font-size: 0.82rem; color: #1e293b;
        }

        .clay-member-inst {
          font-size: 0.72rem; color: #94a3b8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .clay-no-members {
          font-size: 0.8rem; color: #94a3b8; font-style: italic; padding: 4px 0;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .clay-teams-grid {
            grid-template-columns: 1fr;
          }
          .clay-page-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};
