import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { resetDom, makeTrigger } from './setup.js';
import Tip from '../lib/js/Tip.js';

describe('Tip', () => {
    beforeEach(() => resetDom());

    test('reads dataset attributes into instance fields', () => {
        const el = makeTrigger({
            'data-tip-id': 'abc',
            'data-tip-header': 'Title',
            'data-tip': 'Body content',
            'data-tip-theme': 'theme-dark large',
            'data-tip-position': 'right',
        });

        const tip = new Tip(el);

        assert.equal(tip.el, el);
        assert.equal(tip.uuid, 'abc');
        assert.equal(tip.header, 'Title');
        assert.equal(tip.content, 'Body content');
        assert.equal(tip.theme, 'theme-dark large');
        assert.equal(tip.position, 'right');
        assert.equal(tip.coords, null);
    });

    test('defaults position to "top" when not set', () => {
        const el = makeTrigger({ 'data-tip-id': 'x', 'data-tip': 'y' });
        const tip = new Tip(el);
        assert.equal(tip.position, 'top');
    });

    test('defaults header, content and theme to empty strings', () => {
        const el = makeTrigger({ 'data-tip-id': 'x' });
        const tip = new Tip(el);
        assert.equal(tip.header, '');
        assert.equal(tip.content, '');
        assert.equal(tip.theme, '');
    });

    test('arrow defaults to true when data-tip-arrow is absent', () => {
        const el = makeTrigger({ 'data-tip-id': 'x', 'data-tip': 'y' });
        const tip = new Tip(el);
        assert.equal(tip.arrow, true);
    });

    test('data-tip-arrow="false" / "none" disables the arrow', () => {
        const off1 = new Tip(makeTrigger({ 'data-tip': 'y', 'data-tip-arrow': 'false' }));
        const off2 = new Tip(makeTrigger({ 'data-tip': 'y', 'data-tip-arrow': 'none' }));
        assert.equal(off1.arrow, false);
        assert.equal(off2.arrow, false);
    });

    test('any other data-tip-arrow value keeps the arrow on', () => {
        const on = new Tip(makeTrigger({ 'data-tip': 'y', 'data-tip-arrow': 'true' }));
        assert.equal(on.arrow, true);
    });

    test('setCoords() captures element rect plus scroll offsets', () => {
        const el = makeTrigger({ 'data-tip-id': 'x', 'data-tip': 'y' });
        const tip = new Tip(el);

        tip.setCoords();

        assert.deepEqual(tip.coords, {
            top: 100 + window.scrollY,
            left: 50 + window.scrollX,
            right: 150 + window.scrollX,
            bottom: 130 + window.scrollY,
            width: 100,
            height: 30,
        });
    });

    test('autoUuid() returns a string identifier', () => {
        const el = makeTrigger({ 'data-tip-id': 'x' });
        const tip = new Tip(el);
        const id = tip.autoUuid();
        assert.equal(typeof id, 'string');
        assert.ok(id.length > 0);
    });

    test('auto-generates uuid when data-tip-id is missing', () => {
        // NOTE: lib/js/Tip.js calls bare `autoUuid()` instead of `this.autoUuid()`,
        // so this currently throws ReferenceError. The test documents intent;
        // fixing the call site to `this.autoUuid()` makes it pass.
        const el = makeTrigger({ 'data-tip': 'hello' });
        const tip = new Tip(el);
        assert.equal(typeof tip.uuid, 'string');
        assert.ok(tip.uuid.length > 0);
    });
});
