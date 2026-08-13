import React from 'react';

export interface EventDetailData {
  id: string;
  title: string;
  category: string;
  description: string;
  date?: string;
  time?: string;
  venue?: string;
  prizePool?: string;
  coordinator?: string;
  minMembers?: number;
  maxMembers?: number;
  rules_list?: string[];
  rounds_list?: string[];
  criteria_list?: string[];
  objective?: string;
}

interface EventDetailsModalProps {
  event: EventDetailData | null;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          color: '#000000',
          border: '4px solid #000000',
          boxShadow: '10px 10px 0px 0px #000000',
          padding: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                background: '#FFE600',
                color: '#000000',
                border: '2px solid #000000',
                padding: '2px 10px',
                fontSize: '0.7rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                marginBottom: '8px',
                boxShadow: '2px 2px 0px 0px #000000'
              }}
            >
              {event.category}
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
              {event.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
              fontWeight: 900,
              fontSize: '1rem',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Quick Meta Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
          {event.date && (
            <span style={{ background: '#000000', color: '#ffffff', border: '2px solid #000000', padding: '6px 12px' }}>
              📅 {event.date} {event.time ? `· ${event.time}` : ''}
            </span>
          )}
          {event.venue && (
            <span style={{ background: '#8aebee', color: '#000000', border: '2px solid #000000', padding: '6px 12px' }}>
              📍 {event.venue}
            </span>
          )}
          {event.prizePool && (
            <span style={{ background: '#FFE600', color: '#000000', border: '2px solid #000000', padding: '6px 12px' }}>
              🏆 {event.prizePool}
            </span>
          )}
          {event.maxMembers && event.maxMembers > 1 && (
            <span style={{ background: '#FF7A00', color: '#000000', border: '2px solid #000000', padding: '6px 12px' }}>
              👥 Team: {event.minMembers || 1} - {event.maxMembers} Members
            </span>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px', background: '#f8fafc', border: '2px solid #000000', padding: '16px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase' }}>Description</h4>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5, color: '#334155', fontWeight: 500 }}>{event.description}</p>
        </div>

        {/* Coordinator */}
        {event.coordinator && (
          <div style={{ marginBottom: '20px', background: '#e0f2fe', border: '2px solid #000000', padding: '12px 16px' }}>
            <span style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase' }}>Coordinators: </span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{event.coordinator}</span>
          </div>
        )}

        {/* Objective / Overview */}
        {event.objective && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase' }}>Objective</h4>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: '#1e293b' }}>{event.objective}</p>
          </div>
        )}

        {/* Official Rules List */}
        {event.rules_list && event.rules_list.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📜 Event Rules & Guidelines
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.6 }}>
              {event.rules_list.map((rule, rIdx) => (
                <li key={rIdx} style={{ marginBottom: '6px', fontWeight: 600 }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rounds */}
        {event.rounds_list && event.rounds_list.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase' }}>Rounds Breakdown</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.6 }}>
              {event.rounds_list.map((rd, rdIdx) => (
                <li key={rdIdx} style={{ marginBottom: '4px', fontWeight: 600 }}>{rd}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#000000',
              color: '#ffffff',
              border: '2.5px solid #000000',
              boxShadow: '4px 4px 0px 0px #FFE600',
              padding: '10px 24px',
              fontWeight: 900,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
