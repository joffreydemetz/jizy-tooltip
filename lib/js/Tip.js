export default class Tip {
    constructor(el) {
        this.el = el;
        this.uuid = el.dataset.tipId || this.autoUuid();
        this.header = el.dataset.tipHeader || '';
        this.content = el.dataset.tip || '';
        this.theme = el.dataset.tipTheme || '';
        this.position = el.dataset.tipPosition || 'top';
        // Arrow on by default; data-tip-arrow="false" (or "none") drops it for
        // this trigger only. Global/scoped off-switch is --jizy-tooltip-arrow-size: 0.
        this.arrow = el.dataset.tipArrow !== 'false' && el.dataset.tipArrow !== 'none';
        this.coords = null;
    }

    setCoords() {
        const rect = this.el.getBoundingClientRect();

        this.coords = {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY,
            width: rect.width,
            height: rect.height
        };
    }

    autoUuid() {
        if (crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'tip-' + Date.now() + Math.random().toString(16).slice(2);
    }
};