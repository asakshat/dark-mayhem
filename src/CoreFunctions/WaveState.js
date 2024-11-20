export class WaveState {
    constructor(config) {
        this.currentWave = 1;
        this.enemiesInWave = config.initialEnemies;
        this.enemiesSpawned = 0;
        this.lastSpawnTime = 0;
        this.waveStartTime = 0;
        this.isWaveActive = false;
        this.config = config;
    }

    startWave(currentTime) {
        this.isWaveActive = true;
        this.enemiesSpawned = 0;
        this.waveStartTime = currentTime;
    }

    completeWave(currentTime) {
        this.currentWave++;
        this.enemiesInWave += this.config.enemiesIncreasePerWave;
        this.isWaveActive = false;
        this.waveStartTime = currentTime;
    }

    shouldStartNewWave(currentTime) {
        return !this.isWaveActive &&
            (currentTime - this.waveStartTime >= this.config.timeBetweenWaves);
    }

    canSpawnEnemy(currentTime) {
        return this.isWaveActive &&
            this.enemiesSpawned < this.enemiesInWave &&
            (currentTime - this.lastSpawnTime >= this.config.spawnDelay);
    }

    recordSpawn(currentTime) {
        this.enemiesSpawned++;
        this.lastSpawnTime = currentTime;
    }
}
