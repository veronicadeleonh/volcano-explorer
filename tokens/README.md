# Design tokens

`tokens.json` is the single source of truth ([W3C Design Tokens format](https://tr.designtokens.org/format/)). Don't edit anything under `src/styles/` or `tokens/figma/` by hand.

```
npm run tokens      # regenerate everything (also runs automatically before dev/build)
```

| Output | Used by |
|---|---|
| `src/styles/tokens.css` | every component stylesheet, as `var(--color-text-primary)` etc. |
| `src/styles/tokens.js` | places CSS variables can't reach: Mapbox paint, canvas, Recharts (`import { tokens } from '../styles/tokens'`) |
| `tokens/figma/tokens-studio.json` | Figma, through the [Tokens Studio](https://tokens.studio) plugin |

## Layers

- **Primitives** — raw values. `color.white.04` is white at 4 % opacity; there is no “loose colors” bucket any more: one-off literals live inside the semantic token that names their role (`color.info.*`, `color.country.*`, `color.surface.overlay`…).
- **Semantic** — what components should reach for: `color.text.*`, `color.surface.*`, `color.border.*`, `color.accent.*`, `color.status.*`, `color.boundary.*`.
- **Scales** — `font.size`, `font.weight`, `font.line-height`, `font.tracking`, `space`, `radius`, `duration`, `ease`, `z`, `blur`, `shadow`.

## Importing into Figma

1. Install **Tokens Studio for Figma**.
2. Plugin → *Settings* → *Import* (or *Load from file/folder*) → pick `tokens/figma/tokens-studio.json`.
3. You get two sets, `primitives` and `semantic`; enable both (primitives as *Source*, semantic as *Enabled*).
4. *Styles & Variables* → *Create variables* to turn them into native Figma variables.

Shadows import as `boxShadow` tokens (styles); durations, z-index, blur and easing stay as plain tokens because Figma variables can't hold them.

## Not tokenized on purpose

Values that appear once or twice and sit off the scale (spacing 3/5/7/9/11/13/25 px, radii 3/5/6/9/14/16/18 px, font sizes 17/19/30 px, negative margins, `0`–`3` stacking indices) are left inline. They are consolidation candidates, not system values.
