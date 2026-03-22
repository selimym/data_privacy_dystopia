import * as Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { WorldMapScene } from './scenes/WorldMapScene'

export function createWorldMapGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.offsetWidth,
    height: parent.offsetHeight,
    backgroundColor: '#0d0d0f',
    scene: [PreloadScene, WorldMapScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
  })
}
