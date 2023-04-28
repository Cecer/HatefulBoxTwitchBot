import BetterMap from "../../utils/BetterMap.js";

export default class BaseCommand {

    #handler;
    #senderRateLimit;
    #globalRateLimit;

    #senderLastUseTimestamps;
    #globalLastUseTimestamp;

    constructor(handler, senderRateLimit, globalRateLimit) {
        this.#handler = handler;
        this.#senderRateLimit = senderRateLimit;
        this.#globalRateLimit = globalRateLimit;

        this.#senderLastUseTimestamps = new BetterMap();
        this.#globalLastUseTimestamp = 0;
    }

    isSenderAllowed(userData) {
        throw new Error("Abstract method not implemented");
    }

    isRateLimited(userData) {
        let now = Date.now();
        if (this.#globalLastUseTimestamp + this.#globalRateLimit < now) {
            return true;
        }

        if (this.#senderLastUseTimestamps.get(userData.userId, 0) + this.#senderRateLimit < now) {
            return true;
        }

        return false;
    }
    applySenderRateLimit(userData, duration) {
        let timestamp = Date.now();
        if (duration === undefined) {
            timestamp += duration - this.#senderRateLimit;
        }
        this.#senderLastUseTimestamps.set(userData.userId, timestamp);
    }

    handle(userData, args, replyFunc) {
        this.applySenderRateLimit(userData);
        this.#handler(userData, args, replyFunc);
    }
}