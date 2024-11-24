import { EnemyTypes } from "./enemyTypes";

export default class OptimizedEnemy extends Phaser.Physics.Matter.Sprite {
    constructor(data) {
        const { scene, x, y, type = 'ORC' } = data;
        const enemyConfig = EnemyTypes[type];
        const initialFrame = `${enemyConfig.animationPrefix.toLowerCase()}_run000`;

        super(scene.matter.world, x, y, enemyConfig.spritesheetKey, initialFrame);

        // Core properties
        this.scene.add.existing(this);
        this.enemyType = type.toLowerCase();
        this.speed = enemyConfig.speed;
        this.maxHealth = enemyConfig.health;
        this.currentHealth = this.maxHealth;
        this.damage = enemyConfig.damage;
        this.xpValue = enemyConfig.xpValue;

        // Combat properties
        this.damageTint = 0xff0000;
        this.tintDuration = 100;
        this.isTinting = false;
        this.hitCooldown = 100;
        this.lastHitTime = 0;

        // State flags
        this.active = true;
        this.isDying = false;
        this.isDestroyed = false;

        // AI Movement Properties
        this.updateInterval = 100;
        this.lastUpdate = 0;
        this.lastGridKey = null;
        this.preferredDistance = Phaser.Math.Between(50, 100);
        this.minDistance = 30;
        this.orbitSpeed = 0.3 + Math.random() * 0.3;
        this.currentAngle = Math.random() * Math.PI * 2;
        this.personalSpace = 20;
        this.lastPositionChange = 0;
        this.positionChangeInterval = 2000 + Math.random() * 2000;

        this.setupPhysics(enemyConfig.colliderRadius);
        this.setupAnimations();
    }

    setupPhysics(radius) {
        const { Body, Bodies } = Phaser.Physics.Matter.Matter;
        const enemyCollider = Bodies.circle(this.x, this.y, radius, {
            isSensor: false,
            label: 'EnemyCollider',

        });

        const CATEGORIES = {
            PLAYER: 0x0001,
            SPELL: 0x0002,
            ENEMY: 0x0004,
            WALL: 0x0008
        };

        enemyCollider.gameObject = this;

        const compoundBody = Body.create({
            parts: [enemyCollider],
            frictionAir: 0.05,
            friction: 0.1,
            restitution: 0.3
        });

        this.setExistingBody(compoundBody)
            .setFixedRotation()
            .setBounce(0.3)
            .setMass(1)
            .setCollisionCategory(CATEGORIES.ENEMY)
            // Important: Add ENEMY to collidesWith to enable enemy-enemy collisions
            .setCollidesWith(CATEGORIES.PLAYER | CATEGORIES.SPELL | CATEGORIES.WALL | CATEGORIES.ENEMY);
    }


    setupAnimations() {
        if (!this.anims.isPlaying) {
            this.play(`${this.enemyType}_run`);
        }
    }

    update(time, spatialGrid) {
        if (!this.scene?.player || !this.active || this.isDying || this.isDestroyed) return;

        if (spatialGrid) {
            const newGridKey = spatialGrid.getCellKey(this.x, this.y);
            if (this.lastGridKey !== newGridKey) {
                spatialGrid.remove(this, this.lastGridKey);
                this.lastGridKey = spatialGrid.insert(this);
            }
        }

        const camera = this.scene.cameras.main;
        this.setVisible(Phaser.Geom.Rectangle.Overlaps(camera.worldView, this.getBounds()));

        if (time - this.lastUpdate >= this.updateInterval) {
            this.updateAI();
            this.lastUpdate = time;
        }
    }

    updateAI() {
        if (!this.scene?.player) return;

        const time = this.scene.time.now;
        const playerPos = { x: this.scene.player.x, y: this.scene.player.y };
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerPos.x, playerPos.y);
        const behavior = this.determineCurrentBehavior(distanceToPlayer);

        let targetPos = this.getTargetPosition(behavior, playerPos, time);
        targetPos = this.adjustForNearbyEnemies(targetPos, distanceToPlayer);

        this.moveToPosition(targetPos, distanceToPlayer, behavior);
    }


    determineCurrentBehavior(distanceToPlayer) {
        if (this.enemyType.includes('rouge')) {
            // Rogues should strike and retreat
            if (distanceToPlayer < this.minDistance * 0.5) return 'aggressive';
            if (distanceToPlayer < this.preferredDistance) return 'flank';
            return 'aggressive';
        }

        if (this.enemyType.includes('warrior')) {
            // Warriors should always be aggressive when close
            return 'aggressive';
        }

        if (this.enemyType.includes('shaman') || this.enemyType.includes('mage')) {
            // Ranged enemies keep distance
            if (distanceToPlayer < this.preferredDistance * 0.6) return 'retreat';
            if (distanceToPlayer < this.preferredDistance) return 'orbit';
            return 'flank';
        }

        // Default behavior - more aggressive
        if (distanceToPlayer < this.preferredDistance) {
            return 'aggressive';
        }
        return 'orbit';
    }

    getTargetPosition(behavior, playerPos, time) {
        switch (behavior) {
            case 'aggressive':
                // Direct path to player with minimal randomization
                return {
                    x: playerPos.x + (Math.random() - 0.5) * 10,
                    y: playerPos.y + (Math.random() - 0.5) * 10
                };

            case 'flank': {
                const flankAngle = this.currentAngle + Math.PI / 2;
                const flankDistance = this.preferredDistance * 0.5; // Reduced distance
                return {
                    x: playerPos.x + Math.cos(flankAngle) * flankDistance,
                    y: playerPos.y + Math.sin(flankAngle) * flankDistance
                };
            }

            case 'orbit': {
                if (time - this.lastPositionChange > this.positionChangeInterval) {
                    this.currentAngle += (Math.random() - 0.5) * Math.PI / 4;
                    this.orbitSpeed = 0.3 + Math.random() * 0.3;
                    this.lastPositionChange = time;
                }
                this.currentAngle += this.orbitSpeed * 0.005;
                const orbitDistance = this.preferredDistance * 0.8;
                return {
                    x: playerPos.x + Math.cos(this.currentAngle) * orbitDistance,
                    y: playerPos.y + Math.sin(this.currentAngle) * orbitDistance
                };
            }

            case 'retreat': {
                const angle = Phaser.Math.Angle.Between(playerPos.x, playerPos.y, this.x, this.y);
                const retreatDistance = this.preferredDistance * 1.2;
                return {
                    x: playerPos.x + Math.cos(angle) * retreatDistance,
                    y: playerPos.y + Math.sin(angle) * retreatDistance
                };
            }
        }
    }
    adjustForNearbyEnemies(targetPos, distanceToPlayer) {
        if (!this.scene.waveManager?.spatialGrid) return targetPos;

        const nearbyEntities = this.scene.waveManager.spatialGrid
            .getNearbyEntities(this.x, this.y, this.personalSpace * 3); // Increased detection range

        let totalAdjustment = { x: 0, y: 0 };
        let adjustmentCount = 0;

        nearbyEntities.forEach(entity => {
            if (entity !== this && entity.active) {
                const dx = this.x - entity.x;
                const dy = this.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.personalSpace * 2) { // Increased avoidance range
                    // Stronger avoidance force for very close enemies
                    const pushForce = Math.pow((this.personalSpace * 2 - distance) / (this.personalSpace * 2), 2);
                    const adjustmentStrength = 1; // Always full strength for collision avoidance

                    totalAdjustment.x += (dx / distance) * pushForce * 12; // Increased force
                    totalAdjustment.y += (dy / distance) * pushForce * 12;
                    adjustmentCount++;
                }
            }
        });

        if (adjustmentCount > 0) {
            // Apply stronger adjustment for collision avoidance
            return {
                x: targetPos.x + (totalAdjustment.x / adjustmentCount),
                y: targetPos.y + (totalAdjustment.y / adjustmentCount)
            };
        }

        return targetPos;
    }
    moveToPosition(targetPos, distanceToPlayer, behavior) {
        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 5) {
            this.setVelocity(0, 0);
            return;
        }

        let speedMultiplier = {
            'aggressive': 1.6,
            'retreat': 1.4,
            'flank': 1.3,
            'orbit': 1.0
        }[behavior] || 1;

        if (behavior === 'aggressive' && distanceToPlayer < this.minDistance) {
            speedMultiplier *= 1.3;
        }

        const baseSpeed = this.speed * speedMultiplier;
        let velocityX = (dx / distance) * baseSpeed;
        let velocityY = (dy / distance) * baseSpeed;

        // Get current velocity for smoother transitions
        const currentVelX = this.body.velocity.x;
        const currentVelY = this.body.velocity.y;

        // Smoothly interpolate to new velocity
        velocityX = currentVelX + (velocityX - currentVelX) * 0.2;
        velocityY = currentVelY + (velocityY - currentVelY) * 0.2;

        // Add slight repulsion when very close to other enemies
        const nearbyEnemies = this.scene.waveManager?.spatialGrid
            .getNearbyEntities(this.x, this.y, this.personalSpace);

        if (nearbyEnemies?.size > 0) {
            let repulsionX = 0;
            let repulsionY = 0;
            nearbyEnemies.forEach(enemy => {
                if (enemy !== this) {
                    const repulsionDx = this.x - enemy.x;
                    const repulsionDy = this.y - enemy.y;
                    const repulsionDist = Math.sqrt(repulsionDx * repulsionDx + repulsionDy * repulsionDy);
                    if (repulsionDist < this.personalSpace) {
                        repulsionX += (repulsionDx / repulsionDist) * baseSpeed * 0.5;
                        repulsionY += (repulsionDy / repulsionDist) * baseSpeed * 0.5;
                    }
                }
            });
            velocityX += repulsionX;
            velocityY += repulsionY;
        }

        this.setVelocity(velocityX, velocityY);
        this.setFlipX(velocityX < 0);

        if (this.visible && (!this.anims.isPlaying || this.anims.currentAnim?.key !== `${this.enemyType}_run`)) {
            this.play(`${this.enemyType}_run`, true);
        }
    }
    takeDamage(amount) {
        if (!this.active || this.isDying || this.currentHealth <= 0) return;
        if (this.scene.time.now - this.lastHitTime < this.hitCooldown) return;

        this.currentHealth -= amount;
        this.lastHitTime = this.scene.time.now;
        this.flashDamage();

        if (this.currentHealth <= 0) {
            this.initiateDeathSequence();
        }
    }

    flashDamage() {
        if (!this.active || this.isDying) return;

        this.setTint(this.damageTint);
        this.scene.time.delayedCall(this.tintDuration, () => {
            if (this.active) {
                this.clearTint();
            }
        });
    }

    initiateDeathSequence() {
        if (this.isDying) return;

        this.isDying = true;
        this.active = false;
        this.setVelocity(0, 0);
        this.setStatic(true);

        const deathAnim = `${this.enemyType}_death`;
        if (this.scene.anims.exists(deathAnim)) {
            this.play(deathAnim);
            this.once('animationcomplete', () => this.completeDeathSequence());
            this.scene.time.delayedCall(1000, () => {
                if (this.isDying && !this.isDestroyed) {
                    this.completeDeathSequence();
                }
            });
        } else {
            this.completeDeathSequence();
        }
    }

    completeDeathSequence() {
        if (!this.scene || this.isDestroyed) return;

        this.scene.events.emit('enemyDied', this);

        if (this.lastGridKey && this.scene.waveManager?.spatialGrid) {
            this.scene.waveManager.spatialGrid.remove(this, this.lastGridKey);
        }

        if (this.scene.waveManager?.enemyPool) {
            this.setActive(false);
            this.setVisible(false);
            this.setPosition(-1000, -1000);
            this.removeAllListeners();
            this.isDying = false;
            this.isDestroyed = true;
            this.scene.waveManager.enemyPool.despawn(this);
        } else {
            this.destroy();
        }
    }
}