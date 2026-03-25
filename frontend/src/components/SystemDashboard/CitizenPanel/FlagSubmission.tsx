import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { FlagType } from '@/types/game'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'

interface FlagSubmissionProps {
  citizenId: string
  isVisible: boolean
}

const FLAG_TYPES: FlagType[] = ['monitoring', 'restriction', 'intervention', 'detention']

export function FlagSubmission({ citizenId, isVisible }: FlagSubmissionProps) {
  const { t } = useTranslation()
  const [selectedType, setSelectedType] = useState<FlagType | null>(null)
  const [justification, setJustification] = useState('')
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getDecisionElapsedSecs = useUIStore(s => s.getDecisionElapsedSecs)
  const submitFlag = useGameStore(s => s.submitFlag)
  const submitNoAction = useGameStore(s => s.submitNoAction)
  const country = useContentStore(s => s.country)

  // Update timer every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedSecs(Math.floor(getDecisionElapsedSecs()))
    }, 1000)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [getDecisionElapsedSecs])

  // Reset form when citizen changes
  useEffect(() => {
    setSelectedType(null)
    setJustification('')
    setElapsedSecs(0)
  }, [citizenId])

  if (!isVisible) return null

  const canSubmit = selectedType !== null && justification.length >= 10

  const handleSubmit = () => {
    if (!canSubmit || selectedType === null) return
    submitFlag(citizenId, selectedType, justification)
    setSelectedType(null)
    setJustification('')
  }

  const handleNoAction = () => {
    submitNoAction(citizenId)
  }

  const isHesitant = elapsedSecs > 30

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

      {/* Timer */}
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t('flag.submission.timer')}:
        </span>
        <span
          data-testid="decision-timer"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: isHesitant ? 'var(--color-amber)' : 'var(--text-primary)',
            letterSpacing: '0.06em',
          }}
        >
          {elapsedSecs}s
        </span>
        {isHesitant && (
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', letterSpacing: '0.05em' }}>
            {t('flag.submission.hesitation_warning')}
          </span>
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

      {/* Justification */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {t('flag.submission.justification')}
        </div>
        <textarea
          data-testid="justification-input"
          value={justification}
          onChange={e => setJustification(e.target.value)}
          placeholder={t('flag.submission.justification_placeholder')}
          rows={3}
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            background: 'var(--bg-tertiary)',
            border: `1px solid ${justification.length > 0 && justification.length < 10 ? 'var(--color-red)' : 'var(--border-subtle)'}`,
            color: 'var(--text-primary)',
            padding: '6px 8px',
            resize: 'vertical',
            borderRadius: 2,
            boxSizing: 'border-box',
          }}
        />
        {justification.length > 0 && justification.length < 10 && (
          <div style={{ fontSize: 9, color: 'var(--color-red)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            Minimum 10 characters required ({justification.length}/10)
          </div>
        )}
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
