<p align="left"><img src="https://raw.githubusercontent.com/Amir83Nasr/dsh-rastin/main/icons/readme.png" width="128" alt="Rastin icon" /></p>

# Rastin

Cordis bundle for the DeepSeek Harness Web GUI: Persian RTL layout with embedded fonts.

## Features

- **Persian RTL** — chat, queue, question/plan-review, and todo surfaces read right-to-left on the IranYekanX face, shipped as base64 woff2 inside the bundle.
- **Per-seat auto-direction** — each message (and each todo item) follows its own leading word run: a real English opening reads LTR while a lone English term ("Merge کن") stays RTL.
- **Sidebar terminal font** — FiraMono Nerd Font Mono. xterm draws on canvas, so CSS alone can't restyle glyphs; the bundle embeds the face and patches the canvas 2d `font` setter scoped to `[data-sidebar-terminal]`.
- **Todo dock opens by default** — host mounts it collapsed; the bundle clicks each new panel open once (user can re-collapse; an already-seen panel is never reopened).
- **LTR islands** — code blocks, tool-call/command rows, changed-files cards, and process-status labels stay LTR inside the RTL surfaces.
- **RTL arrow mirror** — flow arrows (← → ⇐ ⇒) in RTL prose point the RTL way via a per-glyph mirror span; copy text stays intact.

## Install

```sh
pnpm add @amir83nasr/dsh-rastin
```

## Requirements

- Node.js 24 (matches [ci](.github/workflows/ci.yml)) + pnpm 12 (`packageManager`).

## Setup

```sh
pnpm install --frozen-lockfile
pnpm setup # git hooks: pre-commit = prettier check, pre-push = build + self-check
```

## Workflow

```sh
pnpm build # src/client.template.js + fonts → client.js (generated, git-ignored)
pnpm test # build + self-check (mocked ctx, cleanup assertions)
```

Edit `src/client.template.js` — never `client.js` directly.

## Files

- `src/client.template.js` — editable source (placeholders `__IRANYEKAN_B64__`, `__FIRAMONO_B64__`, `/*__RASTIN_DIRECTION__*/`).
- `src/direction.js` — seat-direction logic, inlined into the bundle, covered by `direction-check` + `orient-check`.
- `src/index.js` — host half (no rendering).
- `src/cordis.patch.yml` — bundle slot patch (`rastin` / `@amir83nasr/dsh-rastin`).
- `scripts/build.mjs` — template + fonts → `client.js`.
- `scripts/self-check.mjs` — behavioral wiring check.
- `fonts/` — embedded faces (`.woff2`).
- `locale/` — bundle metadata (`en.json` / `fa.json`).
- `client.js` — generated output (git-ignored).

## How it works

- One style seat on `shell.overlay` (`rastin-style`) injects `@font-face` + RTL rules.
- `installAutoDirection()` writes each seat's `dir` from its leading word run (LTR islands excluded) and mirrors flow arrows in RTL prose; streaming ticks re-run the verdict, a settled 2+ word LTR run locks.
- `installTerminalFont()` patches `CanvasRenderingContext2D.font`, scoped to the sidebar terminal; reverts on cleanup.
- `autoOpenTodoPanels()` observes the DOM and opens each new collapsed todo panel once; disconnects on cleanup.

## Release

See [AGENTS.md](AGENTS.md) (`RELEASE / PUBLISH (origin)`): bump version, update [CHANGELOG.md](CHANGELOG.md), verify, tag `vX.Y.Z`, push commit + tag, create GitHub Release.
