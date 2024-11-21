export class SpellCollisionSystem {
    static handleCollision(spell, target) {
        if (!target.active || !spell.active) return;

        // First apply damage
        target.takeDamage(spell.damage);

        // Always play explosion animation for any collision
        spell.play('arcane_explosion', true);

        // Only deactivate after animation completes if spell is non-piercing
        if (!spell.config.behavior.piercing) {
            spell.once('animationcomplete', () => {
                spell.deactivate();
            });
        }

        // Stop movement while exploding
        spell.setVelocity(0, 0);
    }
}