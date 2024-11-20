export function createOrcAnimations(scene) {
    const animationTypes = [
        { type: 'orc', actions: ['run', 'death'] },
        { type: 'orc_rouge', actions: ['run', 'death'] },
        { type: 'orc_warrior', actions: ['run', 'death'] },
        { type: 'orc_shaman', actions: ['run', 'death'] }
    ];

    animationTypes.forEach(({ type, actions }) => {
        actions.forEach(action => {
            const frames = [];
            for (let i = 0; i <= 5; i++) {
                const frameName = `${type}_${action}${i.toString().padStart(3, '0')}`;
                frames.push(frameName);
            }

            scene.anims.create({
                key: `${type}_${action}`,
                frames: frames.map(frame => ({ key: 'orc_base', frame })),
                frameRate: 10,
                repeat: action === 'run' ? -1 : 0
            });
        });
    });
}