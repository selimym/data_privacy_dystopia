/**
 * uiStore — UI state: screen routing, selected citizen, cinematic queue,
 * notifications, modals, and the decision timer.
 */
import { create } from 'zustand'
import type { Screen, Notification, NotificationType, CinematicData, ModalState, ModalType } from '@/types/ui'

interface UIState {
  // Screen
  currentScreen: Screen
  setScreen: (screen: Screen) => void

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

  // Decision timer (tracks time since citizen was opened)
  decisionTimerStart: number | null
  startDecisionTimer: () => void
  getDecisionElapsedSecs: () => number

  // Reset
  reset: () => void
}

const initialState = {
  currentScreen: 'start' as Screen,
  selectedCitizenId: null as string | null,
  cinematicQueue: [] as CinematicData[],
  currentCinematic: null as CinematicData | null,
  notifications: [] as Notification[],
  modal: { type: null } as ModalState,
  decisionTimerStart: null as number | null,
}

export const useUIStore = create<UIState>((set, get) => ({
  ...initialState,

  setScreen: (screen) => set({ currentScreen: screen }),

  setSelectedCitizen: (id) => {
    set({ selectedCitizenId: id })
    if (id !== null) {
      // Start the decision timer when a citizen is selected
      set({ decisionTimerStart: Date.now() })
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

  reset: () => set(initialState),
}))
