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

        // AI properties
        this.updateInterval = 100;
        this.lastUpdate = 0;
        this.lastGridKey = null;
        this.preferredDistance = Phaser.Math.Between(100, 200);
        this.orbitSpeed = 0.5 + Math.random() * 0.5;
        this.currentAngle = Math.random() * Math.PI * 2;
        this.personalSpace = 40;
        this.lastPositionChange = 0;
        this.positionChangeInterval = 2000 + Math.random() * 2000;

        this.setupPhysics(enemyConfig.colliderRadius);
        this.setupAnimations();
    }
    setupPhysics(radius) {
        const { Body, Bodies } = Phaser.Physics.Matter.Matter;
        const enemyCollider = Bodies.circle(this.x, this.y, radius, {
            isSensor: false,
            label: 'EnemyCollider'
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

        const time = this.scene.time.now;
        const playerPos = { x: this.scene.player.x, y: this.scene.player.y };

        // Calculate base position relative to player
        let targetPos = this.calculateTargetPosition(playerPos, time);

        // Adjust for other enemies
        targetPos = this.adjustForNearbyEnemies(targetPos);

        // Calculate movement
        this.moveTowardsPosition(targetPos);
    }

    calculateTargetPosition(playerPos, time) {
        // Update orbit angle based on time
        if (time - this.lastPositionChange > this.positionChangeInterval) {
            this.currentAngle += (Math.random() - 0.5) * Math.PI / 2;
            this.lastPositionChange = time;
        }

        this.currentAngle += this.orbitSpeed * 0.016; // Smooth orbital motion

        // Calculate target position in orbit around player
        return {
            x: playerPos.x + Math.cos(this.currentAngle) * this.preferredDistance,
            y: playerPos.y + Math.sin(this.currentAngle) * this.preferredDistance
        };
    }

    adjustForNearbyEnemies(targetPos) {
        let adjustedX = targetPos.x;
        let adjustedY = targetPos.y;

        // Get nearby enemies from spatial grid
        if (this.scene.waveManager?.spatialGrid) {
            const nearbyEntities = this.scene.waveManager.spatialGrid
                .getNearbyEntities(this.x, this.y, this.personalSpace * 2);

            nearbyEntities.forEach(entity => {
                if (entity !== this && entity.active) {
                    const dx = this.x - entity.x;
                    const dy = this.y - entity.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.personalSpace) {
                        const pushForce = (this.personalSpace - distance) / this.personalSpace;
                        adjustedX += (dx / distance) * pushForce * 20;
                        adjustedY += (dy / distance) * pushForce * 20;
                    }
                }
            });
        }

        return { x: adjustedX, y: adjustedY };
    }
    moveTowardsPosition(targetPos) {
        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const speed = this.speed * (distance > this.preferredDistance ? 1.5 : 1);
            let velocityX = (dx / distance) * speed;
            let velocityY = (dy / distance) * speed;

            // Add slight randomization to movement
            velocityX += (Math.random() - 0.5) * 0.3;
            velocityY += (Math.random() - 0.5) * 0.3;

            this.setVelocity(velocityX, velocityY);
            this.setFlipX(velocityX < 0);

            if (this.visible && (!this.anims.isPlaying || this.anims.currentAnim?.key !== `${this.enemyType}_run`)) {
                this.play(`${this.enemyType}_run`, true);
            }
        } else {
            this.setVelocity(0, 0);
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


