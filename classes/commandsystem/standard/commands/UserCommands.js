import dateFns from "date-fns";

import SettingsManager from "../../../settings/SettingsManager.js";
import StandardCommandManager from "../StandardCommandManager.js";
import UserDataManager from "../../../users/UserDataManager.js";


export default () => {
    register_settings();
    register_group();
    register_followage();
    register_accountage();
    register_seen();
    register_idle()
}

function register_settings() {
    StandardCommandManager.newBuilder("setting")
        .addAlias("settings")
        .handler((userData, args, replyFunc) => {
            let targetData = userData;
            let target = args.shift();
            if (target) {
                targetData = UserDataManager.getUserByUsername(target, SettingsManager.getSetting(userData, "command.setting.allowVirtual", false));
                if (!targetData) {
                    replyFunc(`I don't know of anyone by the name: ${target}`);
                    return;
                }
            }
            let key = args.shift();
            let value = SettingsManager.getSetting(targetData, key);
            replyFunc(`Value: ${value}`);
        })
        .register();
}

function register_group() {
    StandardCommandManager.newBuilder("group")
        .addAlias("groups")
        .handler((userData, args, replyFunc) => {
            let targetData = userData;
            if (SettingsManager.getSetting(userData, "command.group.other.allowed", false)) {
                let target = args.shift();
                if (target) {
                    targetData = UserDataManager.getUserByUsername(target, SettingsManager.getSetting(userData, "command.group.allowVirtual", false));
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
                if (!SettingsManager.getSetting(userData, "command.group.modify.allowed", false)) {
                    replyFunc("You do not have permission to modify group memberships!");
                    return;
                }

                if (SettingsManager.getGroupSettingOverride(group, "command.group.modify.protected", false)) {
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

function register_followage() {
    StandardCommandManager.newBuilder("followage")
        .senderRateLimit(60000)
        .handler(async (userData, args, replyFunc) => {
            let response = await fetch(`https://beta.decapi.me/twitch/followage/hatefulbox/${userData.username}`);
            let body = await response.text();
            replyFunc(`${userData.username} has been following for: ${body}`) 
        })
        .register();
}

function register_accountage() {
    StandardCommandManager.newBuilder("accountage")
        .senderRateLimit(60000)
        .handler(async (userData, args, replyFunc) => {
            let response = await fetch(`https://beta.decapi.me/twitch/creation/${userData.username}`);
            let body = await response.text();
            replyFunc(`${userData.username} joined Twitch on: ${body}`) 
        })
        .register();
}

function register_seen() {
    StandardCommandManager.newBuilder("seen")
        .addAlias("lastseen")
        .handler(async (userData, args, replyFunc) => {
            let target = args.shift();
            let targetData = UserDataManager.getUserByUsername(target, false);
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

function register_idle() {
    StandardCommandManager.newBuilder("idle")
        .senderRateLimit(10000)
        .handler((userData, args, replyFunc) => {
            if (SettingsManager.getSetting(userData, "command.idle.excluded")) {
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
                let max = SettingsManager.getSetting(userData, "command.idle.maxCount");
                if (amount > max) {
                    amount = max;
                }
            }

            let allUsers = UserDataManager.getAll()
                .filter(data => !SettingsManager.getSetting(data, "command.idle.excluded"))
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