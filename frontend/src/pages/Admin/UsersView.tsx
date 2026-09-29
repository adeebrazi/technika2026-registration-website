import React, { useEffect, useState } from 'react';

export const UsersView: React.FC = () => {
  const role = localStorage.getItem('adminRole');
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const [accessLevel, setAccessLevel] = useState<'full' | 'limited'>('limited');
  
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
        setUsers(data.users || data);
        setAccessLevel(data.accessLevel || 'full');
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

  // Get unique event names for filter
  const allEventNames = Array.from(new Set(
    users.flatMap(u => u.registeredEvents?.map((r: any) => r.event?.name) || []).filter(Boolean)
  ));

  // Filtered users
  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      user.name?.toLowerCase().includes(q) || 
      user.email?.toLowerCase().includes(q) ||
      user.registrationId?.toLowerCase().includes(q) ||
      user.institution?.toLowerCase().includes(q) ||
      user.whatsapp?.includes(q);
    
    const matchesEvent = filterEvent === 'all' || 
      user.registeredEvents?.some((r: any) => r.event?.name === filterEvent);
    
    return matchesSearch && matchesEvent;
  });

  const canDelete = role === 'admin';
  const fullAccess = accessLevel === 'full';

  if (loading) {
    return (
      <div className="clay-loading-state">
        <div className="clay-loader-orb">
          <span className="clay-loader-icon">⏳</span>
        </div>
        <span className="clay-loader-text">Loading participants...</span>
        <style>{`
          .clay-loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 80px 20px;
            font-family: 'Space Grotesk', sans-serif;
          }
          .clay-loader-orb {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
            border: 3px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              8px 10px 22px rgba(99, 102, 241, 0.35),
              inset 4px 4px 8px rgba(255, 255, 255, 0.5),
              inset -4px -4px 8px rgba(55, 48, 163, 0.3);
            animation: pulseOrb 1.5s ease-in-out infinite;
          }
          .clay-loader-icon { font-size: 1.6rem; }
          .clay-loader-text {
            font-weight: 700;
            color: #475569;
            font-size: 0.95rem;
          }
          @keyframes pulseOrb {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
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

  return (
    <div className="clay-users-page">
      {/* ── Page Header ── */}
      <div className="clay-page-header">
        <div className="clay-header-left">
          <div className="clay-header-emblem">👤</div>
          <div>
            <h2 className="clay-page-title">REGISTERED PARTICIPANTS</h2>
            <p className="clay-page-subtitle">All registrations across Technika 6.0 events</p>
          </div>
        </div>
        <div className="clay-count-badge">
          <span className="clay-count-num">{filteredUsers.length}</span>
          <span className="clay-count-label">{filteredUsers.length === users.length ? 'Total' : `of ${users.length}`}</span>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="clay-toolbar">
        <div className="clay-search-box">
          <span className="clay-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, ID, institution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-search-input"
          />
          {searchQuery && (
            <button className="clay-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        <div className="clay-filter-box">
          <span className="clay-filter-icon">📋</span>
          <select 
            value={filterEvent} 
            onChange={(e) => setFilterEvent(e.target.value)}
            className="clay-filter-select"
          >
            <option value="all">All Events</option>
            {allEventNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="clay-table-card">
        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                {fullAccess && <th>ID</th>}
                <th>{fullAccess ? 'Name & Email' : 'Name'}</th>
                <th>Institution</th>
                <th>Registered Events</th>
                {fullAccess && <th>Payment Status</th>}
                {canDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={fullAccess ? (canDelete ? 6 : 5) : 3} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>📭</span>
                      <span style={{ fontWeight: 700 }}>No participants found</span>
                      <span style={{ fontSize: '0.8rem' }}>Try adjusting your search or filter</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user._id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                    {fullAccess && (
                      <td>
                        <span className="clay-id-badge">{user.registrationId}</span>
                      </td>
                    )}
                    <td>
                      <div className="clay-user-cell">
                        <div className="clay-user-name">{user.name}</div>
                        {fullAccess && <div className="clay-user-email">{user.email}</div>}
                        {fullAccess && <div className="clay-user-phone">📞 {user.whatsapp}</div>}
                      </div>
                    </td>
                    <td>
                      <div className="clay-inst-cell">
                        <div className="clay-inst-name">{user.institution}</div>
                        {fullAccess && <div className="clay-inst-course">{user.course} - {user.semester}</div>}
                      </div>
                    </td>
                    <td>
                      {user.registeredEvents?.length > 0 ? (
                        <div className="clay-events-list">
                          {user.registeredEvents.map((r: any) => (
                            <span key={r._id} className="clay-event-chip">
                              {r.event?.name || 'Unknown'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="clay-no-events">No events</span>
                      )}
                    </td>
                    {fullAccess && (
                      <td>
                        <button
                          onClick={() => setSelectedImage(user.paymentScreenshotUrl)}
                          className="clay-view-ss-btn"
                        >
                          📸 View SS
                        </button>
                        <div className="clay-utr-info">
                          <div><strong>UTR:</strong> {user.utrEnteredManually || user.paymentUTR}</div>
                          <div><strong>Fetched:</strong> {user.utrFetchedFromScreenshot || 'PENDING'}</div>
                        </div>
                      </td>
                    )}
                    {canDelete && (
                      <td>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="clay-delete-btn"
                        >
                          🗑️ Cancel
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Screenshot Modal ── */}
      {selectedImage && (
        <div className="clay-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="clay-modal-header">
              <span className="clay-modal-title">📸 Payment Screenshot</span>
              <button className="clay-modal-close" onClick={() => setSelectedImage(null)}>✕</button>
            </div>
            <div className="clay-modal-body">
              <img 
                src={selectedImage} 
                alt="Payment Screenshot" 
                className="clay-modal-img"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Claymorphism Styles ── */}
      <style>{`
        .clay-users-page {
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
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          border: 2.5px solid #ffffff;
          flex-shrink: 0;
          box-shadow:
            6px 8px 18px rgba(37, 99, 235, 0.3),
            inset 3px 3px 6px rgba(255, 255, 255, 0.5),
            inset -3px -3px 6px rgba(15, 23, 42, 0.3);
        }

        .clay-page-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .clay-page-subtitle {
          font-size: 0.78rem;
          color: #64748b;
          margin: 2px 0 0 0;
          font-weight: 500;
        }

        .clay-count-badge {
          display: flex;
          align-items: baseline;
          gap: 6px;
          background: #f4f8fd;
          padding: 8px 16px;
          border-radius: 16px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            6px 8px 18px rgba(162, 178, 201, 0.22),
            -5px -5px 14px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.18);
        }

        .clay-count-num {
          font-size: 1.5rem;
          font-weight: 900;
          color: #2563eb;
        }

        .clay-count-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
        }

        /* ── Toolbar ── */
        .clay-toolbar {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .clay-search-box {
          flex: 1;
          min-width: 250px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #e2eaf4;
          border-radius: 16px;
          padding: 6px 14px;
          border: 2px solid transparent;
          box-shadow:
            inset 3px 3px 6px rgba(162, 178, 201, 0.45),
            inset -3px -3px 6px rgba(255, 255, 255, 0.9);
          transition: all 0.2s;
        }

        .clay-search-box:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.15),
            inset 2px 2px 4px rgba(162, 178, 201, 0.2),
            inset -2px -2px 4px rgba(255, 255, 255, 0.9);
        }

        .clay-search-icon { font-size: 0.9rem; flex-shrink: 0; }

        .clay-search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
        }

        .clay-search-input::placeholder { color: #94a3b8; font-weight: 500; }

        .clay-search-clear {
          width: 22px; height: 22px; border-radius: 50%;
          border: none; background: rgba(100, 116, 139, 0.12);
          color: #64748b; cursor: pointer; font-size: 0.7rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .clay-search-clear:hover { background: rgba(100, 116, 139, 0.2); }

        .clay-filter-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #e2eaf4;
          border-radius: 16px;
          padding: 6px 14px;
          border: 2px solid transparent;
          box-shadow:
            inset 3px 3px 6px rgba(162, 178, 201, 0.45),
            inset -3px -3px 6px rgba(255, 255, 255, 0.9);
          transition: all 0.2s;
        }

        .clay-filter-box:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
        }

        .clay-filter-icon { font-size: 0.9rem; }

        .clay-filter-select {
          border: none;
          background: transparent;
          outline: none;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
          padding-right: 8px;
        }

        /* ── Data Table Card ── */
        .clay-table-card {
          background: #eef3f9;
          border-radius: 22px;
          border: 2.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            12px 16px 36px rgba(162, 178, 201, 0.35),
            -10px -10px 28px rgba(255, 255, 255, 0.85),
            inset 3px 3px 8px rgba(255, 255, 255, 0.85),
            inset -3px -3px 8px rgba(162, 178, 201, 0.15);
          overflow: hidden;
        }

        .clay-table-wrapper {
          overflow-x: auto;
        }

        .clay-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .clay-table thead tr {
          background: #f4f8fd;
          border-bottom: 2px solid rgba(255, 255, 255, 0.7);
        }

        .clay-table th {
          padding: 0.9rem 1rem;
          font-size: 0.72rem;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .clay-table td {
          padding: 0.85rem 1rem;
          font-size: 0.85rem;
          color: #334155;
          vertical-align: top;
        }

        .clay-table tbody tr {
          border-bottom: 1.5px solid rgba(226, 234, 244, 0.8);
          transition: all 0.2s;
        }

        .clay-table tbody tr:hover {
          background: rgba(244, 248, 253, 0.7);
        }

        .clay-table tbody tr.row-even {
          background: rgba(255, 255, 255, 0.25);
        }

        .clay-table tbody tr.row-odd {
          background: transparent;
        }

        .clay-table tbody tr:last-child {
          border-bottom: none;
        }

        /* ── Table Cell Styles ── */
        .clay-id-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 800;
          color: #2563eb;
          background: #dbeafe;
          padding: 3px 10px;
          border-radius: 8px;
          font-family: 'Space Mono', monospace, 'Space Grotesk', sans-serif;
          box-shadow:
            inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.8),
            inset -1.5px -1.5px 3px rgba(37, 99, 235, 0.12),
            2px 2px 5px rgba(37, 99, 235, 0.08);
        }

        .clay-user-cell { display: flex; flex-direction: column; gap: 2px; }
        .clay-user-name { font-weight: 800; font-size: 0.88rem; color: #0f172a; }
        .clay-user-email { font-size: 0.78rem; color: #64748b; }
        .clay-user-phone { font-size: 0.75rem; color: #94a3b8; margin-top: 1px; }

        .clay-inst-cell { display: flex; flex-direction: column; gap: 2px; }
        .clay-inst-name { font-weight: 700; font-size: 0.82rem; color: #1e293b; }
        .clay-inst-course { font-size: 0.75rem; color: #94a3b8; }

        .clay-events-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .clay-event-chip {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 8px;
          background: #ede9fe;
          color: #6d28d9;
          border: 1.5px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            inset 1px 1px 2px rgba(255, 255, 255, 0.8),
            inset -1px -1px 2px rgba(109, 40, 217, 0.08),
            2px 2px 5px rgba(109, 40, 217, 0.06);
        }

        .clay-no-events {
          font-size: 0.78rem;
          color: #94a3b8;
          font-style: italic;
        }

        .clay-view-ss-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          background: #dbeafe;
          color: #2563eb;
          font-weight: 700;
          font-size: 0.72rem;
          cursor: pointer;
          text-transform: uppercase;
          margin-bottom: 6px;
          box-shadow:
            3px 4px 10px rgba(37, 99, 235, 0.12),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(37, 99, 235, 0.1);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .clay-view-ss-btn:hover {
          transform: translateY(-1px);
          box-shadow:
            4px 6px 14px rgba(37, 99, 235, 0.18),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(37, 99, 235, 0.12);
        }

        .clay-utr-info {
          font-size: 0.7rem;
          color: #64748b;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .clay-delete-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: 10px;
          border: 2px solid rgba(239, 68, 68, 0.15);
          background: #fee2e2;
          color: #dc2626;
          font-weight: 700;
          font-size: 0.72rem;
          cursor: pointer;
          text-transform: uppercase;
          box-shadow:
            3px 4px 10px rgba(239, 68, 68, 0.1),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(239, 68, 68, 0.08);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .clay-delete-btn:hover {
          transform: translateY(-1px);
          background: #fecaca;
          box-shadow:
            4px 6px 14px rgba(239, 68, 68, 0.15),
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(239, 68, 68, 0.12);
        }

        /* ── Modal ── */
        .clay-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .clay-modal-card {
          background: #eef3f9;
          border-radius: 24px;
          border: 2.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            20px 24px 50px rgba(162, 178, 201, 0.45),
            -16px -16px 40px rgba(255, 255, 255, 0.9),
            inset 3px 3px 8px rgba(255, 255, 255, 0.85),
            inset -3px -3px 8px rgba(162, 178, 201, 0.2);
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .clay-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.7);
        }

        .clay-modal-title {
          font-weight: 800;
          font-size: 0.95rem;
          color: #0f172a;
        }

        .clay-modal-close {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.8);
          background: #e2eaf4;
          color: #64748b; font-size: 0.8rem; font-weight: 900;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow:
            inset 2px 2px 4px rgba(255, 255, 255, 0.8),
            inset -2px -2px 4px rgba(162, 178, 201, 0.3),
            3px 3px 8px rgba(162, 178, 201, 0.2);
          transition: all 0.2s;
        }

        .clay-modal-close:hover {
          background: #fee2e2;
          color: #dc2626;
          transform: scale(1.05);
        }

        .clay-modal-body {
          padding: 1rem;
          overflow: auto;
        }

        .clay-modal-img {
          max-width: 100%;
          max-height: 75vh;
          object-fit: contain;
          border-radius: 14px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            6px 8px 18px rgba(162, 178, 201, 0.25),
            inset 2px 2px 4px rgba(255, 255, 255, 0.6);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .clay-page-header { flex-direction: column; align-items: flex-start; }
          .clay-toolbar { flex-direction: column; }
          .clay-search-box { min-width: unset; }
        }
      `}</style>
    </div>
  );
};
