import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/uiStore'
import { useCitizenStore } from '@/stores/citizenStore'
import { useContentStore } from '@/stores/contentStore'
import { useGameStore } from '@/stores/gameStore'
import { InferenceEngine } from '@/services/InferenceEngine'
import { calculateRiskScore } from '@/services/RiskScorer'
import type { CitizenProfile } from '@/types/citizen'
import type { InferenceResult } from '@/types/citizen'
import type { DomainKey } from '@/types/game'
import { DataDomainTabs } from './DataDomainTabs'
import { InferencePanel } from './InferencePanel'
import { FlagSubmission } from './FlagSubmission'
import { AutoFlagDecisionPanel } from './AutoFlagDecisionPanel'

export function CitizenPanel() {
  const { t } = useTranslation()

  const selectedCitizenId = useUIStore(s => s.selectedCitizenId)
  const startDecisionTimer = useUIStore(s => s.startDecisionTimer)
  const getProfile = useCitizenStore(s => s.getProfile)
  const dataBanks = useContentStore(s => s.dataBanks)
  const country = useContentStore(s => s.country)
  const inferenceRules = useContentStore(s => s.inferenceRules)
  const unlockedDomains = useContentStore(s => s.unlockedDomains)
  const pendingBotDecisions = useGameStore(s => s.pendingBotDecisions)

  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [inferenceResults, setInferenceResults] = useState<InferenceResult[]>([])
  const [activeTab, setActiveTab] = useState<DomainKey | 'identity'>('identity')

  useEffect(() => {
    if (!selectedCitizenId || !dataBanks || !country) {
      setProfile(null)
      setInferenceResults([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setProfile(null)
    setInferenceResults([])
    setActiveTab('identity')

    startDecisionTimer()

    getProfile(selectedCitizenId, dataBanks, country)
      .then(loadedProfile => {
        if (cancelled) return
        setProfile(loadedProfile)

        // Run inference engine
        const engine = new InferenceEngine(inferenceRules)
        const unlockedSet = new Set(unlockedDomains as DomainKey[])
        const results = engine.evaluate(loadedProfile, unlockedSet, country)
        setInferenceResults(results)

        // Run risk scoring and update cache
        const riskAssessment = calculateRiskScore(loadedProfile, results, unlockedSet)
        useCitizenStore.getState().updateSkeletonCache(selectedCitizenId, riskAssessment.score)
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedCitizenId, dataBanks, country, inferenceRules, unlockedDomains, getProfile, startDecisionTimer])

  const hasBotDecision = selectedCitizenId !== null &&
    pendingBotDecisions.some(d => d.citizen_id === selectedCitizenId)

  if (!selectedCitizenId) {
    return (
      <div
        data-testid="citizen-panel"
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}
        >
          {t('citizen.panel.no_selection')}
        </div>
      </div>
    )
  }

  return (
    <div data-testid="citizen-panel" className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Panel title */}
      <div className="panel-title" style={{ marginBottom: 8, flexShrink: 0 }}>
        {t('citizen.panel.title')}
        {selectedCitizenId && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            {t('citizen.panel.case_id')}: {selectedCitizenId.slice(0, 8).toUpperCase()}
          </span>
        )}
      </div>

      {isLoading && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: '16px 0',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {t('common.loading')}
        </div>
      )}

      {!isLoading && profile && (
        <>
          {/* Scrollable data section — fills available space */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {/* AutoFlag decision panel at top */}
            <AutoFlagDecisionPanel citizenId={selectedCitizenId} />

            {/* Domain tabs */}
            <DataDomainTabs
              profile={profile}
              unlockedDomains={unlockedDomains}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Inference panel */}
            <InferencePanel
              results={inferenceResults}
              isLoading={false}
            />
          </div>

          {/* Flag submission — pinned to bottom */}
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)' }}>
            <FlagSubmission
              citizenId={selectedCitizenId}
              isVisible={!hasBotDecision}
            />
          </div>
        </>
      )}
    </div>
  )
}
