import fs from "node:fs";

const TAX_VOID_USER_ID = -3;

export default (commandManager, userDataManager, settingsManager, casino, payday) => {
    register_points(commandManager, userDataManager, settingsManager);
    register_top(commandManager, userDataManager, settingsManager);
    register_pay(commandManager, userDataManager);
    register_taxall(commandManager, userDataManager, settingsManager, casino);
    register_welfare(commandManager, userDataManager, settingsManager);
    register_payday(commandManager, payday);

    register_mint(commandManager, userDataManager);
    register_tax(commandManager, userDataManager);

    register_gamble(commandManager, settingsManager, casino);
    register_jackpot(commandManager, casino);
    // register_migrate(commandManager, userDataManager);
}

function sIfPlural(value) {
	return (value === 1 || value === -1) ? "" : "s";
}

function register_points(commandManager, userDataManager, settingsManager) {
    commandManager.newBuilder("points")
        .senderRateLimit(5000)
        .handler((userData, args, replyFunc) => {
            let target = userData.username;
            if (settingsManager.getSetting(userData, "command.points.other.allowed", false)) {
                if (args.length >= 1) {
                    target = args[0];
                }
            }

            let targetData = userDataManager.getUserByUsername(target);
            if (!targetData) {
                replyFunc(`I don't know of anyone by the name: ${target}`);
                return;
            }

            if (userData === targetData) {
                replyFunc(`You have ${targetData.points} point${sIfPlural(targetData.points)}!`);
            } else {
                replyFunc(`${targetData.username} has ${targetData.points} point${sIfPlural(targetData.points)}!`);
            }
        })
        .register();
}

function register_top(commandManager, userDataManager, settingsManager) {
    commandManager.newBuilder("top")
        .senderRateLimit(10000)
        .handler((userData, args, replyFunc) => {
            let amount = 10;
            if (args.length >= 1) {
                amount = parseInt(args.shift());
            }

            if (amount < 0) {
                amount = 0;
            } else {
                let max = settingsManager.getSetting(userData, "command.top.maxCount");
                if (amount > max) {
                    amount = max;
                }
            }

            let allUsers = userDataManager.getAll()
                .filter(data => !settingsManager.getSetting(data, "command.top.excluded"))
                .sort((a, b) => b.points - a.points);
            let topUsers = allUsers.slice(0, amount);
            
            let response = `Top ${amount} point holders: ${topUsers
                .map((data, position) => `#${position + 1} ${data.username}: ${data.points} points`)
                .join(", ")}.`;
            
            if (!topUsers.includes(userData)) {
                response += ` You are #${allUsers.indexOf(userData) + 1}.`;
            }
            

            replyFunc(response);
        })
        .register();
}

function register_pay(commandManager, userDataManager) {
    commandManager.newBuilder("pay")
        .senderRateLimit(1000)
        .handler((userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !pay <username> <amount>`);
                return;
            }

            let target = args.shift();
            let targetData = userDataManager.getUserByUsername(target);
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

            replyFunc(`You have transfered ${amount} points to ${target}!`);
        })
        .register();
}

function register_mint(commandManager) {
    commandManager.newBuilder("mint")
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
            replyFunc(`You have minted ${amount} points! How inflationary!`);
        })
        .register();
}

function register_tax(commandManager, userDataManager) {
    commandManager.newBuilder("tax")
        .senderRateLimit(1000)
        .handler((userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !tax <username> <amount>`);
                return;
            }

            let target = args.shift();
            let targetData = userDataManager.getUserByUsername(target);
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
            replyFunc(`You have taxed ${targetData.username} for ${amount} points!`);
        })
        .register();

}

function register_gamble(commandManager, settingsManager, casino) {
    commandManager.newBuilder("gamble")
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
                        let pityChance = settingsManager.getSetting(userData, "casino.zero.pityChance");
                        
                        if (pityChance < pityRandom) {
                            let pitySize = settingsManager.getSetting(userData, "casino.zero.pitySize");
                            userData.points += pitySize;
                            replyFunc(`You don't have any points you know? It's a good thing I am a nice bot. Have a pity point! +1 point`);
                        } else {
                            pityRandom -= pityChance;
                            let fineChance = settingsManager.getSetting(userData, "casino.zero.fineChance");
                            if (pityRandom < fineChance) {
                                let fineSize = settingsManager.getSetting(userData, "casino.zero.fineSize");
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

            casino.play(userData, amount, replyFunc);
            userData.setSettingOverride("command.top.excluded", false);
        })
        .register();
}

function register_jackpot(commandManager, casino) {
    commandManager.newBuilder("jackpot")
        .senderRateLimit(2000)
        .handler((userData, args, replyFunc) => {
            let jackpotSize = casino.jackpotSize;
            replyFunc(`The current Jackpot is ${jackpotSize} points!`);
        })
        .register();
}

function register_taxall(commandManager, userDataManager, settingsManager, casino) {
    commandManager.newBuilder("taxall")
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
                amountFunc = points => points * amount;
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
                amountFunc = points => amount;
            }

            let recipient = args.shift();
            let recipientData;
            let logFunc;
            switch (recipient) {
                case "void": {
                    recipientData = userDataManager.ensureUser(TAX_VOID_USER_ID);
                    logFunc = (fromData, points) => {
                        replyFunc(`Sent ${points} points from ${fromData.username} into a blackhole`);
                    };
                    break;
                }
                case "jackpot": {
                    recipientData = casino.jackpotBankUserData;
                    logFunc = (fromData, points) => {
                        replyFunc(`Sent ${points} from ${fromData.username} into the casino jackpot`);
                    };
                    break;
                }
                default: {
                    if (recipient.startsWith("@")) {
                        recipient = recipient.substring(1);
                        recipientData = userDataManager.getUserByUsername(recipient);
                        if (!recipientData) {
                            replyFunc(`Error: I don't know of anyone by the name: ${recipient}`);
                            return;
                        }
                        logFunc = (fromData, points) => {
                            replyFunc(`Sent ${points} from ${fromData.username} to ${recipientData.username}`);
                        };
                        break;
                    }
                    replyFunc(`Error: I don't know what you mean by ${recipient}. WHere do you want to send the points exactly? Examples: void, jackpot, @username`)
                    return;
                }
            }

            let taxableUsers = userDataManager.getAll()
                    .filter(d => !settingsManager.getSetting(d, "command.taxall.excluded"))
                    .filter(d => d.points > 1000)
                    .filter(d => d !== recipientData);

            let total = 0;
            for (let data of taxableUsers) {
                let userAmount = Math.ceil(data.points - 1000);
                if (userAmount <= 0) {
                    continue;
                }
                userAmount = amountFunc(userAmount);

                total += userAmount;
                data.points -= userAmount;
                logFunc(data, userAmount);
            }
            replyFunc(`Total tax collected: ${total}`);
        })
        .register();
}

function register_welfare(commandManager, userDataManager, settingsManager) {
    commandManager.newBuilder("welfare")
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

            let poorUsers = userDataManager.getAll()
                    .filter(d => !settingsManager.getSetting(d, "command.welfare.excluded"))
                    .filter(d => d.points < 1000);

            let total = 0;
            for (let data of poorUsers) {
                let userAmount = Math.floor(1000 - data.points);
                if (userAmount <= 0) {
                    continue;
                }
                data.points += userAmount;
                total += userAmount;
                replyFunc(`Granted ${userAmount} points to ${data.username} because they are poor.`);
            }
            replyFunc(`Total given: ${total}`);
        })
        .register();
}

function register_payday(commandManager, payday) {
    commandManager.newBuilder("payday")
        .handler((userData, args, replyFunc) => {
            replyFunc(`Forcing a bonus payday!`);
            payday.processNow();
        })
        .register();
}