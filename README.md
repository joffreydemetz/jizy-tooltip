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
| `data-tip-arrow` | `true` | Set to `false` (or `none`) to drop the arrow on this trigger only |
| `data-tip-id` | auto | Stable id assigned on first show |

### Arrow & placement

The tip is placed relative to the trigger and the arrow sits on the edge facing
it, pointing back at the trigger:

| `data-tip-position` | Tip sits… | Arrow edge |
|---|---|---|
| `top` (default) | above the trigger | bottom |
| `bottom` | below the trigger | top |
| `left` | left of the trigger | right |
| `right` | right of the trigger | left |
| `center` | centred over the trigger | none |

### Staying on screen

`data-tip-position` is a **preference**, not a guarantee — the tip is kept inside
the viewport:

- **Flip** — if the requested side has no room, the tip is placed on the opposite
  side (`top` ↔ `bottom`, `left` ↔ `right`) and the arrow moves to the matching
  edge. If neither side fits, the roomier one wins. `center` never flips.
- **Shift** — the tip is then clamped along the other axis so it never crosses a
  viewport edge, keeping at least `padding` px of margin.

Even when flipped or shifted, the arrow tracks the trigger's centre (driven by
`--jtip-arrow-x` / `--jtip-arrow-y`, set at runtime).

Placement is resolved once, when the tip is shown. The tip is `position: absolute`
in document space, so it scrolls with the page.

To hide the arrow **everywhere**, set `--jizy-tooltip-arrow-size: 0` (see
Styling). For a **single** tip, use `data-tip-arrow="false"`.

## Constructor

`new Tooltip(id = 'jTip', distance = 10, padding = 8)`

- `id` — id of the singleton tip element appended to `<body>`.
- `distance` — pixel gap between trigger and tip.
- `padding` — minimum pixel gap kept between the tip and the viewport edge (see
  [Staying on screen](#staying-on-screen)).

## API

- `ready()` — bind global dismiss listeners (call once after construction).
- `fromElement(el)` — show the tip for a trigger element.
- `show(tip)` / `hide(tip?)` — low-level show/hide using a `Tip` instance.
- `setRenderer(fn)` — supply a custom renderer `(tip) => htmlString` to replace the default template.

## Styling

Import the bundled CSS from `dist/css/` (or the LESS sources from `lib/less/`).
Theming is done entirely through CSS custom properties — override them at
`:root` (or any scoped ancestor) from a stylesheet loaded **after** the tooltip
CSS. No LESS fork or recompile needed.

| Variable | Default | Description |
|---|---|---|
| `--jizy-tooltip-font-family` | `inherit` | Tip font family |
| `--jizy-tooltip-font-size` | `14px` | Tip font size |
| `--jizy-tooltip-width` | `170px` | Max tip width |
| `--jizy-tooltip-bg-color` | `#333` | Tip background (also the arrow colour) |
| `--jizy-tooltip-fg-color` | `#fff` | Tip text colour |
| `--jizy-tooltip-arrow-size` | `8px` | Arrow protrusion; set to `0` to remove the arrow |

```css
:root {
    --jizy-tooltip-bg-color: #1a1a1a;
    --jizy-tooltip-fg-color: #eee;
    --jizy-tooltip-width: 200px;
    --jizy-tooltip-arrow-size: 0; /* no arrow anywhere */
}
```

## Build

```bash
npm run jpack:dist
```

Outputs `dist/js/jizy-tooltip.min.js` and `dist/css/jizy-tooltip.min.css`.

## License

MIT © Joffrey Demetz
