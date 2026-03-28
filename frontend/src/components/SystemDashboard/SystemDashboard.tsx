import '@/styles/dashboard.css'

import { CinematicOverlay, ShiftMemoOverlay, InferenceRulesEditor } from '@/components/shared'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import MemoScreen from '@/components/MemoScreen/MemoScreen'
import TopBar from './Header/TopBar'
import ContractBanner from './Header/ContractBanner'
import AutoFlagBanner from './Header/AutoFlagBanner'
import { TutorialOverlay } from './TutorialOverlay/TutorialOverlay'
import { CitizenQueue } from './CitizenQueue/CitizenQueue'
import { CitizenPanel } from './CitizenPanel/CitizenPanel'
import { DirectivePanel } from './DirectivePanel/DirectivePanel'
import { DirectiveBanner } from './DirectivePanel/DirectiveBanner'
import { MetricsPanel } from './MetricsPanel/MetricsPanel'
import { AlertsPanel } from './AlertsPanel/AlertsPanel'
import { NewsPanel } from './NewsPanel/NewsPanel'
import WorldMapContainer from './WorldMapContainer/WorldMapContainer'
import { MapErrorBoundary } from './WorldMapContainer/MapErrorBoundary'
import { NeighborhoodSweepPanel } from './NeighborhoodSweepPanel/NeighborhoodSweepPanel'
import { SweepStatusPanel } from './SweepStatusPanel/SweepStatusPanel'

export default function SystemDashboard() {
  const currentView = useUIStore(s => s.currentView)
  const queueCollapsed = useUIStore(s => s.queueCollapsed)
  const memoAcknowledged = useUIStore(s => s.memoAcknowledged)
  const tutorialStep = useUIStore(s => s.tutorialStep)
  const weekNumber = useGameStore(s => s.weekNumber)
  const flags = useGameStore(s => s.flags)
  const currentDirective = useGameStore(s => s.currentDirective)
  const isSweep = (currentDirective?.directive_type ?? 'review') === 'sweep'

  // Show memo on very first game start (week 1, no flags yet, never acknowledged).
  // Skip in automated test environments (Playwright sets navigator.webdriver = true).
  const isFirstStart = weekNumber === 1 && flags.length === 0
  const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver
  if (!memoAcknowledged && isFirstStart && !isAutomated) {
    return <MemoScreen />
  }

  return (
    <div
      className="dashboard-layout"
      data-collapsed={queueCollapsed ? 'true' : 'false'}
    >
      {/* ── Header ── */}
      <header className="dashboard-header">
        <TopBar />
        <ContractBanner />
        <AutoFlagBanner />
      </header>

      {/* ── Case Review view ── */}
      {currentView === 'case-review' && (
        <>
          <aside className="dashboard-left" data-tutorial-panel="left">
            {isSweep ? <SweepStatusPanel /> : <CitizenQueue />}
          </aside>
          <main className="dashboard-center" data-tutorial-panel="center">
            <DirectiveBanner />
            {isSweep ? <NeighborhoodSweepPanel /> : <CitizenPanel />}
          </main>
        </>
      )}

      {/* ── News Feed view ── */}
      {currentView === 'news-feed' && (
        <div className="dashboard-full-view">
          <NewsPanel />
        </div>
      )}

      {/* ── World Map view ── */}
      {currentView === 'world-map' && (
        <div className="dashboard-full-view">
          <MapErrorBoundary>
            <WorldMapContainer />
          </MapErrorBoundary>
        </div>
      )}

      {/* ── Right panel: always visible ── */}
      <aside className="dashboard-right" data-tutorial-panel="right">
        <DirectivePanel />
        <MetricsPanel />
        <AlertsPanel />
      </aside>

      {/* ── Tutorial overlay ── */}
      {tutorialStep !== null && <TutorialOverlay />}

      <ShiftMemoOverlay />
      <CinematicOverlay />
      <InferenceRulesEditor />
    </div>
  )
}
