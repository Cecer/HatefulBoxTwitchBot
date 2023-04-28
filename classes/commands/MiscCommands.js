import crypto from "node:crypto";

export default (commandManager) => {
    register_lucky(commandManager);
}

function register_lucky(commandManager) {
    commandManager.newBuilder("lucky")
        .handler((userData, args, replyFunc) => {
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