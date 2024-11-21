// SpellManager.js
import SpellPool from "./SpellPool";
import { SpellConfig } from "../SpellConfig";

export default class SpellManager {
    constructor(scene) {
        this.scene = scene;
        this.pools = new Map();
        this.lastCastTimes = new Map();
        this.initializePools();
    }

    initializePools() {
        Object.entries(SpellConfig).forEach(([spellId, config]) => {
            this.pools.set(spellId, new SpellPool(this.scene, spellId, config));
            this.lastCastTimes.set(spellId, 0);
        });
    }

    canCast(type) {
        const currentTime = this.scene.time.now;
        const lastCastTime = this.lastCastTimes.get(type) || 0;
        const cooldown = this.getSpellCooldown(type);
        return currentTime - lastCastTime >= cooldown;
    }

    getSpellCooldown(type) {
        return SpellConfig[type]?.base?.cooldown || 1000;
    }

    cast(type, x, y, target) {

        if (!this.canCast(type)) {
            return null;
        }

        const pool = this.pools.get(type);
        if (!pool) {
            console.error('No pool found for spell type:', type);
            return null;
        }

        const spell = pool.getSpell();
        if (spell) {
            spell.fire(x, y, target);
            this.lastCastTimes.set(type, this.scene.time.now);
            return spell;
        }

        return null;
    }

    update(time) {
        this.pools.forEach(pool => pool.updateActiveSpells(time));
    }

    shutdown() {
        this.pools.forEach(pool => pool.destroy());
        this.pools.clear();
        this.lastCastTimes.clear();
    }
}