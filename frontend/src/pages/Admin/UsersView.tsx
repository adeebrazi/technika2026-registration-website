import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const UsersView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const role = localStorage.getItem('adminRole');
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely delete ${name}'s registration? This cannot be undone.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) return <div style={{ color: isDark ? '#fff' : '#000' }}>Loading participants...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  const canDelete = role === 'admin' || role === 'faculty';

  return (
    <div style={{ fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}>
      <h2 style={{ color: '#ffffff', fontSize: '2rem', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em', textShadow: '0 0 10px rgba(60, 230, 252, 0.2)' }}>
        REGISTERED PARTICIPANTS ({users.length})
      </h2>

      <div style={{
        overflowX: 'auto',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.03)' }}>
              <th style={{ padding: '1rem', color: '#3ce6fc', fontWeight: 'bold' }}>ID</th>
              <th style={{ padding: '1rem', color: '#3ce6fc', fontWeight: 'bold' }}>Name & Email</th>
              <th style={{ padding: '1rem', color: '#3ce6fc', fontWeight: 'bold' }}>Institution</th>
              <th style={{ padding: '1rem', color: '#3ce6fc', fontWeight: 'bold' }}>Registered Events</th>
              <th style={{ padding: '1rem', color: '#3ce6fc', fontWeight: 'bold' }}>Payment Status</th>
              {canDelete && <th style={{ padding: '1rem', color: '#3ce6fc', fontWeight: 'bold' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', transition: 'background 0.2s' }}>
                <td style={{ padding: '1.25rem 1rem', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>
                  {user.registrationId}
                </td>
                <td style={{ padding: '1.25rem 1rem', color: '#ffffff' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{user.email}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>📞 {user.whatsapp}</div>
                </td>
                <td style={{ padding: '1.25rem 1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600 }}>{user.institution}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{user.course} - {user.semester}</div>
                </td>
                <td style={{ padding: '1.25rem 1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                  {user.registeredEvents?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'square' }}>
                      {user.registeredEvents.map((r: any) => (
                        <li key={r._id} style={{ color: '#e2e8f0' }}>{r.event?.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#64748b', fontStyle: 'italic' }}>No events</span>
                  )}
                </td>
                <td style={{ padding: '1.25rem 1rem' }}>
                  <button
                    onClick={() => setSelectedImage(user.paymentScreenshotUrl)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: 'rgba(60, 230, 252, 0.1)',
                      border: '1px solid rgba(60, 230, 252, 0.3)',
                      borderRadius: '6px',
                      color: '#3ce6fc',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      marginBottom: '0.6rem'
                    }}
                  >
                    View SS
                  </button>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div><strong>UTR (Entered):</strong> {user.utrEnteredManually || user.paymentUTR}</div>
                    <div><strong>UTR (Fetched):</strong> {user.utrFetchedFromScreenshot || 'PENDING'}</div>
                  </div>
                </td>
                {canDelete && (
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s'
                      }}
                    >
                      Cancel Reg
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Screenshot Modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setSelectedImage(null)}>
          <div style={{ 
            position: 'relative', 
            maxWidth: '90%', 
            maxHeight: '90%',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
          }}>
            <button 
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute', top: '-45px', right: '0',
                background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white',
                fontSize: '0.9rem', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', fontWeight: '700',
                textTransform: 'uppercase'
              }}
            >
              ✕ Close
            </button>
            <img 
              src={selectedImage} 
              alt="Payment Screenshot" 
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
