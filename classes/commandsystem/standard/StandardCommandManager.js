import fs from "node:fs";

import BaseCommandManager from "../base/BaseCommandManager.js";
import StandardCommandBuilder from "./StandardCommandBuilder.js";
import SettingsManager from "../../settings/SettingsManager.js";

class StandardCommandManager extends BaseCommandManager {

    #commands;

    constructor() {
        super();
        this.#commands = new Map();

        this.#registerAutoResponders();
    }

    newBuilder(name) {
        return new StandardCommandBuilder(name, c => this.#register(c), SettingsManager);
    }

    #register(command) {
        this.#commands.set(command.name, command);
        if (command.id === command.name) {
            console.log(`${new Date().toISOString()} [CommandManager] Registered command: ${command.name}`);
        } else {
            console.log(`${new Date().toISOString()} [CommandManager] Registered command alias: ${command.name} => ${command.id}`);
        }
    }

    handle(userData, message, replyFunc) {
        message = message.trim();
        
        let prefix = SettingsManager.getSetting(userData, "commandManager.prefix");
        if (message.indexOf(prefix) !== 0) {
            // Not a command
            return false;
        }
        if (this.isSenderIgnored(userData)) {
            // Ignore this user
            return false;
        }
        
        let parts = message.substr(prefix.length).trim().split(" ").filter(arg => arg !== "");
        if (parts.length === 0) {
            // Welp...
            return false;
        }
        let command = this.#commands.get(parts[0].toLowerCase());
        if (!command) {
            // No such commands
            return false;
        }

        if (command.isRateLimited(userData)) {
            // Rate limited
            replyFunc(`Slow down! You cannot use that command again yet!`);
            return false;
        }

        if (!command.isSenderAllowed(userData)) {
            // Sender not allowed to execute this command
            replyFunc(`You do not have permission to use that command!`);
            return false;
        }

        parts.shift(); // Remove the first part (the command name) leaving just the arguments

        console.log(`${new Date().toISOString()} [CommandManager] Handling command ${command.name} for ${userData.username}`);
        try {
            command.handle(userData, parts, replyFunc);
        } catch (e) {
            replyFunc(`Something went wrong with that command! IT'S ALL YOUR FAULT!`);
            //replyFunc(`Something went wrong with that command! Sorry about that :(`)
            console.error(`${new Date().toISOString()} [CommandManager] Error handling command: `, e);
        }
        return true;
    }

    #registerAutoResponders() {
        let autoResponders = JSON.parse(fs.readFileSync("./autoResponders.json", {encoding: "utf8"}));
        for (let command of autoResponders.commands) {
            let builder = this.newBuilder(command.name);

            if ("aliases" in command) {
                for (let alias of command.aliases) {
                    builder.addAlias(alias);
                }
            }
            
            if ("senderRateLimit" in command) {
                builder.senderRateLimit(command.senderRateLimit);
            }
            if ("globalRateLimit" in command) {
                builder.globalRateLimit(command.globalRateLimit);
            }
            let senderPrefix = true;
            if ("senderPrefix" in command) {
                senderPrefix = command.senderPrefix;
            }
            builder.handler((userData, args, replyFunc) => {
                replyFunc(command.response,  senderPrefix);
            })
            .register();
        }
    }
}

export default new StandardCommandManager();