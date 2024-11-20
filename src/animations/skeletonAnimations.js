export function createSkeletonAnimations(scene) {
    // Define all skeleton variants and their exact frame name prefixes
    const skeletonTypes = [
        { type: 'skel', framePrefix: 'skel' },            // Regular skeleton
        { type: 'skel_base', framePrefix: 'skel_base' },  // Base skeleton
        { type: 'skel_rouge', framePrefix: 'skel_rouge' }, // Rogue skeleton
        { type: 'skel_mage', framePrefix: 'skel_mage' }   // Mage skeleton
    ];

    skeletonTypes.forEach(({ type, framePrefix }) => {
        // Create run animation
        scene.anims.create({
            key: `${type}_run`,
            frames: scene.anims.generateFrameNames('skeleton_base', {
                prefix: `${framePrefix}_run`,
                start: 0,
                end: 5,
                zeroPad: 3
            }),
            frameRate: 10,
            repeat: -1
        });

        // Create death animation
        scene.anims.create({
            key: `${type}_death`,
            frames: scene.anims.generateFrameNames('skeleton_base', {
                prefix: `${framePrefix}_death`,
                start: 0,
                end: 5,
                zeroPad: 3
            }),
            frameRate: 10,
            repeat: 0
        });


    });


}