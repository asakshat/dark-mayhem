import Player from "../sprites/Player";
import WaveManager from "../WaveManager";
import SpellManager from "../spells/spellUtils/SpellManager";
import { AutoAttackSystem } from "../spells/spellUtils/system/AutoAttackSystem";
import { MeteorSystem } from "../Hazards/Meteor";
import { SpellProgress } from "../spells/spellUtils/SpellManager";


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
        this.player = null;
        this.waveManager = null;
        this.mapDimensions = null;
        this.audio = {
            bgMusic: null,
            deathSound: null
        };

        this.ui = {
            healthBar: null,
            xpBar: null,
            killCounter: null,
            levelText: null
        };
    }

    createUI() {
        // (Create) a UI container that stays fixed to the camera
        const uiContainer = this.add.container(120, 50);
        uiContainer.setScrollFactor(0);

        // Health Bar
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        const healthBarX = 20;
        const healthBarY = 20;

        // Health bar background
        this.ui.healthBarBg = this.add.rectangle(
            healthBarX,
            healthBarY,
            healthBarWidth,
            healthBarHeight,
            0x000000,
            0.7
        ).setOrigin(0);

        // Health bar fill
        this.ui.healthBar = this.add.rectangle(
            healthBarX,
            healthBarY,
            healthBarWidth,
            healthBarHeight,
            0xff0000,
            1
        ).setOrigin(0);

        // XP Bar
        const xpBarWidth = 300;
        const xpBarHeight = 10;
        const xpBarX = 20;
        const xpBarY = 50;

        // XP bar background
        this.ui.xpBarBg = this.add.rectangle(
            xpBarX,
            xpBarY,
            xpBarWidth,
            xpBarHeight,
            0x000000,
            0.7
        ).setOrigin(0);

        // XP bar fill
        this.ui.xpBar = this.add.rectangle(
            xpBarX,
            xpBarY,
            xpBarWidth,
            xpBarHeight,
            0x3168D3,

        ).setOrigin(0);

        // Level Text
        this.ui.levelText = this.add.text(
            20,
            70,
            'Level: 1',
            {
                fontSize: '24px',
                fontFamily: 'CustomPixelFont',
                color: '#ffffff'
            }
        );

        // Kill Counter
        this.ui.killCounter = this.add.text(
            this.scale.width - 20,
            20,
            'Kills: 0',
            {
                fontSize: '24px',
                fontFamily: 'CustomPixelFont',
                color: '#ffffff'
            }
        ).setOrigin(1, 0);

        // Add all UI elements to the container
        uiContainer.add([
            this.ui.healthBarBg,
            this.ui.healthBar,
            this.ui.xpBarBg,
            this.ui.xpBar,
            this.ui.levelText,
            this.ui.killCounter
        ]);

        // Set UI depth to ensure it's always on top
        uiContainer.setDepth(1000);
    }
    updateUI() {
        if (!this.player || !this.ui.healthBar) return;

        // Update health bar
        const healthBarWidth = 200;
        const healthPercent = this.player.currentHealth / this.player.maxHealth;
        this.ui.healthBar.width = healthBarWidth * healthPercent;
        this.ui.healthText?.destroy();
        this.ui.healthText = this.add.text(
            230, // Position after health bar
            20,  // Same Y as health bar
            `${Math.ceil(this.player.currentHealth)}/${this.player.maxHealth}`,
            {
                fontSize: '16px',
                fontFamily: 'CustomPixelFont',
                color: '#ffffff'
            }
        ).setScrollFactor(0).setDepth(1000);

        // Update XP bar
        const xpBarWidth = 300;
        const xpProgress = this.player.xp / this.player.getXPToNextLevel();
        this.ui.xpBar.width = xpBarWidth * xpProgress;
        this.ui.xpText?.destroy();
        this.ui.xpText = this.add.text(
            330, // Position after XP bar
            50,  // Same Y as XP bar
            `${Math.floor(this.player.xp)}/${this.player.getXPToNextLevel()}`,
            {
                fontSize: '16px',
                fontFamily: 'CustomPixelFont',
                color: '#ffffff'
            }
        ).setScrollFactor(0).setDepth(1000);

        // Update level text
        this.ui.levelText.setText(`Level: ${this.player.level}`);

        // Update kill counter
        this.ui.killCounter.setText(`Kills: ${this.state.totalEnemiesKilled}`);
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
        this.createUI();
        this.updateUI();
        this.spellProgress = new SpellProgress();
        this.spellProgress.scene = this;
        this.spellProgress.addNewSpell('ArcaneBolt');

    }



    setupSystems() {
        this.systems = {
            spell: new SpellManager(this),
            autoAttack: new AutoAttackSystem(this, {
                range: 400,
                spellType: 'ArcaneBolt'
            }),
            meteor: new MeteorSystem(this)

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

        const CATEGORIES = {
            PLAYER: 0x0001,
            SPELL: 0x0002,
            ENEMY: 0x0004,
            WALL: 0x0008
        };

        // Set up collision for the base layer
        base.setCollisionByProperty({ collides: true });

        // Convert layer to Matter bodies with collision properties
        const options = {
            isStatic: true,
            collisionFilter: {
                category: CATEGORIES.WALL,
                mask: CATEGORIES.PLAYER | CATEGORIES.ENEMY
            }
        };

        this.matter.world.convertTilemapLayer(base, options);

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
            initialEnemies: 100,
            difficultyInterval: 180000,
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
        if (this.isSpellEnemyCollision(bodyA, bodyB)) {
            const { spell, enemy } = this.getSpellAndEnemyFromCollision(bodyA, bodyB);


            //  validation
            if (spell &&
                enemy &&
                spell.active &&
                enemy.active &&
                !enemy.isDying &&
                enemy.currentHealth > 0) {

                spell.handleCollision(enemy);
            }
        }

        if (this.isPlayerEnemyCollision(bodyA, bodyB)) {
            const enemy = this.getEnemyFromCollision(bodyA, bodyB);
            if (enemy?.active && !enemy.isDying && enemy.damage) {
                this.player.takeDamage(enemy.damage);
                if (this.player.currentHealth <= 0 && !this.state.isGameOver) {
                    this.handlePlayerDeath();
                }
            }
        }
    }

    setupEventListeners() {
        this.events.off('playerDied').off('enemyDied').off('playerHealthChanged').off('playerLeveledUp');

        this.events.on('playerDied', this.handlePlayerDeath, this);
        this.events.on('enemyDied', (enemy) => {
            this.state.totalEnemiesKilled++;
            this.state.currentWaveEnemiesKilled++;
            if (this.player) {
                this.player.gainXP(enemy.xpValue || 10);
            }
            this.updateUI();
        });

        this.events.on('playerHealthChanged', () => this.updateUI());
        this.events.on('playerLeveledUp', () => {
            this.updateUI();
            this.scene.launch('LevelUpScene', {
                mainScene: this,
                player: this.player,
                spellProgress: this.spellProgress
            });
        });
    }

    pauseGameSystems() {
        this.state.isPaused = true;

        // Stop enemy movement but don't destroy them
        if (this.waveManager) {
            this.waveManager.enabled = false;
        }

        // Pause player input but keep rendering
        if (this.player) {
            this.player.inputEnabled = false;
        }

        // Pause auto-attack
        this.state.autoAttackEnabled = false;

        // Pause meteor system
        if (this.systems.meteor) {
            this.systems.meteor.enabled = false;
        }
    }
    resumeGameSystems() {
        this.state.isPaused = false;

        if (this.waveManager) {
            this.waveManager.enabled = true;
        }

        if (this.player) {
            this.player.inputEnabled = true;
        }

        this.state.autoAttackEnabled = true;

        // Resume meteor system
        if (this.systems.meteor) {
            this.systems.meteor.enabled = true;
        }
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
        if (this.state.isGameOver || this.state.isPaused) return;
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
        let spell = null;
        let enemy = null;

        if (bodyA.label === 'spellCollider' && bodyB.label === 'EnemyCollider') {
            spell = bodyA.gameObject;
            enemy = bodyB.gameObject;
        } else {
            spell = bodyB.gameObject;
            enemy = bodyA.gameObject;
        }

        if (!spell || !enemy) {

            return { spell: null, enemy: null };
        }

        return { spell, enemy };
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

        // Cleanup UI elements
        Object.values(this.ui).forEach(element => {
            if (element?.destroy) {
                element.destroy();
            }
        });

        // Null out references
        this.player = null;
        this.waveManager = null;
        this.systems = {};
        this.ui = {};
    }
}