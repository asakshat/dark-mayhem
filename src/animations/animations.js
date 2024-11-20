export function createAnimations(scene) {
    scene.anims.create({
        key: 'walk',
        frames: scene.anims.generateFrameNames('playerChar', {
            prefix: 'walk',
            start: 0,
            end: 7,
            zeroPad: 3
        }),
        frameRate: 12,
        repeat: -1
    });

    scene.anims.create({
        key: 'idle',
        frames: scene.anims.generateFrameNames('playerChar', {
            prefix: 'idle',
            start: 0,
            end: 9,
            zeroPad: 3
        }),
        frameRate: 12,
        repeat: -1
    });

    scene.anims.create({
        key: 'attack',
        frames: scene.anims.generateFrameNames('playerChar', {
            prefix: 'attack',
            start: 0,
            end: 12,
            zeroPad: 3
        }),
    })



    scene.anims.create({
        key: 'arcane',
        frames: scene.anims.generateFrameNames('playerChar', {
            prefix: 'arcane',
            start: 0,
            end: 3,
            zeroPad: 3
        }),
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'arcane_explosion',
        frames: scene.anims.generateFrameNames('playerChar', {
            prefix: 'arcane_explode',
            start: 0,
            end: 6,
            zeroPad: 3
        }),
        frameRate: 15,
        repeat: 0
    });

    scene.anims.create({
        key: 'gethurt',
        frames: scene.anims.generateFrameNames('playerChar', {
            prefix: 'gethurt',
            start: 0,
            end: 2,
            zeroPad: 3
        }),
        frameRate: 10,
        repeat: 0

    })
    scene.anims.create({
        key: 'death',
        frames: scene.anims.generateFrameNames('playerChar', {
            prefix: 'death',
            start: 0,
            end: 17,
            zeroPad: 3
        }),
        frameRate: 12,
        repeat: 0
    });



}