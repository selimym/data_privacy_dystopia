import type { RealWorldParallel } from '@/services/EndingCalculator'

interface RealWorldParallelsProps {
  parallel: RealWorldParallel
}

export default function RealWorldParallels({ parallel }: RealWorldParallelsProps) {
  return (
    <div
      data-testid="real-world-parallels"
      style={{ marginBottom: '32px' }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.25em',
          color: '#6b7280',
          textTransform: 'uppercase',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        Real-World Parallels
      </div>

      <div
        style={{
          borderLeft: '4px solid #f59e0b',
          paddingLeft: '20px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            color: '#fbbf24',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          {parallel.title}
        </div>
        <div
          style={{
            color: '#d1d5db',
            fontSize: '13px',
            lineHeight: '1.7',
            marginBottom: '16px',
          }}
        >
          {parallel.description}
        </div>

        {parallel.examples.map((ex, i) => (
          <div
            key={i}
            style={{
              borderLeft: '2px solid rgba(245,158,11,0.3)',
              paddingLeft: '16px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                color: '#e5e7eb',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              {ex.name} — {ex.country}, {ex.year}
            </div>
            <div
              style={{
                color: '#9ca3af',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
            >
              {ex.description}
            </div>
          </div>
        ))}

        <div
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '4px',
            padding: '12px 16px',
            color: '#fbbf24',
            fontSize: '12px',
            lineHeight: '1.6',
            marginTop: '8px',
          }}
        >
          <span style={{ fontWeight: 600 }}>What you can do: </span>
          {parallel.call_to_action}
        </div>
      </div>
    </div>
  )
}
