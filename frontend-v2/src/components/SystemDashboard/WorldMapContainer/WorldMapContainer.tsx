export default function WorldMapContainer() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.1em',
      }}
      data-testid="world-map-container"
    >
      WORLD INTELLIGENCE MAP — PHASE 7
    </div>
  )
}
