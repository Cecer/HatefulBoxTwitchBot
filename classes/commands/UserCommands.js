import dateFns from "date-fns";


export default (commandManager, userDataManager, settingsManager) => {
    register_settings(commandManager, userDataManager, settingsManager);
    register_group(commandManager, userDataManager, settingsManager);
    register_followage(commandManager);
    register_accountage(commandManager);
    register_seen(commandManager, userDataManager);
    register_idle(commandManager, userDataManager, settingsManager)
}

function register_settings(commandManager, userDataManager, settingsManager) {
    commandManager.newBuilder("setting")
        .addAlias("settings")
        .handler((userData, args, replyFunc) => {
            let targetData = userData;
            let target = args.shift();
            if (target) {
                targetData = userDataManager.getUserByUsername(target);
                if (!targetData) {
                    replyFunc(`I don't know of anyone by the name: ${target}`);
                    return;
                }
            }
            let key = args.shift();
            let value = settingsManager.getSetting(targetData, key);
            replyFunc(`Value: ${value}`);
        })
        .register();
}

function register_group(commandManager, userDataManager, settingsManager) {
    commandManager.newBuilder("group")
        .addAlias("groups")
        .handler((userData, args, replyFunc) => {
            let targetData = userData;
            if (settingsManager.getSetting(userData, "command.group.other.allowed", false)) {
                let target = args.shift();
                if (target) {
                    targetData = userDataManager.getUserByUsername(target);
                    if (!targetData) {
                        replyFunc(`I don't know of anyone by the name: ${target}`);
                        return;
                    }
                }
            }

            let group = args.shift();
            let action = args.shift()?.toLowerCase() || "check";

            let replyPrefix = (userData === targetData) ?  "You are" : `${targetData.username} is`;

            if (!group) {
                let groups = [...targetData.groups].join(", ");
                replyFunc(`${replyPrefix} a member of: ${groups}`); 
                return;
            }

            if (action === "check") {
                if ([...targetData.groups].includes(group)) {
                    replyFunc(`${replyPrefix} a member of ${group}`);
                } else {
                    replyFunc(`${replyPrefix} not a member of ${group}`);
                }
            } else {
                if (!settingsManager.getSetting(userData, "command.group.modify.allowed", false)) {
                    replyFunc("You do not have permission to modify group memberships!");
                    return;
                }

                if (settingsManager.getGroupSettingOverride(group, "command.group.modify.protected", false)) {
                    replyFunc("That group is protected and must be granted manually!");
                    return;
                }

                switch(action.toLowerCase()) {
                    case "true": {
                        if (targetData.addGroup(group)) {
                            replyFunc(`${replyPrefix} now a member of ${group}`);
                        } else {
                            replyFunc(`${replyPrefix} a member of ${group} already`);
                        }
                        break;
                    }
                    case "false": {
                        if (targetData.removeGroup(group)) {
                            replyFunc(`${replyPrefix} no longer a member of ${group}`);
                        } else {
                            replyFunc(`${replyPrefix} not a member of ${group} already`);
                        }
                        break;
                    }
                    default: {
                        replyFunc("I don't know what you mean by: " + action);
                    }
                }
            }

        })
        .register();
}

function register_followage(commandManager) {
    commandManager.newBuilder("followage")
        .senderRateLimit(60000)
        .handler(async (userData, args, replyFunc) => {
            let response = await fetch(`https://beta.decapi.me/twitch/followage/hatefulbox/${userData.username}`);
            let body = await response.text();
            replyFunc(`${userData.username} has been following for: ${body}`) 
        })
        .register();
}

function register_accountage(commandManager) {
    commandManager.newBuilder("accountage")
        .senderRateLimit(60000)
        .handler(async (userData, args, replyFunc) => {
            let response = await fetch(`https://beta.decapi.me/twitch/creation/${userData.username}`);
            let body = await response.text();
            replyFunc(`${userData.username} joined Twitch on: ${body}`) 
        })
        .register();
}

function register_seen(commandManager, userDataManager) {
    commandManager.newBuilder("seen")
        .addAlias("lastseen")
        .handler(async (userData, args, replyFunc) => {
            let target = args.shift();
            let targetData = userDataManager.getUserByUsername(target);
            if (!targetData) {
                replyFunc(`I don't know of anyone by the name: ${target}`);
                return;
            }

            if (args.includes("date")) {
                let lastSeenStr = dateFns.format(targetData.lastSeen, "do 'of' MMMM, yyyy");
                replyFunc(`I last saw ${targetData.username} on the ${lastSeenStr}`);
            } else {
                let lastSeenStr = dateFns.formatDistanceToNowStrict(targetData.lastSeen, {addSuffix: true, roundingMethod: "floor"})
                replyFunc(`I last saw ${targetData.username} ${lastSeenStr}`);
            }
        })
        .register();
}

function register_idle(commandManager, userDataManager, settingsManager) {
    commandManager.newBuilder("idle")
        .senderRateLimit(10000)
        .handler((userData, args, replyFunc) => {
            if (settingsManager.getSetting(userData, "command.idle.excluded")) {
                replyFunc("Oh you're new to the idle game! Welcome aboard. You are now taking part in the game.");
                userData.setSettingOverride("command.idle.excluded", false);
                return;
            }

            let amount = 10;
            if (args.length >= 1) {
                amount = parseInt(args.shift());
                if (Number.isNaN(amount)) {
                    replyFunc(`Usage: !idle <amount>`);
                    return;
                }
            }

            if (amount < 0) {
                amount = 0;
            } else {
                let max = settingsManager.getSetting(userData, "command.idle.maxCount");
                if (amount > max) {
                    amount = max;
                }
            }

            let allUsers = userDataManager.getAll()
                .filter(data => !settingsManager.getSetting(data, "command.idle.excluded"))
                .sort((a, b) => a.lastSeen - b.lastSeen);
            let topUsers = allUsers.slice(0, amount);
            
            let response = `The ${amount} Best Idlers: ${topUsers
                .map((data, position) => `#${position + 1} ${data.username}: ${dateFns.formatDistanceToNowStrict(data.lastSeen, {addSuffix: false, roundingMethod: "floor"})}`)
                .join(", ")}.`;
            
            if (!topUsers.includes(userData)) {
                response += ` You are #${allUsers.indexOf(userData) + 1}.`;
            }
            

            replyFunc(response);
        })
        .register();
}