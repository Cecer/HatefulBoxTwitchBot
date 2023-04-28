export default class BaseCommandBuilder {
    _senderRateLimit;
    _globalRateLimit;
    _handler;

    constructor() {
        this._senderRateLimit = 0;
        this._globalRateLimit = 0;
    }

    senderRateLimit(ms) {
        this._senderRateLimit = ms;
        return this;
    }
    globalRateLimit(ms) {
        this._globalRateLimit = ms;
        return this;
    }

    handler(handler) {
        this._handler = handler;
        return this;
    }

    register() {
        throw new Error("Abstract method not implemented!");
    }
}