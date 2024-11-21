export default class SpellFactory {
    static create(type, scene) {
        const config = SpellTypes[type];
        if (!config) {
            throw new Error(`Unknown spell type: ${type}`);
        }

        switch (type) {
            case 'ArcaneBolt':
                return new ArcaneBolt({
                    scene,
                    x: -1000,
                    y: -1000,
                    texture: 'playerChar',
                    frame: 'arcane000',
                    config: {
                        damage: config.damage,
                        speed: config.speed,
                        colliderRadius: config.colliderRadius,
                        cooldown: config.cooldown,
                        animations: {
                            cast: 'arcane',
                            impact: 'arcane_explosion'
                        }
                    }
                });
            default:
                throw new Error(`Spell type ${type} not implemented`);
        }
    }
}