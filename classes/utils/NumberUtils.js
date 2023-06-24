class NumberUtils {

    normalRandom(n) {
        let total = 0;
        for (let i = 0; i < n; i++) {
            total += Math.random();
        }
        return total / n;
    }

    sigmoid(x, sensitivity = 1) {
        return 1 / (1 + Math.exp(-x * sensitivity));
    }
}

export default new NumberUtils();