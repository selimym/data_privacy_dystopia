import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'
import type { Neighborhood } from '@/types/game'

function riskBadgeStyle(risk: 'low' | 'medium' | 'high'): { background: string; color: string } {
  if (risk === 'high') return { background: 'var(--color-red-dim)', color: 'var(--color-red)' }
  if (risk === 'medium') return { background: 'var(--color-amber-dim)', color: 'var(--color-amber)' }
  return { background: 'var(--color-green-dim)', color: 'var(--color-green)' }
}

interface NeighborhoodCardProps {
  neighborhood: Neighborhood
  executedRecord?: { actual_arrests: number; consequence_risk: 'low' | 'medium' | 'high' }
}

function NeighborhoodCard({ neighborhood, executedRecord }: NeighborhoodCardProps) {
  const submitNeighborhoodRaid = useGameStore(s => s.submitNeighborhoodRaid)
  const executed = executedRecord !== undefined
  const badgeStyle = riskBadgeStyle(neighborhood.consequence_risk)

  return (
    <div
      style={{
        background: executed ? 'var(--bg-primary)' : 'var(--bg-secondary)',
        border: `1px solid ${executed ? 'var(--border-subtle)' : 'var(--border-subtle)'}`,
        borderRadius: 3,
        padding: '14px 16px',
        opacity: executed ? 0.55 : 1,
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 3,
            }}
          >
            {neighborhood.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
            {neighborhood.description}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {neighborhood.population_descriptor}
          </div>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 2,
            letterSpacing: '0.06em',
            flexShrink: 0,
            marginLeft: 12,
            ...badgeStyle,
          }}
        >
          {neighborhood.consequence_risk.toUpperCase()} RISK
        </span>
      </div>

      {executed ? (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 8,
            padding: '5px 8px',
            background: 'var(--bg-tertiary)',
            borderRadius: 2,
          }}
        >
          EXECUTED — {executedRecord!.actual_arrests} arrests.{' '}
          {executedRecord!.consequence_risk === 'high' ? 'High civilian impact.' : ''}
          {executedRecord!.consequence_risk === 'medium' ? 'Moderate civilian impact.' : ''}
          {executedRecord!.consequence_risk === 'low' ? 'Minimal civilian impact.' : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            EST. {neighborhood.est_arrests_min}–{neighborhood.est_arrests_max} ARRESTS
          </div>
          <button
            data-testid={`execute-raid-btn-${neighborhood.id}`}
            onClick={() => submitNeighborhoodRaid(neighborhood.id)}
            style={{
              padding: '5px 14px',
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid var(--color-red)',
              color: 'var(--color-red)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            EXECUTE RAID
          </button>
        </div>
      )}
    </div>
  )
}

export function NeighborhoodSweepPanel() {
  const neighborhoods = useContentStore(s => s.country?.neighborhoods ?? [])
  const raidRecords = useGameStore(s => s.raidRecords)
  const currentDirective = useGameStore(s => s.currentDirective)

  const executedMap = new Map(
    raidRecords
      .filter(r => r.directive_key === (currentDirective?.directive_key ?? ''))
      .map(r => [r.neighborhood_id, r]),
  )

  if (neighborhoods.length === 0) {
    return (
      <div style={{ padding: '24px 20px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        NO NEIGHBORHOOD DATA AVAILABLE
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 0,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-red)',
          letterSpacing: '0.18em',
          marginBottom: 14,
          paddingBottom: 8,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        SWEEP OPERATION — SELECT NEIGHBORHOODS
      </div>

      {neighborhoods.map(n => (
        <NeighborhoodCard
          key={n.id}
          neighborhood={n}
          executedRecord={executedMap.get(n.id)}
        />
      ))}
    </div>
  )
}
