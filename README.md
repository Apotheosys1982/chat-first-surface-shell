# Chatverse Surface Assistant

Public-facing name: **Chatverse Surface Assistant**.

Internal implementation name: `chat-first-surface-shell`.

Chatverse Surface Assistant is a browser-native bounded assistant surface where the composer acts as the command line, direct artifact commands open full-viewport views, and uploaded files stay quarantined until reviewed and compiled.

This repo is intentionally separate from the SV2 Biosphere Kids work. The public brand can be Chatverse while the internal package, validation scripts, paths, and deployment slug remain `chat-first-surface-shell` to preserve the working runtime and avoid breaking existing links.

## Live Site

- Netlify project: `chat-first-surface-shell`
- Production URL: `https://chat-first-surface-shell.netlify.app`
- Netlify admin: `https://app.netlify.com/projects/chat-first-surface-shell`

## What It Demonstrates

- A chat-first Surface Assistant runtime with a native composer as the primary control.
- Source-bound answer behavior instead of generic chatbot improvisation.
- Artifact routing into full-viewport views for source maps, SOPs, checklists, dashboards, and other structured outputs.
- Mobile/desktop viewport ownership, chrome collapse, and scroll-stability validation.
- Static-runtime assistant architecture that can ship as a proof surface without requiring a live model call for every interaction.
- Validation gates, checksum receipts, and synchronization between source and deploy mirrors.

## App Entry Point

Source app:

```bash
assistants/chat-first-surface-shell/public/index.html
```

Deploy mirror:

```bash
dist/chat-first-surface-shell/index.html
```

Netlify publishes the source app directory:

```bash
assistants/chat-first-surface-shell/public
```

## Local Run

```bash
python3 -m http.server 8899 --directory assistants/chat-first-surface-shell/public
```

Open:

```bash
http://127.0.0.1:8899/index.html
```

## Validation

```bash
npm run sync:chat-first-state
npm run compile:chat-first-answer-pack
npm run validate
```

The checksum gate validates the latest manifest in `checksums/`.

## Core Invariants

- The assistant shell is the first screen.
- The composer is a rectangular native message box, not a pill widget.
- Artifact commands route before natural-language answer-room routing.
- Registered artifacts open in a full-viewport artifact layer.
- Uploads do not become approved sources automatically.
- The viewport is locked to vertical scrolling on mobile and desktop: no horizontal pan, no offscreen closed tray, and no content clipped past the screen edge.
- Native HTML-in-Canvas is attempted only when the browser exposes the required APIs; otherwise the DOM fallback reports that honestly.
- The source app and `dist/chat-first-surface-shell` mirror must remain synchronized.

## Documentation

- [Agent quick start](docs/AGENT_QUICK_START.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Lattice live artifact review protocol](docs/LATTICE_LIVE_ARTIFACT_REVIEW_PROTOCOL.md)
- [Live artifact evaluation work order](docs/LIVE_ARTIFACT_EVAL_WORK_ORDER.md)
- [Handoff packet](docs/HANDOFF_CHAT_FIRST_SURFACE_SHELL_20260622.md)
- [Planning: chat-first shell](docs/PLANNING_CHAT_FIRST_SURFACE_ASSISTANT_SHELL.md)
- [Planning: premium UI](docs/PLANNING_PREMIUM_CHAT_UI_SYSTEM.md)
- [Planning: offer context](docs/PLANNING_OFFER_CONTEXT_ALIGNMENT.md)
- [Planning: bounded routing](docs/PLANNING_BOUNDED_ASSISTANT_ROUTING_SYSTEM.md)
