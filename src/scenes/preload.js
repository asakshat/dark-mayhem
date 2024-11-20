import { createAnimations } from "../animations/animations";
import { createSkeletonAnimations } from "../animations/skeletonAnimations";
import { createOrcAnimations } from "../animations/orcAnimation";

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            this.game.config.width / 4,
            this.game.config.height / 2 - 30,
            this.game.config.width / 2,
            60
        );

        const loadingText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 - 50,
            'Loading...',
            {
                fontSize: '32px',
                fill: '#fff'
            }
        ).setOrigin(0.5);

        const percentText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            '0%',
            {
                fontSize: '18px',
                fill: '#fff'
            }
        ).setOrigin(0.5);

        const assetText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 + 50,
            '',
            {
                fontSize: '18px',
                fill: '#fff'
            }
        ).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(
                this.game.config.width / 4 + 10,
                this.game.config.height / 2 - 20,
                (this.game.config.width / 2 - 20) * value,
                40
            );
            percentText.setText(`${parseInt(value * 100)}%`);
        });

        this.load.on('fileprogress', (file) => {
            assetText.setText(`Loading asset: ${file.key}`);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();

            // Create animations
            createAnimations(this);
            createSkeletonAnimations(this);
            createOrcAnimations(this);

            this.scene.start('MenuScene');
        });

        this.load.atlas('orc_base', '/assets/enemies/orc_spritesheets.png', '/assets/enemies/orc_spritesheets_atlas.json');
        this.load.atlas('skeleton_base', '/assets/enemies/skel_sprites.png', '/assets/enemies/skel_sprites_atlas.json');
        this.load.atlas('playerChar', '/assets/newspritesheet.png', '/assets/newspritesheet_atlas.json', {
            premultiplyAlpha: false,
            flipY: false
        });
        this.load.image('dungeon-tileset', '/assets/dungeon-tileset.png');
        this.load.image('tiles', '/assets/tiles.png');
        this.load.image('props', '/assets/props.png');
        this.load.tilemapTiledJSON('tiles', '/assets/tiles.tmj');
        this.load.audio('bgMusic', ['public/assets/audio/Goblins_Dance_(Battle).ogg', 'public/assets/audio/Goblins_Dance_(Battle).mp3']);
        this.load.audio('playerDeathAudio', ['public/assets/audio/sfx/Female painscream sound Effects.ogg', 'public/assets/audio/sfx/Female painscream sound Effects.mp3']);
        this.load.audioSprite('playersfx', 'public/assets/audio/sfx/spriteAudioGamma.json', ['public/assets/audio/sfx/spriteAudioGamma.mp3', 'public/assets/audio/sfx/spriteAudioGamma.ogg']);
    }
}