# Rastin

Cordis bundle for the DeepSeek Harness Web GUI: Persian RTL layout with embedded fonts.

## Features

- **Persian RTL** — chat, queue, and question/plan-review surfaces read right-to-left on the IranYekanX face, shipped as base64 woff2 inside the bundle.
- **Sidebar terminal font** — FiraMono Nerd Font Mono. xterm draws on canvas, so CSS alone can't restyle glyphs; the bundle embeds the face and patches the canvas 2d `font` setter scoped to `[data-sidebar-terminal]`.
- **Todo dock opens by default** — host mounts it collapsed; the bundle clicks it open once (user can re-collapse).
- **LTR islands** — code blocks, tool-call/command rows, changed-files cards, and process-status labels stay LTR inside the RTL surfaces.
- **RTL arrow mirror** — flow arrows (← → ⇐ ⇒) in RTL prose point the RTL way via a per-glyph mirror span; copy text stays intact.

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

- `src/client.template.js` — editable source (placeholders `__IRANYEKAN_B64__`, `__FIRAMONO_B64__`).
- `src/index.js` — host half (no rendering).
- `src/cordis.patch.yml` — bundle slot patch (`rastin` / `@amir83nasr/rastin`).
- `scripts/build.mjs` — template + fonts → `client.js`.
- `scripts/self-check.mjs` — behavioral wiring check.
- `fonts/` — embedded faces (`.woff2`).
- `locale/` — bundle metadata (`en.json` / `fa.json`).
- `client.js` — generated output (git-ignored).

## How it works

- One style seat on `shell.overlay` (`rastin-style`) injects `@font-face` + RTL rules.
- `installTerminalFont()` patches `CanvasRenderingContext2D.font`, scoped to the sidebar terminal; reverts on cleanup.
- `autoOpenTodoPanels()` observes the DOM and opens collapsed todo panels once; disconnects on cleanup.

## Release

See [AGENTS.md](AGENTS.md) (`RELEASE / PUBLISH (origin)`): bump version, update [CHANGELOG.md](CHANGELOG.md), verify, tag `vX.Y.Z`, push commit + tag, create GitHub Release.
