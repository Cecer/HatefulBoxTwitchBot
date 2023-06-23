import fs from "node:fs";
import chalk from "chalk";

import InvestmentOptionSnapshot from "./InvestmentOptionSnapshot.js";

export default class InvestmentOption {
    #id;
    #unitDataValue;
    #dataQueue;
    #dataHistory;

    #prevSnapshot;
    #nextSnapshot;

    #lerpProgress;
    #lerpedData;


    constructor(id) {
        this.#id = id;
        let saveData = JSON.parse(fs.readFileSync(`./data/investments/${this.#id}.json`, "utf8"));
        this.#unitDataValue = saveData.unitDataValue;
        this.#dataQueue = saveData.dataQueue;
        this.#dataHistory = saveData.dataHistory;
        this.#prevSnapshot = InvestmentOptionSnapshot.fromSave(saveData.prevSnapshot);
        this.#nextSnapshot = InvestmentOptionSnapshot.fromSave(saveData.nextSnapshot);
    }

    #save() {
        let saveData = JSON.stringify({
            id: this.#id,
            unitDataValue: this.#unitDataValue,
            dataQueue: this.#dataQueue,
            dataHistory: this.#dataHistory,
            prevSnapshot: this.#prevSnapshot.toSave(),
            nextSnapshot: this.#nextSnapshot.toSave()
        }, null, "    ");
        fs.writeFileSync(`./data/investments/${this.#id}.json`, saveData, "utf8");
    }


    #updateLerpProgress() {
        let elapsedTime = Date.now() - this.#prevSnapshot.time;
        if (elapsedTime < 0) {
            console.warn(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.yellow(`${this.#id} has less than zero elapsed time! (${elapsedTime})`)}`);
            this.#lerpProgress = 0;
            this.#lerpedData = this.#prevSnapshot.data;
            return;
        }

        let fullTime = this.#nextSnapshot.time - this.#prevSnapshot.time;
        let progress = elapsedTime / fullTime;
        if (progress > 1) {
            this.#cycleSnapshot();
            this.#lerpProgress = 0;
            this.#lerpedData = this.#prevSnapshot.data;
            return;
        }
        
        this.#lerpProgress = progress;
        let dataDelta = this.#nextSnapshot.data - this.#prevSnapshot.data;
        let lerpedDataDelta = dataDelta * progress;
        this.#lerpedData = this.#prevSnapshot.data + lerpedDataDelta;
    }
    tick() {
        this.#updateLerpProgress();

        let remainingMinutes = Math.round((this.#nextSnapshot.time - Date.now()) / 1000 / 60);
        console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.yellow(`${this.#id} value is ${Math.floor(this.#valueWithoutUpdate * 100)/100}. Cycle is at ${Math.floor(this.#lerpProgress*10000)/100}% with ${remainingMinutes} minutes remaining.`)}`);
    }

    #cycleSnapshot() {
        console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.gray(`Cycling ${this.#id}`)}`);
        let start = this.#prevSnapshot;
        let end = this.#nextSnapshot;
        if (start.isReal) {
            this.#dataHistory.push(start.data);
        }

        let isReal;
        let nextData;
        if (this.#dataQueue.length > 0) {
            isReal = true;
            nextData = this.#dataQueue.shift();
        } else {
            // We don't have any data. We'll just replay a random previous value instead
            isReal = false;
            nextData = this.#dataHistory[Math.floor(Math.random() * this.#dataHistory.length)];
        }
        let delta = end.data - nextData;
        nextData += (delta * ((Math.random() * 0.2) - 0.1));

        let oneHour = 1000 * 60 * 60;
        let nextDuration = oneHour + Math.floor(Math.random() * oneHour * 48)

        this.#prevSnapshot = end;
        this.#nextSnapshot = new InvestmentOptionSnapshot(nextData, Date.now() + nextDuration, isReal);

        this.#save();
    }

    get #valueWithoutUpdate() {
        return this.#lerpedData * this.#unitDataValue;
    }

    get value() {
        this.#updateLerpProgress();
        return this.#valueWithoutUpdate;
    }
}