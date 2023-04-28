import chalk from "chalk";

const MAIN_BANK_USER_ID = -1;
const JACKPOT_BANK_USER_ID = -2;

export default class Casino {
    
    #userDataManager;
    #settingsManager;

    #mainBankUser;
    #jackpotBankUser;

    constructor(userDataManager, settingsManager) {
        this.#userDataManager = userDataManager;
        this.#settingsManager = settingsManager;
        this.#mainBankUser = this.#userDataManager.ensureUser(MAIN_BANK_USER_ID);
        this.#jackpotBankUser = this.#userDataManager.ensureUser(JACKPOT_BANK_USER_ID);
        this
    }

    rollWin(userData, betAmount) {
        let winChance = this.#settingsManager.getSetting(userData, "casino.winChance");
        let roll = Math.random();
        if (roll < winChance) {
            return true;
        }
        return false;
    }
    rollJackpot(userData, betAmount) {
        let minBet = this.#settingsManager.getSetting(userData, "casino.minJackpotBet");
        let minRatio = this.#settingsManager.getSetting(userData, "minJackpotRatio");
        let jackpotChance = this.#settingsManager.getSetting(userData, "casino.winChance");

        if (betAmount < minBet) {
            // No tiny bets winning jackpot
            return false;
        }

        let jackpotSize = this.jackpotSize;
        if ((betAmount * minRatio) > jackpotSize) {
            // Don't allow jackpots close to a standard win.
            return false;
        }

        let roll = Math.random();
        if (roll < jackpotChance) {
            return true;
        }
        return false;
    }

    play(userData, betAmount, replyFunc) {
        let jackpotFillRatio = this.#settingsManager.getSetting(userData, "casino.jackpotFillRatio");
        let jackpotContribution = Math.floor(betAmount * jackpotFillRatio);
        if (userData.points < betAmount) {
            replyFunc(`You cannot afford a bet of that size! You only have ${userData.points}.`);
            return;
        }

        userData.points -= betAmount;
        this.#mainBankUser.points += (betAmount - jackpotContribution);
        this.#jackpotBankUser.points += jackpotContribution;

        if (this.rollWin(userData, betAmount)) {
            if (this.rollJackpot(userData, betAmount)) {
                let jackpotAmount = this.jackpotSize;

                jackpotBankUser.points = 0;
                userData.points += jackpotAmount;
                replyFunc(`YOU WIN THE JACKPOT OF ${jackpotAmount}! You now have ${userData.points} points.`);
            } else {
                userData.points += (betAmount * 2);
                replyFunc(`You won 2x your bet! You now have ${userData.points} points. You should try to win even more :)`);
            }
        } else {
            replyFunc(`Sorry, you didn't win this time. You now have ${userData.points} points. Maybe you should try again :)`);
        }
        this.logBalance();
    }

    logBalance() {
        console.log(`${chalk.yellow(`[CASINO]`)} ${chalk.gray(`Profit: ${this.profitSize} | Jackpot: ${this.jackpotSize}`)}`);
    }

    get profitSize() {
        return this.#mainBankUser.points;
    }
    get jackpotSize() {
        return this.#jackpotBankUser.points;
    }
}