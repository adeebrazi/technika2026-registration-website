import React from 'react';

interface CommonRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const CommonRulesModal: React.FC<CommonRulesModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  if (!isOpen) return null;

  const eventRules = [
    "Participants must carry their valid college/school ID cards during the event.",
    "All participants are required to report at the venue at least 30 minutes before the scheduled start time.",
    "Teams must adhere to the event schedule. Late entry may lead to disqualification at the discretion of the organizers.",
    "Participants are expected to maintain discipline and display good sportsmanship throughout the event.",
    "Any damage caused to event property, equipment, or venue infrastructure will be the responsibility of the concerned participant/team.",
    "The use of unfair means, misconduct, violation of event-specific rules, or the use of cheat codes, hacks, exploits, or unauthorized third-party software in games is strictly prohibited.",
    "Participants must follow all instructions provided by the event coordinators, volunteers, and judges.",
    "The organizers reserve the right to modify event schedules, rules, or formats if required due to unforeseen circumstances.",
    "Organizers shall not be responsible for any loss of personal belongings, injuries, or damages incurred during the event.",
    "The Judges' decision will be final and binding on all events."
  ];

  const disqualificationCriteria = [
    "Violation of any event rule or guideline.",
    "Use of unfair practices, cheating, or fraudulent activities.",
    "Misbehavior, misconduct, or use of offensive language towards participants, volunteers, judges, or organizers.",
    "Plagiarism, copying of ideas, projects, designs, or submissions where originality is required.",
    "Causing intentional damage to event property, equipment, or venue facilities.",
    "Use of prohibited materials, tools, devices, or techniques specified in the respective event rules.",
    "Failure to comply with instructions issued by event coordinators, volunteers, or judges.",
    "Any activity that compromises the safety, fairness, or integrity of the event.",
    "Submission of false information during registration or participation.",
    "Any negligence or misconduct deemed inappropriate by the organizing committee."
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
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
          maxWidth: '750px',
          maxHeight: '88vh',
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', gap: '12px' }}>
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
              OFFICIAL BROCHURE · TECHNIKA 6.0
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)', fontSize: '1.65rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1, color: 'var(--foreground, #ffffff)' }}>
              Event Common Rules & Regulations
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

        {/* Section 1: General Event Rules */}
        <div style={{ marginBottom: '22px', background: 'rgba(0, 0, 0, 0.35)', border: '2px solid var(--border, #8aebee)', padding: '16px 18px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 900, textTransform: 'uppercase', color: '#FFE600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📜</span> General Event Rules
          </h4>
          <ol style={{ margin: 0, paddingLeft: '22px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.92)', lineHeight: 1.6 }}>
            {eventRules.map((rule, idx) => (
              <li key={idx} style={{ marginBottom: '6px', fontWeight: 500 }}>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        {/* Section 2: Disqualification Criteria */}
        <div style={{ marginBottom: '22px', background: 'rgba(239, 68, 68, 0.08)', border: '2px solid rgba(239, 68, 68, 0.6)', padding: '16px 18px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 900, textTransform: 'uppercase', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> Disqualification Criteria
          </h4>
          <ol style={{ margin: 0, paddingLeft: '22px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.92)', lineHeight: 1.6 }}>
            {disqualificationCriteria.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '6px', fontWeight: 500 }}>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Section 3: Necessary Documents Required */}
        <div style={{ marginBottom: '24px', background: 'rgba(60, 230, 252, 0.08)', border: '1.5px solid #3CE6FC', padding: '14px 18px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 900, textTransform: 'uppercase', color: '#3CE6FC' }}>
            🪪 Necessary Documents Required at Venue:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}>Original / Valid College or School ID Card.</li>
            <li>Copy of payment receipt / transaction slip with matching 12-digit UTR.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#000000',
              color: '#ffffff',
              border: '2px solid var(--border, #8aebee)',
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              style={{
                background: '#FFE600',
                color: '#000000',
                border: '2.5px solid #000000',
                boxShadow: '3px 3px 0px 0px #000000',
                padding: '10px 24px',
                fontWeight: 900,
                fontSize: '0.88rem',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              ✓ I Understand & Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
