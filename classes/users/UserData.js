import fs from "node:fs";

import BetterMap from "../utils/BetterMap.js";
import InvestmentManager from "../investment/InvestmentManager.js";

export default class UserData {

    #userId;
    #username;
    
    #groups;
    #settingOverrides;
    
    #points;
    #cachedNetWorth;
    #lastSeen;

    #investments;
    // TODO: Achivements

    #needsSave;
    
    constructor(userId) {
        this.#userId = userId;
        this.#username = `_!USER_${userId}`;

        this.#groups = new Set();
        this.#settingOverrides = new BetterMap();

        this.#points = 1000;
        this.#lastSeen = 0;

        this.#investments = new BetterMap();

        this.#needsSave = false;

        this.#load();
    }
    
    get userId() {
        return this.#userId;
    }

    get username() {
        return this.#username;
    }
    set username(username) {
        if (this.#username !== username) {
            this.#username = username;
            this.save();
        }
    }

    get groups() {
        return this.#groups;
    }
    addGroup(group) {
        if (!this.#groups.has(group)) {
            this.#groups.add(group);
            this.save();
            return true;
        }
        return false;
    }
    removeGroup(group) {
        if (this.#groups.has(group)) {
            this.#groups.delete(group);
            this.save();
            return true;
        }
        return false;
    }
    toggleGroup(group, state) {
        if (state) {
            return this.addGroup(group)
        } else {
            return this.removeGroup(group);
        }
    }

    getSettingOverride(key, defaultValue) {
        return this.#settingOverrides.getOrDefault(key, defaultValue);
    }
    setSettingOverride(key, value) {
        if (!this.#settingOverrides.has(key) || this.#settingOverrides.get(key) !== value) {
            this.#settingOverrides.set(key, value);
            this.save();
        }
    }
    clearSettingOverride(key) {
        if (!this.#settingOverrides.has(key)) {
            this.#settingOverrides.delete(key);
            this.save();
        }
    }

    get points() {
        return this.#points;
    }
    set points(points) {
        if (this.#points !== points) {
            this.#points = points;
            this.save();
        }
    }

    recalculateNetWorth() {
        let stockValue = 0;
        for (let [id, amount] of this.#investments.entries()) {
            stockValue += InvestmentManager.getValue(id) * amount;
        }
        this.#cachedNetWorth = this.#points + stockValue;
        return this.#cachedNetWorth;
    }
    get cachedNetWorth() {
        return this.#cachedNetWorth;
    }

    get lastSeen() {
        return new Date(this.#lastSeen);
    }
    updateLastSeen() {
        this.#lastSeen = Date.now();
        this.save();
    }


    get investments() {
        return this.#investments;
    }
    addInvestment(id, amount) {
        id = id.toUpperCase();
        let newAmount = Math.floor(this.#investments.getOrDefault(id, 0) + amount);
        if (newAmount > 0) {
            this.#investments.set(id, newAmount);
        } else if (newAmount == 0) {
            this.#investments.delete(id);
        }
        this.save();
    }


    #load() {
        let data;
        try {
            data = fs.readFileSync(`./data/users/${this.#userId}.json`, {encoding: "utf8"});
        } catch {
            return;
        }
        data = JSON.parse(data);

        this.#username = data.username;
    
        this.#groups.clear();
        for (let group of data.groups) {
            this.#groups.add(group);
        }

        this.#settingOverrides.clear();
        for (let settingsKey of Object.keys(data.settingOverrides)) {
            let value = data.settingOverrides[settingsKey];
            this.#settingOverrides.set(settingsKey, value);
        }

        this.#points = data.points;
        this.#lastSeen = data.lastSeen;

        if ("investments" in data) {
            for (let id in data.investments) {
                let amount = data.investments[id];
                if (amount > 0) {
                    this.#investments.set(id, amount);
                }
            }
        }
    }

    save() {
        this.#needsSave = true;
        process.nextTick(() => {
            if (this.#needsSave) {
                this.#needsSave = false;
                let data = {
                    userId: this.#userId,
                    username: this.#username,
        
                    groups: [...this.#groups],
                    settingOverrides: Object.fromEntries(this.#settingOverrides),
        
                    points: this.#points,
                    lastSeen: this.#lastSeen,
                    investments: Object.fromEntries(this.#investments)
                };
                data = JSON.stringify(data, null, "    ");
                fs.writeFileSync(`./data/users/${this.#userId}.json`, data, {encoding: "utf8"});
            }
        });
    }
}