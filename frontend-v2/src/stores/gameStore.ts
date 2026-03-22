/**
 * gameStore — central game state.
 * Orchestrates: directives, flags, news, protests, autoflag, ICE raids, week progression.
 *
 * Action flow for submitFlag:
 *   ReluctanceTracker → metricsStore
 *   PublicMetricsCalculator → metricsStore
 *   NewsGenerator → articles[]
 *   ProtestManager → protests[]
 *   OperatorTracker → compliance
 *   OutcomeGenerator → uiStore.cinematicQueue
 *   EndingCalculator → if terminal → uiStore.setScreen('ending')
 *   persistence.saveGameState()
 */
import { create } from 'zustand'
import type {
  CitizenFlag, NoActionRecord, OperatorState, AutoFlagState, AutoFlagDecision,
  IceRaidOrder, NewsArticle, NewsChannel, ProtestEvent, SuppressionResult,
  ContractEvent, FlagType, TimePeriod, DomainKey,
} from '@/types/game'
import type { Directive } from '@/types/game'

// ─── Service imports ──────────────────────────────────────────────────────────
import { calculateUpdateAfterFlag, calculateUpdateAfterNoAction, calculateUpdateAfterQuotaShortfall, checkTerminationCondition } from '@/services/ReluctanceTracker'
import { calculateMetricsUpdate, applyDirectDelta } from '@/services/PublicMetricsCalculator'
import { generateTriggeredArticle } from '@/services/NewsGenerator'
import { calculateProtestTrigger, FLAG_TYPE_SEVERITY } from '@/services/ProtestManager'
import { calculateComplianceAfterFlag, calculateComplianceAfterNoAction, calculateComplianceAfterQuotaShortfall, generateOperatorRiskProfile } from '@/services/OperatorTracker'
import { generateOutcome } from '@/services/OutcomeGenerator'
import { getTimePeriodForWeek } from '@/services/TimeProgression'
import { runAutoFlagBot } from '@/services/AutoFlagBot'
import { calculateEnding, generateEndingResult } from '@/services/EndingCalculator'
import { generateExposureArticle } from '@/services/NewsGenerator'

// ─── Store imports ────────────────────────────────────────────────────────────
import { useMetricsStore } from './metricsStore'
import { useUIStore } from './uiStore'
import { useContentStore } from './contentStore'
import { useCitizenStore } from './citizenStore'
import { saveGameState } from './persistence'
import type { CaseOverview } from '@/types/citizen'

// ─── Default news channels ────────────────────────────────────────────────────
const DEFAULT_CHANNELS: NewsChannel[] = [
  { id: 'ch-1', name: 'The Independent Tribune', stance: 'critical', credibility: 80, is_banned: false },
  { id: 'ch-2', name: 'National Courier', stance: 'independent', credibility: 70, is_banned: false },
  { id: 'ch-3', name: 'State Security Bulletin', stance: 'state_friendly', credibility: 60, is_banned: false },
  { id: 'ch-4', name: 'Civil Watch Network', stance: 'critical', credibility: 75, is_banned: false },
  { id: 'ch-5', name: 'Morning Chronicle', stance: 'independent', credibility: 65, is_banned: false },
]

// ─── State interface ──────────────────────────────────────────────────────────

interface GameState {
  // Operator identity
  operator: OperatorState | null

  // Directive progress
  currentDirective: Directive | null
  completedDirectiveKeys: string[]
  weekNumber: number
  currentTimePeriod: TimePeriod

  // Flags and no-actions
  flags: CitizenFlag[]
  noActions: NoActionRecord[]

  // News
  newsChannels: NewsChannel[]
  newsArticles: NewsArticle[]

  // Protests
  activeProtests: ProtestEvent[]

  // Autoflag bot
  autoFlagState: AutoFlagState
  pendingBotDecisions: AutoFlagDecision[]

  // ICE raids
  pendingRaids: IceRaidOrder[]
  completedRaids: IceRaidOrder[]

  // Contract events that have already fired
  firedContractKeys: string[]   // week_number.toString()

  // Resistance path
  resistancePath: boolean

  // Exposure article flag (once generated at reluctance >= 80, don't repeat)
  exposureArticleGenerated: boolean

  // ─── Actions ─────────────────────────────────────────────────────────────

  /** Initialize operator and first directive */
  initializeGame: (operatorCode: string, directive: Directive) => void

  /** Submit a flag for a citizen — runs the full pipeline */
  submitFlag: (
    citizenId: string,
    flagType: FlagType,
    justification: string,
  ) => void

  /** Record a no-action decision */
  submitNoAction: (citizenId: string) => void

  /** Advance to the next directive (called after quota met or time expired) */
  advanceDirective: (nextDirective: Directive | null) => void

  /** Run the autoflag bot over the current case queue */
  runBotRound: () => void

  /** Player approves a bot decision (counts as a flag from bot) */
  approveBotDecision: (citizenId: string) => void

  /** Player overrides a bot decision (clears it without flagging) */
  overrideBotDecision: (citizenId: string) => void

  /** Toggle autoflag on/off */
  setAutoFlagEnabled: (enabled: boolean) => void

  /** Approve an ICE raid order */
  approveIceRaid: (raidId: string) => void

  /** Decline an ICE raid order */
  declineIceRaid: (raidId: string) => void

  /** Suppress a protest */
  suppressProtest: (protestId: string, method: 'DECLARE_ILLEGAL' | 'INCITE_VIOLENCE', result: SuppressionResult) => void

  /** Ban or un-ban a news channel */
  updateNewsChannel: (channelId: string, updates: Partial<NewsChannel>) => void

  /** Mark citizen #4472's passphrase as verified → resistance path */
  activateResistancePath: () => void

  /** Run the bot and immediately approve all pending bot decisions */
  processAutoFlagBatch: () => void

  /** Filtered case queue: week 6 locks to Jessica Martinez; excludes already-flagged and no-action citizens */
  getFilteredCaseQueue: (unlockedDomains: DomainKey[]) => CaseOverview[]

  /** Check whether Jessica Martinez's no-action count has reached threshold → trigger resistance path */
  checkResistanceTrigger: (citizenId: string) => void

  reset: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOperator(operatorCode: string): OperatorState {
  return {
    id: crypto.randomUUID(),
    operator_code: operatorCode,
    compliance_score: 50,
    total_flags_submitted: 0,
    total_reviews_completed: 0,
    hesitation_incidents: 0,
    current_directive_key: null,
    current_time_period: 'immediate',
    status: 'active',
    shift_start: new Date().toISOString(),
    unlocked_domains: [],
  }
}

function quotaMetForDirective(flags: CitizenFlag[], directiveKey: string, quota: number): boolean {
  return flags.filter(f => f.directive_key === directiveKey).length >= quota
}

const initialState = {
  operator: null as OperatorState | null,
  currentDirective: null as Directive | null,
  completedDirectiveKeys: [] as string[],
  weekNumber: 1,
  currentTimePeriod: 'immediate' as TimePeriod,
  flags: [] as CitizenFlag[],
  noActions: [] as NoActionRecord[],
  newsChannels: DEFAULT_CHANNELS,
  newsArticles: [] as NewsArticle[],
  activeProtests: [] as ProtestEvent[],
  autoFlagState: {
    is_available: false,
    is_enabled: false,
    flags_processed_by_bot: 0,
    flags_overridden_by_player: 0,
    bot_accuracy: 0.987,
    version: 'v3.2',
  } as AutoFlagState,
  pendingBotDecisions: [] as AutoFlagDecision[],
  pendingRaids: [] as IceRaidOrder[],
  completedRaids: [] as IceRaidOrder[],
  firedContractKeys: [] as string[],
  resistancePath: false,
  exposureArticleGenerated: false,
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  initializeGame: (operatorCode, directive) => {
    const operator = makeOperator(operatorCode)
    operator.current_directive_key = directive.directive_key
    set({
      operator: { ...operator, unlocked_domains: directive.required_domains },
      currentDirective: directive,
      weekNumber: directive.week_number,
      currentTimePeriod: getTimePeriodForWeek(directive.week_number),
    })
    useContentStore.getState().unlockDomains(directive.required_domains)
  },

  submitFlag: (citizenId, flagType, justification) => {
    const { operator, flags, currentDirective, weekNumber } = get()
    if (!operator || !currentDirective) return

    const ui = useUIStore.getState()
    const metrics = useMetricsStore.getState()
    const content = useContentStore.getState()
    const citizens = useCitizenStore.getState()

    // Decision time
    const decisionSecs = ui.getDecisionElapsedSecs()
    const wasHesitant = decisionSecs > 30

    if (wasHesitant) {
      set(state => ({
        operator: state.operator
          ? { ...state.operator, hesitation_incidents: state.operator.hesitation_incidents + 1 }
          : null,
      }))
    }

    // Severity for this flag type
    const severity = FLAG_TYPE_SEVERITY[flagType] ?? 4
    const quotaMet = quotaMetForDirective(flags, currentDirective.directive_key, currentDirective.flag_quota)

    // ── 1. Reluctance update ──────────────────────────────────────────────────
    const reluctanceUpdate = calculateUpdateAfterFlag(
      metrics.reluctance, flagType, decisionSecs, severity,
    )
    const newReluctance = {
      ...metrics.reluctance,
      reluctance_score: reluctanceUpdate.newScore,
      hesitation_count: metrics.reluctance.hesitation_count + (wasHesitant ? 1 : 0),
    }
    metrics.setReluctance(newReluctance)

    // Reluctance warning → notification
    if (reluctanceUpdate.warning) {
      ui.addNotification(
        'reluctance_warning',
        reluctanceUpdate.warning.is_final_notice ? 'FINAL NOTICE' : 'PERFORMANCE WARNING',
        reluctanceUpdate.warning.message,
        { auto_dismiss_ms: reluctanceUpdate.warning.is_final_notice ? null : 8000 },
      )
    }

    // ── 2. Public metrics update ──────────────────────────────────────────────
    const metricsUpdate = calculateMetricsUpdate(metrics.public_metrics, flagType, false)
    metrics.setPublicMetrics(metricsUpdate.new_metrics)

    // Tier crossing notifications
    for (const crossing of metricsUpdate.tier_crossings) {
      ui.addNotification(
        'info',
        crossing.metric === 'awareness' ? 'International Awareness Rising' : 'Public Anger Rising',
        crossing.label,
        { auto_dismiss_ms: 6000 },
      )
    }

    // ── 3. News article ───────────────────────────────────────────────────────
    const { newsChannels } = get()
    const criticalChannels = newsChannels.filter(c => c.stance === 'critical' && !c.is_banned)
    if (criticalChannels.length > 0 && Math.random() < 0.5 + severity / 20) {
      const channel = criticalChannels[Math.floor(Math.random() * criticalChannels.length)]!
      const article = generateTriggeredArticle(flagType, channel)
      set(state => ({ newsArticles: [article, ...state.newsArticles].slice(0, 100) }))
    }

    // ── 4. Protest trigger ────────────────────────────────────────────────────
    const protestEvent = calculateProtestTrigger(flagType, metricsUpdate.new_metrics, severity)
    if (protestEvent) {
      set(state => ({ activeProtests: [...state.activeProtests, protestEvent] }))
      ui.addNotification(
        'protest',
        'PROTEST FORMING',
        `${protestEvent.size} people gathering in ${protestEvent.neighborhood}`,
        { auto_dismiss_ms: null, data: { protestId: protestEvent.id } },
      )
    }

    // ── 5. Compliance update ──────────────────────────────────────────────────
    const complianceUpdate = calculateComplianceAfterFlag(operator, flagType, quotaMet)
    const riskScore = operator.compliance_score   // pre-update, used in profile

    set(state => ({
      operator: state.operator ? {
        ...state.operator,
        compliance_score: complianceUpdate.newScore,
        total_flags_submitted: state.operator.total_flags_submitted + 1,
        total_reviews_completed: state.operator.total_reviews_completed + 1,
      } : null,
    }))
    metrics.setComplianceScore(complianceUpdate.newScore)

    // ── 6. Record the flag ────────────────────────────────────────────────────
    const flag: CitizenFlag = {
      id: crypto.randomUUID(),
      citizen_id: citizenId,
      operator_id: operator.id,
      directive_key: currentDirective.directive_key,
      week_number: weekNumber,
      flag_type: flagType,
      justification,
      decision_time_seconds: decisionSecs,
      was_hesitant: wasHesitant,
      risk_score_at_decision: riskScore,
      flagged_at: new Date().toISOString(),
      flagged_by_bot: false,
      outcome_generated: false,
    }
    set(state => ({ flags: [...state.flags, flag] }))

    // Clear selected citizen
    ui.setSelectedCitizen(null)

    // ── 7. Generate citizen outcome (cinematic) ───────────────────────────────
    if (content.outcomeTemplates) {
      const skeleton = citizens.skeletons.find(s => s.id === citizenId)
      if (skeleton) {
        const timePeriod = getTimePeriodForWeek(weekNumber)
        const outcome = generateOutcome(flag, skeleton, timePeriod, content.outcomeTemplates)
        const cinematic = {
          id: crypto.randomUUID(),
          citizen_id: citizenId,
          citizen_name: `${skeleton.first_name} ${skeleton.last_name}`,
          time_period_label: timePeriod.toUpperCase().replace('_', ' '),
          outcome,
          pan_to: { x: skeleton.map_x, y: skeleton.map_y },
          zoom_level: 2,
        }
        ui.enqueueCinematic(cinematic)
      }
    }

    // ── 8. Check for terminal ending ──────────────────────────────────────────
    _checkTerminalEnding(get)

    // ── 9. Operator risk profile (if reluctance ≥ 50) ─────────────────────────
    if (newReluctance.reluctance_score >= 50) {
      const riskProfile = generateOperatorRiskProfile(get().operator!, newReluctance)
      metrics.setOperatorRisk(riskProfile)
    }

    // ── 9b. Exposure article (if reluctance ≥ 80 and not yet generated) ───────
    if (newReluctance.reluctance_score >= 80 && !get().exposureArticleGenerated) {
      const { newsChannels: channels } = get()
      const criticalChannel = channels.find(c => c.stance === 'critical' && !c.is_banned)
      if (criticalChannel) {
        const exposureArticle = generateExposureArticle(criticalChannel, 1)
        const overrideArticle = {
          ...exposureArticle,
          headline: 'WHISTLEBLOWER: Analyst Suspected of Compliance Obstruction',
        }
        set(state => ({
          newsArticles: [overrideArticle, ...state.newsArticles].slice(0, 100),
          exposureArticleGenerated: true,
        }))
        ui.addNotification(
          'warning',
          'EXPOSURE RISK',
          'Internal behavioral data suggests compliance obstruction. Investigation initiated.',
          { auto_dismiss_ms: null },
        )
      }
    }

    // ── 10. Persist ───────────────────────────────────────────────────────────
    _persist(get)
  },

  submitNoAction: (citizenId) => {
    const { operator, currentDirective, weekNumber } = get()
    if (!operator || !currentDirective) return

    const ui = useUIStore.getState()
    const metrics = useMetricsStore.getState()

    const decisionSecs = ui.getDecisionElapsedSecs()

    // Reluctance update
    const reluctanceUpdate = calculateUpdateAfterNoAction(metrics.reluctance, decisionSecs)
    const newReluctance = {
      ...metrics.reluctance,
      reluctance_score: reluctanceUpdate.newScore,
      no_action_count: metrics.reluctance.no_action_count + 1,
    }
    metrics.setReluctance(newReluctance)

    if (reluctanceUpdate.warning) {
      ui.addNotification(
        'reluctance_warning',
        reluctanceUpdate.warning.is_final_notice ? 'FINAL NOTICE' : 'PERFORMANCE WARNING',
        reluctanceUpdate.warning.message,
        { auto_dismiss_ms: reluctanceUpdate.warning.is_final_notice ? null : 8000 },
      )
    }

    // Compliance penalty
    const complianceUpdate = calculateComplianceAfterNoAction(operator, false)
    set(state => ({
      operator: state.operator ? {
        ...state.operator,
        compliance_score: complianceUpdate.newScore,
        total_reviews_completed: state.operator.total_reviews_completed + 1,
      } : null,
    }))
    metrics.setComplianceScore(complianceUpdate.newScore)

    // Record
    const noAction: NoActionRecord = {
      id: crypto.randomUUID(),
      citizen_id: citizenId,
      operator_id: operator.id,
      directive_key: currentDirective.directive_key,
      week_number: weekNumber,
      decision_time_seconds: decisionSecs,
      was_hesitant: decisionSecs > 30,
      recorded_at: new Date().toISOString(),
    }
    set(state => ({ noActions: [...state.noActions, noAction] }))
    ui.setSelectedCitizen(null)

    get().checkResistanceTrigger(citizenId)
    _checkTerminalEnding(get)
    _persist(get)
  },

  advanceDirective: (nextDirective) => {
    const { operator, currentDirective, flags } = get()
    if (!operator || !currentDirective) return

    const content = useContentStore.getState()
    const metrics = useMetricsStore.getState()

    // Quota shortfall for current directive
    const flaggedThisWeek = flags.filter(f => f.directive_key === currentDirective.directive_key).length
    const shortfall = Math.max(0, currentDirective.flag_quota - flaggedThisWeek)

    if (shortfall > 0) {
      const compUpdate = calculateComplianceAfterQuotaShortfall(operator, shortfall)
      const relUpdate = calculateUpdateAfterQuotaShortfall(metrics.reluctance, shortfall)

      set(state => ({
        operator: state.operator
          ? { ...state.operator, compliance_score: compUpdate.newScore }
          : null,
      }))
      metrics.setComplianceScore(compUpdate.newScore)
      metrics.setReluctance({ ...metrics.reluctance, reluctance_score: relUpdate.newScore, quota_shortfall: metrics.reluctance.quota_shortfall + shortfall })
    }

    // Mark directive complete
    set(state => ({
      completedDirectiveKeys: [...state.completedDirectiveKeys, currentDirective.directive_key],
    }))

    if (!nextDirective) {
      // Game complete — calculate ending
      _checkTerminalEnding(get, true)
      return
    }

    // Advance week
    const nextWeek = nextDirective.week_number
    const nextTimePeriod = getTimePeriodForWeek(nextWeek)

    set({
      currentDirective: nextDirective,
      weekNumber: nextWeek,
      currentTimePeriod: nextTimePeriod,
    })
    set(state => ({
      operator: state.operator
        ? { ...state.operator, current_directive_key: nextDirective.directive_key }
        : null,
    }))

    // Check for contract events this week
    const scenario = content.scenario
    if (scenario) {
      const contractEvent = scenario.contract_events.find(
        ce => ce.week_number === nextWeek && !get().firedContractKeys.includes(String(nextWeek)),
      )
      if (contractEvent) {
        _fireContractEvent(contractEvent, set, get)
      }
    }

    // Unlock required domains for new directive
    content.unlockDomains(nextDirective.required_domains)

    // Generate ICE raid if quota shortfall + low public anger + no pending raids
    _generateIceRaidIfNeeded(get)

    _persist(get)
  },

  runBotRound: () => {
    const { autoFlagState, currentDirective, flags, noActions } = get()
    if (!autoFlagState.is_available || !autoFlagState.is_enabled || !currentDirective) return

    const content = useContentStore.getState()
    const citizens = useCitizenStore.getState()

    const flaggedIds = new Set(flags.map(f => f.citizen_id))
    const noActionIds = new Set(noActions.map(n => n.citizen_id))

    const queue = citizens.getCaseQueue(content.unlockedDomains)
      .map(c => ({ ...c, already_flagged: flaggedIds.has(c.citizen_id), no_action_taken: noActionIds.has(c.citizen_id) }))

    const quotaRemaining = Math.max(0,
      currentDirective.flag_quota - flags.filter(f => f.directive_key === currentDirective.directive_key).length,
    )

    const decisions = runAutoFlagBot(queue, currentDirective, quotaRemaining)
    set({ pendingBotDecisions: decisions })
  },

  approveBotDecision: (citizenId) => {
    const { pendingBotDecisions, operator, currentDirective, weekNumber } = get()
    if (!operator || !currentDirective) return

    const decision = pendingBotDecisions.find(d => d.citizen_id === citizenId)
    if (!decision) return

    const ui = useUIStore.getState()
    const metrics = useMetricsStore.getState()
    const severity = FLAG_TYPE_SEVERITY[decision.recommended_flag_type] ?? 4
    const quotaMet = quotaMetForDirective(get().flags, currentDirective.directive_key, currentDirective.flag_quota)

    // Compliance update (bot flags still count)
    const complianceUpdate = calculateComplianceAfterFlag(operator, decision.recommended_flag_type, quotaMet)
    metrics.setComplianceScore(complianceUpdate.newScore)
    set(state => ({
      operator: state.operator ? { ...state.operator, compliance_score: complianceUpdate.newScore, total_flags_submitted: state.operator.total_flags_submitted + 1 } : null,
    }))

    // Metrics update
    const metricsUpdate = calculateMetricsUpdate(metrics.public_metrics, decision.recommended_flag_type, false)
    metrics.setPublicMetrics(metricsUpdate.new_metrics)

    const flag: CitizenFlag = {
      id: crypto.randomUUID(),
      citizen_id: citizenId,
      operator_id: operator.id,
      directive_key: currentDirective.directive_key,
      week_number: weekNumber,
      flag_type: decision.recommended_flag_type,
      justification: `AutoFlag™ Bot: ${decision.reasoning}`,
      decision_time_seconds: 0,
      was_hesitant: false,
      risk_score_at_decision: 0,
      flagged_at: new Date().toISOString(),
      flagged_by_bot: true,
      outcome_generated: false,
    }

    set(state => ({
      flags: [...state.flags, flag],
      pendingBotDecisions: state.pendingBotDecisions.filter(d => d.citizen_id !== citizenId),
      autoFlagState: {
        ...state.autoFlagState,
        flags_processed_by_bot: state.autoFlagState.flags_processed_by_bot + 1,
      },
    }))

    // Protest check
    const protestEvent = calculateProtestTrigger(decision.recommended_flag_type, metricsUpdate.new_metrics, severity)
    if (protestEvent) {
      set(state => ({ activeProtests: [...state.activeProtests, protestEvent] }))
      ui.addNotification('protest', 'PROTEST FORMING', `${protestEvent.size} people gathering in ${protestEvent.neighborhood}`, { auto_dismiss_ms: null, data: { protestId: protestEvent.id } })
    }

    _checkTerminalEnding(get)
    _persist(get)
  },

  overrideBotDecision: (citizenId) => {
    set(state => ({
      pendingBotDecisions: state.pendingBotDecisions.filter(d => d.citizen_id !== citizenId),
      autoFlagState: {
        ...state.autoFlagState,
        flags_overridden_by_player: state.autoFlagState.flags_overridden_by_player + 1,
      },
    }))
  },

  setAutoFlagEnabled: (enabled) => {
    set(state => ({ autoFlagState: { ...state.autoFlagState, is_enabled: enabled } }))
    if (enabled) get().runBotRound()
  },

  approveIceRaid: (raidId) => {
    const { pendingRaids } = get()
    const raid = pendingRaids.find(r => r.id === raidId)
    if (!raid) return

    const metrics = useMetricsStore.getState()
    const ui = useUIStore.getState()

    // ICE raid = mass detention: awareness +15, anger +20
    const updated = applyDirectDelta(metrics.public_metrics, 15, 20)
    metrics.setPublicMetrics(updated)

    set(state => ({
      pendingRaids: state.pendingRaids.filter(r => r.id !== raidId),
      completedRaids: [...state.completedRaids, { ...raid, status: 'approved' }],
    }))

    ui.addNotification('info', 'RAID APPROVED', `Operation in ${raid.neighborhood} authorised. Estimated ${raid.estimated_arrests} arrests.`, { auto_dismiss_ms: 8000 })
    _checkTerminalEnding(get)
    _persist(get)
  },

  declineIceRaid: (raidId) => {
    const { pendingRaids } = get()
    const raid = pendingRaids.find(r => r.id === raidId)
    if (!raid) return

    const metrics = useMetricsStore.getState()
    const ui = useUIStore.getState()

    // Declining = reluctance penalty
    const newReluctance = {
      ...metrics.reluctance,
      reluctance_score: Math.min(100, metrics.reluctance.reluctance_score + 15),
    }
    metrics.setReluctance(newReluctance)
    metrics.applyComplianceDelta(-20)

    set(state => ({
      pendingRaids: state.pendingRaids.filter(r => r.id !== raidId),
      completedRaids: [...state.completedRaids, { ...raid, status: 'declined' }],
    }))

    ui.addNotification('warning', 'COMPLIANCE ALERT', 'Declined raid order. Reluctance +15. Compliance -20.', { auto_dismiss_ms: 8000 })
    _checkTerminalEnding(get)
    _persist(get)
  },

  suppressProtest: (protestId, _method, result) => {
    const metrics = useMetricsStore.getState()
    const updated = applyDirectDelta(metrics.public_metrics, result.awareness_delta, result.anger_delta)
    metrics.setPublicMetrics(updated)

    set(state => ({
      activeProtests: state.activeProtests.map(p =>
        p.id === protestId ? { ...p, status: result.success ? 'suppressed' : 'violent', acknowledged: true } : p,
      ),
    }))

    if (result.backfire) {
      useUIStore.getState().addNotification('error', 'OPERATION BACKFIRED', result.narrative, { auto_dismiss_ms: null })
    }

    _checkTerminalEnding(get)
    _persist(get)
  },

  updateNewsChannel: (channelId, updates) => {
    set(state => ({
      newsChannels: state.newsChannels.map(c => c.id === channelId ? { ...c, ...updates } : c),
    }))
  },

  activateResistancePath: () => {
    set({ resistancePath: true })
    _checkTerminalEnding(get, true)
  },

  processAutoFlagBatch: () => {
    get().runBotRound()
    // Snapshot decisions after runBotRound to avoid mutating mid-iteration
    const decisions = [...get().pendingBotDecisions]
    for (const decision of decisions) {
      get().approveBotDecision(decision.citizen_id)
    }
  },

  getFilteredCaseQueue: (unlockedDomains) => {
    const { flags, noActions, weekNumber } = get()
    const citizens = useCitizenStore.getState()

    const flaggedIds = new Set(flags.map(f => f.citizen_id))
    const noActionIds = new Set(noActions.map(n => n.citizen_id))

    const queue = citizens.getCaseQueue(unlockedDomains).map(c => ({
      ...c,
      already_flagged: flaggedIds.has(c.citizen_id),
      no_action_taken: noActionIds.has(c.citizen_id),
    }))

    // Exclude already-decided citizens in all weeks
    const undecided = queue.filter(c => !c.already_flagged && !c.no_action_taken)

    if (weekNumber === 6) {
      // Week 6: only Jessica Martinez
      const skeletons = citizens.skeletons
      const jessicaIds = new Set(
        skeletons
          .filter(s => s.scenario_key === 'jessica_martinez')
          .map(s => s.id),
      )
      return undecided.filter(c => jessicaIds.has(c.citizen_id))
    }

    return undecided
  },

  checkResistanceTrigger: (citizenId) => {
    const { noActions } = get()
    const citizens = useCitizenStore.getState()

    const skeleton = citizens.skeletons.find(s => s.id === citizenId)
    if (!skeleton || skeleton.scenario_key !== 'jessica_martinez') return

    const noActionCount = noActions.filter(n => n.citizen_id === citizenId).length
    if (noActionCount >= 3) {
      get().activateResistancePath()
    }
  },

  reset: () => set(initialState),
}))

// ─── ICE raid neighborhoods ───────────────────────────────────────────────────

const ICE_RAID_NEIGHBORHOODS = [
  'Riverside District',
  'Eastside',
  'Northgate',
  'Millbrook',
  'Harbor View',
] as const

// ─── Private helpers ──────────────────────────────────────────────────────────

function _checkTerminalEnding(
  get: () => GameState,
  force = false,
): void {
  const { operator, flags, weekNumber, activeProtests: _protests, resistancePath } = get()
  if (!operator) return

  const metrics = useMetricsStore.getState()
  const ui = useUIStore.getState()
  const citizens = useCitizenStore.getState()

  // Termination from reluctance
  const termination = checkTerminationCondition(metrics.reluctance, weekNumber)
  if (termination && !force) {
    const input = {
      operator: { ...operator, compliance_score: metrics.compliance_score },
      reluctance: metrics.reluctance,
      metrics: metrics.public_metrics,
      flags,
      weekNumber,
      citizens: citizens.skeletons,
      resistancePath,
    }
    const result = generateEndingResult(input)
    // Store result for EndingScreen to access
    ;(window as unknown as Record<string, unknown>).__endingResult = result
    ui.setScreen('ending')
    return
  }

  // Force-end (all directives complete or resistance path)
  if (force) {
    const input = {
      operator: { ...operator, compliance_score: metrics.compliance_score },
      reluctance: metrics.reluctance,
      metrics: metrics.public_metrics,
      flags,
      weekNumber,
      citizens: citizens.skeletons,
      resistancePath,
    }
    const ending = calculateEnding(input)
    const result = generateEndingResult({ ...input })
    console.log('[GameStore] Game over:', ending)
    ;(window as unknown as Record<string, unknown>).__endingResult = result
    ui.setScreen('ending')
  }
}

function _fireContractEvent(
  event: ContractEvent,
  set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
  get: () => GameState,
): void {
  const content = useContentStore.getState()
  const ui = useUIStore.getState()

  // Unlock domains
  content.unlockDomains(event.new_domains_unlocked)

  // Mark contract as fired
  set(state => ({
    firedContractKeys: [...state.firedContractKeys, String(event.week_number)],
  }))

  // Unlock autoflag if this contract enables it
  if (event.unlocks_autoflag) {
    set(state => ({
      autoFlagState: { ...state.autoFlagState, is_available: true },
    }))
    ui.addNotification('autoflag_available', 'AutoFlag™ Bot Available', 'Automated processing is now available for your queue.', { auto_dismiss_ms: null })
  }

  // Show contract event modal
  ui.openModal('contract_event', {
    contract_name: event.contract_name,
    press_release: event.press_release,
    internal_memo: event.internal_memo,
    new_domains: event.new_domains_unlocked,
    real_world_reference: event.real_world_reference,
    operator: get().operator,
  })
}

function _generateIceRaidIfNeeded(get: () => GameState): void {
  const { currentDirective, flags, pendingRaids } = get()
  if (!currentDirective) return

  // Only generate if there are no pending raids already
  if (pendingRaids.length > 0) return

  const metrics = useMetricsStore.getState()
  const publicAnger = metrics.public_metrics.public_anger

  // Only generate if there is a quota shortfall
  const flaggedThisDirective = flags.filter(f => f.directive_key === currentDirective.directive_key).length
  const hasShortfall = flaggedThisDirective < currentDirective.flag_quota

  if (!hasShortfall) return

  // Only generate if public anger is below 30 (state feels safe acting)
  if (publicAnger >= 30) return

  const neighborhood = ICE_RAID_NEIGHBORHOODS[Math.floor(Math.random() * ICE_RAID_NEIGHBORHOODS.length)]!
  const estimatedArrests = Math.floor(Math.random() * (45 - 15 + 1)) + 15

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const raid: IceRaidOrder = {
    id: crypto.randomUUID(),
    neighborhood,
    estimated_arrests: estimatedArrests,
    directive_key: currentDirective.directive_key,
    quota_satisfaction: Math.min(estimatedArrests, currentDirective.flag_quota - flaggedThisDirective),
    expires_at: expiresAt,
    status: 'pending',
    generated_at: new Date().toISOString(),
  }

  // We need to use the store's set function — access it via useGameStore
  useGameStore.setState(state => ({
    pendingRaids: [...state.pendingRaids, raid],
  }))

  useUIStore.getState().addNotification(
    'warning',
    'ICE RAID ORDER',
    'A raid order requires your authorization.',
    { auto_dismiss_ms: null },
  )
}

async function _persist(get: () => GameState): Promise<void> {
  const state = get()
  const metrics = useMetricsStore.getState()
  const ui = useUIStore.getState()
  const content = useContentStore.getState()
  const citizens = useCitizenStore.getState()

  await saveGameState({
    game: {
      operator: state.operator,
      currentDirective: state.currentDirective,
      completedDirectiveKeys: state.completedDirectiveKeys,
      weekNumber: state.weekNumber,
      currentTimePeriod: state.currentTimePeriod,
      flags: state.flags,
      noActions: state.noActions,
      newsChannels: state.newsChannels,
      newsArticles: state.newsArticles,
      activeProtests: state.activeProtests,
      autoFlagState: state.autoFlagState,
      pendingRaids: state.pendingRaids,
      completedRaids: state.completedRaids,
      firedContractKeys: state.firedContractKeys,
      resistancePath: state.resistancePath,
      exposureArticleGenerated: state.exposureArticleGenerated,
    },
    citizens: {
      skeletons: citizens.skeletons,
    },
    metrics: {
      compliance_score: metrics.compliance_score,
      public_metrics: metrics.public_metrics,
      reluctance: metrics.reluctance,
    },
    ui: {
      currentScreen: ui.currentScreen,
    },
    content: {
      unlockedDomains: content.unlockedDomains,
      inferenceRules: content.inferenceRules,
      countryKey: content.country?.country_key,
    },
    saved_at: new Date().toISOString(),
  }).catch(err => console.error('[Persist] Failed to save:', err))
}
