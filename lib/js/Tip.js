export default class Tip {
    constructor(el) {
        this.el = el;
        this.uuid = el.dataset.tipId || autoUuid();
        this.header = el.dataset.tipHeader || '';
        this.content = el.dataset.tip || '';
        this.theme = el.dataset.tipTheme || '';
        this.position = el.dataset.tipPosition || 'top';
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