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
}

export function makeTrigger(attrs = {}) {
    const el = document.createElement('button');
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
    el.getBoundingClientRect = () => ({
        top: 100,
        left: 50,
        right: 150,
        bottom: 130,
        width: 100,
        height: 30,
        x: 50,
        y: 100,
        toJSON() { return this; },
    });
    document.body.appendChild(el);
    return el;
}
