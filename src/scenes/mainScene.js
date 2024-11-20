import Player from "../sprites/Player";
import WaveManager from "../WaveManager";
import UIManager from "../UImanager";
import SpellManager from "../spells/SpellManager";

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.initializeProperties();
    }

    initializeProperties() {
        this.totalEnemiesKilled = 0;
        this.currentWaveEnemiesKilled = 0;
        this.isGameOver = false;
        this.uiManager = new UIManager();
        this.player = null;
        this.waveManager = null;
        this.bgMusic = null;
        this.deathSound = null;
        this.mapDimensions = null;
        this.autoAttackEnabled = true;
        this.autoAttackRange = 300;
        this.lastSpellCast = 0;
        this.spellCooldown = 1000;
    }

    create() {
        this.spellManager = new SpellManager(this);
        this.initializeProperties();
        this.mapDimensions = this.createMap();
        this.createPlayer();
        this.setupAudio();
        this.setupWaveManager();
        this.setupCollisions();
        this.setupEventListeners();
        this.setupPlayerInput();
        this.updateUI();
    }

    setupAudio() {
        this.bgMusic = this.sound.add('bgMusic', {
            loop: true,
            volume: 0.8
        });

        this.deathSound = this.sound.add('playerDeathAudio', {
            loop: false,
            volume: 0.6
        });

        this.bgMusic.play();
    }

    handleAutoAttack() {
        if (this.isGameOver || this.player.isDead || this.player.isHurt) return;
        if (!this.autoAttackEnabled) return;

        const currentTime = this.time.now;
        if (currentTime - this.lastSpellCast < this.spellCooldown) return;

        const nearestEnemy = this.findNearestEnemy(this.autoAttackRange);

        if (nearestEnemy && nearestEnemy.active) {
            const spell = this.spellManager.castSpell('ArcaneBolt', this.player.x, this.player.y, nearestEnemy);

            if (spell) {
                this.lastSpellCast = currentTime;
                this.player.play('attack', true);
                this.player.once('animationcomplete', (anim) => {
                    if (anim.key === 'attack' && !this.player.isDead) {
                        this.player.play('idle');
                    }
                });
            }
        }
    }

    findNearestEnemy(maxRange = 300) {
        let nearestEnemy = null;
        let nearestDistance = maxRange;

        this.waveManager.enemyPool.pool.forEach(enemies => {
            enemies.forEach(enemy => {
                if (enemy.active) {
                    const distance = Phaser.Math.Distance.Between(
                        this.player.x, this.player.y,
                        enemy.x, enemy.y
                    );

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestEnemy = enemy;
                    }
                }
            });
        });

        return nearestEnemy;
    }

    createMap() {
        const map = this.make.tilemap({ key: 'tiles' });
        const dungeonTileset = map.addTilesetImage('Dungeon tileset', 'dungeon-tileset', 16, 16, 0, 0);
        const tilesTileset = map.addTilesetImage('Tiles', 'tiles', 16, 16, 0, 0);
        const propsTileset = map.addTilesetImage('Props', 'props', 16, 16, 0, 0);

        map.createLayer('ground_tiles', [dungeonTileset, tilesTileset, propsTileset], 0, 0);
        const base = map.createLayer('base', [dungeonTileset, tilesTileset, propsTileset], 0, 0);
        map.createLayer('objects', [dungeonTileset, tilesTileset, propsTileset], 0, 0);

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
            if (this.isGameOver) return;

            event.pairs.forEach((pair) => {
                if (this.isPlayerEnemyCollision(pair.bodyA, pair.bodyB)) {
                    const enemy = this.getEnemyFromCollision(pair.bodyA, pair.bodyB);
                    if (enemy?.damage !== undefined) {
                        this.player.takeDamage(enemy.damage);
                        if (this.player.currentHealth <= 0 && !this.isGameOver) {
                            this.handlePlayerDeath();
                        }
                    }
                }

                if (this.isSpellEnemyCollision(pair.bodyA, pair.bodyB)) {
                    const { spell, enemy } = this.getSpellAndEnemyFromCollision(pair.bodyA, pair.bodyB);
                    if (spell && enemy && enemy.active) {
                        spell.handleCollision(enemy);
                    }
                }
            });
        });
    }

    isSpellEnemyCollision(bodyA, bodyB) {
        return (bodyA.label === 'spellCollider' && bodyB.label === 'EnemyCollider') ||
            (bodyB.label === 'spellCollider' && bodyA.label === 'EnemyCollider');
    }

    getSpellAndEnemyFromCollision(bodyA, bodyB) {
        if (bodyA.label === 'spellCollider' && bodyB.label === 'EnemyCollider') {
            return { spell: bodyA.gameObject, enemy: bodyB.gameObject };
        } else if (bodyB.label === 'spellCollider' && bodyA.label === 'EnemyCollider') {
            return { spell: bodyB.gameObject, enemy: bodyA.gameObject };
        }
        return { spell: null, enemy: null };
    }

    setupEventListeners() {
        this.events.off('playerDied').off('enemyDied').off('playerHealthChanged');

        this.events.on('playerDied', this.handlePlayerDeath, this);
        this.events.on('enemyDied', () => {
            this.totalEnemiesKilled++;
            this.currentWaveEnemiesKilled++;
            this.updateUI();
        });

        this.events.on('playerHealthChanged', () => this.updateUI());
    }

    setupPlayerInput() {
        this.player.inputKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
            downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
            leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
            rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });
    }

    handlePlayerDeath() {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.stopGameplay();
        this.fadeOutBackgroundMusic();
        this.clearEnemies();
        this.player.setDepth(600);
        this.deathSound?.play();
        this.player.play('death', true);
        this.startDeathTransition();
    }

    fadeOutBackgroundMusic() {
        if (this.bgMusic) {
            this.tweens.add({
                targets: this.bgMusic,
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
                    totalKills: this.totalEnemiesKilled,
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
        this.autoAttackEnabled = false;
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

    update() {
        if (this.isGameOver) return;

        this.player.update();
        this.waveManager.update();
        this.updateCamera();
        this.updateUI();
        this.spellManager.update();
        this.handleAutoAttack();
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
            totalEnemiesKilled: this.totalEnemiesKilled
        });
    }

    isPlayerEnemyCollision(bodyA, bodyB) {
        return (bodyA.label === 'playerCollider' && bodyB.label === 'EnemyCollider') ||
            (bodyB.label === 'playerCollider' && bodyA.label === 'EnemyCollider');
    }

    getEnemyFromCollision(bodyA, bodyB) {
        return bodyA.label === 'EnemyCollider' ? bodyA.gameObject : bodyB.gameObject;
    }

    shutdown() {
        this.bgMusic?.stop();
        this.deathSound?.stop();
        this.uiManager?.destroy();
        this.events.off('playerDied').off('enemyDied');
        this.matter.world.off('collisionstart');

        if (this.waveManager) {
            this.waveManager.spatialGrid.clear();
            this.waveManager.enemyPool.pool.forEach(enemies => {
                enemies.forEach(enemy => {
                    if (enemy.active) enemy.destroy();
                });
            });
        }
    }
}