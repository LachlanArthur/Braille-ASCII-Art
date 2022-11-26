// Known tag name
function $<K extends keyof HTMLElementTagNameMap>( selectors: K ): HTMLElementTagNameMap[ K ] | null;
// Any selector
function $<E extends HTMLElement = HTMLElement>( selectors: string ): E | null;

function $<E extends HTMLElement = HTMLElement>( selectors: string ): E | null {
	return document.querySelector( selectors );
}

// Known tag name
function $$<K extends keyof HTMLElementTagNameMap>( selectors: K ): NodeListOf<HTMLElementTagNameMap[ K ]>;
// Any selector
function $$<E extends HTMLElement = HTMLElement>( selectors: string ): NodeListOf<E>;

function $$<E extends HTMLElement = HTMLElement>( selectors: string ): NodeListOf<E> {
	return document.querySelectorAll( selectors );
}

// Result of $ - known event
function on<E extends HTMLElement, K extends keyof HTMLElementEventMap>( elements: E | null, type: K, listener: ( this: E, ev: HTMLElementEventMap[ K ] ) => any, options?: boolean | AddEventListenerOptions ): void;
// Result of $ - unknown event
function on<E extends HTMLElement>( elements: E | null, type: string, listener: ( this: E, ev: Event ) => any, options?: boolean | AddEventListenerOptions ): void;
// Result of $$ - known event
function on<E extends HTMLElement, K extends keyof HTMLElementEventMap>( elements: NodeListOf<E>, type: K, listener: ( this: E, ev: HTMLElementEventMap[ K ] ) => any, options?: boolean | AddEventListenerOptions ): void;
// Result of $$ - unknown event
function on<E extends HTMLElement>( elements: NodeListOf<E>, type: string, listener: ( this: E, ev: Event ) => any, options?: boolean | AddEventListenerOptions ): void;
// Array of elements - known event
function on<E extends HTMLElement, K extends keyof HTMLElementEventMap>( elements: Array<E | null>, type: K, listener: ( this: E, ev: HTMLElementEventMap[ K ] ) => any, options?: boolean | AddEventListenerOptions ): void;
// Array of elements - unknown event
function on<E extends HTMLElement>( elements: Array<E | null>, type: string, listener: ( this: E, ev: Event ) => any, options?: boolean | AddEventListenerOptions ): void;
// Document - known event
function on<K extends keyof HTMLElementEventMap>( elements: Document, type: K, listener: ( this: Document, ev: HTMLElementEventMap[ K ] ) => any, options?: boolean | AddEventListenerOptions ): void;
// Document - unknown event
function on( elements: Document, type: string, listener: ( this: Document, ev: Event ) => any, options?: boolean | AddEventListenerOptions ): void;

function on<E extends HTMLElement>( elements: E | NodeListOf<E> | Array<E | Document | null> | Document | null, type: string, listener: ( this: E | Document, ev: Event ) => any, options?: boolean | AddEventListenerOptions ): void {
	if ( elements instanceof NodeList || Array.isArray( elements ) ) {
		Array.from( elements ).filter( Boolean ).forEach( e => e!.addEventListener.call( e, type, listener, options ) );
	} else if ( elements instanceof HTMLElement || elements instanceof Document ) {
		elements.addEventListener.call( elements, type, listener, options );
	}
}

export function rgbaOffset( x: number, y: number, width: number ) {
	return width * 4 * y + 4 * x;
}

export {
	$,
	$$,
	on,
}
