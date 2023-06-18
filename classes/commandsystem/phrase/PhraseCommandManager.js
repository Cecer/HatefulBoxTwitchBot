import fs from "node:fs";

import PhraseCommandBuilder from "./PhraseCommandBuilder.js";
import BaseCommandManager from "../base/BaseCommandManager.js";

export default class PhrasePhraseManager extends BaseCommandManager {
    
    #settingsManager;
    #phrases;

    constructor(settingsManager) {
        super(settingsManager);
        this.#settingsManager = settingsManager;
        this.#phrases = [];

        this.#registerAutoResponders();
    }

    newBuilder(pattern) {
        return new PhraseCommandBuilder(pattern, c => this.#register(c));
    }

    #register(phrase) {
        this.#phrases.push(phrase);
        console.log(`${new Date().toISOString()} [PhraseManager] Registered phrase: ${phrase.pattern}`);
    }

    handle(userData, message, replyFunc) {
        if (this.isSenderIgnored(userData)) {
            // Ignore this user
            return false;
        }

        let matchCount = 0;
        const maxCount = this.#settingsManager.getSetting(userData, "phraseManager.maxPhrasesAtOnce");
        for (let phrase of this.#phrases) {
            if (phrase.isRateLimited(userData)) {
                // Rate limited
                return false;
            }
            
            if (phrase.doesMessageMatch(message)) {
                // Phrase matched!
                console.log(`${new Date().toISOString()} [PhraseManager] Handling phrase ${phrase.pattern} for ${userData.username}`);
                try {
                    phrase.handle(userData, message, replyFunc);
                    matchCount++;
                    if (matchCount >= maxCount) {
                        break;
                    }
                } catch (e) {
                    console.error("${new Date().toISOString()} [PhraseManager] Error handling command: ", e);
                }
            }
        }
        return true;
    }

    #registerAutoResponders() {
        let autoResponders = JSON.parse(fs.readFileSync("./autoResponders.json", {encoding: "utf8"}));
        for (let phrase of autoResponders.phrases) {
            let patternFlags = "i";
            if ("patternFlags" in phrase) {
                patternFlags = phrase.patternFlags;
            }

            let regex = new RegExp(phrase.pattern, patternFlags);
            let builder = this.newBuilder(regex);

            if ("senderRateLimit" in phrase) {
                builder.senderRateLimit(phrase.senderRateLimit);
            }
            if ("globalRateLimit" in phrase) {
                builder.globalRateLimit(phrase.globalRateLimit);
            }
            let senderPrefix = true;
            if ("senderPrefix" in phrase) {
                senderPrefix = phrase.senderPrefix;
            }
            builder.handler((userData, args, replyFunc) => {
                replyFunc(phrase.response,  senderPrefix);
            })
            .register();
        };
    }
}