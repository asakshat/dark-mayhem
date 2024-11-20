import BaseSpell from './BaseSpell';

export default class ArcaneBolt extends BaseSpell {
    constructor(data) {
        const { scene, x, y, config } = data;
        super({
            scene,
            x,
            y,
            texture: 'playerChar',
            frame: 'arcane000',
            config
        });

        this.target = null;
        this.trackingRadius = 300;
        this.turnRate = 0.05;
        this.hasExploded = false;

        // Add sprite to the scene
        this.scene.add.existing(this);

        // Set the sprite's size and scale
        this.setSize(50, 50);
        this.setOrigin(0.5);
        this.setScale(0.5);

        // Add to physics world
        this.scene.matter.world.add(this.body);

        // Debug sprite creation
        console.log('ArcaneBolt created:', {
            texture: this.texture.key,
            frame: this.frame.name,
            active: this.active,
            visible: this.visible
        });

        // Animation handlers
        this.on('animationcomplete', (anim) => {
            console.log('Animation complete:', anim.key);
            if (anim.key === 'arcane_explosion') {
                this.deactivate();
            }
        });
    }

    fire(x, y, target) {
        super.fire(x, y, target);
        this.target = target;
        this.hasExploded = false;
        this.setVisible(true);
        this.setActive(true);
        this.setPosition(x, y);

        // Start the animation
        this.play('arcane', true);
        console.log('Playing arcane animation:', {
            isPlaying: this.anims.isPlaying,
            currentAnim: this.anims.currentAnim?.key
        });

        if (target) {
            const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
            this.setRotation(angle);
        }
    }

    handleCollision(enemy) {
        if (!this.hasExploded && enemy.active) {
            this.hasExploded = true;
            this.setVelocity(0, 0);

            // Play explosion animation
            this.play('arcane_explosion', true);
            console.log('Playing explosion animation');

            // Deal damage
            if (enemy.takeDamage) {
                enemy.takeDamage(this.damage);
            }
        }
    }

    update() {
        if (!this.active || this.hasExploded) return;

        // Make sure animation is playing
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== 'arcane') {
            this.play('arcane', true);
        }

        // Rest of movement logic
        if (this.target && this.target.active) {
            const targetAngle = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );

            const velocity = new Phaser.Math.Vector2();
            velocity.x = Math.cos(targetAngle) * this.speed;
            velocity.y = Math.sin(targetAngle) * this.speed;

            this.setVelocity(velocity.x, velocity.y);
            this.setRotation(targetAngle);

            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );

            if (distance < this.config.colliderRadius + this.target.width / 2) {
                this.handleCollision(this.target);
            }
        } else {
            const velocity = new Phaser.Math.Vector2(
                Math.cos(this.rotation) * this.speed,
                Math.sin(this.rotation) * this.speed
            );
            this.setVelocity(velocity.x, velocity.y);
        }
    }

    deactivate() {
        this.anims.stop();
        this.hasExploded = false;
        this.setActive(false);
        this.setVisible(false);
        this.target = null;
        this.setVelocity(0, 0);
        this.setPosition(-1000, -1000); // Move off-screen
    }
} 1