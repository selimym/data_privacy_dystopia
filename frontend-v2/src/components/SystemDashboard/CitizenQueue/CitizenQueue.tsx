import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'
import { useUIStore } from '@/stores/uiStore'
import { CaseRow } from './CaseRow'
import type { CaseOverview } from '@/types/citizen'

type SortKey = 'risk' | 'name'

export function CitizenQueue() {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<SortKey>('risk')

  const unlockedDomains = useContentStore(s => s.unlockedDomains)
  const getFilteredCaseQueue = useGameStore(s => s.getFilteredCaseQueue)
  const selectedCitizenId = useUIStore(s => s.selectedCitizenId)
  const setSelectedCitizen = useUIStore(s => s.setSelectedCitizen)

  const rawQueue: CaseOverview[] = getFilteredCaseQueue(unlockedDomains)

  const sorted = useMemo(() => {
    const copy = [...rawQueue]
    if (sortKey === 'risk') {
      copy.sort((a, b) => b.risk_score - a.risk_score)
    } else {
      copy.sort((a, b) => a.display_name.localeCompare(b.display_name))
    }
    return copy
  }, [rawQueue, sortKey])

  return (
    <div className="panel" data-testid="citizen-queue">
      <div className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{t('queue.title')}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setSortKey('name')}
            style={{
              padding: '1px 6px',
              background: sortKey === 'name' ? 'var(--bg-surface)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              color: sortKey === 'name' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            {t('queue.sort.name')}
          </button>
          <button
            onClick={() => setSortKey('risk')}
            style={{
              padding: '1px 6px',
              background: sortKey === 'risk' ? 'var(--bg-surface)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              color: sortKey === 'risk' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            {t('queue.sort.risk')}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div
          style={{
            padding: 12,
            color: 'var(--text-muted)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em',
          }}
        >
          {t('queue.empty')}
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('queue.sort.name')}</th>
              <th>{t('queue.sort.id')}</th>
              <th>{t('queue.risk_score')}</th>
              <th>DOMAINS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(caseItem => (
              <CaseRow
                key={caseItem.citizen_id}
                caseItem={caseItem}
                isSelected={selectedCitizenId === caseItem.citizen_id}
                onSelect={() => setSelectedCitizen(caseItem.citizen_id)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
