import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InferenceResult } from '@/types/citizen'
import { Badge } from '@/components/shared/Badge'
import { useUIStore } from '@/stores/uiStore'

interface InferencePanelProps {
  results: InferenceResult[]
  isLoading: boolean
}

function scarinessVariant(level: number): 'muted' | 'blue' | 'amber' | 'red' {
  if (level >= 5) return 'red'
  if (level >= 4) return 'red'
  if (level >= 3) return 'amber'
  if (level >= 2) return 'blue'
  return 'muted'
}

function scarinessLabel(level: number): string {
  if (level >= 5) return 'CRITICAL'
  if (level >= 4) return 'HIGH'
  if (level >= 3) return 'MEDIUM'
  if (level >= 2) return 'LOW'
  return 'MINIMAL'
}

export function InferencePanel({ results, isLoading }: InferencePanelProps) {
  const { t } = useTranslation()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  return (
    <div data-testid="inference-panel" style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {t('citizen.inferences.title')}
        {isLoading && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>...</span>
        )}
        <button
          data-testid="open-inference-rules-editor"
          onClick={() => useUIStore.getState().openModal('inference_rules_editor')}
          style={{
            marginLeft: 'auto',
            padding: '2px 7px',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          Edit Inference Rules
        </button>
      </div>

      {results.length === 0 && !isLoading ? (
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            padding: '8px 0',
          }}
        >
          {t('citizen.inferences.empty')}
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Inference</th>
              <th>{t('citizen.inferences.scariness')}</th>
              <th>Confidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <>
                <tr
                  key={r.rule_key}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedKey(expandedKey === r.rule_key ? null : r.rule_key)}
                >
                  <td style={{ textTransform: 'capitalize' }}>{r.category}</td>
                  <td>{r.rule_name}</td>
                  <td>
                    <Badge variant={scarinessVariant(r.scariness_level)}>
                      {scarinessLabel(r.scariness_level)}
                    </Badge>
                  </td>
                  <td>{(r.confidence * 100).toFixed(1)}%</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                    {expandedKey === r.rule_key ? '▲' : '▼'}
                  </td>
                </tr>
                {expandedKey === r.rule_key && (
                  <tr key={`${r.rule_key}-expanded`}>
                    <td
                      colSpan={5}
                      style={{
                        background: 'var(--bg-tertiary)',
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                      }}
                    >
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Inference:{' '}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{r.inference_text}</span>
                      </div>

                      {r.supporting_evidence.length > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                            {t('citizen.inferences.evidence')}:
                          </div>
                          <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text-secondary)' }}>
                            {r.supporting_evidence.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ marginBottom: 6 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                          {t('citizen.inferences.implications')}:
                        </div>
                        <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--color-amber)' }}>
                          {r.implications.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>

                      <div
                        style={{
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: 6,
                          color: 'var(--color-green)',
                          fontSize: 10,
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {t('citizen.inferences.educational_note')}:{' '}
                        </span>
                        {r.educational_note}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
