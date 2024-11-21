import './style.css';
import Phaser from 'phaser';
import PhaserMatterCollisionPlugin from 'phaser-matter-collision-plugin';
import MenuScene from './scenes/menuScene';
import MainScene from './scenes/mainScene';
import PreloadScene from './scenes/preload';
import ReactOverlay from './ReactOverlay';
import GameOverScene from './scenes/GameoverScene';

const gameContainer = document.createElement('div');
gameContainer.id = 'game-container';
gameContainer.style.position = 'relative';
document.body.appendChild(gameContainer);

const sizes = {
  width: 1200,
  height: 600,
};

const config = {
  type: Phaser.WEBGL,
  audio: {
    disableWebAudio: false
  },
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  width: sizes.width,
  height: sizes.height,
  parent: 'game-container',
  canvas: gameCanvas,
  scene: [PreloadScene, MenuScene, MainScene, GameOverScene],
  scale: {
    zoom: 1,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: true,
    }
  },
  plugins: {
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin,
        key: 'matterCollision',
        mapping: 'matterCollision'
      }
    ]
  },
};

const game = new Phaser.Game(config);
const overlay = new ReactOverlay();

export { game, overlay };