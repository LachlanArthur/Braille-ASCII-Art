import { rgbaOffset } from "./helpers.js";
export default class KernelDitherer {
    origin;
    numerators;
    denominator;
    constructor(origin, numerators, denominator = 1) {
        this.origin = origin;
        this.numerators = numerators;
        this.denominator = denominator;
    }
    weights() {
        const weights = [];
        const [originX, originY] = this.origin;
        for (let y = 0; y < this.numerators.length; y++) {
            for (let x = 0; x < this.numerators[y].length; x++) {
                weights.push([
                    x - originX,
                    y - originY,
                    this.numerators[y][x] / this.denominator,
                ]);
            }
        }
        return weights;
    }
    dither(input, threshold) {
        const output = new ImageData(input.width, input.height);
        const weights = this.weights();
        for (let y = 0; y < input.height; y++) {
            for (let x = 0; x < input.width; x++) {
                const offset = rgbaOffset(x, y, input.width);
                const greyPixel = input.data.at(offset);
                const value = greyPixel > threshold ? 255 : 0;
                output.data.set([value, value, value, 255], offset);
                // Diffuse error to neighboring pixels
                const error = greyPixel - value;
                for (const [weightX, weightY, weight] of weights) {
                    if (weight === 0)
                        continue;
                    const offset = rgbaOffset(x + weightX, y + weightY, input.width);
                    const value = input.data.at(offset);
                    if (typeof value === 'number' && offset >= 0) {
                        input.data.set([value + error * weight], offset);
                    }
                }
            }
        }
        return output;
    }
}
//# sourceMappingURL=kernel.js.map