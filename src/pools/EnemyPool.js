import { EnemyTypes } from "../sprites/enemyTypes";
import OptimizedEnemy from "../sprites/OptimizedEnemy";
export class EnemyPool {
    constructor(scene, initialSize = 20) {
        this.scene = scene;
        this.pool = new Map();

        Object.keys(EnemyTypes).forEach(type => {
            this.pool.set(type, []);
            for (let i = 0; i < initialSize; i++) {
                const enemy = new OptimizedEnemy({ scene, x: -1000, y: -1000, type });
                enemy.setActive(false).setVisible(false);
                this.pool.get(type).push(enemy);
            }
        });
    }

    spawn(type, x, y) {
        let enemy = this.pool.get(type).find(e => !e.active);

        if (!enemy) {
            enemy = new OptimizedEnemy({ scene: this.scene, x: -1000, y: -1000, type });
            this.pool.get(type).push(enemy);
        }

        enemy.setPosition(x, y)
            .setActive(true)
            .setVisible(true);
        enemy.currentHealth = enemy.maxHealth;

        return enemy;
    }

    despawn(enemy) {
        enemy.setActive(false)
            .setVisible(false)
            .setPosition(-1000, -1000)
            .setVelocity(0, 0);
    }
}
