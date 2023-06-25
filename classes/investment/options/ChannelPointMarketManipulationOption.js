import chalk from "chalk";

import NumberUtils from "../../utils/NumberUtils.js";
import AutomaticOption from "./AutomaticOption.js";

const SIGMOID_SENSITIVITY = 0.0183175;
const RANDOM_RANGE = 0.3;

export default class ChannelPointMarketManipulationOption extends AutomaticOption {

    #influence;
    #influenceChanged;
    
    constructor(id, description) {
        super(id, description);
        this.#influenceChanged = false;
    }

    _loadSaveData(saveData) {
        super._loadSaveData(saveData);
        this.#influence = saveData.influence || 0;
    }
    _storeSaveData(saveData) {
        super._storeSaveData(saveData);
        saveData.influence = this.#influence;
    }

    get _updateFrequency() {
        if (this.#influenceChanged) {
            return 1;
        }
        return 15 * 60 * 1000;
    }

    async _getLiveData() {
        this.#influenceChanged = false;
        
        // Influence decay
        if (this.#influence !== 0) {
            if (Math.random() < 0.00207) {
                this.#influence -= Math.sign(this.#influence);
                console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.gray(`Balancing out CPMM`)}`);
            }
        }

        // Influenced random
        let offset = NumberUtils.sigmoid(this.#influence, SIGMOID_SENSITIVITY) - 0.5;
        let random = NumberUtils.normalRandom(5);

        // Return value;

        let data = (random * RANDOM_RANGE) + ((1 - RANDOM_RANGE) / 2) + offset;
        return Math.max(0.001, data); // Don't allow it to actually reach 0
    }

    applyInfluence(amount) {
        this.#influence = Math.min(1000, Math.max(-1000, this.#influence + amount)); // Silently cap influence to +/- 1000 to prevent reaching 0 or 1 
        this.#influenceChanged = true;
        this._save();
    }
}