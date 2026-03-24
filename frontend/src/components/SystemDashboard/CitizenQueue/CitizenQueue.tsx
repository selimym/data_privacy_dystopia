import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'
import { useUIStore } from '@/stores/uiStore'
import { useCitizenStore } from '@/stores/citizenStore'
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
  const queueCollapsed = useUIStore(s => s.queueCollapsed)
  const toggleQueue = useUIStore(s => s.toggleQueue)
  // Subscribe to skeletons so risk_score_cache updates from background worker trigger re-renders
  const skeletons = useCitizenStore(s => s.skeletons)

  const rawQueue: CaseOverview[] = useMemo(
    () => getFilteredCaseQueue(unlockedDomains),
    [skeletons, unlockedDomains, getFilteredCaseQueue],
  )

  const sorted = useMemo(() => {
    const copy = [...rawQueue]
    if (sortKey === 'risk') {
      copy.sort((a, b) => (b.risk_score ?? -1) - (a.risk_score ?? -1))
    } else {
      copy.sort((a, b) => a.display_name.localeCompare(b.display_name))
    }
    return copy
  }, [rawQueue, sortKey])

  return (
    <div
      className="panel"
      data-testid="citizen-queue"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header with collapse toggle */}
      <div
        className="panel-title"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px 8px 10px' }}
      >
        {!queueCollapsed && (
          <span style={{ flex: 1 }}>{t('queue.title')}</span>
        )}

        <button
          data-testid="queue-collapse-btn"
          onClick={toggleQueue}
          title={queueCollapsed ? 'Expand queue' : 'Collapse queue'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          {queueCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Collapsed: dots strip */}
      {queueCollapsed ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 6,
          }}
        >
          {sorted.map(item => (
            <CaseRow
              key={item.citizen_id}
              caseItem={item}
              isSelected={selectedCitizenId === item.citizen_id}
              onSelect={() => setSelectedCitizen(item.citizen_id)}
              collapsed={true}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Sort controls */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '4px 8px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            {(['risk', 'name'] as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                style={{
                  padding: '1px 6px',
                  background: sortKey === key ? 'var(--bg-surface)' : 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: sortKey === key ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  borderRadius: 2,
                }}
              >
                {key === 'risk' ? t('queue.sort.risk') : t('queue.sort.name')}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
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
              sorted.map(item => (
                <CaseRow
                  key={item.citizen_id}
                  caseItem={item}
                  isSelected={selectedCitizenId === item.citizen_id}
                  onSelect={() => setSelectedCitizen(item.citizen_id)}
                  collapsed={false}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
