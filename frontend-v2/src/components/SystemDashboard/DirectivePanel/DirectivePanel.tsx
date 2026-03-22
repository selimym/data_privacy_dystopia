import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'
import { QuotaBar } from './QuotaBar'
import { IceRaidAlert } from './IceRaidAlert'

export function DirectivePanel() {
  const { t } = useTranslation()
  const [memoRevealed, setMemoRevealed] = useState(false)

  const directive = useGameStore(s => s.currentDirective)
  const weekNumber = useGameStore(s => s.weekNumber)
  const flags = useGameStore(s => s.flags)
  const scenario = useContentStore(s => s.scenario)

  const completedForDirective = directive
    ? flags.filter(f => f.directive_key === directive.directive_key).length
    : 0

  const quotaMet = directive !== null && completedForDirective >= directive.flag_quota

  const nextDirective = scenario?.directives.find(d => d.week_number === weekNumber + 1) ?? null

  const memoVisible = weekNumber >= 4 || memoRevealed

  if (!directive) {
    return (
      <div className="panel" data-testid="directive-panel">
        <div className="panel-title">{t('directive.panel.title')}</div>
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>
          {t('common.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="panel" data-testid="directive-panel">
      <div className="panel-title">{t('directive.panel.title')}</div>

      <div style={{ padding: 12 }}>
        {/* Week label */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginBottom: 4,
          }}
        >
          {t('directive.week_label', { week: weekNumber })}
        </div>

        {/* Directive title */}
        <div
          data-testid="directive-title"
          style={{
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 6,
            letterSpacing: '0.02em',
          }}
        >
          {directive.title}
        </div>

        {/* Description */}
        <div
          data-testid="directive-description"
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          {directive.description}
        </div>

        {/* Quota progress */}
        <QuotaBar completed={completedForDirective} required={directive.flag_quota} />

        {/* Complete badge + advance button */}
        {quotaMet && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-green)',
                letterSpacing: '0.1em',
                marginBottom: 6,
              }}
            >
              {t('directive.complete')}
            </div>
            <button
              data-testid="advance-week-btn"
              onClick={() => useGameStore.getState().advanceDirective(nextDirective)}
              style={{
                width: '100%',
                padding: '7px 12px',
                background: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid var(--color-amber)',
                color: 'var(--color-amber)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              ADVANCE WEEK →
            </button>
          </div>
        )}

        {/* Internal memo */}
        {directive.internal_memo && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}
            >
              {t('directive.internal_memo')}
            </div>
            {memoVisible ? (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                }}
              >
                {directive.internal_memo}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-red)',
                    letterSpacing: '0.08em',
                    flexGrow: 1,
                  }}
                >
                  {t('directive.memo_classified', { week: 4 })}
                </span>
                <button
                  onClick={() => setMemoRevealed(true)}
                  style={{
                    padding: '3px 7px',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  REVEAL
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ICE raid alerts */}
      <IceRaidAlert />
    </div>
  )
}
