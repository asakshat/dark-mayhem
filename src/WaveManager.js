import { EnemyPool } from "./pools/EnemyPool";
import { SpatialGrid } from "./utils/SpatialGrid";
import { EnemyTypes } from "./sprites/enemyTypes";
import { WaveState } from "./CoreFunctions/WaveState.js";
import { DebugVisualizer } from "./CoreFunctions/DebugVisualizer.js";
import { SpawnPosition } from "./CoreFunctions/SpawnPosition.js";
export default class WaveManager {
    constructor(scene, config) {
        this.scene = scene;
        this.enemyPool = new EnemyPool(scene);
        this.spatialGrid = new SpatialGrid(
            scene.game.config.width,
            scene.game.config.height,
            200
        );

        this.waveState = new WaveState(config);
        // this.debugVisualizer = new DebugVisualizer(scene);

        this.mapBounds = { x: 0, y: 0, width: 0, height: 0 };
        this.minSpawnDistance = 200;
        this.spawnPosition = null;
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

        const safeBounds = this.spawnPosition.getSafeSpawnBounds();
        const playerRelative = this.spawnPosition.getPlayerRelativePosition(this.scene.player, safeBounds);
        const avoidance = this.spawnPosition.calculateAvoidanceDirections(playerRelative);
        const angleRanges = this.spawnPosition.calculateAllowedAngleRanges(avoidance);

        const spawnPoint = this.spawnPosition.generateSpawnPoint(
            this.scene.player,
            angleRanges,
            safeBounds
        );

        const enemy = this.enemyPool.spawn(
            this.getRandomEnemyType(),
            spawnPoint.x,
            spawnPoint.y
        );

        this.spatialGrid.insert(enemy);
        // this.debugVisualizer.visualizeSpawn(this.scene.player, spawnPoint);
        this.waveState.recordSpawn(this.scene.time.now);
    }

    getRandomEnemyType() {
        const types = Object.keys(EnemyTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    update() {
        const currentTime = this.scene.time.now;
        this.updateEnemies(currentTime);
        this.updateWaveState(currentTime);
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