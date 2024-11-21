export default class Player extends Phaser.Physics.Matter.Sprite {
    constructor(data) {
        const { scene, x, y, texture, frame } = data;
        super(scene.matter.world, x, y, texture, frame);

        this.scene.add.existing(this);
        this.setupPlayerStats();
        this.setupAudio();
        this.setupPhysics();
        this.setupMouseInput();
    }

    setupPlayerStats() {
        this.speed = 4;
        this.maxHealth = 50;
        this.currentHealth = this.maxHealth;
        this.xp = 0;
        this.level = 1;
        this.hurtCooldown = 500;
        this.lastHurtTime = 0;
        this.isHurt = false;
        this.isDead = false;

        this.inputKeys = null;
        this.mouseTarget = new Phaser.Math.Vector2();
        this.isMovingToMouse = false;
        this.moveThreshold = 5; // Add missing threshold
    }

    setupAudio() {

        this.hurtSounds = [
            'playerhurt000',
            'playerhurt001',
            'playerhurt002',
            'playerhurt003',
            'playerhurt004',
            'playerhurt005'
        ];
        this.hurtAudioSprite = this.scene.sound.addAudioSprite('playersfx');
    }

    setupPhysics() {
        const { Body, Bodies } = Phaser.Physics.Matter.Matter;
        const playerCollider = Bodies.circle(this.x, this.y, 14, {
            isSensor: false,
            label: 'playerCollider'
        });
        const playerSensor = Bodies.circle(this.x, this.y, 50, {
            isSensor: true,
            label: 'playerSensor'
        });
        const compoundBody = Body.create({
            parts: [playerCollider, playerSensor],
            frictionAir: 0.05,
        });
        this.setExistingBody(compoundBody).setFixedRotation();
    }

    playRandomHurtSound() {
        const randomSound = Phaser.Math.RND.pick(this.hurtSounds);
        this.hurtAudioSprite.play(randomSound);
    }

    takeDamage(amount) {
        if (this.isDead) return;

        const currentTime = this.scene.time.now;
        if (currentTime - this.lastHurtTime >= this.hurtCooldown) {
            // Store damage info
            this._pendingDamage = amount;
            this._damageTime = currentTime;

            // Play sound and wait for completion
            this.playRandomHurtSound();

            // Apply immediate health update for UI
            const newHealth = Math.max(0, this.currentHealth - amount);
            this.currentHealth = newHealth;
            this.scene.events.emit('playerHealthChanged', this.currentHealth, this.maxHealth);

            this.isHurt = true;
            this.lastHurtTime = currentTime;

            // Play hurt animation
            this.play('gethurt', true);
            this.once('animationcomplete', () => {
                if (!this.isDead) {
                    this.isHurt = false;
                }
            });

            // Check for death
            if (this.currentHealth <= 0) {
                this.die();
            }
        }
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        this.isHurt = false;
        this.isMovingToMouse = false;
        this.inputKeys = null;

        this.setVelocity(0, 0);
        this.setStatic(true);
        this.scene.events.emit('playerDied');

    }

    getXPToNextLevel() {
        return this.level * 100;
    }

    levelUp() {
        this.level++;
        this.maxHealth += 10;
        this.currentHealth = this.maxHealth;
        // Could add level up sound here
    }

    gainXP(amount) {
        this.xp += amount;
        while (this.xp >= this.getXPToNextLevel()) {
            this.levelUp();
            this.xp -= this.getXPToNextLevel();
        }
    }

    update() {
        if (this.isDead || this.isHurt) return;

        let velocity;
        const keyboardVelocity = this.getMovementFromKeys();

        if (keyboardVelocity.x !== 0 || keyboardVelocity.y !== 0) {
            velocity = keyboardVelocity;
            this.isMovingToMouse = false;
        } else {
            velocity = this.getMovementToMouse();
        }

        if (velocity.x !== 0 || velocity.y !== 0) {
            velocity.normalize();
            velocity.scale(this.speed);
            this.setVelocity(velocity.x, velocity.y);

            if (!this.anims.isPlaying || this.anims.currentAnim?.key !== 'walk') {
                this.play('walk', true);
            }
        } else {
            this.setVelocity(0, 0);
            if (!this.anims.isPlaying || this.anims.currentAnim?.key !== 'idle') {
                this.play('idle', true);
            }
        }
    }

    // Movement methods remain the same
    setupMouseInput() {
        this.scene.input.on('pointerdown', (pointer) => {
            this.mouseTarget.x = pointer.worldX;
            this.mouseTarget.y = pointer.worldY;
            this.isMovingToMouse = true;
        });

        this.scene.input.on('pointerup', () => {
            this.isMovingToMouse = false;
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.mouseTarget.x = pointer.worldX;
                this.mouseTarget.y = pointer.worldY;
                this.isMovingToMouse = true;
            }
        });
    }

    getMovementFromKeys() {
        const velocity = new Phaser.Math.Vector2();

        if (this.inputKeys.left.isDown || this.inputKeys.leftArrow.isDown) {
            velocity.x = -1;
            this.flipX = true;
        }
        if (this.inputKeys.right.isDown || this.inputKeys.rightArrow.isDown) {
            velocity.x = 1;
            this.flipX = false;
        }
        if (this.inputKeys.up.isDown || this.inputKeys.upArrow.isDown) {
            velocity.y = -1;
        }
        if (this.inputKeys.down.isDown || this.inputKeys.downArrow.isDown) {
            velocity.y = 1;
        }

        return velocity;
    }

    getMovementToMouse() {
        if (!this.isMovingToMouse) return new Phaser.Math.Vector2();

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.mouseTarget.x, this.mouseTarget.y
        );

        if (distance < this.moveThreshold) {
            this.isMovingToMouse = false;
            return new Phaser.Math.Vector2();
        }

        const angle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.mouseTarget.x, this.mouseTarget.y
        );

        this.flipX = Math.cos(angle) < 0;

        return new Phaser.Math.Vector2(
            Math.cos(angle),
            Math.sin(angle)
        );
    }
}