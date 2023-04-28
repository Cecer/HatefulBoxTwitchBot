import BaseCommandBuilder from "../base/BaseCommandBuilder.js";
import StandardCommand from "./StandardCommand.js";

export default class StandardCommandBuilder extends BaseCommandBuilder {

    #id;
    #names;
    #registerFunc;
    #settingsManager;

    constructor(id, registerFunc, settingsManager) {
        super();
        this.#id = id.toLowerCase();
        this.#registerFunc = registerFunc;
        this.#settingsManager = settingsManager

        this.#names = new Set();
        this.addAlias(id);
    }
    
    addAlias(alias) {
        this.#names.add(alias.toLowerCase());
        return this;
    }
    register() {
        for (let name of this.#names) {
            let command = new StandardCommand(this.#id, name, this._handler, this._senderRateLimit, this._globalRateLimit, this.#settingsManager);
            this.#registerFunc(command);
        }
    }
}