import { SpellTypes } from './SpellTypes';
import SpellPool from './SpellPool';

export default class SpellManager {
    constructor(scene) {
        this.scene = scene;
        this.spellPools = new Map();
        this.lastCastTimes = new Map();
        this.initializeSpellPools();
    }

    initializeSpellPools() {
        Object.entries(SpellTypes).forEach(([spellName, config]) => {
            this.spellPools.set(
                spellName,
                new SpellPool(this.scene, spellName, config, config.maxProjectiles)
            );
            this.lastCastTimes.set(spellName, 0);
        });
    }

    castSpell(spellName, x, y, target) {
        const currentTime = this.scene.time.now;
        const lastCastTime = this.lastCastTimes.get(spellName);
        const config = SpellTypes[spellName];

        if (currentTime - lastCastTime >= config.cooldown) {
            const spellPool = this.spellPools.get(spellName);
            const spell = spellPool.getSpell();

            if (spell) {
                spell.fire(x, y, target);
                this.lastCastTimes.set(spellName, currentTime);
                return spell;
            }
        }
        return null;
    }

    update() {
        this.spellPools.forEach(pool => {
            pool.updateActiveSpells();
        });
    }
}