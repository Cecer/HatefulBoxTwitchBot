import AutomaticOption from "./AutomaticOption.js";

export default class WeatherInBexhillAutomaticOption extends AutomaticOption {

    #apiUrl;
    
    constructor(id, description, path) {
        super(id, description);
        this.#apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=50.85&longitude=0.47&daily=temperature_2m_max,temperature_2m_min&current_weather=true&timeformat=unixtime&forecast_days=1&timezone=GMT";
    }

    get _updateFrequency() {
        return 15 * 60 * 1000;
    }

    async _getLiveData() {
        try {
            let res = await (await fetch(this.#apiUrl)).json();
            return (res.daily.temperature_2m_min[0] + res.daily.temperature_2m_max[0]) / 2;
        } catch {}
        return NaN;
    }
}