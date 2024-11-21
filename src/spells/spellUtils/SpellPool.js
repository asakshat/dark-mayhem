import ArcaneBolt from "../spelltypes/ArcaneBolt";
export default class SpellPool {
    constructor(scene, spellId, config) {
        this.scene = scene;
        this.spellId = spellId;
        this.config = config;
        this.pool = [];
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
        return this.pool.find(spell => !spell.active) || null;
    }

    updateActiveSpells(time) {
        this.pool.forEach(spell => {
            if (spell.active) {
                spell.update(time);
            }
        });
    }

    destroy() {
        this.pool.forEach(spell => {
            if (spell.destroy) {
                spell.destroy();
            }
        });
        this.pool = [];
    }
}