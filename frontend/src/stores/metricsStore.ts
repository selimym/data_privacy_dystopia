/**
 * metricsStore — tracks operator compliance, reluctance, and public metrics.
 */
import { create } from 'zustand'
import type { PublicMetrics, ReluctanceMetrics, OperatorRiskAssessment } from '@/types/game'

interface MetricsState {
  compliance_score: number
  public_metrics: PublicMetrics
  reluctance: ReluctanceMetrics
  operator_risk: OperatorRiskAssessment | null

  // Actions
  setComplianceScore: (score: number) => void
  applyComplianceDelta: (delta: number) => void
  setPublicMetrics: (metrics: PublicMetrics) => void
  setReluctance: (metrics: ReluctanceMetrics) => void
  setOperatorRisk: (assessment: OperatorRiskAssessment | null) => void
  reset: () => void
}

const initialPublicMetrics: PublicMetrics = {
  international_awareness: 0,
  public_anger: 0,
  awareness_tier: 0,
  anger_tier: 0,
}

const initialReluctance: ReluctanceMetrics = {
  reluctance_score: 0,
  no_action_count: 0,
  hesitation_count: 0,
  quota_shortfall: 0,
  warnings_received: 0,
  is_under_review: false,
  formal_warning_issued: false,
  final_notice_issued: false,
}

const initialState = {
  compliance_score: 50,
  public_metrics: initialPublicMetrics,
  reluctance: initialReluctance,
  operator_risk: null as OperatorRiskAssessment | null,
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  ...initialState,

  setComplianceScore: (score) =>
    set({ compliance_score: Math.max(0, Math.min(100, score)) }),

  applyComplianceDelta: (delta) => {
    const { compliance_score } = get()
    set({ compliance_score: Math.max(0, Math.min(100, compliance_score + delta)) })
  },

  setPublicMetrics: (metrics) => set({ public_metrics: metrics }),

  setReluctance: (metrics) => {
    const updated: ReluctanceMetrics = {
      ...metrics,
      // Track flags that the warning has been formally issued
      formal_warning_issued: metrics.reluctance_score >= 80 || get().reluctance.formal_warning_issued,
      final_notice_issued: metrics.reluctance_score >= 90 || get().reluctance.final_notice_issued,
    }
    set({ reluctance: updated })
  },

  setOperatorRisk: (assessment) => set({ operator_risk: assessment }),

  reset: () => set({ ...initialState, operator_risk: null }),
}))
