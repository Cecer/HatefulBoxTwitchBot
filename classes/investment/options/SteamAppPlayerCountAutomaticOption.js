import AutomaticOption from "./AutomaticOption.js";

export default class SteamAppPlayerCountAutomaticOption extends AutomaticOption {
    
    #apiUrl;

    constructor(id, description, appId) {
        super(id, description);
        this.#apiUrl = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`;
    }

    get _updateFrequency() {
        return 10 * 60 * 1000;
    }

    async _getLiveData() {
        try {
            let res = (await (await fetch(this.#apiUrl)).json()).response.player_count;
            if (Number.isInteger(res)) {
                return res;
            }
        } catch {}
        return NaN;
    }
}



548430