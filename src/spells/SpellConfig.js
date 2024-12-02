export const SpellConfig = {
    ArcaneBolt: {
        id: 'ArcaneBolt',
        name: 'Arcane Bolt',
        icon: '🔮',
        base: {
            speed: 3,
            damage: 100,
            colliderRadius: 8,
            startingProjectiles: 1,
            maxProjectiles: 10,
            cooldown: 1000,
        },
        visuals: {
            texture: 'playerChar',
            defaultFrame: 'arcane000',
            animations: {
                cast: {
                    key: 'arcane',
                    ignoreIfPlaying: false
                },
                impact: {
                    key: 'arcane_explosion',
                    ignoreIfPlaying: false,
                    onComplete: null
                }
            }
        },
        behavior: {
            tracking: true,
            explodeOnImpact: true,
            piercing: false,
            searchRadius: 300,
            retargetDelay: 300
        }
    }


};