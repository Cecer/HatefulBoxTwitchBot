import chalk from "chalk";

import InvestmentOption from "./InvestmentOption.js";
import BetterMap from "../utils/BetterMap.js";

class InvestmentManager {
    
    #options;

    constructor() {
        this.#options = new BetterMap();
        this.#registerOption("CGPT"); // ChatGPTGeneratedNumbers
        this.#registerOption("DLST"); // DownloadSpeedTestInMbps
        this.#registerOption("DRAM"); // DesktopRAMIUseInBytes
        this.#registerOption("FIFW"); // NumberOfTabsInFirstWindow
        this.#registerOption("HDOM"); // HypixelDiscordOnlineMembers
        this.#registerOption("HOTB"); // HeadsOrTailsGeneratedBytes
        this.#registerOption("MCEY"); // MyCaloriesEatenYesterday
        this.#registerOption("MWIK"); // MyWeightInKilograms
        this.#registerOption("PBCP"); // PhoneBatteryChargePercentage
        this.#registerOption("RORG"); // RandomDotOrgGeneratedNumbers
        this.#registerOption("ULST"); // UploadSpeedTestInMbps
        this.#registerOption("WIBT"); // TemperatureInBexhillTomorrow
        this.#registerOption("YTUD"); // SubscribedYouTubeVideosUploadedToday


        this.#tick();
        setInterval(() => {
            this.#tick();
        }, 300000);
    }

    #registerOption(id) {
        id = id.toUpperCase();
        this.#options.set(id, new InvestmentOption(id));
    }

    #tick() {
        console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.gray(`Tick`)}`);
        for (let option of this.#options.values()) {
            option.tick();
        }
    }

    get investmentKeys() {
        return this.#options.keys();
    }

    isValidId(id) {
        return this.#options.has(id.toUpperCase());
    }

    getValue(id) {
        let option = this.#options.get(id);
        if (option === undefined) {
            return undefined;
        }
        return Math.round(option.value);
    }

}

export default new InvestmentManager();