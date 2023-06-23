import chalk from "chalk";
import UserDataManager from "../users/UserDataManager.js";
import SettingsManager from "../settings/SettingsManager.js";

const MAIN_BANK_USER_ID = -1;
const JACKPOT_BANK_USER_ID = -2;

class CasinoManager {

    #mainBankUser;
    #jackpotBankUser;

    constructor() {
        this.#mainBankUser = UserDataManager.ensureUser(MAIN_BANK_USER_ID);
        this.#jackpotBankUser = UserDataManager.ensureUser(JACKPOT_BANK_USER_ID);
        this
    }

    rollWin(userData, betAmount) {
        let winChance = SettingsManager.getSetting(userData, "casino.winChance");
        let roll = Math.random();
        if (roll < winChance) {
            return true;
        }
        return false;
    }
    rollJackpot(userData, betAmount) {
        let minBet = SettingsManager.getSetting(userData, "casino.minJackpotBet");
        let minRatio = SettingsManager.getSetting(userData, "minJackpotRatio");
        let jackpotChance = SettingsManager.getSetting(userData, "casino.jackpotChance");

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
        let jackpotFillRatio = SettingsManager.getSetting(userData, "casino.jackpotFillRatio");
        let jackpotContribution = Math.floor(betAmount * jackpotFillRatio);
        if (userData.points < betAmount) {
            replyFunc(`You cannot afford a bet of that size! You only have \$${userData.points}.`);
            return;
        }

        userData.points -= betAmount;
        this.#mainBankUser.points += (betAmount - jackpotContribution);
        this.jackpotSize += jackpotContribution;

        if (this.rollWin(userData, betAmount)) {
            if (this.rollJackpot(userData, betAmount)) {
                let jackpotAmount = this.jackpotSize;

                this.jackpotSize = 0;
                userData.points += jackpotAmount;
                replyFunc(`YOU WIN THE JACKPOT OF \$${jackpotAmount}! You now have \$${userData.points}.`);
            } else {
                userData.points += (betAmount * 2);
                replyFunc(`You won 2x your bet! You now have \$${userData.points}. You should try to win even more :)`);
            }
        } else {
            replyFunc(`Sorry, you didn't win this time. You now have \$${userData.points}. Maybe you should try again :)`);
        }
        this.logBalance();
    }

    logBalance() {
        console.log(`${new Date().toISOString()} ${chalk.yellow(`[CASINO]`)} ${chalk.gray(`Profit: ${this.profitSize} | Jackpot: ${this.jackpotSize}`)}`);
    }

    get mainBankUserData() {
        return this.#mainBankUser;
    }
    get jackpotBankUserData() {
        return this.#jackpotBankUser;
    }

    get profitSize() {
        return this.#mainBankUser.points;
    }
    get jackpotSize() {
        return this.#jackpotBankUser.points;
    }
    set jackpotSize(value) {
        this.#jackpotBankUser.points = value;
    }
}

export default new CasinoManager();