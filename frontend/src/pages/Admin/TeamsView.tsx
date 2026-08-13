import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const TeamsView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
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

  if (loading) return <div style={{ color: isDark ? '#fff' : '#000' }}>Loading teams...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // Group teams by Event
  const groupedTeams = teams.reduce((acc, team) => {
    const eventName = team.eventId?.name || 'Unknown Event';
    if (!acc[eventName]) acc[eventName] = [];
    acc[eventName].push(team);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      <h2 style={{ color: isDark ? '#f9fafb' : '#111827', fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
        Registered Teams ({teams.length})
      </h2>

      {Object.keys(groupedTeams).length === 0 && (
        <div style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>No teams registered yet.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {Object.entries(groupedTeams).map(([eventName, eventTeams]: [string, any]) => (
          <div key={eventName} style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              padding: '1rem 1.5rem',
              borderBottom: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
              fontWeight: 'bold',
              color: isDark ? '#f9fafb' : '#111827',
              fontSize: '1.125rem'
            }}>
              {eventName} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280' }}>({eventTeams.length} teams)</span>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {eventTeams.map((team: any) => (
                <div key={team._id} style={{
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: isDark ? '#f9fafb' : '#111827', fontSize: '1.125rem' }}>
                      Team: {team.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#6b7280' }}>
                      Join Code: <strong style={{ color: isDark ? '#fff' : '#000' }}>{team.joinCode}</strong>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Leader */}
                    <div style={{ backgroundColor: isDark ? '#374151' : '#f9fafb', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 'bold', marginBottom: '0.25rem' }}>👑 TEAM LEADER</div>
                      <div style={{ color: isDark ? '#f9fafb' : '#111827', fontWeight: 600 }}>{team.leaderId?.name}</div>
                      <div style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280' }}>{team.leaderId?.email}</div>
                      <div style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280' }}>📞 {team.leaderId?.whatsapp}</div>
                    </div>
                    
                    {/* Members */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>ACCEPTED MEMBERS ({team.members?.length || 0})</div>
                      {team.members?.length > 0 ? (
                        team.members.map((m: any) => (
                          <div key={m._id} style={{ fontSize: '0.875rem', color: isDark ? '#d1d5db' : '#4b5563', borderLeft: '2px solid #10b981', paddingLeft: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: isDark ? '#f9fafb' : '#111827' }}>{m.userId?.name}</span> - {m.userId?.institution}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280', fontStyle: 'italic' }}>No members have joined yet.</div>
                      )}
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
