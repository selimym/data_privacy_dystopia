import { useUIStore } from '@/stores/uiStore'
import '@/styles/cinematic.css'

const TIME_PERIOD_CLASS: Record<string, string> = {
  'IMMEDIATE': 'immediate',
  'IMMEDIATE CONSEQUENCE': 'immediate',
  '1 MONTH LATER': 'month',
  '6 MONTHS LATER': 'six-months',
  '1 YEAR LATER': 'year',
}

function getTimePeriodClass(label: string): string {
  return TIME_PERIOD_CLASS[label.toUpperCase()] ?? 'immediate'
}

export function CinematicOverlay() {
  const currentCinematic = useUIStore((s) => s.currentCinematic)
  const advanceCinematic = useUIStore((s) => s.advanceCinematic)

  if (currentCinematic === null) return null

  const { citizen_name, time_period_label, outcome } = currentCinematic
  const timePeriodClass = getTimePeriodClass(time_period_label)

  return (
    <div className="cinematic-overlay" data-testid="cinematic-overlay">
      <div className="cinematic-text-box">
        <button
          className="cinematic-skip-button"
          onClick={advanceCinematic}
          data-testid="cinematic-skip"
          type="button"
        >
          SKIP
        </button>

        <div className="cinematic-header">
          <span className="cinematic-citizen-name">{citizen_name}</span>
          <span className={`cinematic-time-period ${timePeriodClass}`}>
            {time_period_label}
          </span>
        </div>

        {outcome.status && (
          <div className="cinematic-status">{outcome.status}</div>
        )}

        <div className="cinematic-narrative">{outcome.narrative}</div>
      </div>
    </div>
  )
}
