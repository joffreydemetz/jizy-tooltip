import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { resetDom, makeTrigger } from './setup.js';
import Tooltip from '../lib/js/Tooltip.js';
import Tip from '../lib/js/Tip.js';

function newTip(overrides = {}) {
    const el = makeTrigger({
        'data-tip-id': overrides.id || 't1',
        'data-tip-header': overrides.header || '',
        'data-tip': overrides.content || 'body',
        'data-tip-theme': overrides.theme || '',
        'data-tip-position': overrides.position || 'top',
    });
    return new Tip(el);
}

describe('Tooltip', () => {
    beforeEach(() => resetDom());

    describe('constructor', () => {
        test('uses default id and distance', () => {
            const tt = new Tooltip();
            assert.equal(tt.id, 'jTip');
            assert.equal(tt.distance, 10);
            assert.equal(tt.shown, null);
            assert.equal(tt.customRenderer, null);
            assert.equal(tt.element, null);
            assert.equal(tt.uuid, 1);
        });

        test('accepts custom id and distance', () => {
            const tt = new Tooltip('myTip', 25);
            assert.equal(tt.id, 'myTip');
            assert.equal(tt.distance, 25);
        });
    });

    describe('setRenderer()', () => {
        test('stores a function and returns this', () => {
            const tt = new Tooltip();
            const fn = () => '<x/>';
            const ret = tt.setRenderer(fn);
            assert.equal(tt.customRenderer, fn);
            assert.equal(ret, tt);
        });

        test('ignores non-function arguments', () => {
            const tt = new Tooltip();
            tt.setRenderer('not a function');
            tt.setRenderer(42);
            tt.setRenderer(null);
            assert.equal(tt.customRenderer, null);
        });
    });

    describe('getElement()', () => {
        test('creates the element when not present', () => {
            const tt = new Tooltip('jTip');
            const el = tt.getElement();

            assert.ok(el);
            assert.equal(el.id, 'jTip');
            assert.equal(el.getAttribute('role'), 'tooltip');
            assert.equal(el.getAttribute('aria-hidden'), 'true');
            assert.ok(el.classList.contains('jtip'));
            assert.ok(el.classList.contains('hidden'));
            assert.equal(document.querySelector('#jTip'), el);
        });

        test('reuses an existing element with the same id', () => {
            const existing = document.createElement('div');
            existing.id = 'jTip';
            document.body.appendChild(existing);

            const tt = new Tooltip('jTip');
            const el = tt.getElement();

            assert.equal(el, existing);
            assert.ok(el.classList.contains('jtip'));
        });
    });

    describe('ready()', () => {
        test('assigns element and returns this', () => {
            const tt = new Tooltip();
            const ret = tt.ready();
            assert.equal(ret, tt);
            assert.ok(tt.element);
            assert.equal(tt.element.id, 'jTip');
        });

        test('Escape key triggers hide()', () => {
            const tt = new Tooltip().ready();
            tt.shown = 'abc';
            tt.element.classList.add('fade-in');

            const evt = new window.KeyboardEvent('keyup', { key: 'Escape', bubbles: true });
            document.body.dispatchEvent(evt);

            assert.equal(tt.shown, null);
        });

        test('click outside the tooltip element triggers hide()', () => {
            const tt = new Tooltip().ready();
            tt.shown = 'abc';
            tt.element.classList.add('fade-in');

            const outside = document.createElement('button');
            document.body.appendChild(outside);

            const evt = new window.MouseEvent('click', { bubbles: true });
            outside.dispatchEvent(evt);

            assert.equal(tt.shown, null);
        });

        test('click inside the tooltip element does not hide', () => {
            const tt = new Tooltip().ready();
            tt.shown = 'abc';
            tt.element.classList.add('fade-in');
            const inner = document.createElement('span');
            tt.element.appendChild(inner);

            const evt = new window.MouseEvent('click', { bubbles: true });
            inner.dispatchEvent(evt);

            assert.equal(tt.shown, 'abc');
        });
    });

    describe('cleanClasses()', () => {
        test('removes theme-*, arrow, top/right/bottom/left classes', () => {
            const tt = new Tooltip().ready();
            tt.element.classList.add('jtip', 'theme-dark', 'arrow', 'top', 'fade-in', 'keep-me');

            tt.cleanClasses();

            assert.ok(!tt.element.classList.contains('theme-dark'));
            assert.ok(!tt.element.classList.contains('arrow'));
            assert.ok(!tt.element.classList.contains('top'));
            assert.ok(tt.element.classList.contains('jtip'));
            assert.ok(tt.element.classList.contains('fade-in'));
            assert.ok(tt.element.classList.contains('keep-me'));
        });
    });

    describe('getTemplate()', () => {
        test('renders content only when no header is set', () => {
            const tt = new Tooltip();
            const html = tt.getTemplate({ header: '', content: 'hello' });
            assert.equal(html, '<div><div class="tip-content">hello</div></div>');
        });

        test('renders header + content when header is set', () => {
            const tt = new Tooltip();
            const html = tt.getTemplate({ header: 'H', content: 'C' });
            assert.equal(
                html,
                '<div><div class="tip-header">H</div><div class="tip-content">C</div></div>'
            );
        });
    });

    describe('show() / hide()', () => {
        test('show() makes the tooltip visible with content and position class', () => {
            const tt = new Tooltip().ready();
            const tip = newTip({ id: 'tip-A', content: 'Hello', position: 'top' });

            tt.show(tip);

            assert.equal(tt.shown, 'tip-A');
            assert.equal(tt.element.getAttribute('aria-hidden'), 'false');
            assert.ok(tt.element.classList.contains('fade-in'));
            assert.ok(!tt.element.classList.contains('hidden'));
            assert.ok(tt.element.classList.contains('top'));
            assert.match(tt.element.innerHTML, /Hello/);
        });

        test('show() applies each theme token as a class', () => {
            const tt = new Tooltip().ready();
            const tip = newTip({ id: 'tip-T', theme: 'theme-dark large', position: 'right' });

            tt.show(tip);

            assert.ok(tt.element.classList.contains('theme-dark'));
            assert.ok(tt.element.classList.contains('large'));
            assert.ok(tt.element.classList.contains('right'));
        });

        test('show() is a no-op when the same tip is already shown', () => {
            const tt = new Tooltip().ready();
            const tip = newTip({ id: 'same' });

            tt.show(tip);
            tt.element.dataset.touched = '1';
            tt.show(tip);

            assert.equal(tt.element.dataset.touched, '1');
        });

        test('hide() clears state and re-hides after the fade timeout', async () => {
            const tt = new Tooltip().ready();
            const tip = newTip({ id: 'tip-H', content: 'Bye' });
            tt.show(tip);

            tt.hide(tip);

            assert.equal(tt.shown, null);
            assert.ok(tt.element.classList.contains('fade-out'));
            assert.ok(!tt.element.classList.contains('fade-in'));

            await new Promise((r) => setTimeout(r, 250));

            assert.equal(tt.element.innerHTML, '');
            assert.ok(tt.element.classList.contains('hidden'));
            assert.ok(!tt.element.classList.contains('fade-out'));
            assert.equal(tt.element.getAttribute('aria-hidden'), 'true');
        });

        test('hide() with a non-matching tip does nothing', () => {
            const tt = new Tooltip().ready();
            const a = newTip({ id: 'A' });
            const b = newTip({ id: 'B' });
            tt.show(a);

            tt.hide(b);

            assert.equal(tt.shown, 'A');
            assert.ok(tt.element.classList.contains('fade-in'));
        });

        test('hide() with no shown tooltip is a no-op', () => {
            const tt = new Tooltip().ready();
            tt.hide();
            assert.equal(tt.shown, null);
        });
    });

    describe('fromElement()', () => {
        test('returns early when element is falsy', () => {
            const tt = new Tooltip().ready();
            assert.doesNotThrow(() => tt.fromElement(null));
            assert.equal(tt.shown, null);
        });

        test('assigns a generated data-tip-id when missing and shows the tip', () => {
            const tt = new Tooltip().ready();
            const el = makeTrigger({ 'data-tip': 'auto' });

            tt.fromElement(el);

            assert.equal(el.dataset.tipId, 'd-1');
            assert.equal(tt.uuid, 2);
            assert.equal(tt.shown, 'd-1');
            assert.match(tt.element.innerHTML, /auto/);
        });

        test('preserves an existing data-tip-id', () => {
            const tt = new Tooltip().ready();
            const el = makeTrigger({ 'data-tip-id': 'preset', 'data-tip': 'x' });

            tt.fromElement(el);

            assert.equal(el.dataset.tipId, 'preset');
            assert.equal(tt.shown, 'preset');
        });
    });

    describe('init() (compat alias)', () => {
        test('delegates to ready()', () => {
            const tt = new Tooltip();
            tt.init();
            assert.ok(tt.element);
            assert.equal(tt.element.id, 'jTip');
        });
    });
});
