import BaseCommand from "../base/BaseCommand.js";

export default class StandardCommand extends BaseCommand {

    #id;
    #name;
    #settingsManager;

    constructor(id, name, handler, senderRateLimit, globalRateLimit, settingsManager) {
        super(handler, senderRateLimit, globalRateLimit);

        this.#id = id;
        this.#name = name;
        this.#settingsManager = settingsManager;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    isSenderAllowed(userData) {
        if (!this.#settingsManager.getSetting(userData, `command.${this.#id}.allowed`, true)) {
            return false;
        }
        return true;
    }
}