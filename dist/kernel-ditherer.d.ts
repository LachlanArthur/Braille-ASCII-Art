export default class KernelDitherer implements Ditherer {
    origin: [number, number];
    numerators: number[][];
    denominator: number;
    constructor(origin: [number, number], numerators: number[][], denominator?: number);
    weights(): [number, number, number][];
    dither(input: ImageData, threshold: number): ImageData;
}
