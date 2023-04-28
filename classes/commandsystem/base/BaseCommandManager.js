export default class BaseCommandManager {
    #settingsManager;

    constructor(settingsManager) {
        this.#settingsManager = settingsManager;
    }

    newBuilder() {        
        throw new Error("Abstract method not implemented!");
    }
    handle() {
        throw new Error("Abstract method not implemented!");
    }

    isSenderIgnored(userData) {
        return this.#settingsManager.getSetting(userData, "commandManager.ignore");
    }
}