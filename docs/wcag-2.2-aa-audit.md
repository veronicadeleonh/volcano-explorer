# WCAG 2.2 AA audit — first pass

Scope: static review of the code + computed contrast from the design tokens. **Not yet verified in a browser** (no screen reader, no axe run, no reflow/zoom test). Contrast is measured against the dark panel surface (≈ `#0a0a16`); text drawn directly over the map depends on the Mapbox base style and still needs a visual check.

Legend: 🔴 fails AA · 🟠 likely fails / needs a browser check · 🟢 passes

## 1. Contrast

| SC | Finding | Status |
|---|---|---|
| 1.4.3 Contrast (Minimum) | Text tokens vs panel: `primary` 19.7 · `secondary` 12.5 · `tertiary` 9.7 · `muted` 6.3 · **`subtle` 4.50 (borderline)** · **`faint` 3.14** · **`disabled` 2.60**. `faint` is used for 13 text declarations, `disabled` for 5, `subtle` for 11 — mostly 10–12 px labels, stats, meta lines. | 🔴 |
| 1.4.3 | One-off text colors below 4.5:1: `white-22` 1.9, `sky-40` 2.1, `white-25` 2.2 (×4), `sky-50` 2.7, `white-38` 3.5, `ember-70` 3.7, `white-40` 3.8 (×3), `sky-70` 4.2 (×2). | 🔴 |
| 1.4.3 | Placeholder text fails: search `text.disabled` 2.6, Compare dropdown `white-25` 2.2, token field `white-22` 1.9. (The disabled "Last eruption" segment is exempt.) | 🔴 |
| 1.4.3 | White on `ember-100` (`#ff6432`) is 2.95:1 — fails for any white text on an orange fill. `text.on-accent` (`#1f0800`) on the same fill is 6.5:1 and is fine. Check the Compare CTA / primary buttons use the dark text. | 🟠 |
| 1.4.11 Non-text Contrast | Component borders are decorative-level: `border.subtle` 1.13, `border.default` 1.26, `border.strong` 1.48, `border.accent` 1.28. Fine for decoration, but where the border is the *only* thing that shows a control (inputs, chips in the off state) it needs 3:1. | 🟠 |
| 1.4.11 | Status / boundary colors vs panel all pass 3:1 (active 5.7, dormant 10.3, extinct 5.8, subduction 6.0, divergent 7.4, transform 7.8, ring of fire 6.9, ember 6.7). | 🟢 |
| 1.4.11 | Focus indicator on the search box is only a 40 %-ember border change (`border.accent-strong`, 1.9:1). | 🔴 |

**Token-level fix** (one place, fixes dozens of declarations): raise `text.subtle` to ≥ 4.6, `text.faint` and `text.disabled` to ≥ 4.5 for text that is still meant to be read (keep a separate, truly decorative token for non-text use), replace the sub-4.5 one-offs with the semantic tokens, and add `border.control` (≥ 3:1) and `focus.ring` tokens.

## 2. Keyboard and focus

| SC | Finding | Status |
|---|---|---|
| 2.1.1 Keyboard | Tectonic-plate labels are SVG `<g onClick>` with no `tabIndex`, role or key handler → the plate panel is mouse-only. | 🔴 |
| 2.1.1 | Country selection exists only as a map click; no keyboard route to the Country panel. (Volcano selection has the search box as an alternative.) | 🔴 |
| 2.1.1 | Clickable `div`/`li` that are not buttons: country-panel volcano cards (`.cp-card`), Compare "Add volcano" dropdown options (`.cb-option`, `onMouseDown` only), search results (`onMouseDown` only; arrow keys work). | 🔴 |
| 2.4.3 Focus Order / 2.4.11 Focus Not Obscured | Volcano, Country and Compare panels open as overlays but never move focus into themselves, don't trap it and don't return it on close. The full-height right panel also covers the Mapbox zoom + sound controls, which stay in the tab order → focus can land on a hidden control. | 🔴 |
| 2.4.7 Focus Visible | Buttons keep the browser default ring (OK). `outline: none` on `.search-input`, `.tg-input`, `.cb-search` relies on a faint border/background change instead (see 1.4.11). | 🔴 |
| 2.1.2 No Keyboard Trap | None found (Mapbox canvas handles arrows; Escape works in Plate/Compare modals and search). | 🟢 |
| — | Escape closes the Plate modal, Compare modal and search, but **not** the Volcano panel, Country panel or Welcome modal. | 🟠 |

## 3. Names, roles, semantics

| SC | Finding | Status |
|---|---|---|
| 1.3.1 / 3.3.2 / 4.1.2 | Search input, Compare dropdown input and Mapbox-token input have only a placeholder — no `<label>` / `aria-label`. | 🔴 |
| 4.1.2 | There is no `role`, `aria-*` or `aria-modal` anywhere except the Welcome step dots and the new sound button. Missing: `role="dialog"` + accessible name on all modals/panels; combobox/listbox pattern on search (`aria-expanded`, `aria-controls`, `aria-activedescendant`); `aria-pressed` on filter chips and on the sound button; `aria-expanded` on the mobile Layers/Volcanoes toggles. | 🔴 |
| 4.1.2 | Icon-only buttons (✕ close, clear, remove) rely on `title`, which is a weak accessible name. | 🟠 |
| 1.1.1 Non-text Content | The map canvas has no text alternative; decorative emoji icons in buttons are read aloud. Thumbnails do have `alt`. | 🟠 |
| 1.4.1 Use of Color | Volcano status on the map (active / dormant / extinct) is conveyed by marker color alone; status text exists in panels but not for map markers. Filter chips signal on/off mainly by tint. | 🟠 |
| 4.1.3 Status Messages | "No volcano found", loading skeletons and the compare-count changes aren't announced (`aria-live`). | 🟠 |
| 3.1.1 / 2.4.2 | `lang="en"` and a descriptive `<title>` are present. | 🟢 |

## 4. Targets, motion, audio, responsiveness

| SC | Finding | Status |
|---|---|---|
| 2.5.8 Target Size (Minimum) 24 × 24 | `.wm-dot` welcome steps are 6 × 6; `.cb-remove` ✕ ≈ 14 px; `.search-clear` ≈ 22 × 20; `.lc-seg-btn` ≈ 21 px high. Close buttons (28 px), chips and Mapbox controls (29 px) pass. | 🔴 |
| 2.2.2 Pause, Stop, Hide | The globe auto-rotates on load and pulsing markers/animations loop indefinitely, with no pause control (rotation stops on first interaction only). `prefers-reduced-motion` is honored only inside the Welcome modal. | 🟠 |
| 1.4.2 Audio Control | Ambient sound plays for > 3 s. It only starts after the first user gesture and the speaker button mutes it, but the button sits in the map control group, not at the start of the page, and has no `aria-pressed`. | 🟠 |
| 1.4.13 Content on Hover or Focus | Volcano / country hover tooltips are hover-only, disappear with the pointer and can't be dismissed or reached by keyboard. The same info is available in the click panel. | 🟠 |
| 1.4.10 Reflow (320 px) / 1.4.4 Resize text | Has mobile breakpoints, but fixed `100vw/100vh` + `overflow: hidden` and many 8–11 px px-based sizes need a 200 %/400 % zoom test. | 🟠 |
| 2.5.7 Dragging Movements | Map pan is drag-based; zoom buttons and keyboard arrows are provided by Mapbox. | 🟢 |

## 5. Suggested order of work

1. **Tokens** — fix text/border/focus values once in `tokens/tokens.json`, replace sub-AA one-offs. (Biggest effect, almost no code.)
2. **Dialogs** — shared focus handling + `role="dialog"`/`aria-modal`/labelled title + Escape for Volcano, Country, Welcome panels; hide the map controls from tab order while a panel covers them.
3. **Names and states** — labels on the three inputs, `aria-pressed`/`aria-expanded`, combobox pattern on search, `aria-label` on icon buttons.
4. **Keyboard parity** — make `.cp-card`, `.cb-option` and search results real buttons/options; give plate labels `tabIndex` + Enter/Space + role=button; offer a keyboard path to countries (e.g. a country list in the search box).
5. **Targets and motion** — min 24 px hit areas, a pause/reduce-motion control, honor `prefers-reduced-motion` globally.
6. **Browser verification** — axe-core run on every state, keyboard-only walkthrough, VoiceOver pass, 320 px and 200 % zoom checks.
