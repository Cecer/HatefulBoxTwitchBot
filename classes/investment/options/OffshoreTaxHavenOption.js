import AutomaticOption from "./AutomaticOption.js";
export default class OffshoreTaxHavenOption extends AutomaticOption {

    
    constructor(id, description) {
        super(id, description);
    }

    get _updateFrequency() {
        return 24 * 60 * 60 * 1000;
    }

    async _getLiveData() {
        return 1000;
    }
}