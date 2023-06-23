import fs from "node:fs/promises";

import { RefreshingAuthProvider } from "@twurple/auth";
import { PubSubClient } from "@twurple/pubsub";
import { ChatClient } from "@twurple/chat";

import AuthTokenManager from "../auth/AuthTokenManager.js";
import UserDataManager from "../users/UserDataManager.js";
import RconManager from "../rcon/RconManager.js";
import StandardCommandManager from "../commandsystem/standard/StandardCommandManager.js";
import PhraseCommandManager from "../commandsystem/phrase/PhraseCommandManager.js";

class TwitchManager {
    #authProvider;

    #pubSubClient;
    #chatClient;

    #channelName;

    constructor(config) {
        this.#authProvider = new RefreshingAuthProvider({
            clientId: config.auth.clientId,
            clientSecret: config.auth.clientSecret,
            onRefresh: (userId, tokenData) => AuthTokenManager.onRefresh(userId, tokenData)
        });
        this.#channelName = config.channel;
    }
    
    async start() {
        // await authTokenManager.authenticateFromOAuth(authProvider, "");
        await AuthTokenManager.authenticateFromFile(this.#authProvider);
        this.#pubSubClient = new PubSubClient({ authProvider: this.#authProvider });
        this.#chatClient = new ChatClient({ 
            authProvider: this.#authProvider, 
            channels: [this.#channelName],
            isAlwaysMod: true
        });
        
        this.#chatClient.connect();

        this.#chatClient.onMessage((channel, _, message, metadata) => this.#onChatMessage(channel, message, metadata));
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
            let replyFunc = (reply, senderPrefix = true) => {
                reply = `${senderPrefix ? `${userData.username} >> ` : ""}${reply}`;
                this.sendChatMesage(reply, channel);
                let selfUserData = UserDataManager.getUserById(config.auth.userId);
                RconManager.printTwitchChat(selfUserData, reply)
            };
            if (!StandardCommandManager.handle(userData, message, replyFunc)) {
                PhraseCommandManager.handle(userData, message, replyFunc);
            }
        });
    }

    sendChatMesage(message, channel) {
        this.#chatClient.say(channel || this.#channelName, message);
    }
}


const config = JSON.parse(await fs.readFile("./config.json"));
export default new TwitchManager(config);


