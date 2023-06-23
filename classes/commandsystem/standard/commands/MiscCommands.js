import crypto from "node:crypto";

import StandardCommandManager from "../StandardCommandManager.js";
import SettingsManager from "../../../settings/SettingsManager.js";
import RconManager from "../../../rcon/RconManager.js";

export default () => {
    register_lucky();
    register_smite();
    register_splashout();
    register_rainbow();
    register_180();
}

function register_lucky() {
    StandardCommandManager.newBuilder("lucky")
        .handler((userData, _, replyFunc) => {
            let hasher = crypto.createHash("sha1");
            hasher.update(new Date().toDateString(), "utf8");
            let sharedRandom = parseInt(`0x${hasher.digest("hex").substring(0, 8)}`);

            hasher = crypto.createHash("sha1");
            hasher.update(`${userData.userId}@${new Date().toDateString()}`, "utf8");
            let userRandom = parseInt(`0x${hasher.digest("hex").substring(0, 8)}`);

            replyFunc(`Today the lucky number is ${(sharedRandom % 99) + 1} and your lucky letter is ${String.fromCharCode(65 + (userRandom % 26))}`);
        })
        .register();
}

function register_smite() {
    StandardCommandManager.newBuilder("smite")
        .senderRateLimit(30000)
        .handler(async (userData, args, replyFunc) => {
            if (args.length < 1) {
                replyFunc(`Usage: !smite <target>`);
                return;
            }

            let target = args.shift();
            if (!/^[A-Za-z0-9_]{1,16}$/.test(target)) {
                replyFunc(`Error: Invalidate username!`);
                return;
            }

            let cost = SettingsManager.getSetting(userData, "command.smite.cost", Number.MAX_SAFE_INTEGER);
            if (userData.points < cost) {
                replyFunc(`Error: You need ${cost} points for that!`);
                return;
            }

            let response = await RconManager.executeCommand(`execute at ${target} run summon minecraft:lightning_bolt ~ ~ ~`);
            if (response !== "Summoned new Lightning Bolt") {
                replyFunc("Smite unsuccessful. You were not charged.");
                return;
            }
            replyFunc(response);

            userData.points -= cost;
        })
        .register();
}

function register_splashout() {
    StandardCommandManager.newBuilder("splashout")
        .senderRateLimit(5000)
        .handler(async (userData, args, replyFunc) => {
            if (args.length < 1) {
                replyFunc(`Usage: !splashout <target> <count>`);
                return;
            }

            let target = args.shift();
            if (!/^[A-Za-z0-9_]{1,16}$/.test(target)) {
                replyFunc(`Error: Invalidate username!`);
                return;
            }

            let count = parseInt(args.shift());
            if (Number.isNaN(count)) {
                replyFunc(`Error: Invalid amount`);
                return;
            }
            if (count <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            let costEach = SettingsManager.getSetting(userData, "command.splashout.costEach", Number.MAX_SAFE_INTEGER);
            let maxCount = SettingsManager.getSetting(userData, "command.splashout.maxCount", 10);

            if (count > maxCount) {
                replyFunc(`Error: Maximum count is ${maxCount}`);
                return;
            }

            let cost = costEach * count;
            if (userData.points < cost) {
                replyFunc(`Error: You need ${cost} points for that!`);
                return;
            }

            let itemData = {
                id: "minecraft:lingering_potion",
                Count: 1,
                tag: {
                    CustomPotionEffects: [
                        {
                            Id: 24,
                            Amplifier: 3,
                            Ambient: 1,
                            ShowIcon: 0,
                            Duration: 10,
                            ShowParticles: 0
                        },
                        {
                            Id: 25,
                            Amplifier: 3,
                            Ambient: 1,
                            ShowIcon: 0,
                            Duration: 10,
                            ShowParticles: 0
                        }
                    ],
                    CustomPotionColor: 0x00ff00
                }
            };
            let thrownData = {
                HasBeenShot: 1,
                LeftOwner: 1,
                Item: itemData,
                Glowing: 1,
                HasVisualFire: 1
            };

            // let spawnCmd = `execute as ${target} at @s run summon minecraft:item ^ ^ ^1 ${JSON.stringify(itemData)}`

            RconManager.executeCommand(`title ${target} times 2 10 10`, true);
            RconManager.executeCommand(`title ${target} subtitle ""`, true);
            RconManager.executeCommand(`title ${target} title {"color": "green", "text": "What's that smell?"}`, true);
            let delay = 500;
            for (let i = 0; i < count; i++) {
                delay += Math.floor(Math.random() * 200) + 50;
                setTimeout(() => {
                    let pitch = (Math.random() * 1.5) + 0.5;
                    let spawnCmd = `execute at ${target} run summon minecraft:potion ~ ~1 ~ ${JSON.stringify(thrownData)}`;

                    RconManager.executeCommand(spawnCmd, true);
                    RconManager.executeCommand(`execute at ${target} run playsound artifacts:item.whoopee_cushion.fart master @a ~ ~ ~ ${pitch} 1`, true);
                }, delay);
            }
            setTimeout(() => {
                replyFunc("Delivery completed!");
            }, delay);
            replyFunc(`Delivery in progress. ETA: ${Math.floor(delay / 1000)} seconds`);
            userData.points -= cost;
        })
        .register();
}

function register_rainbow() {
    StandardCommandManager.newBuilder("rainbow")
    .senderRateLimit(5000)
        .handler(async (userData, args, replyFunc) => {
            if (args.length < 2) {
                replyFunc(`Usage: !rainbow <target> <count>`);
                return;
            }

            let target = args.shift();
            if (!/^[A-Za-z0-9_]{1,16}$/.test(target)) {
                replyFunc(`Error: Invalidate username!`);
                return;
            }

            let count = parseInt(args.shift());
            if (Number.isNaN(count)) {
                replyFunc(`Error: Invalid amount`);
                return;
            }
            if (count <= 0) {
                replyFunc(`Error: Invalid amount. Must be a positive integer.`);
                return;
            }

            let costEach = SettingsManager.getSetting(userData, "command.rainbow.costEach", Number.MAX_SAFE_INTEGER);
            let maxCount = SettingsManager.getSetting(userData, "command.rainbow.maxCount", 10);

            if (count > maxCount) {
                replyFunc(`Error: Maximum count is ${maxCount}`);
                return;
            }

            let cost = costEach * count;

            if (userData.points < cost) {
                replyFunc(`Error: You need ${cost} points for that!`);
                return;
            }


            let colors = [
                0xff0000,
                0xffa500,
                0xffff00,
                0x008000,
                0x0000ff,
                0x4b0082,
                0xee82ee
            ];

            let data = {
                Age: 0,
                Color: 0,
                Duration: 200,
                DurationOnUse: -20,
                Effects: [
                    {
                        Duration: 40,
                        Id: 16,
                        ShowIcon: 0,
                        ShowParticles: 1,
                        Ambient: 0
                    }
                ],
                Radius: 1.0,
                RadiusOnUse: 0.5,
                RadiusPerTick: 0.1,
                WaitTime: 0,
                ReapplicationDelay: 1
            };
            let delay = 50;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    data.Color = colors[Math.floor(Math.random() * colors.length)];
                    data.Radius = Math.random() * 1;
                    let yOffset = Math.random() * 2;
                    let spawnCmd = `execute at ${target} run summon minecraft:area_effect_cloud ~ ~${yOffset} ~ ${JSON.stringify(data)}`;

                    RconManager.executeCommand(spawnCmd, true);
                }, delay);
                delay += 100;
            }
            setTimeout(() => {
                replyFunc("Your rainbow go away now... :(");
            }, delay);

            replyFunc(`I forecast RAINBOWS for ${Math.floor(delay / 1000)} seconds`);
            userData.points -= cost;
        })
        .register();
}

function register_180() {
    StandardCommandManager.newBuilder("180")
        .handler(async (userData, args, replyFunc) => {
            if (args.length < 1) {
                replyFunc(`Usage: !180 <target>`);
                return;
            }

            let target = args.shift();
            if (!/^[A-Za-z0-9_]{1,16}$/.test(target)) {
                replyFunc(`Error: Invalidate username!`);
                return;
            }

            let cost = SettingsManager.getSetting(userData, "command.180.cost", Number.MAX_SAFE_INTEGER);
            if (userData.points < cost) {
                replyFunc(`Error: You need ${cost} points for that!`);
                return;
            }


            RconManager.executeCommand(`title ${target} times 5 1 2`, true);
            RconManager.executeCommand(`title ${target} subtitle {"color": "green", "text": "baby, right 'round "}`, true);
            RconManager.executeCommand(`title ${target} title {"color": "blue", "text": "You spin me right 'round"}`, true);

            let response = await RconManager.executeCommand(`execute at ${target} run tp ${target} ~ ~ ~ ~180 ~`);
            if (!response.toLowerCase().startsWith(`teleported ${target.toLowerCase()} to `)) {
                replyFunc("Rotation unsuccessful. You were not charged.");
                return;
            }
            replyFunc("Like a record!");

            userData.points -= cost;
        })
        .register();
}