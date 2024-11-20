import { EnemyTypes } from "./enemyTypes";
export default class OptimizedEnemy extends Phaser.Physics.Matter.Sprite {

    constructor(data) {
        const { scene, x, y, type = 'ORC' } = data;
        const enemyConfig = EnemyTypes[type];
        const initialFrame = `${enemyConfig.animationPrefix.toLowerCase()}_run000`;

        super(scene.matter.world, x, y, enemyConfig.spritesheetKey, initialFrame);

        this.scene.add.existing(this);
        this.enemyType = type.toLowerCase();
        this.speed = enemyConfig.speed;
        this.maxHealth = enemyConfig.health;
        this.currentHealth = this.maxHealth;
        this.damage = enemyConfig.damage;
        this.xpValue = enemyConfig.xpValue;

        this.updateInterval = 100;
        this.lastUpdate = 0;
        this.lastGridKey = null;

        this.setupPhysics(enemyConfig.colliderRadius);
        this.setupAnimations();
    }

    setupPhysics(radius) {
        const { Body, Bodies } = Phaser.Physics.Matter.Matter;
        const enemyCollider = Bodies.circle(this.x, this.y, radius, {
            isSensor: false,
            label: `EnemyCollider`,
            friction: 0.001,
            restitution: 0.2
        });
        enemyCollider.gameObject = this;

        const compoundBody = Body.create({
            parts: [enemyCollider],
            frictionAir: 0.05
        });

        this.setExistingBody(compoundBody)
            .setFixedRotation()
            .setBounce(0.2)
            .setMass(1);
    }

    setupAnimations() {
        if (!this.anims.isPlaying) {
            this.play(`${this.enemyType}_run`);
        }
    }

    update(time, spatialGrid) {
        if (!this.scene?.player || !this.active) return;

        // Update spatial grid position
        if (spatialGrid) {
            const newGridKey = spatialGrid.getCellKey(this.x, this.y);
            if (this.lastGridKey !== newGridKey) {
                spatialGrid.remove(this, this.lastGridKey);
                this.lastGridKey = spatialGrid.insert(this);
            }
        }

        // Check if within camera view
        const camera = this.scene.cameras.main;
        const inView = Phaser.Geom.Rectangle.Overlaps(
            camera.worldView,
            this.getBounds()
        );

        this.setVisible(inView);

        // Only update AI at intervals
        if (time - this.lastUpdate >= this.updateInterval) {
            this.updateAI();
            this.lastUpdate = time;
        }
    }

    updateAI() {
        if (!this.scene?.player) return;

        const dx = this.scene.player.x - this.x;
        const dy = this.scene.player.y - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 10) {
            let velocityX = (dx / length) * this.speed;
            let velocityY = (dy / length) * this.speed;

            // Add slight circular motion to make movement more interesting
            const angle = Math.atan2(dy, dx);
            const tangentialFactor = 0.3; // Strength of circular motion

            // Add tangential velocity component
            velocityX += Math.cos(angle + Math.PI / 2) * this.speed * tangentialFactor;
            velocityY += Math.sin(angle + Math.PI / 2) * this.speed * tangentialFactor;

            // Normalize and apply speed
            const totalVelocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            velocityX = (velocityX / totalVelocity) * this.speed;
            velocityY = (velocityY / totalVelocity) * this.speed;

            this.setVelocity(velocityX, velocityY);
            this.setFlipX(velocityX < 0);

            if (this.visible && (!this.anims.isPlaying || this.anims.currentAnim?.key !== `${this.enemyType}_run`)) {
                this.play(`${this.enemyType}_run`, true);
            }
        }
    }

    takeDamage(amount) {
        this.currentHealth -= amount;
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    die() {
        const deathAnim = `${this.enemyType}_death`;
        if (this.scene.anims.exists(deathAnim)) {
            this.play(deathAnim);
            this.once('animationcomplete', () => {
                this.scene.events.emit('enemyDied', this);
                if (this.scene.waveManager?.enemyPool) {
                    this.scene.waveManager.enemyPool.despawn(this);
                } else {
                    this.destroy();
                }
            });
        } else {
            this.scene.events.emit('enemyDied', this);
            if (this.scene.waveManager?.enemyPool) {
                this.scene.waveManager.enemyPool.despawn(this);
            } else {
                this.destroy();
            }
        }
    }
}