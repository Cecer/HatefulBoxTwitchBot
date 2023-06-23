import { RefreshingAuthProvider, exchangeCode } from '@twurple/auth';
import fs from 'node:fs/promises';
import chalk from "chalk";

class AuthTokenManager {

    #userId;
    #savePath;
    #clientId;
    #clientSecret;
    #redirectUrl;

    constructor(config) {
        this.#userId = config.auth.userId;
        this.#savePath = "./data/authToken.json";
        this.#clientId = config.auth.clientId;
        this.#clientSecret = config.auth.clientSecret;
        this.#redirectUrl = config.auth.redirectUrl;
    }

    /**
     * @param {RefreshingAuthProvider} authProvider
     */
    async authenticateFromFile(authProvider) {
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Authenticating from file...`)}`);
        let tokenData = JSON.parse(await fs.readFile(this.#savePath, "utf8"));
        authProvider.addUser(this.#userId, tokenData, ["chat"]);
    }
    
    async authenticateFromOAuth(authProvider, code) {
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Authenticating from OAuth...`)}`);
        let tokenData = await exchangeCode(this.#clientId, this.#clientSecret, code, this.#redirectUrl);
        await this.#saveFile(tokenData);
        authProvider.addUser(this.#userId, tokenData, ["chat"]);
    }

    async onRefresh(userId, tokenData) {
        if (userId != this.#userId) {
            throw new Error(`User ID mismatch during auth refresh: ${userId} != ${this.#userId}`);
        }
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Token refreshed for ${userId}!`)}`);
        await this.#saveFile(tokenData);
    }

    async #saveFile(tokenData) {
        console.log(`${new Date().toISOString()} ${chalk.blueBright(`[AUTH]`)} ${chalk.gray(`Saving token data...`)}`);
        let tokenDataJson = JSON.stringify(tokenData, null, 4);
        await fs.writeFile(this.#savePath, tokenDataJson, "utf8");
    }
}


const config = JSON.parse(await fs.readFile("./config.json"));
export default new AuthTokenManager(config);