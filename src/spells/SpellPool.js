import SpellFactory from './SpellFactory';

export default class SpellPool {
    constructor(scene, type, config, maxSize) {
        this.scene = scene;
        this.type = type;
        this.config = config;
        this.maxSize = maxSize;
        this.pool = [];
        this.initializePool();
    }

    initializePool() {
        for (let i = 0; i < this.maxSize; i++) {
            const spell = SpellFactory.createSpell(this.type, this.scene, this.config);
            spell.deactivate();
            this.pool.push(spell);
        }
    }

    getSpell() {
        return this.pool.find(spell => !spell.active) || null;
    }

    updateActiveSpells() {
        this.pool.forEach(spell => {
            if (spell.active) {
                spell.update();
            }
        });
    }
}