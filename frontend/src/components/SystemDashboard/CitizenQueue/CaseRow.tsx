import { useTranslation } from 'react-i18next'
import type { CaseOverview } from '@/types/citizen'

interface CaseRowProps {
  caseItem: CaseOverview
  isSelected: boolean
  onSelect: () => void
}

export function CaseRow({ caseItem, isSelected, onSelect }: CaseRowProps) {
  const { t } = useTranslation()

  const shortId = caseItem.citizen_id.slice(-8).toUpperCase()
  const domainCount = caseItem.available_domains.length

  const isActionable = !caseItem.already_flagged && !caseItem.no_action_taken

  return (
    <tr
      data-testid={`case-row-${caseItem.citizen_id}`}
      className={isSelected ? 'selected' : undefined}
      style={{ cursor: isActionable ? 'pointer' : 'default' }}
      onClick={isActionable ? onSelect : undefined}
    >
      {/* Name */}
      <td
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
        }}
      >
        {caseItem.display_name}
      </td>

      {/* Case ID */}
      <td
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}
      >
        {shortId}
      </td>

      {/* Risk */}
      <td>
        <span className={`risk-badge ${caseItem.risk_level}`}>
          {t(`common.risk.${caseItem.risk_level}`)}
        </span>
      </td>

      {/* Domains */}
      <td
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        {domainCount} {domainCount === 1 ? 'domain' : 'domains'}
      </td>

      {/* Action */}
      <td>
        {caseItem.already_flagged ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 2,
              background: 'var(--color-green-dim)',
              color: 'var(--color-green)',
              letterSpacing: '0.05em',
            }}
          >
            {t('queue.already_flagged')}
          </span>
        ) : caseItem.no_action_taken ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 2,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}
          >
            {t('queue.no_action_taken')}
          </span>
        ) : (
          <button
            data-testid={`view-citizen-btn-${caseItem.citizen_id}`}
            onClick={e => {
              e.stopPropagation()
              onSelect()
            }}
            style={{
              padding: '3px 8px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            {t('queue.view_file')}
          </button>
        )}
      </td>
    </tr>
  )
}
