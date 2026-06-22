# Chat-First Artifact Modal Fullscreen Pass

Timestamp: 2026-06-21T13:23:55Z

## Root Cause

The artifact renderer still behaved like a centered/adaptive sheet. On the source-map artifact this created a lower panel with empty overlay above it, making the modal feel chopped off instead of like a professional full-viewport artifact surface.

## Files Changed

- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/styles.css`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/styles.css`
- `dist/chat-first-surface-shell/assistant-build-metadata.json`
- `tools/validate-chat-first-shell.js`

## User-Facing Changes

- Artifact modals now open from the top and occupy the full viewport.
- Removed bottom-sheet behavior from the artifact renderer.
- Source map content now uses state rows instead of bullet cards.
- Artifact header now respects safe-area top and uses the shared glass/motion styling.

## Validation Updates

`tools/validate-chat-first-shell.js` now fails if:

- artifact layer is not fixed to viewport edges
- artifact panel does not own full viewport height
- artifact header does not use safe-area top styling
- source map regresses to bullet/card markup

## Commands Run

```bash
npm run validate:chat-first-shell
npm run validate:chrome-collapse
node --check tools/validate-chat-first-shell.js
node --check assistants/chat-first-surface-shell/public/script.js
```

## Validation Results

- `npm run validate:chat-first-shell`: pass
- `npm run validate:chrome-collapse`: pass
- `node --check tools/validate-chat-first-shell.js`: pass
- `node --check assistants/chat-first-surface-shell/public/script.js`: pass

## Known Limitations

- Browser automation could not inspect the local `file://` page earlier because browser policy blocks local file navigation/inspection. Validation is static plus synced `dist` output.
