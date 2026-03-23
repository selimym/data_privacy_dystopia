/**
 * WorldMapContainer — mounts Phaser lazily on first navigation to the World Map view.
 * The game instance persists across view switches (hidden via display:none when inactive).
 * Auto-transitions back from world-map view happen via protest events in gameStore.
 */
import { useEffect, useRef, useState } from 'react'
import type * as Phaser from 'phaser'
import { useCitizenStore } from '@/stores/citizenStore'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { createWorldMapGame } from '@/phaser/WorldMapGame'
import type { NPCDisplayData } from '@/phaser/types'

type WindowWithEvents = Window & { __worldEvents?: EventTarget }

function getOrCreateEventBus(): EventTarget {
  const win = window as WindowWithEvents
  if (!win.__worldEvents) {
    win.__worldEvents = new EventTarget()
  }
  return win.__worldEvents
}

export function WorldMapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const startedRef = useRef(false)
  const [initialized, setInitialized] = useState(false)

  const currentView = useUIStore(s => s.currentView)
  const skeletons = useCitizenStore(s => s.skeletons)
  const flags = useGameStore(s => s.flags)
  const selectedCitizenId = useUIStore(s => s.selectedCitizenId)
  const currentCinematic = useUIStore(s => s.currentCinematic)

  // Lazy-init Phaser on first visit to world-map view
  useEffect(() => {
    if (currentView !== 'world-map') return
    if (!containerRef.current || startedRef.current) return
    startedRef.current = true
    getOrCreateEventBus()
    gameRef.current = createWorldMapGame(containerRef.current)
    setInitialized(true)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [currentView])

  // Sync NPCs when skeletons or flags change
  useEffect(() => {
    if (!initialized || skeletons.length === 0) return
    const events = getOrCreateEventBus()
    const flaggedIds = new Set(flags.map(f => f.citizen_id))
    const npcs: NPCDisplayData[] = skeletons.map(s => ({
      citizen_id: s.id,
      sprite_key: s.sprite_key,
      map_x: s.map_x,
      map_y: s.map_y,
      is_flagged: flaggedIds.has(s.id),
      is_highlighted: s.id === selectedCitizenId,
    }))
    const event = Object.assign(new Event('npcs-update'), { detail: { npcs } })
    events.dispatchEvent(event)
  }, [initialized, skeletons, flags, selectedCitizenId])

  // Pan camera when cinematic fires
  useEffect(() => {
    if (!currentCinematic?.pan_to) return
    const events = getOrCreateEventBus()
    const event = Object.assign(new Event('pan-to'), { detail: currentCinematic.pan_to })
    events.dispatchEvent(event)
  }, [currentCinematic])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      data-testid="world-map-container"
    />
  )
}

export default WorldMapContainer
