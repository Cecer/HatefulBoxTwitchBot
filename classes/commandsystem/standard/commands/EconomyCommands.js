// import { ta } from "date-fns/locale";

import SettingsManager from "../../../settings/SettingsManager.js";
import StandardCommandManager from "../StandardCommandManager.js";
import CasinoManager from "../../../casino/CasinoManager.js";
import UserDataManager from "../../../users/UserDataManager.js";
import InvestmentManager from "../../../investment/InvestmentManager.js";
import PaydayManager from "../../../payday/PaydayManager.js";

const TAX_VOID_USER_ID = -3;

export default () => {
    register_points();
    register_top();
    register_pay();
    register_taxall();
    register_welfare();
    register_payday();

    register_mint();
    register_tax();

    register_gamble();
    register_jackpot();
    
    register_companies();
    register_company();
    register_investments();
    register_buyshares();
    register_sellshares();
    // register_migrate();

    register_reloadinvestmentmanager();
}

function sIfPlural(value) {
	return (value === 1 || value === -1) ? "" : "s";
}

function register_points() {
    StandardCommandManager.newBuilder("points")
        .addAlias("balance")
        .senderRateLimit(5000)
        .handler((userData, args, replyFunc) => {
            let target = userData.username;
            if (SettingsManager.getSetting(userData, "command.points.other.allowed", false)) {
                if (args.length >= 1) {
                    target = args[0];
                }
            }

            let targetData = UserDataManager.getUserByUsername(target, SettingsManager.getSetting(userData, "command.points.other.allowVirtual", false));
            if (!targetData) {
                replyFunc(`I don't know of anyone by the name: ${target}`);
                return;
            }

            targetData.recalculateNetWorth();

            if (userData === targetData) {
                replyFunc(`You have \$${targetData.points} (\$${targetData.cachedNetWorth} including investments)!`);
            } else {
                replyFunc(`${targetData.username} has \$${targetData.points} (\$${targetData.cachedNetWorth} including investments)!`);
            }
        })
        .register();
}

function register_top() {
    StandardCommandManager.newBuilder("top")
        .senderRateLimit(10000)
        .handler((userData, args, replyFunc) => {
            let amount = 10;
            if (args.length >= 1) {
                amount = parseInt(args.shift());
                if (Number.isNaN(amount)) {
                    replyFunc(`Usage: !top <amount>`);
                    return;
                }
            }

            if (amount < 0) {
                amount = 0;
            } else {
                let max = SettingsManager.getSetting(userData, "command.top.maxCount");
                if (amount > max) {
                    amount = max;
                }
            }

            let allUsers = UserDataManager.getAll()
                .filter(data => !SettingsManager.getSetting(data, "command.top.excluded"));
            for (let user of allUsers) {
                user.recalculateNetWorth();
            }
            allUsers = allUsers.sort((a, b) => b.cachedNetWorth - a.cachedNetWorth);

            let topUsers = allUsers.slice(0, amount);
            
            let response = `Richest ${amount} users (including investments): ${topUsers
                .map((data, position) => `#${position + 1} ${data.username}: \$${data.cachedNetWorth}`)
                .join(", ")}.`;
            
            if (!topUsers.includes(userData)) {
                response += ` You are #${allUsers.indexOf(userData) + 1}.`;
            }
            

            replyFunc(response);
        })
        .register();
}

function register_pay() {
    StandardCommandManager.newBuilder("pay")
        .senderRateLimit(1000)
        .handler((userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !pay <username> <amount>`);
                return;
            }

            let target = args.shift();
            let targetData = UserDataManager.getUserByUsername(target, SettingsManager.getSetting(userData, "command.pay.allowVirtual", false));
            if (!targetData) {
                replyFunc(`I don't know of anyone by the name: ${target}`);
                return
            }

            let amount = parseInt(args.shift());
            if (Number.isNaN(amount)) {
                replyFunc(`Error: Invalid amount`);
                return;
            }
            if (amount <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            if (userData.points < amount) {
                replyFunc(`You do not have enough points for that!`);
                return;
            }

            userData.points -= amount;
            targetData.points += amount;
            userData.setSettingOverride("command.top.excluded", false);
            targetData.setSettingOverride("command.top.excluded", false);

            replyFunc(`You have transfered \$${amount} to ${target}!`);
        })
        .register();
}

function register_mint() {
    StandardCommandManager.newBuilder("mint")
        .handler((userData, args, replyFunc) => {
            if (args.length < 1) {
                replyFunc(`Usage: !mint <amount>`);
                return;
            }

            let amount = parseInt(args.shift());
            if (Number.isNaN(amount)) {
                replyFunc(`Error: Invalid amount`);
                return;
            }
            if (amount <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            userData.points += amount;
            userData.setSettingOverride("command.top.excluded", false);
            replyFunc(`You have minted \$${amount}! How inflationary!`);
        })
        .register();
}

function register_tax() {
    StandardCommandManager.newBuilder("tax")
        .senderRateLimit(1000)
        .handler((userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !tax <username> <amount>`);
                return;
            }

            let target = args.shift();
            let targetData = UserDataManager.getUserByUsername(target, SettingsManager.getSetting(userData, "command.tax.allowVirtual", false));
            if (!targetData) {
                replyFunc(`I don't know of anyone by the name: ${target}`);
                return
            }

            let amount = parseInt(args.shift());
            if (Number.isNaN(amount)) {
                replyFunc(`Error: Invalid amount`);
                return;
            }
            if (amount <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            targetData.points -= amount;
            targetData.setSettingOverride("command.top.excluded", false);
            replyFunc(`You have taxed ${targetData.username} for \$${amount}!`);
        })
        .register();

}

function register_gamble() {
    StandardCommandManager.newBuilder("gamble")
        .senderRateLimit(2000)
        .handler((userData, args, replyFunc) => {
            let amount;
            if (args.length < 1) {
                replyFunc(`Usage: !gamble <amount>`);
                return;
            }
            switch (args[0].toLowerCase()) {
                case "all":
                case "allin":
                case "yolo": {
                    amount = userData.points;
                    if (amount <= 0) {
                        let pityRandom = Math.random();
                        let pityChance = SettingsManager.getSetting(userData, "casino.zero.pityChance");
                        
                        if (pityChance < pityRandom) {
                            let pitySize = SettingsManager.getSetting(userData, "casino.zero.pitySize");
                            userData.points += pitySize;
                            replyFunc(`You don't have any points you know? It's a good thing I am a nice bot. Have a pity point! +1 point`);
                        } else {
                            pityRandom -= pityChance;
                            let fineChance = SettingsManager.getSetting(userData, "casino.zero.fineChance");
                            if (pityRandom < fineChance) {
                                let fineSize = SettingsManager.getSetting(userData, "casino.zero.fineSize");
                                userData.points -= fineSize;
                                replyFunc(`You don't have any points to gamble. In other news, you have been fined 1 point for wasting casino time!`);
                            } else {
                                replyFunc(`All of what? Come back when you actually have some points to gamble...`);
                            }
                        }
                        return;
                    }
                    break;
                }
                default: {
                    amount = parseInt(args.shift());
                    break;
                }
            }
            if (Number.isNaN(amount)) {
                replyFunc(`Usage: !gamble <amount>`);
                return;
            }
            if (amount <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            CasinoManager.play(userData, amount, replyFunc);
            userData.setSettingOverride("command.top.excluded", false);
        })
        .register();
}

function register_jackpot() {
    StandardCommandManager.newBuilder("jackpot")
        .senderRateLimit(2000)
        .handler((userData, args, replyFunc) => {
            let jackpotSize = CasinoManager.jackpotSize;
            replyFunc(`The current Jackpot is \$${jackpotSize}!`);
        })
        .register();
}

function register_taxall() {
    StandardCommandManager.newBuilder("taxall")
        .handler((userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !taxall <amount> <recipient>`);
                return;
            }

            let amount = args.shift();
            let amountFunc;
            if (amount.endsWith("%")) {
                amount = amount.substring(0, amount.length - 1);
                if (Number.isNaN(amount)) {
                    replyFunc(`Usage: !taxall <amount> <recipient>`);
                    return;
                }

                if (amount < 0 || amount > 100) {
                    replyFunc(`Error: Invalid amount percentage. Must be in the range of 0-100 inclusive.`);
                    return;
                }
                amountFunc = netWorth => Math.floor(netWorth * (amount / 100));
            } else {
                amount = parseInt(amount);
                if (Number.isNaN(amount)) {
                    replyFunc(`Usage: !taxall <amount> <recipient>`);
                    return;
                }
                if (amount <= 0) {
                    replyFunc(`Error: Invalid amount. Must be positive.`);
                    return;
                }
                amountFunc = netWorth => amount;
            }

            let recipient = args.shift();
            let recipientData;
            let logFunc;
            let logLines = [];
            let recipientText;
            switch (recipient) {
                case "void": {
                    recipientData = UserDataManager.ensureUser(TAX_VOID_USER_ID);
                    logFunc = (fromData, netWorth) => {
                        logLines.push(`\$${netWorth} from ${fromData.username}`);
                    };
                    recipientText = "into a blackhole."
                    break;
                }
                case "jackpot": {
                    recipientData = CasinoManager.jackpotBankUserData;
                    logFunc = (fromData, points) => {
                        logLines.push(`\$${points} from ${fromData.username}`);
                    };
                    recipientText = "into the casino jackpot";
                    break;
                }
                default: {
                    if (recipient.startsWith("@")) {
                        recipient = recipient.substring(1);
                        recipientData = UserDataManager.getUserByUsername(recipient, settingsManager.getSetting(userData, "command.taxall.allowVirtual", false));
                        if (!recipientData) {
                            replyFunc(`Error: I don't know of anyone by the name: ${recipient}`);
                            return;
                        }
                        logFunc = (fromData, points) => {
                            logLines.push(`\$${points} from ${fromData.username}`);
                        };
                        recipientText = `to ${recipientData.username}`;
                        break;
                    }
                    replyFunc(`Error: I don't know what you mean by ${recipient}. WHere do you want to send the points exactly? Examples: void, jackpot, @username`)
                    return;
                }
            }

            let taxableUsers = UserDataManager.getAll()
                    .filter(d => !SettingsManager.getSetting(d, "command.taxall.excluded"))
                    .filter(d => d !== recipientData);
            for(let user of taxableUsers) {
                user.recalculateNetWorth();
            }
            taxableUsers = taxableUsers
                    .filter(d => d.cachedNetWorth > 1000);

            let total = 0;
            for (let data of taxableUsers) {
                let userAmount = Math.ceil(data.cachedNetWorth - 1000);
                if (userAmount <= 0) {
                    continue;
                }
                userAmount = amountFunc(userAmount);
                if (userAmount <= 0) {
                    continue;
                }


                total += userAmount;
                data.points -= userAmount;
                recipientData.points += userAmount;
                logFunc(data, userAmount);
            }
            if (total <= 0) {
                replyFunc("No tax is due.");
            } else {
                let joinedLines;
                if (logLines.length === 1) {
                    joinedLines = logLines[0];
                } else {
                    let lastLine = logLines.pop();
                    joinedLines = logLines.join(", ");
                    joinedLines += ` and ${lastLine}`;
                }
                replyFunc(`Sent ${joinedLines} ${recipientText}`);
                replyFunc(`Total tax collected: ${total}`);
            }
        })
        .register();
}

function register_welfare() {
    StandardCommandManager.newBuilder("welfare")
        .handler((userData, args, replyFunc) => {
            if (args.length < 1) {
                replyFunc(`Usage: !welfare <amount>`);
                return;
            }

            let amount = args.shift();
            amount = parseInt(amount);
            if (Number.isNaN(amount)) {
                replyFunc(`Usage: !welfare <amount>`);
                return;
            }
            if (amount <= 0) {
                replyFunc(`Error: Invalid amount. Must be positive.`);
                return;
            }

            let poorUsers = UserDataManager.getAll()
                    .filter(d => !SettingsManager.getSetting(d, "command.welfare.excluded"))
            for(let user of poorUsers) {
                user.recalculateNetWorth()
            }
            poorUsers = poorUsers.filter(d => d.cachedNetWorth < 1000);

            let total = 0;
            for (let data of poorUsers) {
                let userAmount = Math.floor(1000 - data.cachedNetWorth);
                if (userAmount <= 0) {
                    continue;
                }
                total += userAmount;
            }
            let multiplier = Math.min(amount / total, 1);
            total = 0;

            for (let data of poorUsers) {
                let userAmount = Math.floor(1000 - data.cachedNetWorth);
                if (userAmount <= 0) {
                    continue;
                }

                userAmount = Math.floor(userAmount * multiplier);
                if (userAmount == 0) {
                    continue;
                }

                total += userAmount;
                data.points += userAmount;
                replyFunc(`Granted \$${userAmount} to ${data.username}.`);
            }

            replyFunc(`Total given: ${total}`);
        })
        .register();
}

function register_payday() {
    StandardCommandManager.newBuilder("payday")
        .handler((userData, args, replyFunc) => {
            replyFunc(`Forcing a bonus pay day!`);
            PaydayManager.processNow();
        })
        .register();
}

function register_companies() {
    StandardCommandManager.newBuilder("companies")
        .addAlias("stockmarket")
        .globalRateLimit(60000)
        .handler((userData, args, replyFunc) => {
            replyFunc(`Companies: ${[...InvestmentManager.investmentKeys]
                .filter(id => id !== "SURE")
                .map(id => {
                    let value = InvestmentManager.getValue(id);
                    if (value <= 0) {
                        return null;
                    }
                    return `${id}: \$${value}`
                })
                .filter(entry => entry !== null)
                .join(" | ")}`);
        })
        .register();
}
function register_company() {
    StandardCommandManager.newBuilder("company")
        .senderRateLimit(5000)
        .handler((userData, args, replyFunc) => {
            if (args.length < 1) {
                replyFunc(`Usage: !company <company_id>`);
                return;
            }

            let id = args.shift().toUpperCase();
            if (!InvestmentManager.isValidId(id)) {
                replyFunc(`Error: Unknown company ID.`);
                return;
            }

            let amount = userData.investments.getOrDefault(id, 0);
            let value = InvestmentManager.getValue(id);
            let ownedValue = value * amount;
            replyFunc(`${id} is worth \$${value} per share. You own ${amount} shares${amount > 0 ? ` valued at \$${ownedValue}`: ""}.`);
        })
        .register();
}
function register_investments() {
    StandardCommandManager.newBuilder("investments")
        .addAlias("portfolio")
        .addAlias("stocks")
        .addAlias("shares")
        //.senderRateLimit(60000)
        .handler((userData, args, replyFunc) => {
            let ids = [...userData.investments.keys()];

            if (ids.length === 0) {
                replyFunc("You don't own any shares.");
                return;
            }
            
            let total = 0;
            replyFunc(`Here is your investment portfolio: ${ids
                .map(id => {
                    let value = InvestmentManager.getValue(id);
                    let count = userData.investments.get(id);
                    total += (value * count);
                    return `${id}: ${count} (\$${value * count})`
                })
                .join(" | ")}. Total: \$${total}`);
        })
        .register();
}
function register_buyshares() {
    StandardCommandManager.newBuilder("buyshares")
        .addAlias("buyshare")
        .addAlias("buystock")
        .addAlias("buystocks")
        .senderRateLimit(2000)
        .handler((userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !buyshares <company_id> <amount>`);
                return;
            }

            let id = args.shift().toUpperCase();
            if (!InvestmentManager.isValidId(id)) {
                replyFunc(`Error: Unknown company ID.`);
                return;
            }
            

            let value = InvestmentManager.getValue(id);
            if (value <= 0) {
                replyFunc(`Error: That company is dead. You cannot trade it.`);
                return;
            }

            let amount = args.shift();
            if (amount.startsWith("$")) {
                amount = parseInt(amount.substring(1));
                amount = Math.floor(amount / value);
            } else {
                amount = parseInt(amount);;
            }

            if (Number.isNaN(amount)) {
                replyFunc(`Error: Invalid amount`);
                return;
            }
            if (amount <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            let purchaseValue = value * amount;

            if (userData.points < purchaseValue) {
                replyFunc(`Error: You need \$${purchaseValue} to buy ${amount} share${sIfPlural(amount)}. You only have \$${userData.points}.`);
                return;
            }

            userData.points -= purchaseValue;
            userData.addInvestment(id, amount);
            replyFunc(`You have purchased ${amount} ${id} share${sIfPlural(amount)} for \$${purchaseValue}.`);
        })
        .register();
}
function register_sellshares() {
    StandardCommandManager.newBuilder("sellshares")
        .addAlias("sellshare")
        .addAlias("sellstock")
        .addAlias("sellstocks")
        .senderRateLimit(2000)
        .handler((userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !sellshares <company_id> <amount>`);
                return;
            }

            let id = args.shift().toUpperCase();
            if (!InvestmentManager.isValidId(id)) {
                replyFunc(`Error: Unknown company ID.`);
                return;
            }
            

            let value = InvestmentManager.getValue(id);
            if (value <= 0) {
                replyFunc(`Error: That company is dead. You cannot trade it.`);
                return;
            }

            let owned = userData.investments.getOrDefault(id, 0);

            let amount = args.shift();
            if (amount.startsWith("$")) {
                amount = parseInt(amount.substring(1));
                amount = Math.floor(amount / value);
            } else if (amount.toLowerCase() === "all") {
                amount = owned;
            } else {
                amount = parseInt(amount);
            }

            if (Number.isNaN(amount)) {
                replyFunc(`Error: Invalid amount`);
                return;
            }
            if (amount <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            if (owned == 0) {
                replyFunc(`Error: You don't have any ${id} shares to sell!`);
                return;
            }
            if (owned < amount) {
                replyFunc(`Error: You only have ${owned} ${id} share${sIfPlural(owned)}!`);
                return;
            }

            let sellValue = value * amount;

            if (id === "SURE") {
                let riskFactor = sellValue / 100000;
                if (Math.random() < riskFactor) {
                    replyFunc(`Error: They feds are watching right now. Probably best not risk making such a large withdrawal right now...`);
                    return;
                }
            }
            userData.points += sellValue;
            userData.addInvestment(id, -amount);
            replyFunc(`You have sold ${amount} of your ${owned} ${id} share${sIfPlural(owned)} for \$${sellValue}.`);
        })
        .register();
}
function register_reloadinvestmentmanager() {
    StandardCommandManager.newBuilder("reloadinvestmentmanager")
        .addAlias("reloadim")
        .handler((userData, args, replyFunc) => {
            InvestmentManager.reload();
            replyFunc(`Reloaded.`);
        })
        .register();
}