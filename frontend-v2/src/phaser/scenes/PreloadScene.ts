import Phaser from 'phaser'

const TILE_SIZE = 32

const SPRITE_KEYS = [
  'citizen_male_01',
  'citizen_male_02',
  'citizen_male_03',
  'citizen_female_01',
  'citizen_female_02',
  'citizen_female_03',
  'doctor_male_01',
  'doctor_female_01',
  'nurse_female_01',
  'office_worker_male_01',
  'office_worker_female_01',
  'employee_01',
  'official_01',
  'analyst_01',
]

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // Load tileset images
    this.load.image('hospital_interior', '/assets/tilesets/hospital_interior.png')
    this.load.image('office_interior', '/assets/tilesets/office_interior.png')
    this.load.image('residential_interior', '/assets/tilesets/residential_interior.png')
    this.load.image('commercial_interior', '/assets/tilesets/commercial_interior.png')
    this.load.image('outdoor_ground', '/assets/tilesets/outdoor_ground.png')
    this.load.image('outdoor_nature', '/assets/tilesets/outdoor_nature.png')
    this.load.image('walls_doors', '/assets/tilesets/walls_doors.png')
    this.load.image('furniture_objects', '/assets/tilesets/furniture_objects.png')

    // Load NPC spritesheets (32x32 per frame, 4 rows × 4 frames = 128×128 total)
    SPRITE_KEYS.forEach((key) => {
      this.load.spritesheet(key, `/assets/characters/${key}.png`, {
        frameWidth: TILE_SIZE,
        frameHeight: TILE_SIZE,
      })
    })

    // Load tilemap JSON
    this.load.tilemapTiledJSON('town', '/assets/maps/town.json')
  }

  create() {
    this.createCharacterAnimations()
    this.scene.start('WorldMapScene')
  }

  private createCharacterAnimations() {
    const directions = ['down', 'left', 'right', 'up']

    SPRITE_KEYS.forEach((key) => {
      directions.forEach((dir, rowIndex) => {
        // Walk animation: 4 frames per direction row
        this.anims.create({
          key: `${key}_walk_${dir}`,
          frames: this.anims.generateFrameNumbers(key, {
            start: rowIndex * 4,
            end: rowIndex * 4 + 3,
          }),
          frameRate: 8,
          repeat: -1,
        })

        // Idle animation: single frame (middle of walk cycle)
        this.anims.create({
          key: `${key}_idle_${dir}`,
          frames: [{ key, frame: rowIndex * 4 + 1 }],
          frameRate: 1,
        })
      })
    })
  }
}
