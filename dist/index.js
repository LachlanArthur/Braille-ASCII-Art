import { $, on } from './helpers.js';
// Braille symbol is 2x4 dots
const asciiXDots = 2, asciiYDots = 4;
let threshold = 127, asciiWidth = 100, asciiHeight;
// Cache image
let image;
on(document, 'DOMContentLoaded', function (e) {
    on($('#filepicker'), 'change', async function () {
        if (!this.files || !this.files.length)
            return;
        image = document.createElement('img');
        image.src = URL.createObjectURL(this.files[0].slice(0));
        await new Promise(resolve => on(image, 'load', resolve));
        render();
    });
    on($('#threshold'), 'change', function () {
        let newValue = parseInt(this.value);
        if (newValue == threshold)
            return;
        threshold = newValue;
        render();
    });
    on($('#width'), 'blur', function () {
        let newValue = parseInt(this.value);
        if (newValue == asciiWidth)
            return;
        asciiWidth = newValue;
        render();
    });
});
function render() {
    let input = $('#filepicker');
    let ascii = '';
    if (!image)
        return;
    asciiHeight = Math.ceil(asciiWidth * asciiXDots * (image.height / image.width) / asciiYDots);
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = asciiWidth * asciiXDots;
    canvas.height = asciiHeight * asciiYDots;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += asciiYDots) {
        for (let x = 0; x < canvas.width; x += asciiXDots) {
            let char = ImageData2Braille(context.getImageData(x, y, asciiXDots, asciiYDots));
            ascii += `<span>${char}</span>`;
        }
        ascii += '<br>';
    }
    let output = $('#output');
    output.style.display = 'block';
    output.innerHTML = ascii;
}
function ImageData2Braille(data) {
    if (data.width != asciiXDots || data.height != asciiYDots)
        throw TypeError(`Braille image data must be ${asciiXDots}px wide and ${asciiYDots}px high.`);
    let dots = [];
    for (let i = 0; i < asciiXDots * asciiYDots; i++) {
        dots[i] = data.data.subarray(i * 4, (i + 1) * 4);
    }
    // Reorder dots to match Braille dot order
    dots = [dots[0], dots[2], dots[4], dots[1], dots[3], dots[5], dots[6], dots[7]];
    dots = dots
        .map(([r, g, b, a]) => (r + g + b) / 3)
        .map(grey => +(grey < threshold));
    return String.fromCharCode(10240 + parseInt(dots.reverse().join(''), 2));
}
//# sourceMappingURL=index.js.map