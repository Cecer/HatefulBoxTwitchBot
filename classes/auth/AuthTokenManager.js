import { RefreshingAuthProvider, exchangeCode } from '@twurple/auth';
import fs from 'node:fs/promises';
import chalk from "chalk";

class AuthTokenManager {

    #clientId;
    #clientSecret;
    #redirectUrl;

    #authProvider;

    constructor(config) {
        this.#clientId = config.auth.clientId;
        this.#clientSecret = config.auth.clientSecret;
        this.#redirectUrl = config.auth.redirectUrl;

        this.#authProvider = new RefreshingAuthProvider({
            clientId: config.auth.clientId,
            clientSecret: config.auth.clientSecret,
            onRefresh: (userId, tokenData) => this.onRefresh(userId, tokenData)
        });
    }

    get authProvider() {
        return this.#authProvider;
    }

    #getSavePath(userId) {
        return `./data/authTokens/${userId}.json`
    }

    async authenticateFromFile(userId, intents) {
        let savePath = this.#getSavePath(userId);
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Authenticating from file...`)}`);
        let tokenData = JSON.parse(await fs.readFile(savePath, "utf8"));
        this.#authProvider.addUser(userId, tokenData, intents);
    }
    
    async authenticateFromOAuth(userId, code) {
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Authenticating from OAuth...`)}`);
        let tokenData = await exchangeCode(this.#clientId, this.#clientSecret, code, this.#redirectUrl);
        await this.#saveFile(userId, tokenData);
        this.#authProvider.addUser(userId, tokenData, intents);
    }

    async onRefresh(userId, tokenData) {
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Token refreshed for ${userId}!`)}`);
        await this.#saveFile(userId, tokenData);
    }

    async #saveFile(userId, tokenData) {
        let savePath = this.#getSavePath(userId);
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Saving token data...`)}`);
        let tokenDataJson = JSON.stringify(tokenData, null, 4);
        await fs.writeFile(savePath, tokenDataJson, "utf8");
    }
}

const config = JSON.parse(await fs.readFile("./config.json"));
export default new AuthTokenManager(config);