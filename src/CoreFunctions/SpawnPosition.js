export class SpawnPosition {
    constructor(mapBounds, minSpawnDistance) {
        this.mapBounds = mapBounds;
        this.minSpawnDistance = minSpawnDistance;
        this.minDistance = 800;
        this.maxDistance = 1000;
    }

    getSafeSpawnBounds() {
        return {
            x: this.mapBounds.x + this.minSpawnDistance,
            y: this.mapBounds.y + this.minSpawnDistance,
            width: this.mapBounds.width - (2 * this.minSpawnDistance),
            height: this.mapBounds.height - (2 * this.minSpawnDistance)
        };
    }

    getPlayerRelativePosition(player, safeBounds) {
        return {
            x: (player.x - safeBounds.x) / safeBounds.width,
            y: (player.y - safeBounds.y) / safeBounds.height
        };
    }

    calculateAvoidanceDirections(relativePos) {
        return {
            right: relativePos.x > 0.6,
            left: relativePos.x < 0.4,
            bottom: relativePos.y > 0.6,
            top: relativePos.y < 0.4
        };
    }

    calculateAllowedAngleRanges(avoidance) {
        const ranges = [];
        const { left, right, top, bottom } = avoidance;

        if (!right && !top) ranges.push({ min: 0, max: Math.PI / 2 });
        if (!top && !left) ranges.push({ min: Math.PI / 2, max: Math.PI });
        if (!left && !bottom) ranges.push({ min: Math.PI, max: 3 * Math.PI / 2 });
        if (!bottom && !right) ranges.push({ min: 3 * Math.PI / 2, max: 2 * Math.PI });

        return ranges.length ? ranges : [{ min: 0, max: 2 * Math.PI }];
    }

    calculateMaxDistanceInDirection(player, angle, bounds) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const dx = cos > 0 ? bounds.x + bounds.width - player.x : bounds.x - player.x;
        const dy = sin > 0 ? bounds.y + bounds.height - player.y : bounds.y - player.y;

        const tx = cos !== 0 ? Math.abs(dx / cos) : Infinity;
        const ty = sin !== 0 ? Math.abs(dy / sin) : Infinity;

        return Math.min(tx, ty);
    }

    generateSpawnPoint(player, angleRanges, safeBounds) {
        let spawnPoint;
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
            const point = this.tryGeneratePoint(player, angleRanges, safeBounds);
            if (point) return point;
            attempts++;
        }

        return this.getFallbackSpawnPoint(player, safeBounds);
    }

    tryGeneratePoint(player, angleRanges, safeBounds) {
        const range = angleRanges[Math.floor(Math.random() * angleRanges.length)];
        const angle = range.min + Math.random() * (range.max - range.min);

        const maxDistance = this.calculateMaxDistanceInDirection(player, angle, safeBounds);

        if (maxDistance >= this.minDistance) {
            const distance = Phaser.Math.Between(
                this.minDistance,
                Math.min(this.maxDistance, maxDistance)
            );

            const point = {
                x: player.x + Math.cos(angle) * distance,
                y: player.y + Math.sin(angle) * distance
            };

            if (this.isPointWithinBounds(point, safeBounds)) {
                return point;
            }
        }
        return null;
    }

    getFallbackSpawnPoint(player, safeBounds) {
        const corners = [
            { x: safeBounds.x, y: safeBounds.y },
            { x: safeBounds.x + safeBounds.width, y: safeBounds.y },
            { x: safeBounds.x, y: safeBounds.y + safeBounds.height },
            { x: safeBounds.x + safeBounds.width, y: safeBounds.y + safeBounds.height }
        ];

        return corners.reduce((furthest, corner) => {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y, corner.x, corner.y
            );
            return distance > furthest.distance ?
                { point: corner, distance } :
                furthest;
        }, { point: corners[0], distance: 0 }).point;
    }

    isPointWithinBounds(point, bounds) {
        return point.x >= bounds.x &&
            point.x <= bounds.x + bounds.width &&
            point.y >= bounds.y &&
            point.y <= bounds.y + bounds.height;
    }
}