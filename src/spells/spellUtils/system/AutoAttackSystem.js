export class AutoAttackSystem {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            range: config.range || 200,
            spellType: config.spellType || 'ArcaneBolt',
            targetingDelay: 100
        };
        this.lastTargetCheck = 0;
        this.currentTarget = null;
    }

    update(time) {
        if (!this.canAttack()) return;

        if (time - this.lastTargetCheck >= this.config.targetingDelay) {
            this.currentTarget = this.findNearestEnemy();
            this.lastTargetCheck = time;
        }

        if (this.currentTarget?.active) {
            this.performAttack();
        }
    }

    findNearestEnemy() {
        let nearestEnemy = null;
        let shortestDistance = this.config.range;

        // Get all enemy types from the pool
        this.scene.waveManager.enemyPool.pool.forEach((enemies) => {
            // Filter active enemies
            const activeEnemies = enemies.filter(enemy => enemy.active);

            // Find the nearest one
            activeEnemies.forEach(enemy => {
                const distance = Phaser.Math.Distance.Between(
                    this.scene.player.x,
                    this.scene.player.y,
                    enemy.x,
                    enemy.y
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
        });



        return nearestEnemy;
    }

    canAttack() {
        return this.scene.player &&
            !this.scene.state.isGameOver &&
            !this.scene.player.isDead &&
            !this.scene.player.isHurt &&
            this.scene.state.autoAttackEnabled &&
            this.scene.systems.spell?.canCast(this.config.spellType);
    }

    performAttack() {
        const spell = this.scene.systems.spell.cast(
            this.config.spellType,
            this.scene.player.x,
            this.scene.player.y,
            this.currentTarget
        );

        if (spell) {

            this.scene.player.play('attack', true);
        }
    }
}


