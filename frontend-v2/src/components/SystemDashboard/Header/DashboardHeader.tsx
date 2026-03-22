import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useContentStore } from '@/stores/contentStore'
import { Modal } from '@/components/shared/Modal'
import { SaveLoadPanel } from '@/components/shared/SaveLoadPanel'

export default function DashboardHeader() {
  const { t } = useTranslation()
  const operator = useGameStore((s) => s.operator)
  const weekNumber = useGameStore((s) => s.weekNumber)
  const reluctance = useMetricsStore((s) => s.reluctance)
  const country = useContentStore((s) => s.country)
  const [saveModalOpen, setSaveModalOpen] = useState(false)

  const status = operator?.status ?? 'active'

  const statusColors: Record<string, string> = {
    active: 'var(--color-green)',
    under_review: 'var(--color-amber)',
    suspended: 'var(--color-red)',
    terminated: 'var(--color-red)',
  }

  const statusLabel: Record<string, string> = {
    active: t('dashboard.header.status.active'),
    under_review: t('dashboard.header.status.under_review'),
    suspended: t('dashboard.header.status.suspended'),
    terminated: t('dashboard.header.status.suspended'),
  }

  const statusColor = statusColors[status] ?? 'var(--color-green)'
  const statusText = statusLabel[status] ?? t('dashboard.header.status.active')

  return (
    <div
      data-testid="dashboard-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '36px',
        padding: '0 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      {/* Left: logo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
          }}
        >
          CIVIC HARMONY PLATFORM
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          {t('app.version')}
        </span>
        {country?.ui_flavor.agency_name && (
          <span
            data-testid="agency-name"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--color-blue)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.8,
            }}
          >
            — {country.ui_flavor.agency_name}
          </span>
        )}
      </div>

      {/* Right: operator, week, status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Operator code */}
        <span
          data-testid="operator-code"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em',
          }}
        >
          {t('dashboard.header.operator')}: {operator?.operator_code ?? '—'}
        </span>

        {/* Week indicator */}
        <span
          data-testid="week-indicator"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em',
          }}
        >
          {t('dashboard.header.week')} {weekNumber}/6
          {reluctance.is_under_review && (
            <span
              style={{
                marginLeft: '6px',
                color: 'var(--color-amber)',
                fontSize: '12px',
              }}
            >
              ⚠
            </span>
          )}
        </span>

        {/* Status badge */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: statusColor,
            padding: '2px 8px',
            border: `1px solid ${statusColor}`,
            borderRadius: '2px',
            opacity: 0.9,
          }}
        >
          {statusText}
        </span>

        {/* SAVE/LOAD link */}
        <button
          data-testid="save-load-link"
          onClick={() => setSaveModalOpen(true)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: '2px',
            padding: '2px 7px',
            cursor: 'pointer',
          }}
        >
          {t('save.title')}
        </button>
      </div>

      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title={t('save.title')}
        data-testid="save-load-modal"
      >
        <SaveLoadPanel />
      </Modal>
    </div>
  )
}
