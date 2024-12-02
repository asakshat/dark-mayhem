import ArcaneBolt from "../spelltypes/ArcaneBolt";
export default class SpellPool {
    constructor(scene, spellId, config) {
        this.scene = scene;
        this.spellId = spellId;
        this.config = config;
        this.pool = [];
        this.activeSpells = new Set();
        this.initializePool();
    }

    initializePool() {
        const spellClass = this.getSpellClass(this.spellId);
        const size = this.config.base.maxProjectiles;

        for (let i = 0; i < size; i++) {
            const spell = new spellClass({
                scene: this.scene,
                x: -1000,
                y: -1000,
                config: this.config
            });
            spell.deactivate();
            this.pool.push(spell);
        }
    }

    getSpellClass(spellId) {
        switch (spellId) {
            case 'ArcaneBolt':
                return ArcaneBolt;
            default:
                throw new Error(`Unknown spell type: ${spellId}`);
        }
    }

    getSpell() {
        const spell = this.pool.find(spell => !spell.active);
        if (spell) {
            this.activeSpells.add(spell);
        }
        return spell;
    }

    updateActiveSpells(time) {
        // Only update active spells
        this.activeSpells.forEach(spell => {
            if (!spell.active) {
                this.activeSpells.delete(spell);
            } else {
                spell.update(time);
            }
        });
    }


    destroy() {
        this.activeSpells.clear();
        this.pool.forEach(spell => {
            if (spell.destroy) {
                spell.destroy();
            }
        });
        this.pool = [];
    }
}