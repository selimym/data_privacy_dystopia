import { Suspense, lazy } from 'react'

// Screens — lazily loaded to keep initial bundle small
const StartScreen = lazy(() => import('./components/StartScreen/StartScreen'))
const SystemDashboard = lazy(() => import('./components/SystemDashboard/SystemDashboard'))
const EndingScreen = lazy(() => import('./components/EndingScreen/EndingScreen'))

// Placeholder store hook — replaced in Phase 4 with real Zustand store
function useCurrentScreen(): 'start' | 'dashboard' | 'ending' {
  return 'start'
}

function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0d0d0f',
        color: '#6b7280',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px',
        letterSpacing: '0.1em',
      }}
    >
      LOADING CIVIC HARMONY PLATFORM...
    </div>
  )
}

export default function App() {
  const screen = useCurrentScreen()

  return (
    <Suspense fallback={<LoadingFallback />}>
      {screen === 'start' && <StartScreen />}
      {screen === 'dashboard' && <SystemDashboard />}
      {screen === 'ending' && <EndingScreen />}
    </Suspense>
  )
}
