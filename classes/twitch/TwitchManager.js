import fs from "node:fs/promises";

import { PubSubClient } from "@twurple/pubsub";
import { ChatClient } from "@twurple/chat";
import { ApiClient } from "@twurple/api";

import AuthTokenManager from "../auth/AuthTokenManager.js";
import UserDataManager from "../users/UserDataManager.js";
import RconManager from "../rcon/RconManager.js";
import StandardCommandManager from "../commandsystem/standard/StandardCommandManager.js";
import PhraseCommandManager from "../commandsystem/phrase/PhraseCommandManager.js";
import RedemptionManager from "./RedemptionManager.js";

class TwitchManager {
    #apiClient;
    #pubSubClient;
    #chatClient;

    #channelName;

    #apiUserId
    #chatUserId;
    #pubSubUserId;
    #oauthCodes;

    constructor(config) {
        this.#apiUserId = config.auth.userIds.api;
        this.#chatUserId = config.auth.userIds.chat;
        this.#pubSubUserId = config.auth.userIds.pubSub;
        this.#channelName = config.channel.name;

        this.#oauthCodes = new Map();
        //this.#oauthCodes.set(this.#chatUserId,   "");
        // this.#oauthCodes.set(this.#pubSubUserId, "cc0l9wqxygmpu5asocome6du6uiyaz");
    }
    
    async start() {
        // await this.#authenticate(this.#apiUserId, []); // This is the same as pubsub currently so let's not double authenticate. Twitch might get angry.
        await this.#authenticate(this.#chatUserId, ["chat"]);
        await this.#authenticate(this.#pubSubUserId, []);


        this.#chatClient = new ChatClient({ 
            authProvider: AuthTokenManager.authProvider, 
            channels: [this.#channelName],
            isAlwaysMod: true
        });
        this.#chatClient.connect();
        this.#chatClient.onMessage((channel, _, message, metadata) => this.#onChatMessage(channel, message, metadata));


        new ApiClient({
            authProvider: AuthTokenManager.authProvider
        }).asUser(this.#apiUserId, client => this.#apiClient = client);


        this.#pubSubClient = new PubSubClient({ authProvider: AuthTokenManager.authProvider });
        this.#pubSubClient.onRedemption(this.#pubSubUserId, data => {
            try {
                RedemptionManager.processRedeption(data);
            } catch (e) {
                console.error(`Error during redeption: ${e}`);
            }
            // console.log({
            //     id: data.id,
            //     message: data.message,
            //     redemptionDate: data.redemptionDate,
            //     rewardCost: data.rewardCost,
            //     rewardId: data.rewardId,
            //     rewardIsQueued: data.rewardIsQueued,
            //     rewardTitle: data.rewardTitle,
            //     status: data.status,
            //     userId: data.userId,
            //     userName: data.userName
            // });
        });
    }

    get apiClient() {
        return this.#apiClient;
    }

    async #authenticate(userId, intents) {
        let code = this.#oauthCodes.get(userId);
        if (code === undefined) {
            await AuthTokenManager.authenticateFromFile(userId, intents);
        } else {
            await AuthTokenManager.authenticateFromOAuth(userId, code, intents);
        }
    }

    async #onChatMessage(channel, message, metadata) {
        let userInfo = metadata.userInfo;
        UserDataManager.updateUsername(userInfo.userId, userInfo.userName);
    
    
        let userData = UserDataManager.getUserById(userInfo.userId);
        userData.toggleGroup("subscriber", userInfo.isSubscriber);
        userData.toggleGroup("vip", userInfo.isVip);
        userData.toggleGroup("moderator", userInfo.isMod);
        userData.toggleGroup("broadcaster", userInfo.isBroadcaster);
        userData.updateLastSeen();

        RconManager.printTwitchChat(userData, message);
    
        process.nextTick(() => {
            let replyFunc = (replyMessage, senderPrefix = true) => this.sendChatReply(userData, replyMessage, senderPrefix, channel);
            if (!StandardCommandManager.handle(userData, message, replyFunc)) {
                PhraseCommandManager.handle(userData, message, replyFunc);
            }
        });
    }

    sendChatMessage(message, channel) {
        this.#chatClient.say(channel || this.#channelName, message);
        
        let selfUserData = UserDataManager.getUserById(this.#chatUserId);
        RconManager.printTwitchChat(selfUserData, message)
    }

    sendChatReply(userData, message, senderPrefix, channel) {
        message = `${senderPrefix ? `${userData.username} >> ` : ""}${message}`;
        this.sendChatMessage(message, channel);
    }
}


const config = JSON.parse(await fs.readFile("./config.json"));
export default new TwitchManager(config);


