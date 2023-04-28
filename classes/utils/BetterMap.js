export default class BetterMap extends Map {
    getOrDefault(key, defaultValue) {
        return this.has(key) ? this.get(key) : defaultValue
    }
    computeIfAbsent(key, creator) {
        if (this.has(key)) {
            return this.get(key);
        }
        let value = creator(key);
        this.set(key, value);
        return value;
    }
}