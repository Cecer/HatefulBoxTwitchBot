import dateFns from "date-fns";


export default (commandManager, userDataManager, settingsManager) => {
    register_settings(commandManager, settingsManager);
    register_group(commandManager, userDataManager, settingsManager);
    register_followage(commandManager);
    register_accountage(commandManager);
    register_seen(commandManager, userDataManager);
}

function register_settings(commandManager, settingsManager) {
    commandManager.newBuilder("setting")
        .addAlias("settings")
        .handler((userData, args, replyFunc) => {
            let value = settingsManager.getSetting(userData, args[0]);
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