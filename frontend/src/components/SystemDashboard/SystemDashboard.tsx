import '@/styles/dashboard.css'

import { useCallback, useRef, useState } from 'react'
import { CinematicOverlay, ShiftMemoOverlay, InferenceRulesEditor, MemoArchiveModal } from '@/components/shared'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

const QUEUE_MIN = 160
const QUEUE_MAX = 480
const RIGHT_MIN = 240
const RIGHT_MAX = 560

function PanelResizer({
  side,
  width,
  onWidthChange,
  min,
  max,
}: {
  side: 'left' | 'right'
  width: number
  onWidthChange: (w: number) => void
  min: number
  max: number
}) {
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)
  const elRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    elRef.current?.classList.add('resizing')

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = side === 'left' ? ev.clientX - startX.current : startX.current - ev.clientX
      const next = Math.max(min, Math.min(max, startW.current + delta))
      onWidthChange(next)
    }
    const onUp = () => {
      dragging.current = false
      elRef.current?.classList.remove('resizing')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [side, width, onWidthChange, min, max])

  return (
    <div
      ref={elRef}
      className="panel-resizer"
      onMouseDown={handleMouseDown}
      style={{ [side === 'left' ? 'right' : 'left']: -3 }}
    />
  )
}
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
import { NewsTicker } from './NewsTicker/NewsTicker'
import { ProtestBanner } from './ProtestBanner/ProtestBanner'
import { NewsImagePanel } from './NewsImagePanel/NewsImagePanel'

export default function SystemDashboard() {
  const currentView = useUIStore(s => s.currentView)
  const queueCollapsed = useUIStore(s => s.queueCollapsed)
  const memoAcknowledged = useUIStore(s => s.memoAcknowledged)
  const tutorialStep = useUIStore(s => s.tutorialStep)
  const weekNumber = useGameStore(s => s.weekNumber)
  const flags = useGameStore(s => s.flags)
  const currentDirective = useGameStore(s => s.currentDirective)
  const isSweep = (currentDirective?.directive_type ?? 'review') === 'sweep'

  const [queueWidth, setQueueWidth] = useState(() => {
    const saved = localStorage.getItem('panel-queue-width')
    return saved ? parseInt(saved, 10) : 275
  })
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('panel-right-width')
    return saved ? parseInt(saved, 10) : 375
  })

  const handleQueueResize = useCallback((w: number) => {
    setQueueWidth(w)
    localStorage.setItem('panel-queue-width', String(w))
  }, [])
  const handleRightResize = useCallback((w: number) => {
    setRightWidth(w)
    localStorage.setItem('panel-right-width', String(w))
  }, [])

  // Show memo on very first game start (week 1, no flags yet, never acknowledged).
  // Skip in automated test environments (Playwright sets navigator.webdriver = true).
  const isFirstStart = weekNumber === 1 && flags.length === 0
  const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver
  if (!memoAcknowledged && isFirstStart && !isAutomated) {
    return <MemoScreen />
  }

  const effectiveQueueWidth = queueCollapsed ? 36 : queueWidth

  return (
    <div
      className="dashboard-layout"
      data-collapsed={queueCollapsed ? 'true' : 'false'}
      style={{
        '--queue-width': `${effectiveQueueWidth}px`,
        '--right-width': `${rightWidth}px`,
      } as React.CSSProperties}
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
            {!queueCollapsed && (
              <PanelResizer
                side="left"
                width={queueWidth}
                onWidthChange={handleQueueResize}
                min={QUEUE_MIN}
                max={QUEUE_MAX}
              />
            )}
          </aside>
          <main className="dashboard-center" data-tutorial-panel="center">
            <DirectiveBanner />
            <ProtestBanner />
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
        <PanelResizer
          side="right"
          width={rightWidth}
          onWidthChange={handleRightResize}
          min={RIGHT_MIN}
          max={RIGHT_MAX}
        />
        <div className="dashboard-right-content">
          <DirectivePanel />
          <MetricsPanel />
          <AlertsPanel />
        </div>
        <NewsImagePanel />
      </aside>

      {/* ── Tutorial overlay ── */}
      {tutorialStep !== null && <TutorialOverlay />}

      {/* ── News ticker — bottom strip, all views ── */}
      <NewsTicker />

      <ShiftMemoOverlay />
      <CinematicOverlay />
      <InferenceRulesEditor />
      <MemoArchiveModal />
    </div>
  )
}
