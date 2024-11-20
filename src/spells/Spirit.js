import BaseSpell from './BaseSpell';

export default class Spirit extends BaseSpell {
    constructor(data) {
        super(data);
        this.angle = data.startAngle || 0;
        this.orbitRadius = data.orbitRadius || 75;
        this.orbitSpeed = data.orbitSpeed || 0.03;
        this.centerObject = data.centerObject;
    }

    fire(x, y) {
        super.fire(x, y);
        this.play('spirit-idle');
    }

    update() {
        if (!this.active || !this.centerObject) return;

        this.angle += this.orbitSpeed;

        const newX = this.centerObject.x + Math.cos(this.angle) * this.orbitRadius;
        const newY = this.centerObject.y + Math.sin(this.angle) * this.orbitRadius;

        this.setPosition(newX, newY);
        this.setRotation(this.angle);

        super.update();
    }
}