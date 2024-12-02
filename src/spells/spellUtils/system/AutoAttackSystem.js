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

    findNearestEnemies() {
        const targets = [];
        const maxTargets = this.getMaxTargets();

        // Get all enemy types from the pool
        const allEnemies = [];
        this.scene.waveManager.enemyPool.pool.forEach((enemies) => {
            // Filter active enemies
            const activeEnemies = enemies.filter(enemy =>
                enemy.active && !enemy.isDying && enemy.currentHealth > 0
            );
            allEnemies.push(...activeEnemies);
        });

        // Sort all enemies by distance
        const sortedEnemies = allEnemies
            .map(enemy => ({
                enemy,
                distance: Phaser.Math.Distance.Between(
                    this.scene.player.x,
                    this.scene.player.y,
                    enemy.x,
                    enemy.y
                )
            }))
            .filter(item => item.distance <= this.config.range)
            .sort((a, b) => a.distance - b.distance);

        // Take only the nearest enemies up to maxTargets
        return sortedEnemies
            .slice(0, maxTargets)
            .map(item => item.enemy);
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