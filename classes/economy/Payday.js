import chalk from "chalk";

const INTERVAL_TIME = 5 * 60 * 1000;

export default class Payday {
    
    #userDataManager;
    #settingsManager;
    #announcementFunction;

    constructor(userDataManager, settingsManager) {
        this.#userDataManager = userDataManager;
        this.#settingsManager = settingsManager;
        this.#announcementFunction = () => {};

        let delay = INTERVAL_TIME - (Date.now() % INTERVAL_TIME);
        console.log(`${new Date().toISOString()} ${chalk.green(`[PAYDAY]`)} ${chalk.gray(`Scheduled for start in ${delay}ms`)}`);
        setTimeout(() => {
            this.processNow();
            setInterval(() => this.processNow(), INTERVAL_TIME);
        }, delay);
    }

    setAnnouncementFunction(func) {
        this.#announcementFunction = func;
    }

    processNow() {
        let totalUsers = 0;
        let totalPoints = 0;
        this.#userDataManager.getAll()
            .filter(d => !this.#settingsManager.getSetting(d, "payday.excluded"))
            .filter(d => d.lastSeen > (Date.now() - this.#settingsManager.getSetting(d, "payday.maxIdleTime")))
            .forEach(d => {
                let payAmount = this.#settingsManager.getSetting(d, "payday.payAmount");
                if (payAmount !== 0) {
                    d.points += payAmount;
                    totalUsers++;
                    totalPoints += payAmount;
                    console.log(`${new Date().toISOString()} ${chalk.green(`[PAYDAY]`)} ${chalk.gray(`Paid ${payAmount} points to ${d.username}`)}`);
                }
            });
        if (totalUsers > 0 && totalPoints > 0) {
            this.#announcementFunction(`[PAYDAY] Paid a total of ${totalPoints} to ${totalUsers} users!`);
        }
    }
}