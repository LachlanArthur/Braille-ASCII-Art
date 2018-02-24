import { $, $$, on } from './helpers.js';

on( document, 'DOMContentLoaded', function ( e ) {

	on( $<HTMLInputElement>( '#filepicker' ), 'change', function ( e ) {
		console.log( this.files );
	} );

} );
