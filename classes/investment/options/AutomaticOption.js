import chalk from "chalk";

import BaseOption from "./BaseOption.js";

export default class AutomaticOption extends BaseOption {
    
    #lastUpdateTimestamp;
    #latestValue;


    constructor(id, description) {
        super(id, description);
    }

    _loadSaveData(saveData) {
        super._loadSaveData(saveData);
        this.#latestValue = saveData.latestValue || 1;
        this.#lastUpdateTimestamp = saveData.lastUpdateTimestamp || 0;
    }
    _storeSaveData(saveData) {
        super._storeSaveData(saveData);
        saveData.latestValue = this.#latestValue;
        saveData.lastUpdateTimestamp = this.#lastUpdateTimestamp;
    }

    get _updateFrequency() {
        throw new Error("Not implemented!");
    }

    async _getLiveData() {
        throw new Error("Not implemented!");
    }

    async #updateValue() {
        if (this.#latestValue <= 0) {
            // Company is dead
            return 0;
        }
        let value = await this._getLiveData();
        value *=  this._unitDataValue;
        this.#lastUpdateTimestamp = Date.now();
        if (Number.isNaN(value)) {
            console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.yellow(`${this.id} live value is NaN! Skipping update.`)}`);
            return;
        }
        this.#latestValue = value;
    }

    async tick() {
        let timeTillNextUpdate = (this.#lastUpdateTimestamp + this._updateFrequency) - Date.now();
        if (timeTillNextUpdate < 0) {
            await this.#updateValue();
            timeTillNextUpdate = this._updateFrequency;
            this._save();
        }
        console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.yellow(`${this.id} value is ${Math.floor(this.#latestValue * 100)/100}. Next update is in ${Math.round(timeTillNextUpdate / 1000 / 60)} minutes.`)}`);
    }

    get value() {
        return this.#latestValue;
    }
}