import Player from "../sprites/Player";
import WaveManager from "../WaveManager";
import UIManager from "../UImanager";
import SpellManager from "../spells/spellUtils/SpellManager";
import { AutoAttackSystem } from "../spells/spellUtils/system/AutoAttackSystem";


export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.initializeProperties();
    }
    init(data) {
        console.log('Initializing MainScene:', data);
        this.cleanupPhysics();
        this.initializeProperties();
    }
    cleanupPhysics() {
        if (this.matter && this.matter.world) {
            const bodies = this.matter.world.getAllBodies();
            bodies.forEach(body => {
                this.matter.world.remove(body);
            });

            this.matter.world.resetCollisionIDs();
        }
    }
    restartGame() {
        this.scene.stop('MainScene');

        this.scene.start('MainScene', { isRestart: true });
    }

    initializeProperties() {
        this.state = {
            totalEnemiesKilled: 0,
            currentWaveEnemiesKilled: 0,
            isGameOver: false,
            autoAttackEnabled: true
        };

        this.systems = {};
        this.uiManager = new UIManager();
        this.player = null;
        this.waveManager = null;
        this.mapDimensions = null;
        this.audio = {
            bgMusic: null,
            deathSound: null
        };
    }


    create() {
        this.setupSystems();
        this.mapDimensions = this.createMap();
        this.createPlayer();
        this.setupAudio();
        this.setupWaveManager();
        this.setupCollisions();
        this.setupEventListeners();
        this.setupPlayerInput();
        this.updateUI();

        console.log('Auto Attack Enabled:', this.state.autoAttackEnabled);


    }



    setupSystems() {
        this.systems = {
            spell: new SpellManager(this),
            autoAttack: new AutoAttackSystem(this, {
                range: 300,
                spellType: 'ArcaneBolt'
            })
        };
    }

    setupAudio() {
        this.audio.bgMusic = this.sound.add('bgMusic', {
            loop: true,
            volume: 0.8
        });

        this.audio.deathSound = this.sound.add('playerDeathAudio', {
            loop: false,
            volume: 0.6
        });

        this.audio.bgMusic.play();
    }

    createMap() {
        const map = this.make.tilemap({ key: 'tiles' });
        const dungeonTileset = map.addTilesetImage('Dungeon tileset', 'dungeon-tileset', 16, 16, 0, 0);
        const tilesTileset = map.addTilesetImage('Tiles', 'tiles', 16, 16, 0, 0);
        const propsTileset = map.addTilesetImage('Props', 'props', 16, 16, 0, 0);

        const tileSets = [dungeonTileset, tilesTileset, propsTileset];

        map.createLayer('ground_tiles', tileSets, 0, 0);
        const base = map.createLayer('base', tileSets, 0, 0);
        map.createLayer('objects', tileSets, 0, 0);

        base.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(base);

        const dimensions = {
            width: map.widthInPixels,
            height: map.heightInPixels
        };

        this.cameras.main.setBounds(0, 0, dimensions.width, dimensions.height);
        this.cameras.main.setBackgroundColor('#362336');

        return dimensions;
    }

    createPlayer() {
        if (!this.mapDimensions) return;
        if (this.player) {
            this.player.destroy();
        }
        this.player = new Player({
            scene: this,
            x: this.mapDimensions.width / 2,
            y: this.mapDimensions.height / 2,
            texture: 'playerChar',
            frame: 'idle000'
        });
        this.player.play('idle');
    }

    setupWaveManager() {
        if (!this.mapDimensions) return;

        this.waveManager = new WaveManager(this, {
            initialEnemies: 200,
            enemiesIncreasePerWave: 2,
            timeBetweenWaves: 10000,
            spawnDelay: 200
        });
        this.waveManager.setMapBounds(this.mapDimensions.width, this.mapDimensions.height);
    }

    setupCollisions() {
        this.matter.world.off('collisionstart');
        this.matter.world.on('collisionstart', (event) => {
            if (this.state.isGameOver) return;

            event.pairs.forEach((pair) => {
                this.handleCollision(pair.bodyA, pair.bodyB);
            });
        });
    }

    handleCollision(bodyA, bodyB) {
        if (this.isPlayerEnemyCollision(bodyA, bodyB)) {
            const enemy = this.getEnemyFromCollision(bodyA, bodyB);
            if (enemy?.damage) {
                this.player.takeDamage(enemy.damage);
                if (this.player.currentHealth <= 0 && !this.state.isGameOver) {
                    this.handlePlayerDeath();
                }
            }
        }

        if (this.isSpellEnemyCollision(bodyA, bodyB)) {
            const { spell, enemy } = this.getSpellAndEnemyFromCollision(bodyA, bodyB);
            if (spell && enemy && enemy.active) {
                spell.handleCollision(enemy);
            }
        }
    }

    setupEventListeners() {
        this.events.off('playerDied').off('enemyDied').off('playerHealthChanged');

        this.events.on('playerDied', this.handlePlayerDeath, this);
        this.events.on('enemyDied', () => {
            this.state.totalEnemiesKilled++;
            this.state.currentWaveEnemiesKilled++;
            this.updateUI();
        });

        this.events.on('playerHealthChanged', () => this.updateUI());
    }

    setupPlayerInput() {
        this.player.inputKeys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            upArrow: 'UP',
            downArrow: 'DOWN',
            leftArrow: 'LEFT',
            rightArrow: 'RIGHT'
        });
    }

    handlePlayerDeath() {
        if (this.state.isGameOver) return;

        this.state.isGameOver = true;
        this.stopGameplay();
        this.fadeOutBackgroundMusic();
        this.clearEnemies();
        this.player.setDepth(600);
        this.audio.deathSound?.play();
        this.player.play('death', true);
        this.startDeathTransition();
    }

    fadeOutBackgroundMusic() {
        if (this.audio.bgMusic) {
            this.tweens.add({
                targets: this.audio.bgMusic,
                volume: 0,
                duration: 500
            });
        }
    }

    startDeathTransition() {
        const darkness = this.add.rectangle(0, 0, this.scale.width * 2, this.scale.height * 2, 0x000000, 0.5)
            .setDepth(500)
            .setScrollFactor(0)
            .setOrigin(0, 0)
            .setAlpha(0);

        this.tweens.add({
            targets: darkness,
            alpha: 1,
            duration: 3000,
            onComplete: () => {
                this.time.timeScale = 1;
                this.scene.start('GameOverScene', {
                    totalKills: this.state.totalEnemiesKilled,
                    wavesCompleted: this.waveManager.currentWave - 1
                });
            }
        });
    }

    stopGameplay() {
        if (this.player) {
            this.player.inputKeys = null;
            this.player.isMovingToMouse = false;
            this.player.setVelocity(0, 0);
            this.player.setStatic(true);
        }

        if (this.waveManager) {
            this.waveManager.isWaveActive = false;
            this.waveManager.enabled = false;
        }

        this.time.timeScale = 0.2;
        this.state.autoAttackEnabled = false;
    }

    clearEnemies(radius = 800) {
        this.waveManager.enemyPool.pool.forEach(enemies => {
            enemies.forEach(enemy => {
                if (!enemy.active) return;

                const distanceToPlayer = Phaser.Math.Distance.Between(
                    enemy.x, enemy.y,
                    this.player.x, this.player.y
                );

                if (distanceToPlayer < radius) {
                    enemy.setAlpha(0);
                } else {
                    enemy.setStatic(true).setVelocity(0, 0);
                    enemy.anims.stop();
                }
                enemy.active = false;
            });
        });
    }

    update(time) {
        if (this.state.isGameOver) return;

        this.player?.update();
        this.waveManager?.update();
        this.updateCamera();
        this.updateUI();

        // Update game systems
        Object.values(this.systems).forEach(system => {
            if (system.update) {
                system.update(time);
            }
        });
    }

    updateCamera() {
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setLerp(0.1, 0.1);
        this.cameras.main.setZoom(1.3);
    }

    updateUI() {
        this.uiManager.updateUI({
            currentScene: 'MainScene',
            player: this.player,
            totalEnemiesKilled: this.state.totalEnemiesKilled
        });
    }

    isSpellEnemyCollision(bodyA, bodyB) {
        return (bodyA.label === 'spellCollider' && bodyB.label === 'EnemyCollider') ||
            (bodyB.label === 'spellCollider' && bodyA.label === 'EnemyCollider');
    }

    isPlayerEnemyCollision(bodyA, bodyB) {
        return (bodyA.label === 'playerCollider' && bodyB.label === 'EnemyCollider') ||
            (bodyB.label === 'playerCollider' && bodyA.label === 'EnemyCollider');
    }

    getEnemyFromCollision(bodyA, bodyB) {
        return bodyA.label === 'EnemyCollider' ? bodyA.gameObject : bodyB.gameObject;
    }

    getSpellAndEnemyFromCollision(bodyA, bodyB) {
        if (bodyA.label === 'spellCollider' && bodyB.label === 'EnemyCollider') {
            return { spell: bodyA.gameObject, enemy: bodyB.gameObject };
        }
        return { spell: bodyB.gameObject, enemy: bodyA.gameObject };
    }

    shutdown() {
        console.log('Shutting down MainScene');

        // Cleanup physics first
        this.cleanupPhysics();

        // Stop audio
        Object.values(this.audio).forEach(sound => {
            if (sound?.stop) sound.stop();
        });

        // Cleanup systems
        Object.values(this.systems).forEach(system => {
            if (system.shutdown) {
                system.shutdown();
            }
        });

        // Cleanup UI
        if (this.uiManager?.destroy) {
            this.uiManager.destroy();
        }

        // Remove event listeners
        this.events.off('playerDied');
        this.events.off('enemyDied');
        this.events.off('playerHealthChanged');
        this.matter.world.off('collisionstart');

        // Cleanup wave manager
        if (this.waveManager) {
            this.waveManager.spatialGrid?.clear();
            if (this.waveManager.enemyPool?.pool) {
                this.waveManager.enemyPool.pool.forEach(enemies => {
                    enemies.forEach(enemy => {
                        if (enemy.active) {
                            enemy.destroy();
                        }
                    });
                });
            }
        }

        // Destroy player if it exists
        if (this.player) {
            this.player.destroy();
        }

        // Null out references
        this.player = null;
        this.waveManager = null;
        this.systems = {};
    }
}