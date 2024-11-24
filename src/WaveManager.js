import { EnemyPool } from "./pools/EnemyPool";
import { SpatialGrid } from "./utils/SpatialGrid";
import { EnemyTypes } from "./sprites/enemyTypes";
import { DebugVisualizer } from "./CoreFunctions/DebugVisualizer.js";
import { SpawnPosition } from "./CoreFunctions/SpawnPosition.js";
import OptimizedEnemy from "./sprites/OptimizedEnemy.js";
export default class WaveManager {
    constructor(scene, config) {
        this.scene = scene;
        this.enemyPool = new EnemyPool(scene);
        this.spatialGrid = new SpatialGrid(
            scene.game.config.width,
            scene.game.config.height,
            200
        );


        this.maxConcurrentEnemies = config.initialEnemies;
        this.spawnDelay = config.spawnDelay;
        this.lastSpawnTime = 0;

        // Difficulty settings
        this.difficultyInterval = config.difficultyInterval;
        this.lastDifficultyIncrease = 0;
        this.difficultyMultiplier = 1;

        this.mapBounds = { x: 0, y: 0, width: 0, height: 0 };
        this.minSpawnDistance = 200;
        this.spawnPosition = null;
        this.isActive = true;
    }

    setMapBounds(width, height) {
        this.mapBounds = {
            x: 32,
            y: 32,
            width: width - 64,
            height: height - 64
        };
        this.spawnPosition = new SpawnPosition(this.mapBounds, this.minSpawnDistance);
    }

    spawnEnemy() {
        if (!this.scene.player) return;

        const type = this.getRandomEnemyType();
        let enemy = this.enemyPool.pool.get(type).find(e =>
            !e.active && !e.isDying && !e.isDestroyed
        );

        if (!enemy) {
            enemy = new OptimizedEnemy({
                scene: this.scene,
                x: -1000,
                y: -1000,
                type
            });
            this.enemyPool.pool.get(type).push(enemy);
        }

        const safeBounds = this.spawnPosition.getSafeSpawnBounds();
        const playerRelative = this.spawnPosition.getPlayerRelativePosition(
            this.scene.player,
            safeBounds
        );
        const avoidance = this.spawnPosition.calculateAvoidanceDirections(playerRelative);
        const angleRanges = this.spawnPosition.calculateAllowedAngleRanges(avoidance);
        const spawnPoint = this.spawnPosition.generateSpawnPoint(
            this.scene.player,
            angleRanges,
            safeBounds
        );

        // Reset enemy state
        enemy.isDying = false;
        enemy.isDestroyed = false;
        enemy.currentHealth = enemy.maxHealth;
        enemy.setPosition(spawnPoint.x, spawnPoint.y)
            .setActive(true)
            .setVisible(true)
            .setVelocity(0, 0)
            .setStatic(false);

        this.spatialGrid.insert(enemy);
    }
    getRandomEnemyType() {
        const types = Object.keys(EnemyTypes);
        return types[Math.floor(Math.random() * types.length)];
    }


    update() {
        const currentTime = this.scene.time.now;
        this.updateEnemies(currentTime);
        this.checkDifficulty(currentTime);
        this.checkSpawns(currentTime);
    }
    checkDifficulty(currentTime) {
        if (currentTime - this.lastDifficultyIncrease >= this.difficultyInterval) {
            this.increaseDifficulty();
            this.lastDifficultyIncrease = currentTime;
        }
    }


    updateEnemies(currentTime) {
        this.enemyPool.pool.forEach(enemies => {
            enemies.forEach(enemy => {
                if (enemy.active) {
                    enemy.update(currentTime, this.spatialGrid);
                }
            });
        });
    }
    checkSpawns(currentTime) {
        if (!this.isActive) return;

        const activeEnemies = this.countActiveEnemies();
        if (activeEnemies < this.maxConcurrentEnemies &&
            currentTime - this.lastSpawnTime >= this.spawnDelay) {
            this.spawnEnemy();
            this.lastSpawnTime = currentTime;
        }
    }
    increaseDifficulty() {
        this.difficultyMultiplier += 0.5;
        this.maxConcurrentEnemies = Math.floor(this.maxConcurrentEnemies * 1.5);
        // Optional: decrease spawn delay as difficulty increases
        this.spawnDelay = Math.max(100, this.spawnDelay * 0.9);

        console.log('Difficulty increased:', {
            multiplier: this.difficultyMultiplier,
            maxEnemies: this.maxConcurrentEnemies,
            spawnDelay: this.spawnDelay
        });
    }
    countActiveEnemies() {
        let count = 0;
        this.enemyPool.pool.forEach(enemies => {
            count += enemies.filter(e => e.active && !e.isDying && !e.isDestroyed).length;
        });
        return count;
    }


    updateWaveState(currentTime) {
        if (this.waveState.shouldStartNewWave(currentTime)) {
            this.startWave();
        } else if (this.waveState.canSpawnEnemy(currentTime)) {
            this.spawnEnemy();
        } else if (this.checkWaveComplete()) {
            this.waveState.completeWave(currentTime);
            this.spatialGrid.clear();
        }
    }

    startWave() {
        this.waveState.startWave(this.scene.time.now);
        this.spatialGrid.clear();
    }

    checkWaveComplete() {
        let activeEnemies = 0;
        this.enemyPool.pool.forEach(enemies => {
            activeEnemies += enemies.filter(e => e.active).length;
        });
        return activeEnemies === 0 &&
            this.waveState.enemiesSpawned >= this.waveState.enemiesInWave;
    }
}