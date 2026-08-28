import Tip from './Tip.js';

export default class Tooltip {
    constructor(id = 'jTip', distance = 10, padding = 8) {
        this.id = id;
        this.distance = distance;
        // Minimum gap kept between the tip and the viewport edge.
        this.padding = padding;
        this.shown = null;
        this.customRenderer = null;
        this.element = null;
        this.uuid = 1;
        this.hideTimer = null;
        // Per-tip classes this instance put on the singleton, so cleanClasses()
        // can remove exactly those — see cleanClasses().
        this.applied = [];
    }

    setRenderer(callback) {
        if (typeof callback === 'function') {
            this.customRenderer = callback;
        }
        return this;
    }

    ready() {
        this.element = this.getElement();

        document.body.addEventListener('keyup', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                this.hide();
            }
        });

        document.body.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.hide();
            }
        });

        document.body.addEventListener('touchstart', (e) => {
            if (!this.element.contains(e.target)) {
                this.hide();
            }
        });

        return this;
    }

    getElement() {
        let element = document.querySelector('#' + this.id);

        if (!element || element.length === 0) {
            element = document.createElement('div');
            element.id = this.id;
            document.body.appendChild(element);
        }

        element.setAttribute('role', 'tooltip');
        element.setAttribute('aria-hidden', 'true');
        element.classList.add('jtip', 'hidden');
        return element;
    }

    clamp(value, lo, hi) {
        // A tip bigger than the viewport gives hi < lo — pin it to the near edge
        // rather than returning an inverted range.
        if (hi < lo) return lo;
        return Math.min(Math.max(value, lo), hi);
    }

    // documentElement.clientWidth is the right measure in a browser (it excludes
    // the scrollbar, unlike innerWidth) but reads 0 without layout, so fall back.
    viewport() {
        const de = document.documentElement;
        return {
            width: de.clientWidth || window.innerWidth,
            height: de.clientHeight || window.innerHeight
        };
    }

    // The requested side is a preference: when there isn't room for the tip on
    // it, use the opposite side. If neither fits, keep the roomier of the two.
    resolveSide(side, trigger, tipW, tipH, bounds) {
        const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
        const room = {
            top: trigger.top - bounds.minY,
            bottom: bounds.maxY - trigger.bottom,
            left: trigger.left - bounds.minX,
            right: bounds.maxX - trigger.right
        };
        const need = (s) => (s === 'top' || s === 'bottom' ? tipH : tipW) + this.distance;

        if (room[side] >= need(side)) return side;

        const alt = opposite[side];
        if (room[alt] >= need(alt)) return alt;

        return room[alt] > room[side] ? alt : side;
    }

    // Returns the side the tip was actually placed on, which is what show() puts
    // on the element as a class — it may differ from the requested one.
    position(trigger, position) {
        const tipW = this.element.offsetWidth;
        const tipH = this.element.offsetHeight;
        const vp = this.viewport();

        // Viewport edges expressed in document space, matching trigger.* — which
        // already carry the scroll offset from Tip.setCoords(). Mixing the two
        // spaces is what used to break every clamp on a scrolled page.
        const bounds = {
            minX: window.scrollX + this.padding,
            maxX: window.scrollX + vp.width - this.padding,
            minY: window.scrollY + this.padding,
            maxY: window.scrollY + vp.height - this.padding
        };

        let side = position;
        if (side !== 'center' && ['top', 'bottom', 'left', 'right'].indexOf(side) === -1) {
            side = 'top';
        }

        let left, top;

        if (side === 'center') {
            left = trigger.left + trigger.width / 2 - tipW / 2;
            top = trigger.top + trigger.height / 2 - tipH / 2;
        } else {
            side = this.resolveSide(side, trigger, tipW, tipH, bounds);

            if (side === 'left' || side === 'right') {
                left = side === 'left' ? trigger.left - this.distance - tipW : trigger.right + this.distance;
                top = (trigger.top + trigger.bottom) / 2 - tipH / 2;
            } else {
                left = trigger.left + (trigger.width - tipW) / 2;
                top = side === 'bottom' ? trigger.bottom + this.distance : trigger.top - tipH - this.distance;
            }
        }

        // Shift into view on both axes.
        left = this.clamp(left, bounds.minX, bounds.maxX - tipW);
        top = this.clamp(top, bounds.minY, bounds.maxY - tipH);

        // Point the arrow at the trigger's centre rather than the tip's centre:
        // when the tip is shifted (e.g. clamped to the viewport edge) the arrow
        // must track the trigger, not sit in the middle of the box.
        const inset = Math.min(12, tipW / 2, tipH / 2);
        const triggerCx = trigger.left + trigger.width / 2;
        const triggerCy = trigger.top + trigger.height / 2;
        const arrowX = this.clamp(triggerCx - left, inset, tipW - inset);
        const arrowY = this.clamp(triggerCy - top, inset, tipH - inset);
        this.element.style.setProperty('--jtip-arrow-x', arrowX + 'px');
        this.element.style.setProperty('--jtip-arrow-y', arrowY + 'px');

        // trigger coords already include the scroll offset (setCoords adds
        // scrollX/scrollY), so don't add it again here.
        this.element.style.left = left + 'px';
        this.element.style.top = top + 'px';

        return side;
    }

    // Every per-tip class goes through here so cleanClasses() can undo it. The
    // structural classes set in getElement() (jtip, hidden) deliberately don't.
    addClass(...names) {
        names.filter(Boolean).forEach((name) => {
            this.element.classList.add(name);
            this.applied.push(name);
        });
    }

    // Remove exactly what the previous tip added. This used to pattern-match the
    // class list (/theme-|arrow|top|right|bottom|left/), which both missed
    // `center` (leaking it onto the singleton forever) and, being a substring
    // test, stripped classes the tooltip never set — a theme named `topbar`, or
    // a site's own hook on #jTip.
    cleanClasses() {
        if (this.applied.length) {
            this.element.classList.remove(...this.applied);
        }
        this.applied = [];
    }

    show(tip) {
        if (this.shown === tip.uuid) return;

        // cancel any pending hide so moving between triggers doesn't blank the
        // freshly-shown tip mid-transition.
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }

        tip.setCoords();
        this.shown = tip.uuid;
        this.cleanClasses();

        this.element.innerHTML = this.customRenderer ? this.customRenderer(tip) : this.getTemplate(tip);
        if (!tip.arrow) {
            this.addClass('no-arrow');
        }

        if (tip.theme) {
            this.addClass(...tip.theme.split(' '));
        }

        // Drop any leftover fade-out from a still-pending hide of a previous
        // trigger — otherwise it wins over fade-in (later in the cascade) and
        // the freshly-shown tip stays invisible when switching fast.
        this.element.classList.remove('fade-out');

        // Lay the element out (still transparent via the base .jtip opacity:0)
        // BEFORE measuring/positioning — otherwise offsetWidth/Height read 0
        // while it is display:none and the placement math collapses.
        this.element.classList.remove('hidden');

        // The side class comes from position(), not from tip.position: the tip
        // flips when the requested side has no room, and the arrow has to follow.
        // Safe to add after measuring — it only drives the absolutely-positioned
        // ::after, so it can't change offsetWidth/Height. Theme classes, which
        // can, are applied above.
        this.addClass(this.position(tip.coords, tip.position));

        this.element.setAttribute('aria-hidden', 'false');
        this.element.classList.add('fade-in');
    }

    hide(tip) {
        if (this.shown && (!tip || tip.uuid === this.shown)) {
            this.shown = null;
            this.element.classList.remove('fade-in');
            this.element.classList.add('fade-out');

            this.hideTimer = setTimeout(() => {
                this.hideTimer = null;
                this.element.innerHTML = '';
                this.cleanClasses();
                this.element.classList.add('hidden');
                this.element.classList.remove('fade-out');
                this.element.setAttribute('aria-hidden', 'true');
            }, 200);
        }
    }

    getTemplate(tip) {
        let html = '<div>';
        if (tip.header) {
            html += '<div class="tip-header">' + tip.header + '</div>';
        }
        html += '<div class="tip-content">' + tip.content + '</div>';
        html += '</div>';
        return html;
    }

    fromElement(el) {
        if (!el) {
            return;
        }

        if (!el.dataset.tipId) {
            el.dataset.tipId = 'd-' + this.uuid++;
        }

        const tip = new Tip(el);

        this.show(tip);
    }

    // @COMPAT

    init() {
        this.ready();
    }
};