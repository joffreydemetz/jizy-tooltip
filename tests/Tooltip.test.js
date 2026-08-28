import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { resetDom, makeTrigger, setViewport, stubSize } from './setup.js';
import Tooltip from '../lib/js/Tooltip.js';
import Tip from '../lib/js/Tip.js';

function newTip(overrides = {}, rect = null) {
    const attrs = {
        'data-tip-id': overrides.id || 't1',
        'data-tip-header': overrides.header || '',
        'data-tip': overrides.content || 'body',
        'data-tip-theme': overrides.theme || '',
        'data-tip-position': overrides.position || 'top',
    };
    if (overrides.arrow === false) {
        attrs['data-tip-arrow'] = 'false';
    }
    return new Tip(makeTrigger(attrs, rect));
}

const PAD = 8;
const VP_W = 1024;
const VP_H = 768;
const TIP_W = 170;
const TIP_H = 40;

// Shows a tip of a known size for a trigger at a known place, and reports
// what came out of position().
function place(rect, overrides = {}, viewport = {}) {
    setViewport({ width: VP_W, height: VP_H, ...viewport });

    const tt = new Tooltip().ready();
    stubSize(tt.element, overrides.tipW || TIP_W, overrides.tipH || TIP_H);
    tt.show(newTip(overrides, rect));

    const side = ['top', 'bottom', 'left', 'right', 'center']
        .find((s) => tt.element.classList.contains(s));

    return {
        tt,
        side,
        left: parseFloat(tt.element.style.left),
        top: parseFloat(tt.element.style.top),
        arrowX: parseFloat(tt.element.style.getPropertyValue('--jtip-arrow-x')),
        arrowY: parseFloat(tt.element.style.getPropertyValue('--jtip-arrow-y')),
    };
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

    describe('position()', () => {
        test('keeps the requested side and centres the tip when there is room', () => {
            const r = place({ top: 300, left: 400, width: 100, height: 30 });

            assert.equal(r.side, 'top');
            assert.equal(r.left, 400 + (100 - TIP_W) / 2);
            assert.equal(r.top, 300 - TIP_H - 10);
        });

        test('flips top to bottom when the trigger hugs the top edge', () => {
            const r = place({ top: 5, left: 400, width: 100, height: 30 }, { position: 'top' });

            assert.equal(r.side, 'bottom');
            assert.equal(r.top, 35 + 10);
            assert.ok(r.top >= PAD);
        });

        test('flips bottom to top when the trigger hugs the bottom edge', () => {
            const r = place({ top: VP_H - 40, left: 400, width: 100, height: 30 }, { position: 'bottom' });

            assert.equal(r.side, 'top');
            assert.ok(r.top + TIP_H <= VP_H - PAD);
        });

        test('flips left to right when the trigger hugs the left edge', () => {
            const r = place({ top: 300, left: 5, width: 100, height: 30 }, { position: 'left' });

            assert.equal(r.side, 'right');
            assert.equal(r.left, 105 + 10);
        });

        test('flips right to left when the trigger hugs the right edge', () => {
            const r = place({ top: 300, left: VP_W - 110, width: 100, height: 30 }, { position: 'right' });

            assert.equal(r.side, 'left');
            assert.ok(r.left >= PAD);
            assert.ok(r.left + TIP_W <= VP_W - PAD);
        });

        test('shifts a top tip left instead of overflowing the right edge', () => {
            const r = place({ top: 300, left: VP_W - 34, width: 30, height: 30 }, { position: 'top' });

            assert.equal(r.side, 'top');
            assert.equal(r.left, VP_W - PAD - TIP_W);
            assert.ok(r.left + TIP_W <= VP_W - PAD);
        });

        test('shifts a top tip right instead of overflowing the left edge', () => {
            const r = place({ top: 300, left: 2, width: 30, height: 30 }, { position: 'top' });

            assert.equal(r.side, 'top');
            assert.equal(r.left, PAD);
        });

        test('the arrow tracks the trigger centre on a shifted tip', () => {
            const rect = { top: 300, left: VP_W - 60, width: 30, height: 30 };
            const r = place(rect, { position: 'top' });

            const triggerCx = rect.left + rect.width / 2;
            assert.equal(r.left, VP_W - PAD - TIP_W);   // shifted off centre
            assert.equal(r.arrowX, triggerCx - r.left);
            assert.notEqual(r.arrowX, TIP_W / 2);
        });

        test('the arrow stays inside the tip box when the trigger is past its edge', () => {
            const r = place({ top: 300, left: VP_W - 20, width: 16, height: 30 }, { position: 'top' });

            assert.ok(r.arrowX <= TIP_W - 12);
            assert.ok(r.arrowX >= 12);
        });

        test('clamps against the viewport, not the document, on a scrolled page', () => {
            // Trigger sits at the top of the viewport but far down the document —
            // the old code compared document-space coords to viewport-space bounds
            // and left the tip off-screen here.
            const r = place(
                { top: 5, left: 40, width: 100, height: 30 },
                { position: 'top' },
                { scrollX: 500, scrollY: 800 }
            );

            assert.equal(r.side, 'bottom');
            assert.ok(r.top >= 800 + PAD);
            assert.ok(r.top + TIP_H <= 800 + VP_H - PAD);
            assert.ok(r.left >= 500 + PAD);
            assert.ok(r.left + TIP_W <= 500 + VP_W - PAD);
        });

        test('pins a tip wider than the viewport to the near edge', () => {
            const r = place({ top: 300, left: 400, width: 100, height: 30 }, { tipW: 2000 });

            assert.equal(r.left, PAD);
            assert.ok(!Number.isNaN(r.left));
            assert.ok(!Number.isNaN(r.arrowX));
        });

        test('center never flips but is still clamped into view', () => {
            const r = place({ top: 5, left: 2, width: 30, height: 30 }, { position: 'center' });

            assert.equal(r.side, 'center');
            assert.equal(r.left, PAD);
            assert.equal(r.top, PAD);
        });

        test('falls back to the roomier side when neither side fits', () => {
            // 700px tall tip, trigger a little below centre: neither above nor
            // below has room, so the taller gap (above) wins.
            const r = place({ top: 420, left: 400, width: 100, height: 30 }, { position: 'bottom', tipH: 700 });

            assert.equal(r.side, 'top');
            assert.equal(r.top, PAD);
        });

        test('treats an unknown position as top', () => {
            const r = place({ top: 300, left: 400, width: 100, height: 30 }, { position: 'sideways' });

            assert.equal(r.side, 'top');
            assert.ok(!r.tt.element.classList.contains('sideways'));
        });
    });

    describe('cleanClasses()', () => {
        test('removes the classes the tooltip applied for a tip', () => {
            const tt = new Tooltip().ready();
            tt.show(newTip({ id: 'c1', position: 'top', theme: 'theme-dark', arrow: false }));

            assert.ok(tt.element.classList.contains('top'));
            assert.ok(tt.element.classList.contains('theme-dark'));
            assert.ok(tt.element.classList.contains('no-arrow'));

            tt.cleanClasses();

            assert.ok(!tt.element.classList.contains('top'));
            assert.ok(!tt.element.classList.contains('theme-dark'));
            assert.ok(!tt.element.classList.contains('no-arrow'));
        });

        test('keeps structural and foreign classes', () => {
            const tt = new Tooltip().ready();
            // `topbar` and `arrow-lg` trip the old substring regex; the singleton
            // lives in <body>, so a site may legitimately hook classes on it.
            tt.element.classList.add('fade-in', 'keep-me', 'topbar', 'arrow-lg', 'left-rail');
            tt.show(newTip({ id: 'c2', position: 'left' }));

            tt.cleanClasses();

            assert.ok(tt.element.classList.contains('jtip'));
            assert.ok(tt.element.classList.contains('fade-in'));
            assert.ok(tt.element.classList.contains('keep-me'));
            assert.ok(tt.element.classList.contains('topbar'));
            assert.ok(tt.element.classList.contains('arrow-lg'));
            assert.ok(tt.element.classList.contains('left-rail'));
        });

        test('does not leak a center tip class into the next show()', () => {
            const tt = new Tooltip().ready();

            tt.show(newTip({ id: 'c3', position: 'center' }));
            assert.ok(tt.element.classList.contains('center'));

            tt.show(newTip({ id: 'c4', position: 'bottom' }));
            assert.ok(!tt.element.classList.contains('center'));
            assert.ok(tt.element.classList.contains('bottom'));
        });

        test('ignores empty theme tokens', () => {
            const tt = new Tooltip().ready();
            tt.show(newTip({ id: 'c5', theme: 'alpha  beta' }));

            assert.ok(tt.element.classList.contains('alpha'));
            assert.ok(tt.element.classList.contains('beta'));
            assert.ok(!tt.applied.includes(''));
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

        test('show() adds no-arrow only for a tip that opted out', () => {
            const tt = new Tooltip().ready();

            tt.show(newTip({ id: 'noarr', arrow: false }));
            assert.ok(tt.element.classList.contains('no-arrow'));

            // switching to an arrow-on tip must drop the class (cleanClasses strips /arrow/)
            tt.show(newTip({ id: 'witharr' }));
            assert.ok(!tt.element.classList.contains('no-arrow'));
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
