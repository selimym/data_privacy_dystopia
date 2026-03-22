import Phaser from 'phaser'
import type { NPCDisplayData } from '../types'

const TILE_SIZE = 32

// Tint colors
const TINT_FLAGGED = 0xff4444
const TINT_HIGHLIGHTED = 0x4444ff

interface WorldEvents extends EventTarget {}

function getWorldEvents(): WorldEvents | null {
  return ((window as unknown as Record<string, unknown>).__worldEvents as WorldEvents) ?? null
}

export class WorldMapScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap
  private npcSprites: Map<string, Phaser.GameObjects.Sprite> = new Map()
  private npcData: Map<string, NPCDisplayData> = new Map()
  private started = false

  // Drag-to-pan state
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private camStartX = 0
  private camStartY = 0

  // Event listeners (stored for cleanup)
  private onNpcsUpdate!: (e: Event) => void
  private onPanTo!: (e: Event) => void
  private onHighlightNpc!: (e: Event) => void

  constructor() {
    super({ key: 'WorldMapScene' })
  }

  create() {
    // StrictMode guard — prevent double init
    if (this.started) return
    this.started = true

    this.createMap()
    this.setupCamera()
    this.setupDragPan()
    this.setupEventListeners()
  }

  private createMap() {
    this.map = this.make.tilemap({ key: 'town' })

    const tilesetNames = [
      ['hospital_interior', 'hospital_interior'],
      ['office_interior', 'office_interior'],
      ['residential_interior', 'residential_interior'],
      ['commercial_interior', 'commercial_interior'],
      ['outdoor_ground', 'outdoor_ground'],
      ['outdoor_nature', 'outdoor_nature'],
      ['walls_doors', 'walls_doors'],
      ['furniture_objects', 'furniture_objects'],
    ]

    const tilesets = tilesetNames
      .map(([name, key]) => this.map.addTilesetImage(name, key))
      .filter((t): t is Phaser.Tilemaps.Tileset => t !== null)

    const layerNames = [
      '1_Floor',
      '2_Walls_Base',
      '3_Furniture_Low',
      '4_Furniture_Mid',
      '5_Furniture_High',
      '6_Objects',
    ]

    const depths = [0, 10, 50, 150, 200, 250]

    layerNames.forEach((name, i) => {
      const layer = this.map.createLayer(name, tilesets, 0, 0)
      if (layer) layer.setDepth(depths[i])
    })
  }

  private setupCamera() {
    const mapWidth = this.map.widthInPixels
    const mapHeight = this.map.heightInPixels

    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)

    // Start centered on the map
    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2)

    // Handle resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.cameras.resize(gameSize.width, gameSize.height)
    })
  }

  private setupDragPan() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true
      this.dragStartX = pointer.x
      this.dragStartY = pointer.y
      this.camStartX = this.cameras.main.scrollX
      this.camStartY = this.cameras.main.scrollY
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return
      const dx = (pointer.x - this.dragStartX) / this.cameras.main.zoom
      const dy = (pointer.y - this.dragStartY) / this.cameras.main.zoom
      this.cameras.main.setScroll(this.camStartX - dx, this.camStartY - dy)
    })

    this.input.on('pointerup', () => {
      this.isDragging = false
    })

    this.input.on('pointerout', () => {
      this.isDragging = false
    })
  }

  private setupEventListeners() {
    const events = getWorldEvents()
    if (!events) return

    this.onNpcsUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ npcs: NPCDisplayData[] }>).detail
      if (detail?.npcs) this.syncNPCs(detail.npcs)
    }

    this.onPanTo = (e: Event) => {
      const detail = (e as CustomEvent<{ x: number; y: number; zoom?: number }>).detail
      if (!detail) return
      const worldX = detail.x * TILE_SIZE + TILE_SIZE / 2
      const worldY = detail.y * TILE_SIZE + TILE_SIZE / 2
      this.cameras.main.pan(worldX, worldY, 800, 'Power2')
      if (detail.zoom !== undefined) {
        this.cameras.main.zoomTo(detail.zoom, 800)
      }
    }

    this.onHighlightNpc = (e: Event) => {
      const detail = (e as CustomEvent<{ citizen_id: string | null }>).detail
      if (!detail) return
      this.highlightNPC(detail.citizen_id)
    }

    events.addEventListener('npcs-update', this.onNpcsUpdate)
    events.addEventListener('pan-to', this.onPanTo)
    events.addEventListener('highlight-npc', this.onHighlightNpc)
  }

  private syncNPCs(npcs: NPCDisplayData[]) {
    const incomingIds = new Set(npcs.map(n => n.citizen_id))

    // Remove sprites for NPCs no longer in the list
    for (const [id, sprite] of this.npcSprites) {
      if (!incomingIds.has(id)) {
        sprite.destroy()
        this.npcSprites.delete(id)
        this.npcData.delete(id)
      }
    }

    // Create or update each NPC
    for (const npc of npcs) {
      const worldX = npc.map_x * TILE_SIZE + TILE_SIZE / 2
      const worldY = npc.map_y * TILE_SIZE + TILE_SIZE / 2

      let sprite = this.npcSprites.get(npc.citizen_id)

      if (!sprite) {
        // Create new sprite
        sprite = this.add.sprite(worldX, worldY, npc.sprite_key)
        sprite.setDepth(100)

        // Scale to fit 32×32 display
        const naturalWidth = sprite.width || TILE_SIZE
        const scale = TILE_SIZE / naturalWidth
        sprite.setScale(scale)

        // Play idle animation if available
        const idleAnim = `${npc.sprite_key}_idle_down`
        if (this.anims.exists(idleAnim)) {
          sprite.play(idleAnim)
        }

        sprite.setInteractive({ useHandCursor: false })
        this.npcSprites.set(npc.citizen_id, sprite)
      } else {
        // Update position if changed
        sprite.setPosition(worldX, worldY)
      }

      // Apply tint based on state
      this.applyNPCTint(sprite, npc)
      this.npcData.set(npc.citizen_id, npc)
    }
  }

  private applyNPCTint(sprite: Phaser.GameObjects.Sprite, npc: NPCDisplayData) {
    if (npc.is_highlighted) {
      sprite.setTint(TINT_HIGHLIGHTED)
    } else if (npc.is_flagged) {
      sprite.setTint(TINT_FLAGGED)
    } else {
      sprite.clearTint()
    }
  }

  private highlightNPC(citizenId: string | null) {
    // Update all sprites based on new highlight state
    for (const [id, sprite] of this.npcSprites) {
      const data = this.npcData.get(id)
      if (!data) continue

      const isHighlighted = id === citizenId
      this.applyNPCTint(sprite, { ...data, is_highlighted: isHighlighted })
    }

    // Pan camera to highlighted NPC
    if (citizenId) {
      const data = this.npcData.get(citizenId)
      if (data) {
        const worldX = data.map_x * TILE_SIZE + TILE_SIZE / 2
        const worldY = data.map_y * TILE_SIZE + TILE_SIZE / 2
        this.cameras.main.pan(worldX, worldY, 600, 'Power2')
      }
    }
  }

  shutdown() {
    const events = getWorldEvents()
    if (events) {
      events.removeEventListener('npcs-update', this.onNpcsUpdate)
      events.removeEventListener('pan-to', this.onPanTo)
      events.removeEventListener('highlight-npc', this.onHighlightNpc)
    }
  }
}
