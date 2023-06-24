import chalk from "chalk";

import InvestmentOptionSnapshot from "../InvestmentOptionSnapshot.js";
import BaseOption from "./BaseOption.js";

export default class ManualOption extends BaseOption {
    #minDuration;
    #maxDuration;
    #dataQueue;
    #dataHistory;

    #prevSnapshot;
    #nextSnapshot;

    #lerpProgress;
    #lerpedData;


    constructor(id, description) {
        super(id, description);
    }

    _loadSaveData(saveData) {
        super._loadSaveData(saveData);
        this.#minDuration = saveData.minDuration || 1 * 60 * 60 * 1000;
        this.#maxDuration = saveData.maxDuration || 48 * 60 * 60 * 1000;
        this.#dataQueue = saveData.dataQueue;
        this.#dataHistory = saveData.dataHistory;
        this.#prevSnapshot = InvestmentOptionSnapshot.fromSave(saveData.prevSnapshot);
        this.#nextSnapshot = InvestmentOptionSnapshot.fromSave(saveData.nextSnapshot);
    }

    _storeSaveData(saveData) {
        super._storeSaveData(saveData);
        saveData.minDuration = this.#minDuration,
        saveData.maxDuration = this.#maxDuration,
        saveData.dataQueue = this.#dataQueue,
        saveData.dataHistory = this.#dataHistory,
        saveData.prevSnapshot = this.#prevSnapshot.toSave(),
        saveData.nextSnapshot = this.#nextSnapshot.toSave()
    }


    #updateLerpProgress() {
        let elapsedTime = Date.now() - this.#prevSnapshot.time;
        if (elapsedTime < 0) {
            console.warn(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.yellow(`${this.id} has less than zero elapsed time! (${elapsedTime})`)}`);
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
    async tick() {
        this.#updateLerpProgress();

        let remainingMinutes = Math.round((this.#nextSnapshot.time - Date.now()) / 1000 / 60);
        console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.yellow(`${this.id} value is ${Math.floor(this.#valueWithoutUpdate * 100)/100}. Cycle is at ${Math.floor(this.#lerpProgress*10000)/100}% with ${remainingMinutes} minutes remaining.`)}`);
    }

    #cycleSnapshot() {
        console.log(`${new Date().toISOString()} ${chalk.red(`[INVESTMENTS]`)} ${chalk.gray(`Cycling ${this.id}`)}`);
        let start = this.#prevSnapshot;
        let end = this.#nextSnapshot;
        if (start.isReal) {
            this.#dataHistory.push(start.data);
        }

        let isReal;
        let nextData;
        if (end.data <= 0) {
            // This option is dead. Lock it at zero
            isReal = false;
            nextData = 0;
        } else {
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
        }

        let nextDuration = this.#minDuration + Math.floor(Math.random() * (this.#maxDuration - this.#minDuration))

        this.#prevSnapshot = end;
        this.#nextSnapshot = new InvestmentOptionSnapshot(nextData, Date.now() + nextDuration, isReal);

        this._save();
    }

    get #valueWithoutUpdate() {
        return this.#lerpedData * this._unitDataValue;
    }

    get value() {
        this.#updateLerpProgress();
        return this.#valueWithoutUpdate;
    }
}