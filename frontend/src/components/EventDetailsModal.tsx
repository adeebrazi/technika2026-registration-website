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
  mode: 'solo' | 'create_team' | 'join_team';
  teamName: string;
  teamId: string;
}

export interface TeamCheckStatusState {
  loading: boolean;
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
  config?: EventConfigState;
  onUpdateConfig?: (eventId: string, updates: Partial<EventConfigState>) => void;
  teamCheckStatus?: TeamCheckStatusState;
  onValidateTeamCode?: (eventId: string, teamId: string) => void;
  formDataName?: string;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  isSelected,
  onToggleSelect,
  config,
  onUpdateConfig,
  teamCheckStatus,
  onValidateTeamCode,
  formDataName
}) => {
  if (!event) return null;

  const minMembers = event.minMembers ?? 1;
  const maxMembers = event.maxMembers ?? 1;
  const isSoloOnly = maxMembers === 1;
  const isTeamOnly = minMembers > 1;
  const isHybrid = minMembers === 1 && maxMembers > 1;
  const currentMode = config?.mode || (isTeamOnly ? 'create_team' : 'solo');

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
          background: 'var(--card, #00364d)',
          color: 'var(--foreground, #ffffff)',
          border: '3.5px solid var(--border, #8aebee)',
          boxShadow: '10px 10px 0px 0px #000000',
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
                border: '2px solid #000000',
                padding: '2px 10px',
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                marginBottom: '8px',
                boxShadow: '2px 2px 0px 0px #000000'
              }}
            >
              {event.category}
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1, color: 'var(--foreground, #ffffff)' }}>
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
              border: '2px solid #ffffff',
              boxShadow: '3px 3px 0px 0px #000000',
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
          <span style={{ background: '#FF7A00', color: '#000000', border: '1.5px solid #000000', padding: '5px 10px' }}>
            👥 {isSoloOnly ? 'Solo Entry (1 Member)' : isTeamOnly ? `Team: ${minMembers} - ${maxMembers} Members` : `Solo or Team (1 - ${maxMembers} Members)`}
          </span>
        </div>

        {/* Participation & Team Setup Panel (Only shown on Registration page when onToggleSelect is provided) */}
        {onToggleSelect && (
          <div
            style={{
              marginBottom: '20px',
              background: 'rgba(0, 0, 0, 0.45)',
              color: '#ffffff',
              border: isSelected ? '3px solid #FFE600' : '2px solid var(--border, #8aebee)',
              boxShadow: isSelected ? '6px 6px 0px 0px #FFE600, 8px 8px 0px 0px #000000' : '4px 4px 0px 0px #000000',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 900, textTransform: 'uppercase', color: '#FFE600', letterSpacing: '0.04em' }}>
                ⚡ Participation Mode & Team Setup
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#3CE6FC', background: 'rgba(60, 230, 252, 0.15)', padding: '3px 8px', border: '1px solid #3CE6FC' }}>
                {isSoloOnly ? 'Solo Only' : isTeamOnly ? `Team Required (${minMembers}-${maxMembers} Members)` : `Solo or Team (${minMembers}-${maxMembers} Members)`}
              </span>
            </div>

            {/* Mode selection buttons */}
            {isSoloOnly ? (
              <div style={{ fontSize: '0.82rem', fontWeight: 800, background: 'rgba(255,255,255,0.08)', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1' }}>
                👤 Individual Entry — No team required. You will be enrolled as a solo participant.
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: '6px' }}>
                  Select How You Want To Enter:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {isHybrid && (
                    <button
                      type="button"
                      onClick={() => onUpdateConfig && onUpdateConfig(event.id, { mode: 'solo' })}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        background: currentMode === 'solo' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                        color: currentMode === 'solo' ? '#000000' : '#cbd5e1',
                        border: currentMode === 'solo' ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.25)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      👤 Go Solo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onUpdateConfig && onUpdateConfig(event.id, { mode: 'create_team' })}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      background: currentMode === 'create_team' ? '#FFE600' : 'rgba(255,255,255,0.1)',
                      color: currentMode === 'create_team' ? '#000000' : '#cbd5e1',
                      border: currentMode === 'create_team' ? '2px solid #FFE600' : '1px solid rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    👑 Leader (Create Team)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig && onUpdateConfig(event.id, { mode: 'join_team' })}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      background: currentMode === 'join_team' ? '#3CE6FC' : 'rgba(255,255,255,0.1)',
                      color: currentMode === 'join_team' ? '#000000' : '#cbd5e1',
                      border: currentMode === 'join_team' ? '2px solid #3CE6FC' : '1px solid rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🤝 Join Friend's Team
                  </button>
                </div>
              </div>
            )}

            {/* Solo Confirmation Note */}
            {currentMode === 'solo' && isHybrid && (
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderLeft: '3px solid #ffffff' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>
                  ✓ You are registering individually. You will compete solo under your personal registration ID.
                </p>
              </div>
            )}

            {/* Create Team Configuration */}
            {currentMode === 'create_team' && (
              <div style={{ background: 'rgba(255, 230, 0, 0.08)', padding: '12px', border: '1.5px solid rgba(255, 230, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#FFE600' }}>
                  Team Name:
                </label>
                <input
                  type="text"
                  placeholder={formDataName ? `${formDataName}'s Team` : "e.g. CyberKnights"}
                  value={config?.teamName || ''}
                  onChange={(e) => onUpdateConfig && onUpdateConfig(event.id, { mode: 'create_team', teamName: e.target.value })}
                  style={{
                    background: '#000000',
                    border: '2px solid #FFE600',
                    color: '#FFE600',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  💡 <strong>How it works:</strong> As Team Leader, upon submitting your registration, a unique <strong>6-character Team ID</strong> (e.g. <code>T49201</code>) will be created. Share it with your teammates so they can select "Join Team" during their registration!
                </div>
              </div>
            )}

            {/* Join Team Configuration */}
            {currentMode === 'join_team' && (
              <div style={{ background: 'rgba(60, 230, 252, 0.08)', padding: '12px', border: '1.5px solid rgba(60, 230, 252, 0.5)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#3CE6FC' }}>
                  Enter Team ID Given by Your Leader:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. T49201"
                    value={config?.teamId || ''}
                    onChange={(e) => onUpdateConfig && onUpdateConfig(event.id, { mode: 'join_team', teamId: e.target.value.toUpperCase() })}
                    style={{
                      flex: 1,
                      background: '#000000',
                      border: '2px solid #3CE6FC',
                      color: '#3CE6FC',
                      padding: '8px 12px',
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onValidateTeamCode && onValidateTeamCode(event.id, config?.teamId || '')}
                    disabled={teamCheckStatus?.loading || !config?.teamId?.trim()}
                    style={{
                      background: '#3CE6FC',
                      color: '#000000',
                      border: '2px solid #000000',
                      padding: '8px 16px',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {teamCheckStatus?.loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>
                {teamCheckStatus?.valid === true && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '6px 10px', fontSize: '0.76rem', fontWeight: 800 }}>
                    {teamCheckStatus?.message}
                  </div>
                )}
                {teamCheckStatus?.valid === false && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 10px', fontSize: '0.76rem', fontWeight: 800 }}>
                    {teamCheckStatus?.message}
                  </div>
                )}
                {!teamCheckStatus?.message && (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Ask your Team Leader for the 6-character Team ID code they received upon registration.
                  </span>
                )}
              </div>
            )}

            {/* Selection Action Button */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  onToggleSelect(event.id);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  background: isSelected ? '#10b981' : '#FFE600',
                  color: isSelected ? '#ffffff' : '#000000',
                  border: '2.5px solid #000000',
                  boxShadow: '4px 4px 0px 0px #000000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSelected ? '✓ SELECTED FOR REGISTRATION (CLICK TO REMOVE)' : '+ ADD EVENT TO REGISTRATION'}
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: '20px', background: 'rgba(0, 0, 0, 0.35)', border: '2px solid var(--border, #8aebee)', padding: '16px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: '#FFE600', letterSpacing: '0.04em' }}>
            Description
          </h4>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--foreground, #ffffff)', fontWeight: 500 }}>
            {event.description}
          </p>
        </div>


        {/* Objective / Overview */}
        {event.objective && (
          <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(255, 255, 255, 0.18)', padding: '14px 16px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: 900, textTransform: 'uppercase', color: '#3CE6FC' }}>
              🎯 Objective
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: '#e2e8f0' }}>{event.objective}</p>
          </div>
        )}

        {/* Official Rules List */}
        {event.rules_list && event.rules_list.length > 0 && (
          <div style={{ marginBottom: '20px', background: 'rgba(0, 0, 0, 0.25)', border: '1.5px solid rgba(255, 255, 255, 0.15)', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', color: '#FFE600' }}>
              📜 Event Rules & Guidelines
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 }}>
              {event.rules_list.map((rule, rIdx) => (
                <li key={rIdx} style={{ marginBottom: '6px', fontWeight: 500 }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rounds Breakdown */}
        {event.rounds_list && event.rounds_list.length > 0 && (
          <div style={{ marginBottom: '20px', background: 'rgba(0, 0, 0, 0.25)', border: '1.5px solid rgba(60, 230, 252, 0.3)', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', color: '#3CE6FC' }}>
              🔄 Rounds Breakdown
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 }}>
              {event.rounds_list.map((rd, rdIdx) => (
                <li key={rdIdx} style={{ marginBottom: '6px', fontWeight: 500 }}>{rd}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Judgement Criteria */}
        {event.criteria_list && event.criteria_list.length > 0 && (
          <div style={{ marginBottom: '20px', background: 'rgba(0, 0, 0, 0.25)', border: '1.5px solid rgba(255, 122, 0, 0.4)', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', color: '#FF7A00' }}>
              ⚖️ Judgement Criteria
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 }}>
              {event.criteria_list.map((crit, cIdx) => (
                <li key={cIdx} style={{ marginBottom: '4px', fontWeight: 500 }}>{crit}</li>
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
              border: '2px solid #000000',
              boxShadow: '4px 4px 0px 0px #000000',
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
              border: '2px solid #000000',
              boxShadow: '4px 4px 0px 0px #000000',
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
