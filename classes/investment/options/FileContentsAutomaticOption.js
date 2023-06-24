import fs from "node:fs/promises";

import AutomaticOption from "./AutomaticOption.js";

export default class FileContentsAutomaticOption extends AutomaticOption {
    
    #path;

    constructor(id, description, path) {
        super(id, description);
        this.#path = path;
    }

    get _updateFrequency() {
        return 60 * 1000;
    }

    async _getLiveData() {
        return parseFloat(await fs.readFile(this.#path));
    }
}