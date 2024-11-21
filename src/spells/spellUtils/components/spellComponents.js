
export class SpellComponents {
    static tracking(spell, config) {
        return {
            update: (time) => {
                if (spell.target?.active && !spell.isExploding) {
                    const angle = Phaser.Math.Angle.Between(
                        spell.x, spell.y,
                        spell.target.x, spell.target.y
                    );

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