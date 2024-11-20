export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.width = width;
        this.height = height;
    }

    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    insert(entity) {
        const key = this.getCellKey(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, new Set());
        }
        this.grid.get(key).add(entity);
        return key;
    }

    remove(entity, oldKey) {
        if (this.grid.has(oldKey)) {
            this.grid.get(oldKey).delete(entity);
        }
    }

    getNearbyEntities(x, y, radius) {
        const nearby = new Set();
        const cellRadius = Math.ceil(radius / this.cellSize);

        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerCellX + dx},${centerCellY + dy}`;
                if (this.grid.has(key)) {
                    for (const entity of this.grid.get(key)) {
                        if (Phaser.Math.Distance.Between(x, y, entity.x, entity.y) <= radius) {
                            nearby.add(entity);
                        }
                    }
                }
            }
        }

        return nearby;
    }

    clear() {
        this.grid.clear();
    }
}
