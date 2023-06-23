export default class InvestmentOptionSnapshot {
    #data;
    #time;
    #isReal;

    constructor(data, time, isReal) {
        this.#data = data;
        this.#time = time;
        this.#isReal = isReal;
    }
    static fromSave(saveData) {
        return new InvestmentOptionSnapshot(saveData.data, saveData.time, saveData.isReal);
    }
    toSave() {
        return {
            data: this.#data,
            time: this.#time,
            isReal: this.#isReal
        }
    }

    get data() {
        return this.#data;
    }
    get time() {
        return this.#time;
    }
    get isReal() {
        return this.#isReal;
    }
}