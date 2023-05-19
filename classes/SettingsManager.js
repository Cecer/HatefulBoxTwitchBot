import BetterMap from "./utils/BetterMap.js";

export default class SettingsManager {

    #baseSettings;
    #groupOverrides;

    groupSearchOrder;

    constructor() {
        this.#baseSettings = new BetterMap();
        this.#groupOverrides = new BetterMap();

        this.groupSearchOrder = ["nojackpot", "admin", "bot", "virtual", "broadcaster", "moderator", "vip", "subscriber"];
        for (let group of this.groupSearchOrder) {
            this.#groupOverrides.set(group, new BetterMap());
        }

        this.setBase("commandManager.ignore", false);
        this.setBase("commandManager.prefix", "!");
        
        this.setBase("phraseManager.ignore", false);
        this.setBase("phraseManager.maxPhrasesAtOnce", 2);

        this.setBase("casino.winChance", 0.4001);
        this.setBase("casino.minJackpotBet", 10);
        this.setBase("casino.minJackpotRatio", 3.0);
        this.setBase("casino.jackpotChance", 0.025);
        this.setBase("casino.jackpotFillRatio", 0.25);
        this.setBase("casino.zero.pityChance", 0.4);
        this.setBase("casino.zero.pitySize", 1);
        this.setBase("casino.zero.fineChance", 0.3);
        this.setBase("casino.zero.fineSize", 1);

        this.setBase("command.setting.allowed", false);
        this.setBase("command.group.allowed", false);
        this.setBase("command.mint.allowed", false);
        this.setBase("command.tax.allowed", false);
        this.setBase("command.top.maxCount", 15);
        this.setBase("command.top.excluded", true);
        this.setBase("command.idle.maxCount", 15);
        this.setGroup("nojackpot", "casino.jackpotChance", 0);

        this.setGroup("admin", "command.mint.allowed", true);
        this.setGroup("admin", "command.tax.allowed", true);
        this.setGroup("admin", "command.points.other.allowed", true);
        this.setGroup("admin", "command.top.maxCount", 100);
        this.setGroup("admin", "command.idle.maxCount", 100);
        this.setGroup("admin", "command.setting.allowed", true);
        this.setGroup("admin", "command.group.allowed", true);
        this.setGroup("admin", "command.group.other.allowed", true);
        this.setGroup("admin", "command.group.modify.allowed", true);
        this.setGroup("admin", "command.group.modify.protected", true);

        this.setGroup("bot", "commandManager.ignore", true);
        this.setGroup("bot", "command.idle.excluded", true);

        this.setGroup("virtual", "commandManager.ignore", true);
        this.setGroup("virtual", "command.top.excluded", true);
        this.setGroup("virtual", "command.idle.excluded", true);
    }

    setBase(key, value) {
        this.#baseSettings.set(key, value);
    }
    setGroup(group, key, value) {
        group = group.toLowerCase();
        this.#groupOverrides.get(group).set(key, value);
    }
    
    getSetting(userData, key, fallback = null) {
        let value = this.#baseSettings.getOrDefault(key, fallback);
        
        if (userData) {
            let groups = userData.groups;
            for (let group of this.groupSearchOrder) {
                if (groups.has(group)) {
                    value = this.#groupOverrides.get(group).getOrDefault(key, value);
                }
            }
            value = userData.getSettingOverride(key, value);
        }
        
        return value;
    }

    getGroupSettingOverride(group, key, fallback = null) {
        return this.#groupOverrides.get(group).getOrDefault(key, fallback);
    }
}