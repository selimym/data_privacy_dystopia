import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/uiStore'
import { useContentStore } from '@/stores/contentStore'
import { useGameStore } from '@/stores/gameStore'
import { Modal } from '@/components/shared'

export default function ContractBanner() {
  const { t } = useTranslation()
  const modal = useUIStore((s) => s.modal)
  const closeModal = useUIStore((s) => s.closeModal)
  const scenario = useContentStore((s) => s.scenario)
  const weekNumber = useGameStore((s) => s.weekNumber)

  const isContractModalOpen = modal.type === 'contract_event'

  // Find the contract event for the current week (if any)
  const currentContractEvent = scenario?.contract_events.find(
    (ce) => ce.week_number === weekNumber,
  ) ?? null

  // Derive contract data from modal.data or current contract event
  const contractData = isContractModalOpen
    ? (modal.data as { contract_name?: string; press_release?: string; internal_memo?: string; real_world_reference?: string } | undefined)
    : null

  const contractName =
    contractData?.contract_name ??
    currentContractEvent?.contract_name ??
    ''

  const pressRelease =
    contractData?.press_release ??
    currentContractEvent?.press_release ??
    ''

  const internalMemo =
    contractData?.internal_memo ??
    currentContractEvent?.internal_memo ??
    ''

  const realWorldRef =
    contractData?.real_world_reference ??
    currentContractEvent?.real_world_reference ??
    ''

  if (!isContractModalOpen) return null

  return (
    <>
      {/* Persistent banner below header */}
      <div
        data-testid="contract-banner"
        style={{
          padding: '6px 16px',
          background: 'rgba(37, 99, 235, 0.08)',
          borderBottom: '1px solid rgba(37, 99, 235, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}
      >
        <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>
          {t('contract.banner.new_contract')}
        </span>
        <span>—</span>
        <span>{t('common.loading')}</span>
      </div>

      {/* Contract event modal */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={closeModal}
        title={contractName}
        data-testid="contract-modal"
      >
        {/* Press release section */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {t('contract.modal.press_release')}
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {pressRelease}
          </p>
        </div>

        {/* Internal memo section — amber tint */}
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            background: 'rgba(251, 191, 36, 0.06)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'var(--color-amber)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {t('contract.modal.internal_memo')}
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-amber)',
              lineHeight: 1.6,
              margin: 0,
              opacity: 0.85,
            }}
          >
            {internalMemo}
          </p>
        </div>

        {/* Real-world parallel section */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {t('contract.modal.real_world')}
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            {realWorldRef}
          </p>
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={closeModal}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              padding: '6px 16px',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            {t('contract.modal.close')}
          </button>
        </div>
      </Modal>
    </>
  )
}
