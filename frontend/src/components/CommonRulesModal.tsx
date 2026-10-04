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
        background: 'rgba(0, 0, 0, 0.82)',
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
          maxWidth: '760px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          color: '#000000',
          border: '3.5px solid #000000',
          boxShadow: '10px 10px 0px 0px #000000',
          padding: '26px 24px',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                background: '#FFE600',
                color: '#000000',
                border: '2px solid #000000',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                marginBottom: '8px',
                boxShadow: '2px 2px 0px 0px #000000'
              }}
            >
              OFFICIAL BROCHURE · TECHNIKA 6.0
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)',
                fontSize: '1.65rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: 1.15,
                color: '#000000',
                letterSpacing: '-0.02em'
              }}
            >
              Event Common Rules &amp; Regulations
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: '2.5px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
              fontWeight: 900,
              fontSize: '1.15rem',
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
        <div
          style={{
            marginBottom: '20px',
            background: '#f8fafc',
            border: '2.5px solid #000000',
            boxShadow: '4px 4px 0px 0px #000000',
            padding: '18px 20px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFE600',
              color: '#000000',
              border: '2px solid #000000',
              padding: '4px 10px',
              marginBottom: '14px',
              boxShadow: '2px 2px 0px 0px #000000'
            }}
          >
            <span style={{ fontSize: '1rem' }}>📜</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              General Event Rules
            </span>
          </div>
          <ol style={{ margin: 0, paddingLeft: '22px', fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.65 }}>
            {eventRules.map((rule, idx) => (
              <li key={idx} style={{ marginBottom: '8px', fontWeight: 600 }}>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        {/* Section 2: Disqualification Criteria */}
        <div
          style={{
            marginBottom: '20px',
            background: '#fff1f2',
            border: '3px solid #dc2626',
            boxShadow: '4px 4px 0px 0px #dc2626',
            padding: '18px 20px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#dc2626',
              color: '#ffffff',
              border: '2px solid #000000',
              padding: '4px 10px',
              marginBottom: '14px',
              boxShadow: '2px 2px 0px 0px #000000'
            }}
          >
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Disqualification Criteria
            </span>
          </div>
          <ol style={{ margin: 0, paddingLeft: '22px', fontSize: '0.88rem', color: '#881337', lineHeight: 1.65 }}>
            {disqualificationCriteria.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '8px', fontWeight: 600 }}>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Section 3: Necessary Documents Required */}
        <div
          style={{
            marginBottom: '24px',
            background: '#f0f9ff',
            border: '2.5px solid #0284c7',
            boxShadow: '4px 4px 0px 0px #0284c7',
            padding: '16px 20px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0284c7',
              color: '#ffffff',
              border: '2px solid #000000',
              padding: '4px 10px',
              marginBottom: '10px',
              boxShadow: '2px 2px 0px 0px #000000'
            }}
          >
            <span style={{ fontSize: '1rem' }}>🪪</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Necessary Documents Required at Venue
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: '#0c4a6e', lineHeight: 1.6, fontWeight: 600 }}>
            <li style={{ marginBottom: '6px' }}>Original / Valid College or School ID Card.</li>
            <li>Copy of payment receipt / transaction slip with matching 12-digit UTR.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              color: '#000000',
              border: '2.5px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
              padding: '10px 22px',
              fontWeight: 900,
              fontSize: '0.88rem',
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
                boxShadow: '4px 4px 0px 0px #000000',
                padding: '10px 26px',
                fontWeight: 900,
                fontSize: '0.88rem',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              ✓ I Understand &amp; Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
