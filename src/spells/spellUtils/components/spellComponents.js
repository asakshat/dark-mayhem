
export class SpellComponents {
    static tracking(spell, config) {
        return {
            update: (time) => {
                if (spell.target?.active && !spell.isExploding) {
                    let angle;

                    if (spell.fireAngle !== undefined) {
                        // Use initial fire angle plus slight tracking
                        const targetAngle = Phaser.Math.Angle.Between(
                            spell.x, spell.y,
                            spell.target.x, spell.target.y
                        );

                        // Blend between fire angle and target angle
                        angle = Phaser.Math.Angle.RotateTo(
                            spell.fireAngle,
                            targetAngle,
                            0.1 // Adjust this value to control how much projectiles curve
                        );
                    } else {
                        // Direct tracking if no fire angle set
                        angle = Phaser.Math.Angle.Between(
                            spell.x, spell.y,
                            spell.target.x, spell.target.y
                        );
                    }

                    spell.setVelocity(
                        Math.cos(angle) * spell.speed,
                        Math.sin(angle) * spell.speed
                    );
                    spell.setRotation(angle);
                }
            }
        };
    }

    static explosion(spell, config) {
        return {
            onImpact: (target) => {
                if (!spell.isExploding) {
                    spell.isExploding = true;
                    spell.setVelocity(0, 0);
                    return true;
                }
                return false;
            }
        };
    }
}