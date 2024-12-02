import BaseSpell from './BaseSpell';

export default class ProjectileSpells extends BaseSpell {
    constructor(data) {
        super(data);
        this.projectileIndex = 0;
        this.totalProjectiles = this.config.base.startingProjectiles;
    }

    findTargets() {
        if (!this.scene.waveManager?.spatialGrid) return [];

        const searchRadius = this.config.behavior.searchRadius;
        const nearbyEntities = Array.from(
            this.scene.waveManager.spatialGrid.getNearbyEntities(
                this.scene.player.x,
                this.scene.player.y,
                searchRadius
            )
        );

        return nearbyEntities
            .filter(enemy => enemy.active && !enemy.isDying && enemy.currentHealth > 0)
            .map(enemy => ({
                enemy,
                distance: Phaser.Math.Distance.Between(
                    this.scene.player.x,
                    this.scene.player.y,
                    enemy.x,
                    enemy.y
                )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, this.totalProjectiles)
            .map(item => item.enemy);
    }

    findAdditionalTargets(initialTarget) {
        const targets = this.findTargets();

        if (initialTarget) {
            // Ensure initial target is first, then add other targets
            return [
                initialTarget,
                ...targets.filter(enemy => enemy !== initialTarget)
            ].slice(0, this.totalProjectiles);
        }

        return targets;
    }

    fire(x, y, target) {
        const targets = this.findAdditionalTargets(target);
        if (targets.length === 0) return false;

        // Select target based on projectile index
        this.target = targets[this.projectileIndex % targets.length];

        // Calculate initial angle to target
        const angle = Phaser.Math.Angle.Between(x, y, this.target.x, this.target.y);
        this.fireAngle = angle;

        // Call parent class fire method
        super.fire(x, y, this.target);

        // Set initial velocity towards target
        this.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );

        return true;
    }

    update(time) {
        if (!this.active || this.isExploding) return;

        // Update base components
        super.update(time);

        // Check if current target is still valid
        if (!this.target?.active || this.target.isDying || this.target.currentHealth <= 0) {
            const newTargets = this.findTargets();
            if (newTargets.length > 0) {
                this.target = newTargets[this.projectileIndex % newTargets.length];
            } else {
                this.deactivate();
            }
        }
    }
}