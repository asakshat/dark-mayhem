import { SpellComponents } from "../spellUtils/components/spellComponents";
import { SpellCollisionSystem } from "../spellUtils/SpellCollision";

export default class BaseSpell extends Phaser.Physics.Matter.Sprite {
    constructor(data) {
        const { scene, x, y, config } = data;
        super(
            scene.matter.world,
            x,
            y,
            config.visuals.texture,
            config.visuals.defaultFrame
        );

        this.config = config;
        this.scene = scene;
        this.damage = config.base.damage;
        this.speed = config.base.speed;
        this.target = null;
        this.hasExploded = false;

        this.setupComponents();
        this.setupPhysics();

        this.setDepth(config.visuals.depth || 200);
        this.setScale(config.visuals.scale || 1);

        this.scene.add.existing(this);
        this.on('animationcomplete', (anim) => {
            if (anim.key === 'arcane_explosion') {
                this.isExploding = false;
            }
        });
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

        this.setExistingBody(circleCollider)
            .setFixedRotation()
            .setCollisionCategory(2)
            .setCollidesWith([1])
            .setPosition(-1000, -1000);
    }
    fire(x, y, target) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setAlpha(1);
        this.target = target;
        this.hasExploded = false;

        console.log('Spell fired:', {
            position: { x, y },
            hasTarget: !!target,
            targetPosition: target ? { x: target.x, y: target.y } : null,
            frame: this.frame.name,
            visible: this.visible,
            alpha: this.alpha,
            depth: this.depth
        });

        this.setFrame(this.config.visuals.defaultFrame);
        this.play('arcane', true);
    }

    deactivate() {
        this.isExploding = false;
        if (this.anims) this.anims.stop();
        this.setActive(false);
        this.setVisible(false);
        this.setPosition(-1000, -1000);
        this.setVelocity(0, 0);
        this.target = null;
    }

    update(time) {
        if (!this.active) return;

        if (!this.isExploding) {
            Object.values(this.components).forEach(component => {
                if (component.update) {
                    component.update(time);
                }
            });
        }
    }

    handleCollision(target) {
        SpellCollisionSystem.handleCollision(this, target);
    }
}
