import fs from "node:fs/promises";

import { Rcon } from "rcon-client";

class RconManager {

    #config;
    #client;

    constructor(config) {
        this.#config = {
            host: config.mcRcon.hostname,
            port: config.mcRcon.port, 
            password: config.mcRcon.password, 
            timeout: 30000
        };
    }

    async start() {
        await this.#reconnect();
    }

    async #reconnect() {
        console.log(`${new Date().toISOString()} [MCRcon] Connecting...`);
        this.#client = await Rcon.connect(this.#config);
        this.#client.once("error", e => {
            console.error(`${new Date().toISOString()} [MCRcon] Error: ${e}!`);
            setTimeout(() => {
                this.#reconnect();
            }, 100);
        });
        console.log(`${new Date().toISOString()} [MCRcon] Connected!`);
    }
    
    async executeCommand(command, silentLog = false) {
        if (!silentLog) {
            console.log(`${new Date().toISOString()} [MCRcon] Executing: ${command}`);
        }


        let response;
        try {
            response = (await this.#client.send(command)).trim();
        } catch (e) {
            console.error(`${new Date().toISOString()} [MCRcon]   Error: ${e}`);
            await this.#reconnect();
            return "Error";
        }
        if (!silentLog) {
            console.log(`${new Date().toISOString()} [MCRcon]   Response: ${response}`);
        }
        return response;
    }

    async printTwitchChat(userData, message) {
        message = message.replace(/[\u00a7]/g, "");
        let parts = [{
            text: "Twitch > ", 
            color: "#9146ff"
        }];

        parts.push(this.#formatUsername(userData));
        parts.push({
            text: ": " + message,
            color: "white"
        })

        return await this.executeCommand(`tellraw @a ${JSON.stringify(parts)}`, true);
    }

    async printTwitchRedeption(userData, redeptionTitle) {
        let parts = [{
            text: "Twitch > ", 
            color: "#9146ff"
        }];

        parts.push({
            text: `${userData.username} redeemed ${redeptionTitle}`,
            color: "yellow"
        });

        return await this.executeCommand(`tellraw @a ${JSON.stringify(parts)}`, true);
    }

    #formatUsername(userData) {
        if (userData.groups.has("bot")) {
            return {
                text: "[BOT] " + userData.username,
                color: "dark_gray"
            };
        }
        if (userData.groups.has("broadcaster")) {
            return {
                text: "[BOX] " + userData.username,
                color: "#c6ac93"
            };
        }
        if (userData.groups.has("admin")) {
            return {
                text: "[ADMIN] " + userData.username,
                color: "#e91916"
            };
        }
        if (userData.groups.has("moderator")) {
            return {
                text: "[MOD] " + userData.username,
                color: "#00ad03"
            };
        }
        if (userData.groups.has("vip")) {
            return {
                text: "[VIP] " + userData.username,
                color: "#e005b9"
            };
        }
        if (userData.groups.has("subscriber")) {
            return {
                text: "[SUB] " + userData.username,
                color: "#a26b39"
            };
        }
        return {
            text: userData.username,
            color: "gray"
        };
    }
}

const config = JSON.parse(await fs.readFile("./config.json"));
export default new RconManager(config);