import fs from "node:fs";

import chalk from "chalk";

import BetterMap from "../utils/BetterMap.js";
import UserData from "./UserData.js";

export default class UserDataManager {

    #usersById;
    #usersByUsername;

    constructor() {
        this.#usersById = new BetterMap();
        this.#usersByUsername = new BetterMap();

        for (let filename of fs.readdirSync("./data/users/")) {
            if (filename.endsWith(".json")) {
                let userId = parseInt(filename.slice(0, -4));
                if (userId) {
                    this.ensureUser(userId);
                }
            }
        }

    }

    /**
     * @returns {UserData[]}
     */
    getAll() {
        return [...this.#usersById.values()];
    }

    /**
     * @param {number} userId 
     * @returns {UserData}
     */
    getUserById(userId) {
        if (typeof userId === "string") {
            userId = parseInt(userId);
        }
        return this.#usersById.get(userId);
    }
    /**
     * @param {string} username 
     * @returns {UserData}
     */
    getUserByUsername(username) {
        username = username.toLowerCase();
        return this.#usersByUsername.get(username);
    }

    /**
     * @param {number} userId 
     * @param {string} username 
     */
    updateUsername(userId, username) {
        if (typeof userId === "string") {
            userId = parseInt(userId);
        }
        username = username.toLowerCase();

        let userData = this.ensureUser(userId);
        if (userData.username !== username) {
            this.#usersByUsername.delete(userData.username);

            console.log(`${chalk.blue(`[UserData]`)} ${chalk.gray(`Updating username from ${userData.username} to ${username}`)}`);
            userData.username = username;
            this.#usersByUsername.set(username, userData);
        }
    }

    /**
     * @param {number} userId 
     * @returns {UserData}
     */
    ensureUser(userId) {
        if (typeof userId === "string") {
            userId = parseInt(userId);
        }

        return this.#usersById.computeIfAbsent(userId, () => {
            let userData = new UserData(userId);
            this.#usersByUsername.set(userData.username, userData);
            console.log(`${chalk.blue(`[UserData]`)} ${chalk.gray(`Loaded ${userData.userId} (${userData.username})`)}`);
            return userData;
        });
    }
}