import { SpellConfig } from '../SpellConfig';
import BaseSpell from './BaseSpell';

export default class ArcaneBolt extends BaseSpell {
    constructor(data) {
        super({
            ...data,
            config: SpellConfig.ArcaneBolt
        });
    }
}