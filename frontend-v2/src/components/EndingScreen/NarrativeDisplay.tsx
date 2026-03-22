interface NarrativeDisplayProps {
  narrative: string
  ending_key: string
}

const ENDING_COLORS: Record<string, string> = {
  compliant_operator: '#ef4444',
  state_servant: '#ef4444',
  reluctant_operator: '#f59e0b',
  refusal_burnout: '#f59e0b',
  resistance_hero: '#22c55e',
  resistance_path: '#22c55e',
  whistleblower: '#3b82f6',
  early_termination: '#3b82f6',
}

function getEndingColor(key: string): string {
  return ENDING_COLORS[key] ?? '#6b7280'
}

function formatEndingKey(key: string): string {
  return key.replace(/_/g, ' ').toUpperCase()
}

export default function NarrativeDisplay({ narrative, ending_key }: NarrativeDisplayProps) {
  const color = getEndingColor(ending_key)

  return (
    <div
      data-testid="narrative-display"
      style={{
        borderLeft: `4px solid ${color}`,
        paddingLeft: '24px',
        marginBottom: '32px',
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: '11px',
          letterSpacing: '0.2em',
          color,
          marginBottom: '16px',
          textTransform: 'uppercase',
        }}
      >
        {formatEndingKey(ending_key)}
      </div>
      <div
        style={{
          color: '#e5e7eb',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '14px',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap',
        }}
      >
        {narrative}
      </div>
    </div>
  )
}
