export class AutoAttackSystem {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            range: config.range || 200,
            spellType: config.spellType || 'ArcaneBolt',
            targetingDelay: 100
        };
        this.lastTargetCheck = 0;
        this.currentTargets = [];
    }

    update(time) {
        if (!this.canAttack()) return;

        if (time - this.lastTargetCheck >= this.config.targetingDelay) {
            this.currentTargets = this.findNearestEnemies();
            this.lastTargetCheck = time;
        }

        if (this.currentTargets.length > 0) {
            this.performAttack();
        }
    }

    // In AutoAttackSystem class
    findNearestEnemies() {
        const maxTargets = Math.min(this.getMaxTargets(), 8); // Cap targets for performance
        const allEnemies = [];

        // Only process active enemies
        this.scene.waveManager.enemyPool.pool.forEach((enemies) => {
            const activeEnemies = enemies.filter(enemy =>
                enemy.active &&
                !enemy.isDying &&
                enemy.currentHealth > 0 &&
                Phaser.Math.Distance.Between(
                    this.scene.player.x,
                    this.scene.player.y,
                    enemy.x,
                    enemy.y
                ) <= this.config.range
            ).slice(0, maxTargets); // Limit early for performance

            allEnemies.push(...activeEnemies);
            if (allEnemies.length >= maxTargets) return; // Early exit if we have enough targets
        });

        return allEnemies.slice(0, maxTargets);
    }

    getMaxTargets() {
        // Get the number of projectiles from spell config
        const spellConfig = this.scene.systems.spell?.pools?.get(this.config.spellType)?.config;
        return spellConfig?.base?.startingProjectiles || 1;
    }

    canAttack() {
        return this.scene.player &&
            !this.scene.state.isGameOver &&
            !this.scene.player.isDead &&
            !this.scene.player.isHurt &&
            this.scene.state.autoAttackEnabled &&
            this.scene.spellProgress.ownedSpells.has(this.config.spellType) &&
            this.scene.systems.spell?.canCast(this.config.spellType);
    }

    performAttack() {
        if (this.currentTargets.length === 0) return;

        const success = this.scene.systems.spell.cast(
            this.config.spellType,
            this.scene.player.x,
            this.scene.player.y,
            this.currentTargets[0]  // Primary target
        );

        if (success) {
            this.scene.player.play('attack', true);
        }
    }
}