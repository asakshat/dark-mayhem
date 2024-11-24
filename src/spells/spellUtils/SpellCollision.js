export class SpellCollisionSystem {
    static handleCollision(spell, target) {
        // Validate spell and target
        if (!target?.active || !spell?.active || !target.takeDamage || spell.hasExploded) {
            return;
        }

        // Immediately set explosion state and stop movement
        spell.hasExploded = true;
        spell.isExploding = true;
        spell.setVelocity(0, 0);

        // Apply damage
        if (target.currentHealth > 0) {
            target.takeDamage(spell.damage);
        }

        // Handle explosion animation and cleanup
        if (spell.scene.anims.exists('arcane_explosion')) {
            spell.play('arcane_explosion', true);

            // Ensure cleanup after animation or timeout
            const cleanup = () => {
                spell.isExploding = false;
                spell.deactivate();
            };

            // Set a safety timeout in case animation fails
            spell.scene.time.delayedCall(300, () => {
                if (spell.active) {
                    cleanup();
                }
            });

            // Normal cleanup after animation
            spell.once('animationcomplete', (anim) => {
                if (anim.key === 'arcane_explosion') {
                    cleanup();
                }
            });
        } else {
            // If no animation, deactivate immediately
            spell.deactivate();
        }
    }
}