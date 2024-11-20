import ArcaneBolt from './ArcaneBolt';
import Spirit from './Spirit';

export default class SpellFactory {
    static createSpell(type, scene, config) {
        console.log('Creating spell:', type, 'with config:', config);

        const baseData = {
            scene,
            x: 0,
            y: 0,
            texture: 'playerChar',  // Explicitly set texture
            frame: 'arcane000',     // Set initial frame
            config
        };

        switch (type) {
            case 'ArcaneBolt':
                const spell = new ArcaneBolt(baseData);
                console.log('Created ArcaneBolt sprite:',
                    'texture:', spell.texture.key,
                    'frame:', spell.frame.name,
                    'visible:', spell.visible,
                    'active:', spell.active
                );
                return spell;
        }
    }
}
