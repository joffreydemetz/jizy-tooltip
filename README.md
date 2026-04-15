# jizy-tooltip

A lightweight JS tooltip module driven by `data-*` attributes.

## Install

```bash
npm install jizy-tooltip
```

## Usage

```js
import { Tooltip } from 'jizy-tooltip';

const tooltip = new Tooltip('jTip', 10).ready();

document.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('mouseenter', () => tooltip.fromElement(el));
    el.addEventListener('mouseleave', () => tooltip.hide());
});
```

```html
<button
    data-tip="Save the current document"
    data-tip-header="Save"
    data-tip-position="bottom"
    data-tip-theme="dark">
    Save
</button>
```

The tooltip is dismissed on click outside, touch outside, or `Escape`.

## Trigger attributes

| Attribute | Default | Description |
|---|---|---|
| `data-tip` | — | Tooltip body (required) |
| `data-tip-header` | — | Optional header |
| `data-tip-position` | `top` | `top`, `bottom`, `left`, `right`, `center` |
| `data-tip-theme` | — | Space-separated theme classes added to the tip |
| `data-tip-id` | auto | Stable id assigned on first show |

## Constructor

`new Tooltip(id = 'jTip', distance = 10)`

- `id` — id of the singleton tip element appended to `<body>`.
- `distance` — pixel gap between trigger and tip.

## API

- `ready()` — bind global dismiss listeners (call once after construction).
- `fromElement(el)` — show the tip for a trigger element.
- `show(tip)` / `hide(tip?)` — low-level show/hide using a `Tip` instance.
- `setRenderer(fn)` — supply a custom renderer `(tip) => htmlString` to replace the default template.

## Styling

Import the bundled CSS from `dist/css/` or the LESS sources from `lib/less/`. The build emits a generated `_variables.less` from `lib/less/variables.less` merged with the `lessVariables` defined in `config/jpack.js` (e.g. `desktopBreakpoint`).

Override variables before importing `tooltip.less`, or fork `variables.less` to retheme:

```less
@tooltip-bg-color: #1a1a1a;
@tooltip-fg-color: #fff;
@tooltip-width: 200px;
```

## Build

```bash
npm run jpack:dist
```

Outputs `dist/js/jizy-tooltip.min.js` and `dist/css/jizy-tooltip.min.css`.

## License

MIT © Joffrey Demetz
