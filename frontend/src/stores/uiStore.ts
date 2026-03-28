/**
 * uiStore — UI state: screen routing, selected citizen, cinematic queue,
 * notifications, modals, and the decision timer.
 */
import { create } from 'zustand'
import type { Screen, Notification, NotificationType, CinematicData, ModalState, ModalType, ShiftMemoData } from '@/types/ui'

export type DashboardView = 'case-review' | 'news-feed' | 'world-map'

interface UIState {
  // Screen
  currentScreen: Screen
  previousScreen: Screen | null
  setScreen: (screen: Screen) => void
  goBack: () => void

  // Dashboard view (case-review | news-feed | world-map)
  currentView: DashboardView
  setView: (view: DashboardView) => void

  // First-run memo — persisted in localStorage
  memoAcknowledged: boolean
  acknowledgeMemo: () => void

  // Guided first-shift tutorial (null = done/skipped)
  tutorialStep: number | null
  advanceTutorial: () => void
  skipTutorial: () => void

  // Queue collapse state
  queueCollapsed: boolean
  toggleQueue: () => void

  // Selected citizen (case panel)
  selectedCitizenId: string | null
  setSelectedCitizen: (id: string | null) => void

  // Cinematic queue
  cinematicQueue: CinematicData[]
  currentCinematic: CinematicData | null
  enqueueCinematic: (cinematic: CinematicData) => void
  advanceCinematic: () => void
  skipCinematic: () => void

  // Notifications
  notifications: Notification[]
  addNotification: (type: NotificationType, title: string, message: string, opts?: { auto_dismiss_ms?: number | null; data?: Record<string, unknown> }) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void

  // Modals
  modal: ModalState
  openModal: (type: ModalType, data?: Record<string, unknown>) => void
  closeModal: () => void

  // Decision timer (tracks time since citizen was opened — internal only, not displayed)
  decisionTimerStart: number | null
  startDecisionTimer: () => void
  getDecisionElapsedSecs: () => number

  // Global shift timer (displayed to player)
  shiftStartTime: number | null
  startShiftTimer: () => void
  getShiftElapsedSecs: () => number

  // Shift memo (shown between weeks)
  pendingShiftMemo: ShiftMemoData | null
  showShiftMemo: (data: ShiftMemoData) => void
  dismissShiftMemo: () => void

  // Reset
  reset: () => void
}

const MEMO_KEY = 'civic-harmony-memo-acknowledged'

const initialState = {
  currentScreen: 'start' as Screen,
  previousScreen: null as Screen | null,
  currentView: 'case-review' as DashboardView,
  memoAcknowledged: localStorage.getItem(MEMO_KEY) === 'true',
  tutorialStep: null as number | null,
  queueCollapsed: false,
  selectedCitizenId: null as string | null,
  cinematicQueue: [] as CinematicData[],
  currentCinematic: null as CinematicData | null,
  notifications: [] as Notification[],
  modal: { type: null } as ModalState,
  decisionTimerStart: null as number | null,
  shiftStartTime: null as number | null,
  pendingShiftMemo: null as ShiftMemoData | null,
}

export const useUIStore = create<UIState>((set, get) => ({
  ...initialState,

  setScreen: (screen) => set(state => ({ currentScreen: screen, previousScreen: state.currentScreen })),

  goBack: () => set(state => ({
    currentScreen: state.previousScreen ?? 'start',
    previousScreen: null,
  })),

  setView: (view) => set({ currentView: view }),

  acknowledgeMemo: () => {
    localStorage.setItem(MEMO_KEY, 'true')
    set({ memoAcknowledged: true, tutorialStep: 0 })
  },

  advanceTutorial: () => {
    const { tutorialStep } = get()
    if (tutorialStep === null) return
    const next = tutorialStep + 1
    set({ tutorialStep: next > 3 ? null : next })
  },

  skipTutorial: () => set({ tutorialStep: null }),

  toggleQueue: () => set(state => ({ queueCollapsed: !state.queueCollapsed })),

  setSelectedCitizen: (id) => {
    set({ selectedCitizenId: id })
    if (id !== null && get().tutorialStep === null) {
      // Start per-citizen decision timer (internal, for hesitation scoring)
      set({ decisionTimerStart: Date.now() })
      // Start global shift timer on first selection (never resets mid-shift)
      if (get().shiftStartTime === null) {
        set({ shiftStartTime: Date.now() })
      }
    }
  },

  enqueueCinematic: (cinematic) => {
    const { cinematicQueue, currentCinematic } = get()
    if (currentCinematic === null) {
      set({ currentCinematic: cinematic })
    } else {
      set({ cinematicQueue: [...cinematicQueue, cinematic] })
    }
  },

  advanceCinematic: () => {
    const { cinematicQueue } = get()
    if (cinematicQueue.length === 0) {
      set({ currentCinematic: null })
    } else {
      const [next, ...rest] = cinematicQueue
      set({ currentCinematic: next ?? null, cinematicQueue: rest })
    }
  },

  skipCinematic: () => {
    set({ currentCinematic: null, cinematicQueue: [] })
  },

  addNotification: (type, title, message, opts: { auto_dismiss_ms?: number | null; data?: Record<string, unknown> } = {}) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      auto_dismiss_ms: opts.auto_dismiss_ms ?? null,
      created_at: new Date().toISOString(),
      data: opts.data,
    }
    set(state => ({ notifications: [...state.notifications, notification] }))

    if (opts.auto_dismiss_ms) {
      setTimeout(() => {
        get().dismissNotification(notification.id)
      }, opts.auto_dismiss_ms)
    }
  },

  dismissNotification: (id) =>
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),

  clearNotifications: () => set({ notifications: [] }),

  openModal: (type, data) => set({ modal: { type, data } }),

  closeModal: () => set({ modal: { type: null } }),

  startDecisionTimer: () => set({ decisionTimerStart: Date.now() }),

  getDecisionElapsedSecs: () => {
    const { decisionTimerStart } = get()
    if (decisionTimerStart === null) return 0
    return (Date.now() - decisionTimerStart) / 1000
  },

  startShiftTimer: () => set(state => ({
    shiftStartTime: state.shiftStartTime ?? Date.now(),
  })),

  getShiftElapsedSecs: () => {
    const { shiftStartTime } = get()
    if (shiftStartTime === null) return 0
    return (Date.now() - shiftStartTime) / 1000
  },

  showShiftMemo: (data) => set({ pendingShiftMemo: data }),
  dismissShiftMemo: () => set({ pendingShiftMemo: null }),

  reset: () => set({ ...initialState, memoAcknowledged: localStorage.getItem(MEMO_KEY) === 'true' }),
}))
