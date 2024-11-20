export class DebugVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.enabled = process.env.NODE_ENV === 'development';
    }

    visualizeSpawn(player, spawnPoint) {
        if (!this.enabled) return;

        this.drawSpawnPoint(spawnPoint);
        this.drawLineToSpawn(player, spawnPoint);
    }

    drawSpawnPoint(point) {
        this.scene.add.circle(point.x, point.y, 5, 0xff0000)
            .setDepth(1000)
            .setAlpha(0.5);
    }

    drawLineToSpawn(player, spawnPoint) {
        const line = new Phaser.Geom.Line(
            player.x, player.y,
            spawnPoint.x, spawnPoint.y
        );

        const graphics = this.scene.add.graphics({
            lineStyle: { width: 1, color: 0xff0000, alpha: 0.3 }
        })
            .setDepth(1000)
            .strokeLineShape(line);

        this.scene.time.delayedCall(1000, () => graphics.destroy());
    }
}
