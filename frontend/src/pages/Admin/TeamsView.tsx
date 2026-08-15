import React, { useEffect, useState } from 'react';
export const TeamsView: React.FC = () => {
  
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <div style={{ color: '#fff' }}>Loading teams...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // Group teams by Event
  const groupedTeams = teams.reduce((acc, team) => {
    const eventName = team.eventId?.name || 'Unknown Event';
    if (!acc[eventName]) acc[eventName] = [];
    acc[eventName].push(team);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}>
      <h2 style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em', textShadow: '0 0 10px rgba(60, 230, 252, 0.2)' }}>
        REGISTERED TEAMS ({teams.length})
      </h2>

      {Object.keys(groupedTeams).length === 0 && (
        <div style={{ color: '#9ca3af', fontSize: '1rem', fontStyle: 'italic' }}>No teams registered yet.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {Object.entries(groupedTeams).map(([eventName, eventTeams]: [string, any]) => (
          <div key={eventName} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              fontWeight: '900',
              color: '#3ce6fc',
              fontSize: '1.25rem',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{eventName}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 10px', borderRadius: '20px' }}>
                {eventTeams.length} teams
              </span>
            </div>
            
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {eventTeams.map((team: any) => (
                <div key={team._id} style={{
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.01)',
                  boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '1.15rem' }}>
                      Team: {team.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      Join Code: <strong style={{ color: '#3ce6fc' }}>{team.joinCode}</strong>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {/* Leader */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>👑 TEAM LEADER</div>
                      <div style={{ color: '#ffffff', fontWeight: 700 }}>{team.leaderId?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>{team.leaderId?.email}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>📞 {team.leaderId?.whatsapp}</div>
                    </div>
                    
                    {/* Members */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '900', letterSpacing: '0.05em' }}>ACCEPTED MEMBERS ({team.members?.length || 0})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {team.members?.length > 0 ? (
                          team.members.map((m: any) => (
                            <div key={m._id} style={{ fontSize: '0.8rem', color: '#cbd5e1', borderLeft: '3px solid #10b981', paddingLeft: '0.6rem', padding: '2px 0' }}>
                              <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.userId?.name}</span> <span style={{ color: '#94a3b8' }}>- {m.userId?.institution}</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>No members have joined yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
