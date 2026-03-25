import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { FlagType, DomainKey } from '@/types/game'
import type { InferenceResult } from '@/types/citizen'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'

interface FlagSubmissionProps {
  citizenId: string
  isVisible: boolean
  inferenceResults: InferenceResult[]
  visitedTabs: Set<DomainKey>
}

const FLAG_TYPES: FlagType[] = ['monitoring', 'restriction', 'intervention', 'detention']

export function FlagSubmission({ citizenId, isVisible, inferenceResults, visitedTabs }: FlagSubmissionProps) {
  const { t } = useTranslation()
  const [selectedType, setSelectedType] = useState<FlagType | null>(null)
  const [selectedFindings, setSelectedFindings] = useState<Set<string>>(new Set())

  const submitFlag = useGameStore(s => s.submitFlag)
  const submitNoAction = useGameStore(s => s.submitNoAction)
  const country = useContentStore(s => s.country)

  // Reset form when citizen changes
  useEffect(() => {
    setSelectedType(null)
    setSelectedFindings(new Set())
  }, [citizenId])

  if (!isVisible) return null

  const canSubmit = selectedType !== null && selectedFindings.size > 0

  const toggleFinding = (ruleKey: string) => {
    setSelectedFindings(prev => {
      const next = new Set(prev)
      if (next.has(ruleKey)) next.delete(ruleKey)
      else next.add(ruleKey)
      return next
    })
  }

  const handleSubmit = () => {
    if (!canSubmit || selectedType === null) return
    const findings = [...selectedFindings]
    const justification = findings.join(', ')
    submitFlag(citizenId, selectedType, justification, findings)
    setSelectedType(null)
    setSelectedFindings(new Set())
  }

  const handleNoAction = () => {
    submitNoAction(citizenId)
  }

  // A finding is checkable if the player has visited all its domains
  const isCheckable = (r: InferenceResult) =>
    r.domains_used.every(d => visitedTabs.has(d))

  // A finding is hinted if some domains are visited but not all
  const isHinted = (r: InferenceResult) =>
    !isCheckable(r) && r.domains_used.some(d => visitedTabs.has(d))

  const missingDomains = (r: InferenceResult): DomainKey[] =>
    r.domains_used.filter(d => !visitedTabs.has(d))

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 12,
        marginTop: 12,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {t('flag.submission.title')}
      </div>

      {/* Directive findings */}
      <div data-testid="findings-panel" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Directive Findings
        </div>

        {inferenceResults.length === 0 ? (
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '6px 0' }}>
            No findings — review data tabs to surface indicators.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {inferenceResults.map(r => {
              const checkable = isCheckable(r)
              const hinted = isHinted(r)
              const checked = selectedFindings.has(r.rule_key)

              return (
                <div
                  key={r.rule_key}
                  data-testid={`finding-${r.rule_key}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '5px 8px',
                    background: checked ? 'var(--bg-surface)' : 'transparent',
                    border: `1px solid ${checked ? 'var(--color-amber)' : 'var(--border-subtle)'}`,
                    borderRadius: 2,
                    opacity: checkable ? 1 : 0.5,
                    cursor: checkable ? 'pointer' : 'default',
                  }}
                  onClick={() => checkable && toggleFinding(r.rule_key)}
                >
                  <input
                    type="checkbox"
                    data-testid={`finding-checkbox-${r.rule_key}`}
                    checked={checked}
                    disabled={!checkable}
                    onChange={e => { e.stopPropagation(); checkable && toggleFinding(r.rule_key) }}
                    onClick={e => e.stopPropagation()}
                    style={{ accentColor: 'var(--color-amber)', marginTop: 1, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: checkable ? (checked ? 'var(--color-amber)' : 'var(--text-secondary)') : 'var(--text-muted)',
                    }}>
                      {r.rule_name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                      {checkable
                        ? r.inference_text
                        : hinted
                          ? `→ Review ${missingDomains(r).join(', ')} data to assess`
                          : `→ Review ${r.domains_used.join(', ')} data to assess`
                      }
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Flag type selection */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          {t('flag.submission.select_type')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FLAG_TYPES.map(type => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: selectedType === type ? 'var(--color-amber)' : 'var(--text-secondary)',
                padding: '3px 6px',
                background: selectedType === type ? 'var(--bg-surface)' : 'transparent',
                borderRadius: 2,
              }}
            >
              <input
                type="radio"
                name={`flag-type-${citizenId}`}
                value={type}
                checked={selectedType === type}
                onChange={() => setSelectedType(type)}
                data-testid={`flag-type-${type}`}
                style={{ accentColor: 'var(--color-amber)' }}
              />
              {country?.ui_flavor.flag_labels[type] ?? t(`flag.type.${type}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          data-testid="submit-flag-btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: canSubmit ? 'var(--color-red-dim)' : 'var(--bg-tertiary)',
            color: canSubmit ? 'var(--color-red)' : 'var(--text-disabled)',
            border: `1px solid ${canSubmit ? 'var(--color-red)' : 'var(--border-subtle)'}`,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            borderRadius: 2,
          }}
        >
          {t('flag.submission.submit')}
        </button>

        <button
          data-testid="no-action-btn"
          onClick={handleNoAction}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          {t('flag.submission.no_action')}
        </button>
      </div>
    </div>
  )
}
