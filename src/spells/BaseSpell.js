export default class BaseSpell extends Phaser.Physics.Matter.Sprite {
    constructor(data) {
        const { scene, x, y, texture, frame, config } = data;
        super(scene.matter.world, x, y, texture, frame);

        this.scene = scene;
        this.config = config;
        this.damage = config.damage;
        this.speed = config.speed;
        this.active = false;

        // Add to scene
        this.scene.add.existing(this);

        // Setup physics
        this.setupPhysics();
    }

    setupPhysics() {
        const { Bodies } = Phaser.Physics.Matter.Matter;
        const circleCollider = Bodies.circle(0, 0, this.config.colliderRadius, {
            isSensor: true,
            label: 'spellCollider'
        });

        this.setExistingBody(circleCollider)
            .setFixedRotation()
            .setCollisionCategory(2)
            .setCollidesWith([1])
            .setPosition(-1000, -1000); // Start off-screen

        // Debug physics setup
        console.log('BaseSpell physics setup:', {
            body: this.body,
            collisionCategory: this.body.collisionFilter.category,
            collidesWith: this.body.collisionFilter.mask
        });
    }

    fire(x, y, target) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
    }

    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.setPosition(-1000, -1000);
        this.setVelocity(0, 0);
    }
}