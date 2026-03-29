import type { CaseOverview } from '@/types/citizen'

interface CaseRowProps {
  caseItem: CaseOverview
  isSelected: boolean
  onSelect: () => void
  collapsed: boolean
}

function riskLabel(score: number | null, riskLevel?: string): 'LOW' | 'MEDIUM' | 'HIGH' | '◆◆◆' | null {
  if (riskLevel === 'classified') return '◆◆◆'
  if (score === null) return null
  if (score >= 65) return 'HIGH'
  if (score >= 35) return 'MEDIUM'
  return 'LOW'
}

function riskColor(score: number | null, riskLevel?: string): string {
  if (riskLevel === 'classified') return '#dc2626'
  if (score === null) return 'var(--text-muted)'
  if (score >= 65) return 'var(--color-red)'
  if (score >= 35) return '#ea580c'
  return 'var(--color-green)'
}

const pulseStyle = `
  @keyframes riskPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes classifiedGlow {
    0%, 100% { box-shadow: 0 0 4px 1px rgba(220, 38, 38, 0.6); }
    50% { box-shadow: 0 0 10px 3px rgba(220, 38, 38, 0.9); }
  }
  @keyframes classifiedBadgeGlow {
    0%, 100% { text-shadow: 0 0 4px rgba(220, 38, 38, 0.8); opacity: 1; }
    50% { text-shadow: 0 0 10px rgba(220, 38, 38, 1); opacity: 0.7; }
  }
`

export function CaseRow({ caseItem, isSelected, onSelect, collapsed }: CaseRowProps) {
  const isActionable = !caseItem.already_flagged && !caseItem.no_action_taken
  const isClassified = caseItem.risk_level === 'classified'
  const color = riskColor(caseItem.risk_score, caseItem.risk_level)
  const label = riskLabel(caseItem.risk_score, caseItem.risk_level)

  // Collapsed: render a risk-colored dot with a tooltip
  if (collapsed) {
    return (
      <div
        data-testid={`view-citizen-btn-${caseItem.citizen_id}`}
        title={`${caseItem.display_name} · ${isClassified ? 'CLASSIFIED' : `Risk ${label ?? 'computing...'}`}`}
        onClick={isActionable ? onSelect : undefined}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: isClassified ? '#0d0d0f' : (isSelected ? color : 'transparent'),
          border: `2px solid ${color}`,
          margin: '3px auto',
          cursor: isActionable ? 'pointer' : 'default',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: caseItem.already_flagged || caseItem.no_action_taken ? 0.4 : 1,
          animation: isClassified ? 'classifiedGlow 2s ease-in-out infinite' : undefined,
        }}
      />
    )
  }

  // Expanded: name + risk score row
  return (
    <>
      <style>{pulseStyle}</style>
      <div
        data-testid={`view-citizen-btn-${caseItem.citizen_id}`}
        onClick={isActionable ? onSelect : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 8px 5px 10px',
          borderLeft: `2px solid ${isClassified ? '#dc2626' : isSelected ? 'var(--color-green)' : 'transparent'}`,
          background: isClassified
            ? (isSelected ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.05)')
            : isSelected ? 'var(--bg-surface)' : 'transparent',
          cursor: isActionable ? 'pointer' : 'default',
          borderBottom: '1px solid var(--border-subtle)',
          opacity: caseItem.already_flagged || caseItem.no_action_taken ? 0.45 : 1,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => {
          if (!isSelected && isActionable) {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-tertiary)'
          }
        }}
        onMouseLeave={e => {
          if (!isSelected) {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent'
          }
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {caseItem.display_name}
        </span>
        <span
          data-testid={`risk-badge-${caseItem.citizen_id}`}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: isClassified ? 15 : 12,
            fontWeight: 600,
            color,
            flexShrink: 0,
            animation: isClassified
              ? 'classifiedBadgeGlow 2s ease-in-out infinite'
              : label === null
                ? 'riskPulse 1.2s ease-in-out infinite'
                : undefined,
            letterSpacing: isClassified ? '0.1em' : undefined,
          }}
        >
          {label ?? '···'}
        </span>
      </div>
    </>
  )
}
