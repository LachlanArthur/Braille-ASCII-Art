import { $, on } from './helpers.js';
// Braille symbol is 2x4 dots
const asciiXDots = 2, asciiYDots = 4;
let ditherMode = 'floyd-steinberg', invert = false, threshold = 127, asciiWidth = 100, asciiHeight;
let image;
let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');
let ascii = '';
on(document, 'DOMContentLoaded', function (e) {
    on($('#filepicker'), 'change', async function () {
        if (!this.files || !this.files.length)
            return;
        image = document.createElement('img');
        image.src = URL.createObjectURL(this.files[0].slice(0));
        await new Promise(resolve => on(image, 'load', resolve));
        render();
    });
    on($('#dither'), 'change', function () {
        let newValue = this.value;
        if (newValue == ditherMode)
            return;
        ditherMode = newValue;
        document.body.dataset.dither = newValue;
        render();
    });
    on($('#threshold'), 'change', function () {
        let newValue = parseInt(this.value);
        if (ditherMode !== 'threshold' || newValue == threshold)
            return;
        threshold = newValue;
        render();
    });
    on($('#width'), 'input', function () {
        let newValue = parseInt(this.value);
        if (newValue == asciiWidth || newValue < 1)
            return;
        asciiWidth = newValue;
        render();
    });
    on($('#invert'), 'change', function () {
        invert = this.checked;
        document.body.classList.toggle('invert', invert);
        render();
    });
    on($('#copy'), 'click', function () {
        navigator.clipboard.writeText(ascii);
        const oldText = this.textContent;
        this.textContent = 'Copied!';
        setTimeout(() => this.textContent = oldText, 1000);
    });
    on($('#font-size'), 'input', function () {
        document.documentElement.style.setProperty('--font-size', `${this.value}px`);
    });
});
function rgbaOffset(x, y, width) {
    return width * 4 * y + 4 * x;
}
async function render() {
    let asciiText = [];
    let asciiHtml = [];
    if (!image)
        return;
    asciiHeight = Math.ceil(asciiWidth * asciiXDots * (image.height / image.width) / asciiYDots);
    canvas.width = asciiWidth * asciiXDots;
    canvas.height = asciiHeight * asciiYDots;
    // Fill the canvas with white
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    // Draw the image as greyscale
    context.globalCompositeOperation = 'luminosity';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const greyPixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const ditheredPixels = dither(greyPixels);
    for (let y = 0; y < canvas.height; y += asciiYDots) {
        const line = [];
        for (let x = 0; x < canvas.width; x += asciiXDots) {
            // Braille Unicode range starts at U2800 (= 10240 decimal)
            // Each of the eight dots is mapped to a bit in a byte which
            // determines its position in the range.
            // https://en.wikipedia.org/wiki/Braille_Patterns
            line.push(10240 + parseInt([
                ditheredPixels.data.at(rgbaOffset(x + 1, y + 3, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
                ditheredPixels.data.at(rgbaOffset(x + 0, y + 3, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
                ditheredPixels.data.at(rgbaOffset(x + 1, y + 2, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
                ditheredPixels.data.at(rgbaOffset(x + 1, y + 1, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
                ditheredPixels.data.at(rgbaOffset(x + 1, y + 0, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
                ditheredPixels.data.at(rgbaOffset(x + 0, y + 2, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
                ditheredPixels.data.at(rgbaOffset(x + 0, y + 1, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
                ditheredPixels.data.at(rgbaOffset(x + 0, y + 0, canvas.width)) === (invert ? 255 : 0) ? 1 : 0,
            ].join(''), 2));
        }
        const lineChars = String.fromCharCode.apply(String, line);
        asciiText.push(lineChars);
        asciiHtml.push(lineChars.split('').map(char => `<span>${char}</span>`).join(''));
    }
    ascii = asciiText.join('\n');
    let output = $('#output');
    output.style.display = 'block';
    output.innerHTML = '';
    output.insertAdjacentHTML('afterbegin', asciiHtml.join('<br>'));
}
function dither(input) {
    switch (ditherMode) {
        case 'threshold':
            return ditherThreshold(input);
        case 'floyd-steinberg':
            return ditherFloydSteinberg(input);
    }
}
function ditherThreshold(input) {
    const output = context.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const offset = rgbaOffset(x, y, canvas.width);
            const value = input.data.at(offset) > threshold ? 255 : 0;
            output.data.set([value, value, value, 255], offset);
        }
    }
    return output;
}
function ditherFloydSteinberg(input) {
    const output = context.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const offset = rgbaOffset(x, y, canvas.width);
            const greyPixel = input.data.at(offset);
            const value = greyPixel > threshold ? 255 : 0;
            output.data.set([value, value, value, 255], offset);
            // Diffuse error to neighboring pixels
            const error = greyPixel - value;
            const neighbors = [
                [rgbaOffset(x + 1, y + 0, canvas.width), 7 / 16],
                [rgbaOffset(x - 1, y + 1, canvas.width), 3 / 16],
                [rgbaOffset(x + 0, y + 1, canvas.width), 5 / 16],
                [rgbaOffset(x + 1, y + 1, canvas.width), 1 / 16],
            ];
            for (const [offset, scale] of neighbors) {
                const value = input.data.at(offset);
                if (value) {
                    input.data.set([value + error * scale], offset);
                }
            }
        }
    }
    return output;
}
//# sourceMappingURL=index.js.map