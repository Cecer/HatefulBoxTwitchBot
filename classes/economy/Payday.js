import chalk from "chalk";

const TAX_VOID_USER_ID = -3;
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
        let payableUsers = this.#userDataManager.getAll()
            .filter(d => !this.#settingsManager.getSetting(d, "payday.excluded"))
            .filter(d => d.lastSeen > (Date.now() - this.#settingsManager.getSetting(d, "payday.maxIdleTime")));

        if (payableUsers.length === 0) {
            return;
        }
        
        let taxRefund = 0;
        let taxRefundShare = 0;
        let taxActionRand = Math.random();
        if (taxActionRand > 0.8) {
            let taxUser = this.#userDataManager.ensureUser(TAX_VOID_USER_ID);
            if (taxActionRand > 0.98) {
                taxRefund = taxUser.points * Math.random();
                taxRefundShare = Math.floor(taxRefund / payableUsers.length);
                taxRefund = taxRefundShare * payableUsers.length;
                taxUser.points -= taxRefund;
                console.log(`${new Date().toISOString()} ${chalk.green(`[TAX REFUND]`)} ${chalk.gray(` Refunding ${taxRefund} points with ${taxRefundShare} each`)}`);
            } else {
                let decay = taxUser.points * 0.05;
                taxUser.points -= decay;
                console.log(`${new Date().toISOString()} ${chalk.green(`[TAX DECAY]`)} ${chalk.gray(` Removing ${taxUser.points} points from the economy...`)}`);
            }
        }

        payableUsers
            .forEach(d => {
                let payAmount = this.#settingsManager.getSetting(d, "payday.payAmount");
                if (payAmount !== 0) {
                    let randomMultiplier = (Math.random() * 0.2) + 0.9;
                    payAmount = Math.floor(payAmount * randomMultiplier);
                    totalPoints += payAmount;
                    payAmount += taxRefundShare;
                    d.points += payAmount;
                    totalUsers++;
                    console.log(`${new Date().toISOString()} ${chalk.green(`[PAY DAY]`)} ${chalk.gray(`Paid ${payAmount} points to ${d.username}`)}`);
                }
            });
        if (totalUsers > 0 && totalPoints > 0) {
            this.#announcementFunction(`[PAY DAY] Paid a total of ${totalPoints} to ${totalUsers} users!`);
            if (taxRefund > 0) {
                this.#announcementFunction(`[TAX REFUND] Refunded ${taxRefund} points!`);
            }
        }
    }
}