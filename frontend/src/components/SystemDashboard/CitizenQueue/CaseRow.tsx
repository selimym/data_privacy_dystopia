import type { CaseOverview } from '@/types/citizen'

interface CaseRowProps {
  caseItem: CaseOverview
  isSelected: boolean
  onSelect: () => void
  collapsed: boolean
}

function riskColor(score: number): string {
  if (score >= 70) return 'var(--color-red)'
  if (score >= 50) return '#ea580c'
  if (score >= 30) return 'var(--color-amber)'
  return 'var(--color-green)'
}

export function CaseRow({ caseItem, isSelected, onSelect, collapsed }: CaseRowProps) {
  const isActionable = !caseItem.already_flagged && !caseItem.no_action_taken
  const color = riskColor(caseItem.risk_score)

  // Collapsed: render a risk-colored dot with a tooltip
  if (collapsed) {
    return (
      <div
        data-testid={`view-citizen-btn-${caseItem.citizen_id}`}
        title={`${caseItem.display_name} · Risk ${caseItem.risk_score}`}
        onClick={isActionable ? onSelect : undefined}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: isSelected ? color : 'transparent',
          border: `2px solid ${color}`,
          margin: '3px auto',
          cursor: isActionable ? 'pointer' : 'default',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: caseItem.already_flagged || caseItem.no_action_taken ? 0.4 : 1,
        }}
      />
    )
  }

  // Expanded: name + risk score row
  return (
    <div
      data-testid={`view-citizen-btn-${caseItem.citizen_id}`}
      onClick={isActionable ? onSelect : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px 5px 10px',
        borderLeft: `2px solid ${isSelected ? 'var(--color-green)' : 'transparent'}`,
        background: isSelected ? 'var(--bg-surface)' : 'transparent',
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
          fontSize: 11,
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {caseItem.display_name}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color,
          flexShrink: 0,
        }}
      >
        {caseItem.risk_score}
      </span>
    </div>
  )
}
