import { useState } from 'react'

export default function InfoPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [triggerHovered, setTriggerHovered] = useState(false)

  return (
    <>
      {/* Floating trigger button */}
      <button
        data-testid="info-popup-trigger"
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9000,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(13,13,15,0.9)',
          border: `1px solid ${triggerHovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}`,
          color: triggerHovered ? '#e5e7eb' : '#6b7280',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.15s, color 0.15s',
          backdropFilter: 'blur(4px)',
        }}
        title="About / Report a bug"
      >
        ℹ
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9001,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <div
            data-testid="info-popup-panel"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9002,
              width: 420,
              background: '#0d0d0f',
              border: '1px solid #374151',
              borderRadius: 4,
              boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 24px 48px rgba(0,0,0,0.9)',
              overflow: 'hidden',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {/* Decorative top bar */}
            <div
              style={{
                height: 3,
                background: 'linear-gradient(90deg, #6366f1, #a78bfa, #38bdf8)',
              }}
            />

            <div style={{ padding: '28px 32px 32px' }}>
              {/* Close button */}
              <button
                data-testid="info-popup-close"
                onClick={() => setIsOpen(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                title="Close"
              >
                ×
              </button>

              {/* Title */}
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: '0.3em',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                DATA PRIVACY DYSTOPIA
              </div>

              {/* Website card */}
              <a
                data-testid="info-popup-website"
                href="https://selimym.github.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
              >
                <InfoCard
                  emoji="✦"
                  accent="#a78bfa"
                  title="Like this game?"
                  subtitle="Have a look at my other work → selimym.github.io"
                />
              </a>

              {/* Bug report card */}
              <a
                data-testid="info-popup-bug-report"
                href="https://github.com/selimym/data_privacy_distopia/issues"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <InfoCard
                  emoji="⚑"
                  accent="#38bdf8"
                  title="Noticed a bug?"
                  subtitle="Report it on GitHub — every report helps!"
                />
              </a>

              {/* Footer */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid #1f2937',
                  fontSize: 12,
                  color: '#4b5563',
                  lineHeight: 1.7,
                }}
              >
                <div style={{ marginBottom: 8, color: '#6b7280' }}>This is not a game. These systems are real:</div>
                <FooterLink href="https://www.972mag.com/lavender-ai-israeli-army-gaza/" label="Lavender: The AI machine directing Israel's bombing spree in Gaza — +972 Magazine" />
                <FooterLink href="https://www.404media.co/elite-the-palantir-app-ice-uses-to-find-neighborhoods-to-raid/" label="ELITE: The Palantir App ICE Uses to Find Neighborhoods to Raid — 404 Media" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function InfoCard({
  emoji,
  accent,
  title,
  subtitle,
}: {
  emoji: string
  accent: string
  title: string
  subtitle: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 3,
        border: `1px solid ${hovered ? accent + '55' : '#1f2937'}`,
        background: hovered ? `${accent}08` : 'transparent',
        transition: 'border-color 0.2s, background 0.2s',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          fontSize: 18,
          color: accent,
          lineHeight: 1,
          marginTop: 2,
          flexShrink: 0,
          filter: hovered ? `drop-shadow(0 0 6px ${accent}88)` : 'none',
          transition: 'filter 0.2s',
        }}
      >
        {emoji}
      </span>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: hovered ? '#e5e7eb' : '#9ca3af',
            letterSpacing: '0.05em',
            marginBottom: 4,
            transition: 'color 0.2s',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: hovered ? '#6b7280' : '#4b5563',
            letterSpacing: '0.05em',
            lineHeight: 1.5,
            transition: 'color 0.2s',
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        fontSize: 12,
        color: hovered ? '#9ca3af' : '#4b5563',
        textDecoration: hovered ? 'underline' : 'none',
        letterSpacing: '0.05em',
        lineHeight: 1.6,
        marginBottom: 3,
        transition: 'color 0.15s',
        cursor: 'pointer',
      }}
    >
      ↗ {label}
    </a>
  )
}
