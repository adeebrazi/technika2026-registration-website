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
    <div>
      <h2 style={{ color: isDark ? '#f9fafb' : '#111827', fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
        Registered Participants ({users.length})
      </h2>

      <div style={{
        overflowX: 'auto',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', borderBottom: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}` }}>
              <th style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563' }}>ID</th>
              <th style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563' }}>Name & Email</th>
              <th style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563' }}>Institution</th>
              <th style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563' }}>Registered Events</th>
              <th style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563' }}>Payment</th>
              {canDelete && <th style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
                <td style={{ padding: '1rem', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                  {user.registrationId}
                </td>
                <td style={{ padding: '1rem', color: isDark ? '#f9fafb' : '#111827' }}>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280' }}>{user.email}</div>
                  <div style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280' }}>📞 {user.whatsapp}</div>
                </td>
                <td style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563', fontSize: '0.875rem' }}>
                  {user.institution} <br/> ({user.course} - {user.semester})
                </td>
                <td style={{ padding: '1rem', color: isDark ? '#d1d5db' : '#4b5563', fontSize: '0.875rem' }}>
                  {user.registeredEvents?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      {user.registeredEvents.map((r: any) => (
                        <li key={r._id}>{r.event?.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>No events</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => setSelectedImage(user.paymentScreenshotUrl)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    View SS
                  </button>
                  <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#6b7280', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div><strong>UTR (Entered):</strong> {user.utrEnteredManually || user.paymentUTR}</div>
                    <div><strong>UTR (Fetched):</strong> {user.utrFetchedFromScreenshot || 'PENDING'}</div>
                  </div>
                </td>
                {canDelete && (
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
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
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setSelectedImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button 
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute', top: '-40px', right: '0',
                background: 'none', border: 'none', color: 'white',
                fontSize: '1.5rem', cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
            <img 
              src={selectedImage} 
              alt="Payment Screenshot" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
