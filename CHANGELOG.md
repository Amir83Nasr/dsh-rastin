# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-10-02

### Fixed

- Flow arrows (← → ⇐ ⇒) in RTL prose now point the RTL way: each arrow
  gets a per-glyph mirror span (`data-rastin-mirror`, `scaleX(-1)`), so
  `ورودی … → Bot(cfg) → start()` reads right-to-left end to end. Span
  holds the exact char, so selection and copy stay intact. Covered by
  `orient-check` (wrap, idempotence, LTR-seat and island exclusion) and
  the `self-check` wiring assertions.

## [0.2.0] - 2026-10-02

### Added

- IranYekanX Bold (700) embedded alongside Regular, so Persian bold text
  stops falling back to a system face.
- Per-seat auto-direction: each message follows its own leading word run,
  so a real English opening (two-plus LTR words) reads LTR while a lone
  English term ("Merge کن") stays RTL (`src/direction.js`, covered by
  `scripts/direction-check.mjs` with 37 fa/en/mixed/markup/script cases
  plus `scripts/orient-check.mjs` for streaming, lock, and idempotence).
- Auto-direction covers `turn-error`, `turn-max-tokens`, and `model-retry`
  seats, so English failures ("This turn failed", "API key is invalid")
  read LTR.

### Fixed

- Style seat attribute typo (`data-raastin` → `data-rastin`).
- Product face scoped to the RTL surfaces instead of `:root`, so the rest
  of the app keeps the host font.
- Terminal canvas patch now handles weight/style-prefixed fonts
  (`bold 13px monospace`) and no longer double-patches on re-apply
  (shared idempotent cleanup, no clobber of third-party patches).
- Todo auto-open is one-shot: opens the first collapsed panel, then
  disconnects so a later manual collapse stays collapsed.
- Auto-direction batches streaming ticks per frame (no full-document sweep
  per character) and drops self-triggered `dir` observation.
- Verdict reads seat prose minus LTR islands (`seatText`): tool-call,
  command, code, clock, and process-status English no longer flips a
  Persian seat to LTR (`orientSeat`/`seatText` live in `src/direction.js`,
  shared by the bundle and `orient-check`, so the old hand-copied mock is
  gone).
- Question-card feedback row aligns right with the rest of the RTL surface
  (was `left`).
- Product face restored app-wide (`:root --dsw-font-family`): the whole app
  reads IranYekanX again, not just the RTL surfaces.
- LTR islands isolated (`unicode-bidi: isolate`), md/plan-preview RTL
  fallback scoped behind `:not([dir])` so `orientSeat` verdicts win.
- `::selection` tint + queue-counter bidi isolation for RTL runs.
- FiraMono full-file embed documented as the ~1.7MB ceiling
  (`client.js` size guard at 2MB); subsetting waits on an icon inventory.
- Sidebar chrome (workspace header, session rows) deliberately untouched:
  no host `data-` hook or slot seat exists — noted as a `ponytail` in the
  template, pending host cooperation.
- Queue-dock mixes covered: Persian digits/units and counter verdicts
  (`direction-check` now 37 cases).

## [0.1.0] - 2026-09-26

### Added

- Persian RTL layout for chat, queue, and question surfaces (IranYekanX face).
- FiraMono Nerd Font Mono for the sidebar terminal (base64 woff2 embed + canvas 2d `font` setter patch scoped to `[data-sidebar-terminal]`).
- Todo dock opens by default (host mounts it collapsed; user can re-collapse).
- Bundle metadata locales: `en.json` / `fa.json`.
