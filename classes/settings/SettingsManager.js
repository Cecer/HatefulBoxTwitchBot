import BetterMap from "../utils/BetterMap.js";

class SettingsManager {

    #baseSettings;
    #groupOverrides;

    groupSearchOrder;

    constructor() {
        this.#baseSettings = new BetterMap();
        this.#groupOverrides = new BetterMap();

        this.groupSearchOrder = ["nojackpot", "admin", "bot", "virtual", "broadcaster", "moderator", "vip", "subscriber", "freeredeems"];
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
        this.setBase("casino.jackpotChance", 0.01);
        this.setBase("casino.jackpotFillRatio", 0.25);
        this.setBase("casino.zero.pityChance", 0.4);
        this.setBase("casino.zero.pitySize", 1);
        this.setBase("casino.zero.fineChance", 0.3);
        this.setBase("casino.zero.fineSize", 1);

        this.setBase("payday.excluded", false);
        this.setBase("payday.maxIdleTime", 10 * 60 * 1000);
        this.setBase("payday.payAmount", 25);

        this.setBase("command.setting.allowed", false);
        this.setBase("command.group.allowed", false);
        this.setBase("command.mint.allowed", false);
        this.setBase("command.tax.allowed", false);
        this.setBase("command.taxall.allowed", false);
        this.setBase("command.welfare.allowed", false);
        this.setBase("command.payday.allowed", false);
        this.setBase("command.top.maxCount", 15);
        this.setBase("command.top.excluded", true);
        this.setBase("command.idle.maxCount", 15);
        this.setBase("command.idle.excluded", true);
        this.setBase("command.smite.cost", 5000);
        this.setBase("command.smite.allowed", true);
        this.setBase("command.splashout.allowed", true);
        this.setBase("command.splashout.maxCount", 20);
        this.setBase("command.splashout.costEach", 25);
        this.setBase("command.rainbow.allowed", true);
        this.setBase("command.rainbow.costEach", 5);
        this.setBase("command.rainbow.maxCount", 1000);
        this.setBase("command.180.allowed", true);
        this.setBase("command.180.cost", 500);
        this.setBase("command.reloadcompanies.allowed", false);
        this.setBase("command.clonereward.allowed", false);
        // this.setBase("command.companies.allowed", false);
        // this.setBase("command.company.allowed", false);
        // this.setBase("command.investments.allowed", false);
        // this.setBase("command.buyshares.allowed", false);
        // this.setBase("command.sellshares.allowed", false);

        this.setGroup("subscriber", "payday.maxIdleTime", 15 * 60 * 1000);
        this.setGroup("subscriber", "payday.payAmount", 50);

        this.setGroup("nojackpot", "casino.jackpotChance", 0);

        this.setGroup("admin", "command.mint.allowed", true);
        this.setGroup("admin", "command.tax.allowed", true);
        this.setGroup("admin", "command.taxall.allowed", true);
        this.setGroup("admin", "command.welfare.allowed", true);
        this.setGroup("admin", "command.payday.allowed", true);
        this.setGroup("admin", "command.points.other.allowed", true);
        this.setGroup("admin", "command.top.maxCount", 100);
        this.setGroup("admin", "command.idle.maxCount", 100);
        this.setGroup("admin", "command.setting.allowed", true);
        this.setGroup("admin", "command.group.allowed", true);
        this.setGroup("admin", "command.group.other.allowed", true);
        this.setGroup("admin", "command.group.modify.allowed", true);
        this.setGroup("admin", "command.group.modify.protected", true);
        this.setGroup("admin", "command.taxall.excluded", true);
        this.setGroup("admin", "command.points.other.allowVirtual", true);
        this.setGroup("admin", "command.pay.allowVirtual", true);
        this.setGroup("admin", "command.tax.allowVirtual", true);
        this.setGroup("admin", "command.taxall.allowVirtual", true);
        this.setGroup("admin", "command.setting.allowVirtual", true);
        this.setGroup("admin", "command.group.allowVirtual", true);
        this.setGroup("admin", "command.splashout.maxCount", 200);
        this.setGroup("admin", "command.splashout.costEach", 0);
        this.setGroup("admin", "command.rainbow.maxCount", 1000);
        this.setGroup("admin", "command.rainbow.costEach", 0);
        this.setGroup("admin", "command.180.allowed", true);
        this.setGroup("admin", "command.clonereward.allowed", true);
        this.setGroup("admin", "command.companies.allowed", true);
        this.setGroup("admin", "command.company.allowed", true);
        this.setGroup("admin", "command.investments.allowed", true);
        this.setGroup("admin", "command.buyshares.allowed", true);
        this.setGroup("admin", "command.sellshares.allowed", true);
        this.setGroup("admin", "command.reloadcompanies.allowed", true);

        this.setGroup("bot", "commandManager.ignore", true);
        this.setGroup("bot", "command.idle.excluded", true);
        this.setGroup("bot", "command.taxall.excluded", true);
        this.setGroup("bot", "command.welfare.excluded", true);
        this.setGroup("bot", "payday.excluded", true);

        this.setGroup("virtual", "commandManager.ignore", true);
        this.setGroup("virtual", "command.top.excluded", true);
        this.setGroup("virtual", "command.idle.excluded", true);
        this.setGroup("virtual", "command.taxall.excluded", true);
        this.setGroup("virtual", "command.welfare.excluded", true);
        this.setGroup("virtual", "payday.excluded", true);
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
export default new SettingsManager();