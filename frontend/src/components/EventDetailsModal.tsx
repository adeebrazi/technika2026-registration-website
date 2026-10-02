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
  teamMembers?: string[];
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

  // Teammates Verification State: { [uniqueId]: { loading: boolean, valid?: boolean, name?: string, institution?: string, message?: string } }
  const [teammateStatus, setTeammateStatus] = React.useState<
    Record<string, { loading: boolean; valid?: boolean; name?: string; institution?: string; message?: string }>
  >({});

  const maxTeammates = Math.max(1, (maxMembers ?? 2) - 1);
  const currentTeammates = config?.teamMembers && config.teamMembers.length > 0 ? config.teamMembers : [''];

  const handleTeammateChange = (index: number, val: string) => {
    const cleanVal = val.toUpperCase().trim().slice(0, 6);
    const updated = [...currentTeammates];
    updated[index] = cleanVal;
    if (onUpdateConfig) {
      onUpdateConfig(event.id, { mode: 'create_team', teamMembers: updated });
    }
    if (cleanVal.length === 6) {
      verifyTeammateId(cleanVal);
    }
  };

  const handleAddTeammateSlot = () => {
    if (currentTeammates.length < maxTeammates) {
      const updated = [...currentTeammates, ''];
      if (onUpdateConfig) {
        onUpdateConfig(event.id, { mode: 'create_team', teamMembers: updated });
      }
    }
  };

  const handleRemoveTeammateSlot = (index: number) => {
    const updated = currentTeammates.filter((_, i) => i !== index);
    if (onUpdateConfig) {
      onUpdateConfig(event.id, { mode: 'create_team', teamMembers: updated.length > 0 ? updated : [''] });
    }
  };

  const verifyTeammateId = async (id: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId || cleanId.length < 4) return;
    setTeammateStatus((prev) => ({ ...prev, [cleanId]: { loading: true } }));
    try {
      const res = await fetch('/api/teams/verify-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId: cleanId, eventId: event.id })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setTeammateStatus((prev) => ({
          ...prev,
          [cleanId]: {
            loading: false,
            valid: true,
            name: data.user.name,
            institution: data.user.institution,
            message: `✓ Verified: ${data.user.name} (${data.user.institution || 'Registered'})`
          }
        }));
      } else {
        setTeammateStatus((prev) => ({
          ...prev,
          [cleanId]: {
            loading: false,
            valid: false,
            message: data.message || `No participant found with ID "${cleanId}".`
          }
        }));
      }
    } catch {
      setTeammateStatus((prev) => ({
        ...prev,
        [cleanId]: { loading: false, valid: false, message: 'Could not connect to server to verify.' }
      }));
    }
  };

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
            👥 {isSoloOnly ? 'Solo Entry (1 Member)' : isTeamOnly ? `Team: ${minMembers} - ${maxMembers} Members` : `Solo or Team (1 - ${maxMembers} Members)`}
          </span>
        </div>

        {/* Participation & Team Setup Panel (Only shown on Registration page when onToggleSelect is provided) */}
        {onToggleSelect && (
          <div
            style={{
              marginBottom: '20px',
              background: 'var(--muted, #f1f5f9)',
              color: 'var(--foreground, #000000)',
              border: isSelected ? '3px solid #FFE600' : '2.5px solid var(--border, #000000)',
              boxShadow: isSelected ? '6px 6px 0px 0px #FFE600, 8px 8px 0px 0px var(--border, #000000)' : '4px 4px 0px 0px var(--border, #000000)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--foreground, #000000)', letterSpacing: '0.03em' }}>
                ⚡ Participation Mode & Team Setup
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#000000', background: 'var(--brut-lime, #8aebee)', padding: '3px 8px', border: '1.5px solid var(--border, #000000)' }}>
                {isSoloOnly ? 'Solo Only' : isTeamOnly ? `Team Required (${minMembers}-${maxMembers} Members)` : `Solo or Team (${minMembers}-${maxMembers} Members)`}
              </span>
            </div>

            {/* Mode selection buttons */}
            {isSoloOnly ? (
              <div style={{ fontSize: '0.82rem', fontWeight: 800, background: 'var(--card, #ffffff)', padding: '10px 14px', border: '2px solid var(--border, #000000)', color: 'var(--foreground, #000000)' }}>
                👤 Individual Entry — No team required. You will be enrolled as a solo participant.
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--foreground, #000000)', marginBottom: '6px' }}>
                  Select How You Want To Enter:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {isHybrid && (
                    <button
                      type="button"
                      onClick={() => onUpdateConfig && onUpdateConfig(event.id, { mode: 'solo' })}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '9px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        background: currentMode === 'solo' ? 'var(--brut-lime, #8aebee)' : 'var(--card, #ffffff)',
                        color: '#000000',
                        border: '2px solid var(--border, #000000)',
                        boxShadow: currentMode === 'solo' ? '2.5px 2.5px 0px 0px var(--border, #000000)' : 'none',
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
                      padding: '9px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      background: currentMode === 'create_team' ? '#FFE600' : 'var(--card, #ffffff)',
                      color: '#000000',
                      border: '2px solid var(--border, #000000)',
                      boxShadow: currentMode === 'create_team' ? '2.5px 2.5px 0px 0px var(--border, #000000)' : 'none',
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
                      padding: '9px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      background: currentMode === 'join_team' ? 'var(--brut-pink, #1cabb0)' : 'var(--card, #ffffff)',
                      color: currentMode === 'join_team' ? '#ffffff' : '#000000',
                      border: '2px solid var(--border, #000000)',
                      boxShadow: currentMode === 'join_team' ? '2.5px 2.5px 0px 0px var(--border, #000000)' : 'none',
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
              <div style={{ background: 'var(--card, #ffffff)', padding: '10px 12px', borderLeft: '4px solid var(--brut-lime, #8aebee)', border: '1.5px solid var(--border, #000000)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--foreground, #000000)', fontWeight: 700 }}>
                  ✓ You are registering individually. You will compete solo under your personal registration ID.
                </p>
              </div>
            )}

            {/* Create Team Configuration */}
            {currentMode === 'create_team' && (
              <div style={{ background: 'var(--card, #ffffff)', padding: '12px', border: '2px solid var(--border, #000000)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--foreground, #000000)' }}>
                    Team Name:
                  </label>
                  <input
                    type="text"
                    placeholder={formDataName ? `${formDataName}'s Team` : "e.g. CyberKnights"}
                    value={config?.teamName || ''}
                    onChange={(e) => onUpdateConfig && onUpdateConfig(event.id, { mode: 'create_team', teamName: e.target.value })}
                    style={{
                      background: 'var(--card, #ffffff)',
                      border: '2px solid var(--border, #000000)',
                      color: 'var(--foreground, #000000)',
                      padding: '8px 12px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Teammates Unique ID Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1.5px dashed var(--border, #000000)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--foreground, #000000)' }}>
                      Teammate Unique ID(s):
                    </label>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#FFE600', color: '#000000', padding: '1px 6px', border: '1.5px solid #000000' }}>
                      Leader + up to {maxTeammates} Teammate{maxTeammates > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentTeammates.map((memberId, idx) => {
                      const status = teammateStatus[memberId];
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <input
                                type="text"
                                maxLength={6}
                                placeholder={`Teammate #${idx + 1} Unique ID (e.g. T48291)`}
                                value={memberId}
                                onChange={(e) => handleTeammateChange(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: 'var(--card, #ffffff)',
                                  border: '2px solid var(--border, #000000)',
                                  color: 'var(--foreground, #000000)',
                                  padding: '7px 10px',
                                  fontSize: '0.85rem',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  fontFamily: 'monospace',
                                  outline: 'none'
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => verifyTeammateId(memberId)}
                              disabled={memberId.length < 4 || status?.loading}
                              style={{
                                padding: '7px 10px',
                                fontSize: '0.72rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                background: memberId.length >= 4 ? '#000000' : '#e2e8f0',
                                color: memberId.length >= 4 ? '#ffffff' : '#94a3b8',
                                border: '2px solid var(--border, #000000)',
                                cursor: memberId.length >= 4 ? 'pointer' : 'default',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {status?.loading ? 'Checking...' : 'Verify'}
                            </button>
                            {currentTeammates.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTeammateSlot(idx)}
                                title="Remove teammate"
                                style={{
                                  padding: '7px 9px',
                                  fontSize: '0.72rem',
                                  fontWeight: 900,
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '2px solid #000000',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Verification Feedback Banner */}
                          {memberId && status && !status.loading && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '4px 8px',
                                border: '1.5px solid #000000',
                                background: status.valid ? '#dcfce7' : '#fee2e2',
                                color: status.valid ? '#166534' : '#991b1b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>{status.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add another teammate slot button */}
                    {currentTeammates.length < maxTeammates && (
                      <button
                        type="button"
                        onClick={handleAddTeammateSlot}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '5px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          background: 'var(--brut-cyan, #1cabb0)',
                          color: '#ffffff',
                          border: '2px solid #000000',
                          boxShadow: '1.5px 1.5px 0px 0px #000000',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        + Add Another Teammate ({currentTeammates.length}/{maxTeammates})
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--foreground, #000000)', lineHeight: 1.4, opacity: 0.9 }}>
                  💡 <strong>How it works:</strong> Enter your teammates' <strong>6-character Unique ID</strong> (e.g. <code>T49201</code>) that they received upon registering. Teammates who haven't registered yet can also join your team later using your generated <strong>Team ID</strong>!
                </div>
              </div>
            )}

            {/* Join Team Configuration */}
            {currentMode === 'join_team' && (
              <div style={{ background: 'var(--card, #ffffff)', padding: '12px', border: '2px solid var(--border, #000000)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--foreground, #000000)' }}>
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
                      background: 'var(--card, #ffffff)',
                      border: '2px solid var(--border, #000000)',
                      color: 'var(--foreground, #000000)',
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
                      background: 'var(--brut-lime, #8aebee)',
                      color: '#000000',
                      border: '2px solid var(--border, #000000)',
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
                  <div style={{ background: '#dcfce7', border: '1.5px solid #10b981', color: '#166534', padding: '6px 10px', fontSize: '0.78rem', fontWeight: 800 }}>
                    {teamCheckStatus?.message}
                  </div>
                )}
                {teamCheckStatus?.valid === false && (
                  <div style={{ background: '#fee2e2', border: '1.5px solid #ef4444', color: '#991b1b', padding: '6px 10px', fontSize: '0.78rem', fontWeight: 800 }}>
                    {teamCheckStatus?.message}
                  </div>
                )}
                {!teamCheckStatus?.message && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--foreground, #000000)', opacity: 0.8 }}>
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
                  border: '2.5px solid var(--border, #000000)',
                  boxShadow: '4px 4px 0px 0px var(--border, #000000)',
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
