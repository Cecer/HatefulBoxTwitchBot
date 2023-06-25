import fs from "node:fs/promises";
import chalk from "chalk";

import BetterMap from "../utils/BetterMap.js";

import ManualOption from "./options/ManualOption.js";
import WeatherInBexhillAutomaticOption from "./options/WeatherInBexhillAutomaticOption.js";
import SteamAppPlayerCountAutomaticOption from "./options/SteamAppPlayerCountAutomaticOption.js";
import FileContentsAutomaticOption from "./options/FileContentsAutomaticOption.js";
import ChannelPointMarketManipulationOption from "./options/ChannelPointMarketManipulationOption.js";

class InvestmentManager {
    
    #webhookMessageUrl;
    #options;

    #discordValueHistory;
    #discordValueHistorySize;

    #cpmmOption;

    constructor(config) {
        this.#webhookMessageUrl = config.investment.webhookMessageUrl;

        this.#options = new BetterMap();
        this.#discordValueHistory = [];
        this.#discordValueHistorySize = 360;
        
        this.#cpmmOption = new ChannelPointMarketManipulationOption("CPMM", "Channel point market manipulation");
        this.#registerOptions(
            new ManualOption("CGPT", "Random numbers from ChatGPT (0-2000)"),
            new ManualOption("DLST", "Download speed test in Mbps"),
            new ManualOption("FIFW", "Number of tabs in first Firefox window"),
            new ManualOption("HDOM", "Hypixel Discord online member count"),
            new ManualOption("HOTB", "Bytes generated by Heads or Tails bits"),
            new ManualOption("MCEY", "My calories eaten yesterday"),
            new ManualOption("MWIK", "My weight in KG"),
            new ManualOption("PBCP", "Phone battery charge percentage"),
            new ManualOption("RORG", "Random numbers from random.org (0-2000)"),
            new ManualOption("ULST", "Upload speed test in Mbps"),
            new ManualOption("YTUD", "Subscribed YouTube videos uploaded yesterday"),
            this.#cpmmOption,
            new WeatherInBexhillAutomaticOption("WIBT", "Current temperature in Bexhill"),
            new SteamAppPlayerCountAutomaticOption("DRCP", "Deep Rock current player count", 548430),
            new FileContentsAutomaticOption("DRAM", "DesktopAlpha RAM used in bytes according to free", "./data/misc/DRAM_live_data.txt")
        );

        this.#tick();
        setTimeout(() => {
            this.#tick();
        }, 5000);
        setInterval(() => {
            this.#tick();
        }, 30000);
    }

    #registerOptions(...options) {
        options = [...options].sort((a, b) => a.id > b.id ? 1 : -1);
        for (let option of options) {
            this.#options.set(option.id, option);
            option.reload();
        }
    }

    async #tick() {
        console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.gray(`Tick`)}`);
        for (let option of this.#options.values()) {
            option.tick();
        }
        await this.#updateDiscord();
    }

    get investmentKeys() {
        return this.#options.keys();
    }

    isValidId(id) {
        return this.#options.has(id.toUpperCase());
    }

    getValue(id, round = true) {
        let option = this.#options.get(id.toUpperCase());
        if (option === undefined) {
            return undefined;
        }

        if (round) {
            return Math.round(option.value);
        } else {
            return option.value;
        }
    }

    async #updateDiscord() {
        let fields = [];

        let total = 0;
        let count = 0;

        let firstHistory = this.#discordValueHistory.length > 0 ? this.#discordValueHistory[0] : new BetterMap();
        let latestHistory = new BetterMap();
        for (let id of this.#options.keys()) {
            let newValue = this.getValue(id, false);
            let oldValue = firstHistory.getOrDefault(id, newValue);
            latestHistory.set(id, newValue);
            
            total += newValue;
            count++;
            
            fields.push({
                name: `${id} ${oldValue < newValue ? "▲" : (oldValue > newValue ? "▼" : "")}`,
                value: `Was: \$${Math.round(oldValue)}\nNow: \$${Math.round(newValue)}\n\u200b`,
                inline: true
            });
        }
        this.#discordValueHistory.push(latestHistory);
        if (this.#discordValueHistory.length > this.#discordValueHistorySize) {
            this.#discordValueHistory.shift();
        }


        if (count == 0) {
            console.error(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.red(`Cannot update Discord as there are no options to list!`)}`);
            return;
        }

        let average = Math.round(total / count * 100) / 100;

        let payload = {
            username: "The Box Market",
            footer: "Last updated: ",
            embeds: [
                {
                    title: "Market Value Changes",
                    description: `Here's the latest on the box market. The average share now costs \$${average}.`,
                    timestamp: new Date().toISOString(),
                    fields: fields
                }
            ]
        };

        let response = await (await fetch(this.#webhookMessageUrl, {
            method: "PATCH",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json" 
            }
        })).json();
        //console.error(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.gray(`Discord response: ${JSON.stringify(response)}`)}`);
    }

    reload() {
        for (let option of this.#options.values()) {
            option.reload();
        }
    }

    get CPMMOption() {
        return this.#cpmmOption;
    }
}



const config = JSON.parse(await fs.readFile("./config.json"));
export default new InvestmentManager(config);