import fs from "node:fs";

export default class BaseOption {
    #id;
    #description;
    #unitDataValue;

    constructor(id, description) {
        this.#id = id.toUpperCase();
        this.#description = description;
    }
    reload() {
        let saveData = JSON.parse(fs.readFileSync(`./data/investments/${this.#id}.json`, "utf8"));
        this._loadSaveData(saveData);
    }
    _save() {
        let saveData = {};
        this._storeSaveData(saveData);
        let jsonSaveData = JSON.stringify(saveData, null, "    ");
        fs.writeFileSync(`./data/investments/${this.#id}.json`, jsonSaveData, "utf8");
    }

    _loadSaveData(saveData) {
        this.#unitDataValue = saveData.unitDataValue;
    }
    _storeSaveData(saveData) {
        saveData.id = this.#id;
        saveData.description = this.#description;
        saveData.unitDataValue = this.#unitDataValue;

        for (let key in saveData) {
            if (Number.isNaN(saveData[key])) {
                throw new Error("Refusing to save option with NaN values");
            }
        }
    }

    async tick() {
        throw new Error("Not implemented");
    }

    get id() {
        return this.#id;
    }
    get description() {
        return this.#description;
    }
    get _unitDataValue() {
        return this.#unitDataValue;
    }

    get value() {
        throw new Error("Not implemented!");
    }
}