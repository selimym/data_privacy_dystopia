import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n'
import './styles/global.css'
import './styles/cinematic.css'
import './styles/system-effects.css'

// Expose initializeGame on window in DEV for Playwright E2E tests
if (import.meta.env.DEV) {
  import('./services/GameOrchestrator').then(({ initializeGame }) => {
    ;(window as unknown as Record<string, unknown>).__initializeGame = initializeGame
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
