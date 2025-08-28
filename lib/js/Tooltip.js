import Tip from './Tip.js';

export default class Tooltip {
    constructor(id = 'jTip', distance = 10) {
        this.id = id;
        this.distance = distance;
        this.shown = null;
        this.customRenderer = null;
        this.element = null;
        this.uuid = 1;
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

    position(trigger, position) {
        let left, top;
        const tipW = this.element.offsetWidth;
        const tipH = this.element.offsetHeight;
        const viewportW = document.documentElement.clientWidth;

        if (position === 'center') {
            top = trigger.top + trigger.height / 2 - tipH / 2;
            left = trigger.left + trigger.width / 2 - tipW / 2;
        } else if (position === 'left' || position === 'right') {
            top = (trigger.top + trigger.bottom) / 2 - tipH / 2;
            if (position === 'left') {
                left = trigger.left - this.distance - tipW;
                if (left < 0) left = this.distance;
            } else {
                left = trigger.right + this.distance;
                if (left + tipW > viewportW) left = viewportW - tipW - this.distance;
            }
        } else {
            left = trigger.left + (trigger.width - tipW) / 2;
            top = position === 'bottom' ? trigger.bottom + this.distance : trigger.top - tipH - this.distance;
        }

        if (left < 0) left = trigger.left;
        if (top < 0) top = trigger.bottom + this.distance;

        this.element.style.left = left + 'px';
        this.element.style.top = top + window.pageYOffset + 'px';
    }

    cleanClasses() {
        this.element.className.split(' ').forEach((item) => {
            if (item.match(/theme-|arrow|top|right|bottom|left/)) {
                this.element.classList.remove(item);
            }
        });
    }

    show(tip) {
        if (this.shown === tip.uuid) return;

        tip.setCoords();
        this.shown = tip.uuid;
        this.cleanClasses();

        this.element.innerHTML = this.renderer ? this.renderer(tip) : this.getTemplate(tip);
        this.element.classList.add(tip.position);

        if (tip.theme) {
            tip.theme.split(' ').forEach(theme => {
                this.element.classList.add(theme);
            });
        }

        this.position(tip.coords, tip.position);

        this.element.setAttribute('aria-hidden', 'false');
        this.element.classList.add('fade-in');
        this.element.classList.remove('hidden');
    }

    hide(tip) {
        if (this.shown && (!tip || tip.uuid === this.shown)) {
            this.shown = null;
            this.element.classList.remove('fade-in');
            this.element.classList.add('fade-out');

            setTimeout(() => {
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
        if (!el) return;

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