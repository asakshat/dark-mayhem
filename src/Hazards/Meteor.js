export class MeteorSystem {
    constructor(scene) {
        this.scene = scene;
        this.enabled = true;
        this.meteors = [];
        this.lastSpawnTime = 0;
        this.spawnDelay = 6000;
        this.minSpawnDelay = 3000;
        this.meteorDamage = 20;
        this.warningDuration = 1500;
        this.meteorRadius = 60;

        // Position tracking
        this.positionHistory = [];
        this.historyInterval = 300; // Track position every second
        this.lastPositionTime = 0;

        this.warningGraphics = this.scene.add.graphics();
        this.warningGraphics.setDepth(100);
    }

    createWarningEffect(x, y) {
        // Create the warning circle with outline and fill
        const warning = {
            x: x,
            y: y,
            alpha: 0.3,
            pulseTime: 0
        };

        return warning;
    }


    getPastPosition(ageMs) {
        if (this.positionHistory.length === 0) return null;

        const targetTime = this.scene.time.now - ageMs;
        const position = this.positionHistory
            .filter(pos => pos.time <= targetTime)
            .sort((a, b) => b.time - a.time)[0];

        return position || this.positionHistory[0];
    }

    update(time) {
        // Update position history
        if (!this.enabled) return;
        if (time - this.lastPositionTime >= this.historyInterval) {
            this.updatePositionHistory();
            this.lastPositionTime = time;
        }

        // Clean up completed meteors
        this.meteors = this.meteors.filter(meteor => meteor.active);

        // Check for spawning new meteors
        if (time - this.lastSpawnTime >= this.spawnDelay) {
            this.spawnMeteors();
            this.lastSpawnTime = time;

            this.spawnDelay = Math.max(
                this.minSpawnDelay,
                this.spawnDelay - 200
            );
        }

        // Update active meteors
        this.meteors.forEach(meteor => this.updateMeteor(meteor));


        this.warningGraphics.clear();

        // Draw all warning effects
        this.meteors.forEach(meteor => {
            if (meteor.active && !meteor.hasHit) {
                const warning = meteor.warning;

                // Draw filled circle
                this.warningGraphics.fillStyle(0xff0000, warning.alpha * 0.3);
                this.warningGraphics.fillCircle(warning.x, warning.y, this.meteorRadius);

                // Draw circle outline
                this.warningGraphics.lineStyle(2, 0xff0000, warning.alpha);
                this.warningGraphics.strokeCircle(warning.x, warning.y, this.meteorRadius);




            }
        });
    }
    updatePositionHistory() {
        if (!this.scene.player) return;

        const position = {
            x: this.scene.player.x,
            y: this.scene.player.y,
            direction: this.getPlayerDirection(),
            time: this.scene.time.now
        };

        this.positionHistory.push(position);

        // Keep only last 5 seconds of history
        const cutoffTime = this.scene.time.now - 5000;
        this.positionHistory = this.positionHistory.filter(pos => pos.time > cutoffTime);
    }

    getPlayerDirection() {
        const player = this.scene.player;
        if (!player) return 0;

        // Get movement direction
        let angle = 0;

        if (player.body.velocity.x !== 0 || player.body.velocity.y !== 0) {
            angle = Math.atan2(player.body.velocity.y, player.body.velocity.x);
        } else if (player.flipX) {
            angle = Math.PI; // Facing left
        }

        return angle;
    }

    spawnMeteors() {
        const gameTimeMinutes = this.scene.time.now;
        const meteorCount = Math.min(4, 1 + Math.floor(gameTimeMinutes / 5));

        // Get position from 1 second ago
        const pastPosition = this.getPastPosition(1000);
        if (!pastPosition) return;

        // First meteor always at last position
        this.spawnMeteor(pastPosition, 0);

        // Rest of meteors with directional spread
        for (let i = 1; i < meteorCount; i++) {
            this.spawnMeteor(pastPosition, i);
        }
    }

    spawnMeteor(pastPosition, index) {
        if (!pastPosition) return;

        let impactX, impactY;

        if (index === 0) {
            // First meteor: Directly on past position
            impactX = pastPosition.x;
            impactY = pastPosition.y;
        } else {
            // Subsequent meteors: In player's direction with spread
            const spreadAngle = Math.PI / 4; // 45-degree spread
            const direction = pastPosition.direction;
            const spawnAngle = direction + (Math.random() - 0.5) * spreadAngle;

            // Calculate offset in the direction player was facing
            const distance = 200 + Math.random() * 200; // Random distance 200-400 pixels
            impactX = pastPosition.x + Math.cos(spawnAngle) * distance;
            impactY = pastPosition.y + Math.sin(spawnAngle) * distance;
        }

        // Create warning effect
        const warning = this.createWarningEffect(impactX, impactY);

        // Create meteor object
        const meteor = {
            x: impactX,
            y: impactY - 800,
            targetY: impactY,
            active: true,
            warning: warning,
            fallSpeed: 8,
            hasHit: false,
            warningStartTime: this.scene.time.now
        };

        meteor.sprite = this.scene.add.circle(meteor.x, meteor.y, 15, 0xff4400);
        meteor.sprite.setDepth(500);

        this.meteors.push(meteor);
    }



    updateWarningEffect(warning) {
        // Update pulse effect
        warning.pulseTime += 0.05;
        warning.alpha = 0.3 + Math.sin(warning.pulseTime) * 0.1;
    }


    updateMeteor(meteor) {
        if (!meteor.active || meteor.hasHit) return;

        const timeSinceWarning = this.scene.time.now - meteor.warningStartTime;

        // Update warning effect
        this.updateWarningEffect(meteor.warning);

        // Start falling after warning duration
        if (timeSinceWarning > this.warningDuration) {
            meteor.y += meteor.fallSpeed;
            meteor.sprite.y = meteor.y;

            // Check for impact
            if (meteor.y >= meteor.targetY) {
                // Check for player collision only at impact
                if (this.checkPlayerCollision(meteor)) {
                    this.handlePlayerHit();
                }
                this.handleMeteorImpact(meteor);
            }
        }
    }

    checkPlayerCollision(meteor) {
        if (!this.scene.player || meteor.hasHit) return false;

        const distance = Phaser.Math.Distance.Between(
            meteor.x,
            meteor.targetY,  // Use target Y instead of current Y
            this.scene.player.x,
            this.scene.player.y
        );

        return distance < this.meteorRadius;
    }

    handleMeteorImpact(meteor) {
        // Create impact effect
        const impactGraphics = this.scene.add.graphics();
        impactGraphics.setDepth(101);

        // Draw impact effect
        impactGraphics.fillStyle(0xff0000, 0.6);
        impactGraphics.fillCircle(meteor.x, meteor.y, this.meteorRadius);

        // Fade out impact effect
        this.scene.tweens.add({
            targets: impactGraphics,
            alpha: 0,
            duration: 500,
            onComplete: () => impactGraphics.destroy()
        });

        // Clean up meteor
        meteor.sprite.destroy();
        meteor.hasHit = true;
        meteor.active = false;
    }

    handlePlayerHit() {
        if (this.scene.player && !this.scene.player.isDead) {
            this.scene.player.takeDamage(this.meteorDamage);
        }
    }


    shutdown() {
        // Clean up all meteors and graphics
        this.meteors.forEach(meteor => {
            if (meteor.sprite) meteor.sprite.destroy();
        });
        this.warningGraphics.clear();
        this.warningGraphics.destroy();
        this.meteors = [];
    }
}