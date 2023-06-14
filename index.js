import fs from "node:fs";

import { RefreshingAuthProvider } from "@twurple/auth";
import { PubSubClient } from "@twurple/pubsub";
import { ChatClient } from "@twurple/chat";

import UserDataManager from "./classes/users/UserDataManager.js";
import SettingsManager from "./classes/SettingsManager.js";
import StandardCommandManager from "./classes/commandsystem/standard/StandardCommandManager.js";
import PhraseCommandManager from "./classes/commandsystem/phrase/PhraseCommandManager.js";
import Casino from "./classes/economy/Casino.js";
import Payday from "./classes/economy/Payday.js";

import AuthTokenManager from "./classes/auth/AuthTokenManager.js";

import registerUserCommands from "./classes/commands/UserCommands.js";
import registerEconomyCommands from "./classes/commands/EconomyCommands.js";
import registerMiscCommands from "./classes/commands/MiscCommands.js";

const userDataManager = new UserDataManager();
const settingsManager = new SettingsManager(userDataManager);

const commandManager = new StandardCommandManager(settingsManager);
const phraseManager = new PhraseCommandManager(settingsManager);
const casino = new Casino(userDataManager, settingsManager);
const payday = new Payday(userDataManager, settingsManager);

const config = JSON.parse(fs.readFileSync("./config.json"));

const authTokenManager = new AuthTokenManager(config.auth.userId, "./authToken.json", config.auth.clientId, config.auth.clientSecret, config.auth.redirectUrl);
const authProvider = new RefreshingAuthProvider({
    clientId: config.auth.clientId,
    clientSecret: config.auth.clientSecret,
    onRefresh: authTokenManager.onRefresh
});

await authTokenManager.authenticateFromFile(authProvider);
// await authTokenManager.authenticateFromOAuth(authProvider, "");

const pubSubClient = new PubSubClient({ authProvider });
const chatClient = new ChatClient({ 
    authProvider, 
    channels: [config.channel],
    isAlwaysMod: true
});
chatClient.connect();

chatClient.onMessage((channel, _, message, metadata) => {
    let userInfo = metadata.userInfo;
    userDataManager.updateUsername(userInfo.userId, userInfo.userName);

    let userData = userDataManager.getUserById(userInfo.userId);
    userData.toggleGroup("subscriber", userInfo.isSubscriber);
    userData.toggleGroup("vip", userInfo.isVip);
    userData.toggleGroup("moderator", userInfo.isMod);
    userData.toggleGroup("broadcaster", userInfo.isBroadcaster);
    userData.updateLastSeen();

    process.nextTick(() => {
        let replyFunc = (reply, senderPrefix = true) => chatClient.say(channel, `${senderPrefix ? `${userData.username} >> ` : ""}${reply}`);
        if (!commandManager.handle(userData, message, replyFunc)) {
            phraseManager.handle(userData, message, replyFunc);
        }
    });
});

registerUserCommands(commandManager, userDataManager, settingsManager);
registerEconomyCommands(commandManager, userDataManager, settingsManager, casino, payday);
registerMiscCommands(commandManager);

payday.setAnnouncementFunction(message => chatClient.say(config.channel, message));