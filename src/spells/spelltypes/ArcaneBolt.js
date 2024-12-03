// In ArcaneBolt.js
import { SpellConfig } from '../SpellConfig';
import ProjectileSpells from './ProjectileSpells';
export default class ArcaneBolt extends ProjectileSpells {
    constructor(data) {
        super({
            ...data,
            config: SpellConfig.ArcaneBolt
        });
    }



}