import { SpellComponents } from "../spellUtils/components/spellComponents";
import { SpellCollisionSystem } from "../spellUtils/SpellCollision";

export default class BaseSpell extends Phaser.Physics.Matter.Sprite {
    constructor(data) {
        const { scene, x, y, config } = data;
        super(scene.matter.world, x, y, config.visuals.texture, config.visuals.defaultFrame);

        this.config = config;
        this.scene = scene;
        this.damage = config.base.damage;
        this.speed = config.base.speed;
        this.target = null;
        this.hasExploded = false;
        this.isExploding = false;
        this.cleanupTimeout = null;

        this.setupComponents();
        this.setupPhysics();

        this.setDepth(config.visuals.depth || 200);
        this.setScale(config.visuals.scale || 1);
        this.scene.add.existing(this);
    }
    setupComponents() {
        this.components = {};
        if (this.config.behavior.tracking) {
            this.components.tracking = SpellComponents.tracking(this, this.config);
        }
        if (this.config.behavior.explodeOnImpact) {
            this.components.explosion = SpellComponents.explosion(this, this.config);
        }
    }
    setupPhysics() {
        const { Bodies } = Phaser.Physics.Matter.Matter;
        const circleCollider = Bodies.circle(0, 0, this.config.base.colliderRadius, {
            isSensor: true,
            label: 'spellCollider'
        });

        circleCollider.gameObject = this;

        const CATEGORIES = {
            PLAYER: 0x0001,
            SPELL: 0x0002,
            ENEMY: 0x0004,
            WALL: 0x0008
        };

        this.setExistingBody(circleCollider)
            .setFixedRotation()
            .setCollisionCategory(CATEGORIES.SPELL)
            .setCollidesWith(CATEGORIES.ENEMY)
            .setPosition(-1000, -1000);
    }

    fire(x, y, target) {
        // Clear any existing cleanup timeout
        if (this.cleanupTimeout) {
            this.cleanupTimeout.remove();
            this.cleanupTimeout = null;
        }

        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setAlpha(1);
        this.target = target;
        this.hasExploded = false;
        this.isExploding = false;

        this.setFrame(this.config.visuals.defaultFrame);
        this.play('arcane', true);

        // Set a maximum lifetime for the spell
        this.cleanupTimeout = this.scene.time.delayedCall(5000, () => {
            if (this.active) {
                this.deactivate();
            }
        });
    }

    deactivate() {
        // Clear any existing cleanup timeout
        if (this.cleanupTimeout) {
            this.cleanupTimeout.remove();
            this.cleanupTimeout = null;
        }

        // Stop all animations
        if (this.anims) {
            this.anims.stop();
        }

        // Clear states
        this.hasExploded = false;
        this.isExploding = false;
        this.target = null;

        // Reset physics body and visibility
        this.setActive(false);
        this.setVisible(false);
        this.setPosition(-1000, -1000);
        this.setVelocity(0, 0);

        // Remove any existing animation listeners
        this.removeAllListeners('animationcomplete');
    }

    updateConfig(newConfig) {
        if (newConfig.damage !== undefined) {
            this.damage = newConfig.damage;
        }
        if (newConfig.cooldown !== undefined) {
            this.cooldown = newConfig.cooldown;
        }
        if (newConfig.speed !== undefined) {
            this.speed = newConfig.speed;
        }
    }

    update(time) {
        if (!this.active || this.isExploding) return;

        // Update components (like tracking)
        Object.values(this.components).forEach(component => {
            if (component.update) {
                component.update(time);
            }
        });

        // Optional: Add safety check for stuck spells
        if (this.active && !this.isExploding && !this.target?.active) {
            this.deactivate();
        }
    }

    handleCollision(target) {
        SpellCollisionSystem.handleCollision(this, target);
    }
}
