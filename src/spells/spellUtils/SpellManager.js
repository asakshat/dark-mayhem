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
        // Clean up existing pools first
        this.cleanup();

        Object.entries(SpellConfig).forEach(([spellId, config]) => {
            this.pools.set(spellId, new SpellPool(this.scene, spellId, config));
            this.lastCastTimes.set(spellId, 0);
        });
    }
    cleanup() {
        // Properly destroy all existing pools
        this.pools.forEach(pool => pool.destroy());
        this.pools.clear();
        this.lastCastTimes.clear();
    }
    destroy() {
        this.pool.forEach(spell => {
            if (spell.destroy) {
                spell.destroy();
            }
        });
        this.pool = [];
    }

    canCast(type) {
        // First check if the player owns this spell
        if (!this.scene.spellProgress.ownedSpells.has(type)) {
            return false;
        }

        const currentTime = this.scene.time.now;
        const lastCastTime = this.lastCastTimes.get(type) || 0;
        const cooldown = this.getSpellCooldown(type);
        return currentTime - lastCastTime >= cooldown;
    }

    getSpellCooldown(type) {
        return SpellConfig[type]?.base?.cooldown || 500;
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

        // Create all projectiles at once
        let success = false;
        const config = pool.config;
        const startingProjectiles = config.base.startingProjectiles || 1;

        for (let i = 0; i < startingProjectiles; i++) {
            const spell = pool.getSpell();
            if (spell) {
                spell.projectileIndex = i;
                if (spell.fire(x, y, target)) {
                    success = true;
                }
            }
        }

        if (success) {
            this.lastCastTimes.set(type, this.scene.time.now);
        }

        return success;
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

export class SpellProgress {
    constructor() {
        this.ownedSpells = new Map();
        this.availableSpells = [
            {
                id: 'ArcaneBolt',
                name: SpellConfig.ArcaneBolt.name,
                icon: SpellConfig.ArcaneBolt.icon,
                baseStats: {
                    damage: SpellConfig.ArcaneBolt.base.damage,
                    projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles,
                    cooldown: SpellConfig.ArcaneBolt.base.cooldown
                },
                upgrades: [
                    {
                        level: 2,
                        damage: SpellConfig.ArcaneBolt.base.damage + 20,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 1,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 100
                    },
                    {
                        level: 3,
                        damage: SpellConfig.ArcaneBolt.base.damage + 40,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 2,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 200
                    },
                    {
                        level: 4,
                        damage: SpellConfig.ArcaneBolt.base.damage + 60,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 3,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 200
                    },
                    {
                        level: 5,
                        damage: SpellConfig.ArcaneBolt.base.damage + 80,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 3,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 200
                    },
                    {
                        level: 6,
                        damage: SpellConfig.ArcaneBolt.base.damage + 80,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 3,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 200
                    },
                    {
                        level: 7,
                        damage: SpellConfig.ArcaneBolt.base.damage + 80,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 3,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 200
                    },
                    {
                        level: 8,
                        damage: SpellConfig.ArcaneBolt.base.damage + 80,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 3,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 200
                    },
                    {
                        level: 9,
                        damage: SpellConfig.ArcaneBolt.base.damage + 80,
                        projectiles: SpellConfig.ArcaneBolt.base.startingProjectiles + 3,
                        cooldown: SpellConfig.ArcaneBolt.base.cooldown - 200
                    }
                ]
            },

        ];
        this.MAX_PROJECTILES = 8;
    }


    getSpellInfo(spellId) {
        return this.availableSpells.find(spell => spell.id === spellId);
    }

    getCurrentStats(spellId) {
        const currentLevel = this.ownedSpells.get(spellId) || 0;
        const spellInfo = this.getSpellInfo(spellId);

        if (currentLevel === 0) {
            return spellInfo.baseStats;
        }

        // For level 1, return baseStats
        if (currentLevel === 1) {
            return spellInfo.baseStats;
        }

        // For levels 2+, return the current level's upgrade stats
        const currentUpgrade = spellInfo.upgrades.find(u => u.level === currentLevel);
        return currentUpgrade || spellInfo.baseStats;
    }

    getNextUpgrade(spellId) {
        const currentLevel = this.ownedSpells.get(spellId) || 0;
        const spellInfo = this.getSpellInfo(spellId);
        return spellInfo.upgrades.find(upgrade => upgrade.level === currentLevel + 1);
    }
    upgradeSpell(spellId) {
        const currentLevel = this.ownedSpells.get(spellId) || 0;
        this.ownedSpells.set(spellId, currentLevel + 1);

        // Get new stats with projectile capping
        const newStats = this.getCurrentStats(spellId);
        if (!newStats) return;

        // Cap projectiles for performance
        const cappedProjectiles = Math.min(newStats.projectiles, this.MAX_PROJECTILES);

        // Update the spell configuration
        SpellConfig[spellId].base.damage = newStats.damage;
        SpellConfig[spellId].base.startingProjectiles = cappedProjectiles;
        SpellConfig[spellId].base.cooldown = newStats.cooldown;

        // Update existing pool
        if (this.scene?.systems?.spell) {
            const pool = this.scene.systems.spell.pools.get(spellId);
            if (!pool) return;

            // Update pool configuration first
            pool.config = {
                ...pool.config,
                base: {
                    ...pool.config.base,
                    damage: newStats.damage,
                    startingProjectiles: cappedProjectiles,
                    cooldown: newStats.cooldown,
                    maxProjectiles: this.MAX_PROJECTILES
                }
            };

            // Efficiently update or trim existing pool
            const targetPoolSize = Math.min(this.MAX_PROJECTILES, pool.pool.length);

            // Update existing spells
            pool.pool.slice(0, targetPoolSize).forEach(spell => {
                if (spell) {
                    spell.updateConfig({
                        damage: newStats.damage,
                        cooldown: newStats.cooldown,
                        totalProjectiles: cappedProjectiles
                    });
                }
            });

            // Remove excess projectiles if needed
            if (pool.pool.length > targetPoolSize) {
                const removed = pool.pool.splice(targetPoolSize);
                removed.forEach(spell => {
                    if (spell.destroy) {
                        spell.destroy();
                    }
                });
            }

            // Add new projectiles only if necessary
            const currentSize = pool.pool.length;
            if (currentSize < cappedProjectiles) {
                const spellClass = pool.getSpellClass(spellId);
                for (let i = currentSize; i < cappedProjectiles; i++) {
                    const spell = new spellClass({
                        scene: this.scene,
                        x: -1000,
                        y: -1000,
                        config: pool.config
                    });
                    spell.deactivate();
                    pool.pool.push(spell);
                }
            }
        }
    }

    addNewSpell(spellId) {
        if (!this.ownedSpells.has(spellId)) {
            this.ownedSpells.set(spellId, 1);

            // Get initial stats
            const initialStats = this.getCurrentStats(spellId);

            // Update SpellConfig
            SpellConfig[spellId].base.damage = initialStats.damage;
            SpellConfig[spellId].base.startingProjectiles = initialStats.projectiles;
            SpellConfig[spellId].base.cooldown = initialStats.cooldown;

            // Create new pool
            if (this.scene?.systems?.spell && !this.scene.systems.spell.pools.has(spellId)) {
                const pool = new SpellPool(this.scene, spellId, SpellConfig[spellId]);
                this.scene.systems.spell.pools.set(spellId, pool);

                // Initialize pool with correct number of projectiles
                const maxProjectiles = Math.max(initialStats.projectiles, SpellConfig[spellId].base.maxProjectiles || 10);
                const spellClass = pool.getSpellClass(spellId);

                for (let i = 0; i < maxProjectiles; i++) {
                    const spell = new spellClass({
                        scene: this.scene,
                        x: -1000,
                        y: -1000,
                        config: SpellConfig[spellId]
                    });
                    spell.deactivate();
                    pool.pool.push(spell);
                }
            }
        }
    }
    getRandomNewSpell() {
        const unownedSpells = this.availableSpells.filter(
            spell => !this.ownedSpells.has(spell.id)
        );
        if (unownedSpells.length === 0) return null;
        return unownedSpells[Math.floor(Math.random() * unownedSpells.length)];
    }

    formatUpgradeDescription(currentStats, nextStats) {
        const changes = [];

        // If it's a new spell, use base stats
        if (currentStats.damage === 0) {
            changes.push(`Base Damage: ${nextStats.damage}`);
            changes.push(`Base Projectiles: ${nextStats.projectiles}`);
            changes.push(`Base Cooldown: ${nextStats.cooldown}ms`);
        } else {
            // For upgrades, show current level → next level
            const damageDiff = nextStats.damage - currentStats.damage;
            const projectilesDiff = nextStats.projectiles - currentStats.projectiles;
            const cooldownDiff = currentStats.cooldown - nextStats.cooldown;

            changes.push(`Damage: ${currentStats.damage} → ${nextStats.damage} (${damageDiff >= 0 ? '+' : ''}${damageDiff})`);
            changes.push(`Projectiles: ${currentStats.projectiles} → ${nextStats.projectiles} (${projectilesDiff >= 0 ? '+' : ''}${projectilesDiff})`);
            changes.push(`Cooldown: ${currentStats.cooldown}ms → ${nextStats.cooldown}ms (${cooldownDiff >= 0 ? '-' : '+'}${Math.abs(cooldownDiff)}ms)`);
        }

        return changes.join(', ');
    }

    getUpgradeOptions() {
        const options = [];

        // Add upgrade options for owned spells
        this.ownedSpells.forEach((level, spellId) => {
            const spellInfo = this.getSpellInfo(spellId);
            const nextUpgrade = this.getNextUpgrade(spellId);

            // Get stats for current level
            const currentStats = this.getCurrentStats(spellId);

            if (nextUpgrade) {
                options.push({
                    type: 'upgrade',
                    spellId,
                    spell: spellInfo,
                    currentLevel: level,
                    nextLevel: nextUpgrade,
                    description: this.formatUpgradeDescription(currentStats, nextUpgrade)
                });
            }
        });

        // Add new spell option
        const newSpell = this.getRandomNewSpell();
        if (newSpell) {
            options.push({
                type: 'new',
                spell: newSpell,
                description: this.formatUpgradeDescription(
                    { damage: 0, projectiles: 0, cooldown: 0 },
                    newSpell.baseStats
                )
            });
        }

        return options;
    }
}