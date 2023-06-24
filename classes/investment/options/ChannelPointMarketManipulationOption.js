import AutomaticOption from "./AutomaticOption.js";

export default class ChannelPointMarketManipulationOption extends AutomaticOption {
    
    constructor(id, description) {
        super(id, description);
    }

    get _updateFrequency() {
        return 1 * 60 * 1000;
    }

    async _getLiveData() {
        return 500;
    }
}