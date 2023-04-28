import BaseCommandBuilder from "../base/BaseCommandBuilder.js";
import PhraseCommand from "./PhraseCommand.js";

export default class PhraseCommandBuilder extends BaseCommandBuilder {

    #regex;
    #registerFunc;
    #settingsManager;

    constructor(regex, registerFunc, settingsManager) {
        super();
        this.#regex = regex;
        this.#registerFunc = registerFunc;
        this.#settingsManager = settingsManager;
    }
    
    register() {
        let command = new PhraseCommand(this.#regex, this._handler, this._senderRateLimit, this._globalRateLimit, this.#settingsManager);
        this.#registerFunc(command);
    }
}