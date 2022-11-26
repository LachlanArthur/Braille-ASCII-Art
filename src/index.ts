import { $, on, rgbaOffset } from './helpers.js';
import KernelDitherer from './kernel-ditherer.js';

// Braille symbol is 2x4 dots
const asciiXDots = 2,
	asciiYDots = 4;

type DithererName = 'threshold' | 'floydSteinberg';

const ditherers: Record<DithererName, Ditherer> = {
	threshold: new KernelDitherer(
		[ 0, 0 ],
		[],
		1,
	),
	floydSteinberg: new KernelDitherer(
		[ 1, 0 ],
		[
			[ 0, 0, 7 ],
			[ 3, 5, 1 ],
		],
		16,
	),
};

let dithererName: DithererName = 'floydSteinberg',
	invert = false,
	threshold = 127,
	asciiWidth = 100,
	asciiHeight = 100;

let image: HTMLImageElement;
let canvas = document.createElement( 'canvas' );
let context = canvas.getContext( '2d' )!;
let ascii = '';

on( document, 'DOMContentLoaded', function ( e ) {

	on( $<HTMLInputElement>( '#filepicker' ), 'change', async function () {
		if ( !this.files || !this.files.length ) return;

		image = document.createElement( 'img' );
		image.src = URL.createObjectURL( this.files[ 0 ].slice( 0 ) );
		await new Promise( resolve => on( image, 'load', resolve ) );

		render();
	} );

	on( $<HTMLSelectElement>( '#dither' ), 'change', function () {
		let newValue = this.value as DithererName;
		if ( newValue == dithererName ) return;
		dithererName = newValue;
		render();
	} );

	on( $<HTMLInputElement>( '#threshold' ), 'change', function () {
		let newValue = parseInt( this.value );
		if ( newValue == threshold ) return;
		threshold = newValue;
		render();
	} );

	on( $<HTMLInputElement>( '#width' ), 'input', function () {
		let newValue = parseInt( this.value );
		if ( newValue == asciiWidth || newValue < 1 ) return;
		asciiWidth = newValue;
		render();
	} );

	on( $<HTMLInputElement>( '#invert' ), 'change', function () {
		invert = this.checked;
		document.body.classList.toggle( 'invert', invert );
		render();
	} );

	on( $<HTMLButtonElement>( '#copy' ), 'click', function () {
		navigator.clipboard.writeText( ascii );
		const oldText = this.textContent;
		this.textContent = 'Copied!';
		setTimeout( () => this.textContent = oldText, 1000 );
	} );

	on( $<HTMLInputElement>( '#font-size' ), 'input', function () {
		document.documentElement.style.setProperty( '--font-size', `${this.value}px` );
	} );

} );

async function render() {
	let asciiText: string[] = [];
	let asciiHtml: string[] = [];

	if ( !image ) return;

	asciiHeight = Math.ceil( asciiWidth * asciiXDots * ( image.height / image.width ) / asciiYDots );
	document.documentElement.style.setProperty( '--width', asciiWidth.toString() );
	document.documentElement.style.setProperty( '--height', asciiHeight.toString() );

	canvas.width = asciiWidth * asciiXDots;
	canvas.height = asciiHeight * asciiYDots;

	// Fill the canvas with white
	context.globalCompositeOperation = 'source-over';
	context.fillStyle = 'white';
	context.fillRect( 0, 0, canvas.width, canvas.height );

	// Draw the image as greyscale
	context.globalCompositeOperation = 'luminosity';
	context.drawImage( image, 0, 0, canvas.width, canvas.height );

	const ditherer = ditherers[ dithererName ];

	const greyPixels = context.getImageData( 0, 0, canvas.width, canvas.height );
	const ditheredPixels = ditherer.dither( greyPixels, threshold );
	const targetValue = invert ? 255 : 0;

	for ( let y = 0; y < canvas.height; y += asciiYDots ) {
		const line: number[] = [];
		for ( let x = 0; x < canvas.width; x += asciiXDots ) {
			// Braille Unicode range starts at U2800 (= 10240 decimal)
			// Each of the eight dots is mapped to a bit in a byte which
			// determines its position in the range.
			// https://en.wikipedia.org/wiki/Braille_Patterns
			line.push(
				10240
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 1, y + 3, canvas.width ) ) === targetValue ) << 7 )
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 0, y + 3, canvas.width ) ) === targetValue ) << 6 )
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 1, y + 2, canvas.width ) ) === targetValue ) << 5 )
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 1, y + 1, canvas.width ) ) === targetValue ) << 4 )
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 1, y + 0, canvas.width ) ) === targetValue ) << 3 )
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 0, y + 2, canvas.width ) ) === targetValue ) << 2 )
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 0, y + 1, canvas.width ) ) === targetValue ) << 1 )
				+ ( +( ditheredPixels.data.at( rgbaOffset( x + 0, y + 0, canvas.width ) ) === targetValue ) << 0 )
			);
		}
		const lineChars = String.fromCharCode.apply( String, line );
		asciiText.push( lineChars );
		asciiHtml.push( lineChars.split( '' ).map( char => `<span>${char}</span>` ).join( '' ) );
	}

	ascii = asciiText.join( '\n' );

	$( '#char-count' )!.textContent = ascii.length.toLocaleString();

	let output = $( '#output' )!;
	output.style.display = 'block';
	output.innerHTML = '';
	output.insertAdjacentHTML( 'afterbegin', asciiHtml.join( '<br>' ) );
}
