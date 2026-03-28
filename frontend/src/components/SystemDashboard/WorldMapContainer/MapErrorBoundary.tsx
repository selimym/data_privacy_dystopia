import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="map-error"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'var(--bg-primary)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-red)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            ✕ SATELLITE FEED UNAVAILABLE
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              opacity: 0.6,
            }}
          >
            LOCAL NETWORK ERROR — FALLBACK TO CASE REVIEW
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
