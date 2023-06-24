import fs from "node:fs/promises";

import RconManager from "../rcon/RconManager.js";
import UserDataManager from "../users/UserDataManager.js";
import TwitchManager from "./TwitchManager.js";

const CONVERT_TO_BOX_POINTS_REWARD_ID = "9c4a1168-e229-469a-be50-96b6c47d5076";
const SUPPORT_CPMM_REWARD_ID = "7df242c1-b8b8-42d3-8c06-ea8328df152c";
const CRITICISE_CPPM_REWARD_ID = "dab294e0-ec6e-4ee9-9176-41441f5b0fec";

class RedemptionManager {

    #registry;
    
    #channelId;

    constructor(config) {
        this.#channelId = config.channel.id;
        
        this.#registry = new Map();
        this.#registry.set(CONVERT_TO_BOX_POINTS_REWARD_ID, this.#handle_convertToBoxPoints);
        this.#registry.set(SUPPORT_CPMM_REWARD_ID, this.#handle_supportCPPM);
        this.#registry.set(CRITICISE_CPPM_REWARD_ID, this.#handle_criticiseCPPM);
    }

    async processRedeption(data) {
        let userData = UserDataManager.getUserById(data.userId);
        await RconManager.printTwitchRedeption(userData, data.rewardTitle);

        let handler = this.#registry.get(data.rewardId);
        if (handler === undefined) {
            console.log(`Ignoring unknown reward: ${data.rewardId}`);
            return;
        }

        let handle = new RedemptionHandle(this.#channelId, userData, data);
        if (userData.groups.has("freeredeems")) {
            await handle.refund();
        }
        handler.call(this, handle);
    }

    async #handle_convertToBoxPoints(handle) {
        handle.userData.points += handle.cost;
        await handle.complete();
        await handle.reply(`Channels points converted. Enjoy the \$${handle.cost}!`);
    }

    async #handle_supportCPPM(handle) {
        await handle.refund();
        await handle.reply("That reward is not yet implemented. Your channel points have been refunded.");
    }

    async #handle_criticiseCPPM(handle) {
        await handle.refund();
        await handle.reply("That reward is not yet implemented. Your channel points have been refunded.");
    }
}

class RedemptionHandle {
    #channelId;
    #userData;
    #rewardId;
    #redeptionId;
    #cost;

    #alreadyResolved;

    constructor(channelId, userData, data) {
        this.#channelId = channelId;
        this.#userData = userData;
        this.#rewardId = data.rewardId;
        this.#redeptionId = data.id;
        this.#cost = data.rewardCost;

        this.#alreadyResolved = false;
    }

    get channelId() {
        return this.#channelId;
    }
    get userData() {
        return this.#userData;
    }
    get rewardId() {
        return this.#rewardId;
    }
    get redeptionId() {
        return this.#redeptionId;
    }
    get cost() {
        return this.#cost;
    }

    async reply(message) {
        TwitchManager.sendChatReply(this.#userData, message, true);
    }
    async refund() {
        if (this.#alreadyResolved) {
            return;
        }

        await TwitchManager.apiClient.channelPoints.updateRedemptionStatusByIds(this.#channelId, this.#rewardId, [this.#redeptionId], "CANCELED");
        this.#alreadyResolved = true;
    }
    async complete() {
        if (this.#alreadyResolved) {
            return;
        }

        if (this.#userData.groups.has("freeredeems")) {
            await this.refund();
            return;
        }

        await TwitchManager.apiClient.channelPoints.updateRedemptionStatusByIds(this.#channelId, this.#rewardId, [this.#redeptionId], "FULFILLED");
        this.#alreadyResolved = true;
    }
}

const config = JSON.parse(await fs.readFile("./config.json"));
export default new RedemptionManager(config);