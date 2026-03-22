import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMetricsStore } from '@/stores/metricsStore'

const RECOMMENDATION_COLORS: Record<string, string> = {
  continue_monitoring: 'var(--color-amber)',
  formal_review: 'var(--color-red)',
  immediate_action: 'var(--color-red)',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  continue_monitoring: 'CONTINUE MONITORING',
  formal_review: 'FORMAL REVIEW REQUIRED',
  immediate_action: 'IMMEDIATE ACTION',
}

export function OperatorProfilePanel() {
  const { t } = useTranslation()
  const reluctance = useMetricsStore((s) => s.reluctance)
  const operatorRisk = useMetricsStore((s) => s.operator_risk)
  const [collapsed, setCollapsed] = useState(false)

  // Only show when reluctance >= 50
  if (reluctance.reluctance_score < 50) return null

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
  }

  const recColor = operatorRisk
    ? (RECOMMENDATION_COLORS[operatorRisk.recommendation] ?? 'var(--color-amber)')
    : 'var(--text-muted)'

  return (
    <div
      data-testid="operator-profile-panel"
      style={{
        marginTop: 8,
        border: '1px solid var(--color-amber)',
        borderRadius: 2,
        background: 'var(--bg-tertiary)',
      }}
    >
      {/* Header — toggles collapse */}
      <button
        data-testid="operator-profile-toggle"
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ ...monoStyle, fontSize: 9, letterSpacing: '0.12em', color: 'var(--color-amber)', textTransform: 'uppercase' }}>
          {t('operator_profile.title')}
        </span>
        <span style={{ ...monoStyle, color: 'var(--text-muted)' }}>
          {collapsed ? '+' : '−'}
        </span>
      </button>

      {!collapsed && (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {operatorRisk === null ? (
            <div style={{ ...monoStyle, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Assessment pending
            </div>
          ) : (
            <>
              {/* Subtitle */}
              <div style={{ ...monoStyle, fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                {t('operator_profile.subtitle')}
              </div>

              {/* Recommendation badge */}
              <div
                data-testid="operator-profile-recommendation"
                style={{
                  ...monoStyle,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: recColor,
                  border: `1px solid ${recColor}`,
                  padding: '2px 8px',
                  display: 'inline-block',
                  borderRadius: 2,
                  textTransform: 'uppercase',
                }}
              >
                {RECOMMENDATION_LABELS[operatorRisk.recommendation] ?? operatorRisk.recommendation}
              </div>

              {/* Overall score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ ...monoStyle, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Risk score:
                </span>
                <span
                  data-testid="operator-profile-score"
                  style={{ ...monoStyle, fontSize: 13, color: recColor, fontWeight: 700 }}
                >
                  {Math.round(operatorRisk.overall_score)}
                </span>
                <span style={{ ...monoStyle, fontSize: 9, color: 'var(--text-muted)' }}>/100</span>
              </div>

              {/* Factors list */}
              <div>
                <div style={{ ...monoStyle, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Behavioral flags
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {operatorRisk.factors.map(factor => (
                    <div
                      key={factor.key}
                      data-testid={`risk-factor-${factor.key}`}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span style={{ ...monoStyle, fontSize: 9, color: 'var(--text-secondary)' }}>
                        {t(`operator_profile.factor.${factor.key}`, factor.label)}
                      </span>
                      <span style={{
                        ...monoStyle,
                        fontSize: 9,
                        color: factor.score >= 70 ? 'var(--color-red)' : factor.score >= 40 ? 'var(--color-amber)' : 'var(--text-muted)',
                        fontWeight: factor.score >= 70 ? 700 : 400,
                      }}>
                        {Math.round(factor.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated at */}
              <div style={{ ...monoStyle, fontSize: 8, color: 'var(--text-disabled)', marginTop: 2 }}>
                Generated: {new Date(operatorRisk.generated_at).toLocaleTimeString()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
