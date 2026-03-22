import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import type { IceRaidOrder } from '@/types/game'

interface IceRaidAlertProps {
  raid: IceRaidOrder
}

function SingleRaidAlert({ raid }: IceRaidAlertProps) {
  const { t } = useTranslation()

  return (
    <div
      data-testid="ice-raid-alert"
      style={{
        margin: '8px 12px',
        padding: '10px 12px',
        background: 'rgba(220, 38, 38, 0.1)',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        borderRadius: 2,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-red)',
          letterSpacing: '0.1em',
          marginBottom: 6,
        }}
      >
        ⚡ {t('ice_raid.alert.title')}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginBottom: 2,
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
          {t('ice_raid.alert.neighborhood')}:{' '}
        </span>
        {raid.neighborhood}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginBottom: 8,
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
          {t('ice_raid.alert.estimated_arrests')}:{' '}
        </span>
        {raid.estimated_arrests}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          data-testid="approve-raid-btn"
          onClick={() => useGameStore.getState().approveIceRaid(raid.id)}
          style={{
            flex: 1,
            padding: '5px 8px',
            background: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid var(--color-red)',
            color: 'var(--color-red)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          {t('ice_raid.alert.approve')}
        </button>
        <button
          data-testid="decline-raid-btn"
          onClick={() => useGameStore.getState().declineIceRaid(raid.id)}
          style={{
            flex: 1,
            padding: '5px 8px',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          {t('ice_raid.alert.decline')}
        </button>
      </div>
    </div>
  )
}

export function IceRaidAlert() {
  const pendingRaids = useGameStore(s => s.pendingRaids)

  if (pendingRaids.length === 0) return null

  return (
    <>
      {pendingRaids.map(raid => (
        <SingleRaidAlert key={raid.id} raid={raid} />
      ))}
    </>
  )
}
