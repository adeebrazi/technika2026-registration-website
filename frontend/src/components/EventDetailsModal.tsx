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

export interface EventConfigState {
  mode?: string;
  teamName?: string;
  teamId?: string;
}

export interface TeamCheckStatusState {
  loading?: boolean;
  valid?: boolean;
  message?: string;
  leaderName?: string;
}

interface EventDetailsModalProps {
  event: EventDetailData | null;
  onClose: () => void;
  // Optional registration integration props:
  isSelected?: boolean;
  onToggleSelect?: (eventId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  isSelected,
  onToggleSelect,
}) => {
  if (!event) return null;

  const minMembers = event.minMembers ?? 1;
  const maxMembers = event.maxMembers ?? 1;
  const isSoloOnly = maxMembers === 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--card, #FFFFFF)',
          color: 'var(--foreground, #000000)',
          border: '3.5px solid var(--border, #000000)',
          boxShadow: '10px 10px 0px 0px var(--border, #000000)',
          padding: '24px',
          boxSizing: 'border-box'
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
                border: '2px solid var(--border, #000000)',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                marginBottom: '8px',
                boxShadow: '2px 2px 0px 0px var(--border, #000000)'
              }}
            >
              {event.category}
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1, color: 'var(--foreground, #000000)' }}>
              {event.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: '2.5px solid var(--border, #000000)',
              boxShadow: '3px 3px 0px 0px var(--border, #000000)',
              fontWeight: 900,
              fontSize: '1.1rem',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        {/* Quick Meta Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', fontSize: '0.78rem', fontWeight: 800 }}>
          <span style={{ background: 'var(--brut-orange, #f5a201)', color: '#000000', border: '2px solid var(--border, #000000)', padding: '5px 10px', fontWeight: 900 }}>
            👥 {isSoloOnly ? 'Solo Entry (1 Participant)' : `Group / Team Event (${minMembers} - ${maxMembers} Members)`}
          </span>
        </div>

        {/* Participation Selection Panel */}
        {onToggleSelect && (
          <div
            style={{
              marginBottom: '20px',
              background: isSelected ? '#f0fdf4' : 'var(--muted, #f1f5f9)',
              color: 'var(--foreground, #000000)',
              border: isSelected ? '3px solid #10b981' : '2.5px solid var(--border, #000000)',
              boxShadow: isSelected ? '6px 6px 0px 0px #10b981, 8px 8px 0px 0px var(--border, #000000)' : '4px 4px 0px 0px var(--border, #000000)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {!isSoloOnly && (
              <div
                style={{
                  background: '#fef3c7',
                  border: '2px solid #000000',
                  boxShadow: '3px 3px 0px 0px #000000',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  color: '#78350f',
                  fontWeight: 800
                }}
              >
                💡 <strong>On-Spot Team Formation:</strong> All participants register individually online. For this group/team event, you will form your team directly on-spot with your friends at the event venue during reporting!
              </div>
            )}

            {/* Selection Action Button */}
            <button
              type="button"
              onClick={() => {
                onToggleSelect(event.id);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '0.92rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: isSelected ? '#10b981' : '#FFE600',
                color: isSelected ? '#ffffff' : '#000000',
                border: '2.5px solid var(--border, #000000)',
                boxShadow: '4px 4px 0px 0px var(--border, #000000)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {isSelected ? '✓ SELECTED FOR REGISTRATION (CLICK TO REMOVE)' : '+ ADD EVENT TO REGISTRATION'}
            </button>
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: '20px', background: 'var(--muted, #f1f5f9)', border: '2.5px solid var(--border, #000000)', boxShadow: '3px 3px 0px 0px var(--border, #000000)', padding: '16px' }}>
          <div style={{ display: 'inline-block', background: '#FFE600', color: '#000000', border: '1.5px solid var(--border, #000000)', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
            Description
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--foreground, #000000)', fontWeight: 600 }}>
            {event.description}
          </p>
        </div>

        {/* Objective / Overview */}
        {event.objective && (
          <div style={{ marginBottom: '20px', background: 'var(--muted, #f1f5f9)', border: '2.5px solid var(--border, #000000)', boxShadow: '3px 3px 0px 0px var(--border, #000000)', padding: '16px' }}>
            <div style={{ display: 'inline-block', background: 'var(--brut-lime, #8aebee)', color: '#000000', border: '1.5px solid var(--border, #000000)', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
              🎯 Objective
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--foreground, #000000)', fontWeight: 600 }}>
              {event.objective}
            </p>
          </div>
        )}

        {/* Official Rules List */}
        {event.rules_list && event.rules_list.length > 0 && (
          <div style={{ marginBottom: '20px', background: 'var(--muted, #f1f5f9)', border: '2.5px solid var(--border, #000000)', boxShadow: '3px 3px 0px 0px var(--border, #000000)', padding: '16px' }}>
            <div style={{ display: 'inline-block', background: 'var(--brut-orange, #f5a201)', color: '#000000', border: '1.5px solid var(--border, #000000)', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
              📜 Event Rules & Guidelines
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.88rem', color: 'var(--foreground, #000000)', lineHeight: 1.6, listStyleType: 'disc' }}>
              {event.rules_list.map((rule, rIdx) => (
                <li key={rIdx} style={{ marginBottom: '6px', fontWeight: 600 }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rounds Breakdown */}
        {event.rounds_list && event.rounds_list.length > 0 && (
          <div style={{ marginBottom: '20px', background: 'var(--muted, #f1f5f9)', border: '2.5px solid var(--border, #000000)', boxShadow: '3px 3px 0px 0px var(--border, #000000)', padding: '16px' }}>
            <div style={{ display: 'inline-block', background: 'var(--brut-pink, #1cabb0)', color: '#ffffff', border: '1.5px solid var(--border, #000000)', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
              🔄 Rounds Breakdown
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.88rem', color: 'var(--foreground, #000000)', lineHeight: 1.6, listStyleType: 'disc' }}>
              {event.rounds_list.map((rd, rdIdx) => (
                <li key={rdIdx} style={{ marginBottom: '6px', fontWeight: 600 }}>{rd}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Judgement Criteria */}
        {event.criteria_list && event.criteria_list.length > 0 && (
          <div style={{ marginBottom: '20px', background: 'var(--muted, #f1f5f9)', border: '2.5px solid var(--border, #000000)', boxShadow: '3px 3px 0px 0px var(--border, #000000)', padding: '16px' }}>
            <div style={{ display: 'inline-block', background: '#FFE600', color: '#000000', border: '1.5px solid var(--border, #000000)', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
              ⚖️ Judgement Criteria
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.88rem', color: 'var(--foreground, #000000)', lineHeight: 1.6, listStyleType: 'disc' }}>
              {event.criteria_list.map((crit, cIdx) => (
                <li key={cIdx} style={{ marginBottom: '4px', fontWeight: 600 }}>{crit}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <a
            href="/brochure.pdf"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFE600',
              color: '#000000',
              border: '2px solid var(--border, #000000)',
              boxShadow: '3px 3px 0px 0px var(--border, #000000)',
              padding: '10px 18px',
              fontWeight: 900,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <span>📄 View in Brochure (PDF)</span>
            <span>↗</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--secondary, #8aebee)',
              color: '#000000',
              border: '2px solid var(--border, #000000)',
              boxShadow: '3px 3px 0px 0px var(--border, #000000)',
              padding: '10px 24px',
              fontWeight: 900,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            {onToggleSelect ? 'Done & Close' : 'Close Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
