import './style.css';
import Phaser from 'phaser';
import PhaserMatterCollisionPlugin from 'phaser-matter-collision-plugin';
import MenuScene from './scenes/menuScene';
import MainScene from './scenes/mainScene';
import PreloadScene from './scenes/preload';
import GameOverScene from './scenes/GameoverScene';
import LevelUpScene from './scenes/LevelupScene';
import OptionsScene from './scenes/Options';


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
  canvas: gameCanvas,
  scene: [PreloadScene, MenuScene, MainScene, LevelUpScene, GameOverScene, OptionsScene], scale: {
    zoom: 1,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false,
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

export { game };