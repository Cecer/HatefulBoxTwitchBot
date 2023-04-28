import BaseCommand from "../base/BaseCommand.js";

export default class PhraseCommand extends BaseCommand {

    #regex;
    #settingsManager;

    constructor(regex, handler, senderRateLimit, globalRateLimit, settingsManager) {
        super(handler, senderRateLimit, globalRateLimit);

        this.#regex = regex;
        this.#settingsManager = settingsManager;
    }
    
    get pattern() {
        return this.#regex.source
    }

    doesMessageMatch(message) {
        return this.#regex.test(message);
    }

    isSenderAllowed() {
        // TODO: Phrase permission handling
        return true;
    }
}