import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
});

const { window } = dom;

globalThis.window = window;
globalThis.document = window.document;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.KeyboardEvent = window.KeyboardEvent;
globalThis.MouseEvent = window.MouseEvent;
globalThis.TouchEvent = window.TouchEvent || window.Event;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);

if (!globalThis.crypto) {
    globalThis.crypto = window.crypto || {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
    globalThis.crypto.randomUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
}

export function resetDom() {
    document.body.innerHTML = '';
    document.body.className = '';
    setViewport();
}

// jsdom does no layout: documentElement.clientWidth/clientHeight are always 0
// and scrollX/scrollY are read-only accessors. Redefine them so the placement
// math has a viewport to work against.
export function setViewport({ width = 1024, height = 768, scrollX = 0, scrollY = 0 } = {}) {
    Object.defineProperty(document.documentElement, 'clientWidth', { value: width, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: height, configurable: true });
    Object.defineProperty(window, 'scrollX', { value: scrollX, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
}

// Same reason: offsetWidth/offsetHeight read 0 without layout, which collapses
// every measurement in Tooltip.position().
export function stubSize(el, width, height) {
    Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
}

// rect is viewport-space (top/left/width/height), like a real
// getBoundingClientRect(); Tip.setCoords() adds the scroll offset on top.
export function makeTrigger(attrs = {}, rect = null) {
    const el = document.createElement('button');
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }

    const r = { top: 100, left: 50, width: 100, height: 30, ...(rect || {}) };
    const box = {
        top: r.top,
        left: r.left,
        right: r.left + r.width,
        bottom: r.top + r.height,
        width: r.width,
        height: r.height,
        x: r.left,
        y: r.top,
        toJSON() { return this; },
    };

    el.getBoundingClientRect = () => box;
    document.body.appendChild(el);
    return el;
}
