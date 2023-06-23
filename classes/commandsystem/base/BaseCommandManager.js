import SettingsManager from "../../settings/SettingsManager.js";

export default class BaseCommandManager {

    newBuilder() {        
        throw new Error("Abstract method not implemented!");
    }
    handle() {
        throw new Error("Abstract method not implemented!");
    }

    isSenderIgnored(userData) {
        return SettingsManager.getSetting(userData, "commandManager.ignore");
    }
}