import type { CitizenOutcome } from './game'

// ─── Screen routing ───────────────────────────────────────────────────────────

export type Screen = 'start' | 'dashboard' | 'ending' | 'endings_archive'

export type ActivePanel = 'citizen' | 'news' | 'metrics' | 'map' | null

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'reluctance_warning'
  | 'contract_event'
  | 'protest'
  | 'ice_raid'
  | 'autoflag_available'
  | 'exposure_article'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  auto_dismiss_ms: number | null        // null = requires manual dismiss
  created_at: string
  data?: Record<string, unknown>        // payload for modals
}

// ─── Cinematics ───────────────────────────────────────────────────────────────

export interface CinematicData {
  id: string
  citizen_id: string
  citizen_name: string
  time_period_label: string             // e.g. "1 MONTH LATER"
  outcome: CitizenOutcome
  pan_to: { x: number; y: number }
  zoom_level: number
}

// ─── World map display state (React → Phaser) ─────────────────────────────────

export interface NPCDisplayData {
  id: string
  sprite_key: string
  map_x: number
  map_y: number
  is_highlighted: boolean
  is_flagged: boolean
  flag_type: import('./game').FlagType | null
}

export interface WorldDisplayState {
  npcs: NPCDisplayData[]
  cinematic: CinematicInstruction | null
  week_number: number
  visual_effects: {
    crt_enabled: boolean
    data_flow_enabled: boolean
  }
}

export interface CinematicInstruction {
  citizen_id: string
  citizen_name: string
  pan_to: { x: number; y: number }
  zoom_level: number
  duration_ms: number
}

// ─── Shift memo ───────────────────────────────────────────────────────────────

export interface ShiftMemoData {
  weekNumber: number
  memoText: string
  tone: 'positive' | 'warning' | 'briefing'
  nextDirective: import('./game').Directive | null
  sender?: { name: string; title: string }
  isBriefing?: boolean
  /** Optional easter-egg / recruitment link rendered below memo body. */
  recruitmentLink?: { label: string; href: string }
  /** Wrong-flag moral feedback — colleague calls out low-risk or fabricated flags. */
  wrongFlags?: import('./game').WrongFlagRecord[]
  /** Hacktivist contact — path A end-of-shift memo from Hamza Bendelladj. */
  isHacktivistContact?: boolean
  /** Protected citizen order — Central Command "do not process" directive. */
  isEpsteinOrder?: boolean
  protectedCitizenName?: string
  /**
   * When present, the end-of-shift overlay also shows the next directive briefing
   * inline, eliminating the separate "DIRECTIVE BRIEFING" popup.
   */
  nextDirectiveBriefing?: {
    directiveKey: string
    title: string
    description: string
    quota: number
    flagType: string
    newDomains: string[]
  }
}

// ─── Modal state ──────────────────────────────────────────────────────────────

export type ModalType =
  | 'contract_event'
  | 'protest'
  | 'inference_rules_editor'
  | 'operator_profile'
  | 'save_load'
  | 'ice_raid'
  | 'autoflag_confirm'
  | 'memo_archive'
  | null

export interface ModalState {
  type: ModalType
  data?: Record<string, unknown>
}
