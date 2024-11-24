export class SpawnPosition {
    constructor(mapBounds, player, minSpawnDistance) {
        this.mapBounds = mapBounds;
        this.player = player;
        this.minSpawnDistance = minSpawnDistance;
        this.minDistance = 800;
        this.maxDistance = 1000;
    }

    generateSpawnPoint() {
        let spawnPoint;
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
            spawnPoint = this.tryGeneratePoint();
            if (spawnPoint && this.isPointOutsidePlayerView(spawnPoint) && this.isPointWithinBounds(spawnPoint, this.mapBounds)) {
                return spawnPoint;
            }
            attempts++;
        }

        // Fallback to a random point within the map bounds
        return {
            x: Phaser.Math.Between(this.mapBounds.x + this.minSpawnDistance, this.mapBounds.x + this.mapBounds.width - this.minSpawnDistance),
            y: Phaser.Math.Between(this.mapBounds.y + this.minSpawnDistance, this.mapBounds.y + this.mapBounds.height - this.minSpawnDistance)
        };
    }

    tryGeneratePoint() {
        const angle = Phaser.Math.Between(0, 2 * Math.PI);
        const distance = Phaser.Math.Between(this.minDistance, this.maxDistance);

        const point = {
            x: this.player.x + Math.cos(angle) * distance,
            y: this.player.y + Math.sin(angle) * distance
        };

        return point;
    }

    isPointOutsidePlayerView(point) {
        const playerViewAngle = Math.atan2(this.player.y - point.y, this.player.x - point.x);
        const playerViewRadius = 120; // Adjust this value to control the player's view radius

        return (
            Math.abs(Phaser.Math.Angle.Normalize(playerViewAngle - Math.atan2(this.player.body.velocity.y, this.player.body.velocity.x))) > Math.PI / 2 ||
            Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y) > playerViewRadius
        );
    }

    isPointWithinBounds(point, bounds) {
        return point.x >= bounds.x &&
            point.x <= bounds.x + bounds.width &&
            point.y >= bounds.y &&
            point.y <= bounds.y + bounds.height;
    }
}