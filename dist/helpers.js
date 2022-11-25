function $(selectors) {
    return document.querySelector(selectors);
}
function $$(selectors) {
    return document.querySelectorAll(selectors);
}
function on(elements, type, listener, options) {
    if (elements instanceof NodeList || Array.isArray(elements)) {
        Array.from(elements).filter(Boolean).forEach(e => e.addEventListener.call(e, type, listener, options));
    }
    else if (elements instanceof HTMLElement || elements instanceof Document) {
        elements.addEventListener.call(elements, type, listener, options);
    }
}
export { $, $$, on, };
//# sourceMappingURL=helpers.js.map