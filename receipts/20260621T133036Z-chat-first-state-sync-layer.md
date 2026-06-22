# Chat-First State Sync Layer

Timestamp: 2026-06-21T13:30:36Z

## Root Cause

The chat-first shell had a project-state dashboard, but newly printed receipts/logs/checksums were not automatically reflected in the workspace. The runtime could therefore show stale state after validation and receipt generation.

## Files Changed

- `tools/sync-chat-first-state.js`
- `package.json`
- `assistants/chat-first-surface-shell/public/index.html`
- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/project-state.js`
- `dist/chat-first-surface-shell/index.html`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/project-state.js`
- `tools/validate-chat-first-shell.js`

## Behavior Added

- Added a generated `project-state.js` bundle for the chat-first shell.
- The shell now loads generated project state before the main runtime.
- Project dashboard now renders latest receipt/checksum metadata from generated state.
- Receipt stream artifact now renders actual recent receipts, validation gates, and checksum manifests.
- Validator now enforces that the latest receipt is represented in the shell state bundle.

## Validation Commands

```bash
npm run sync:chat-first-state
npm run validate:chat-first-shell
npm run validate:chrome-collapse
npm run validate:checksum
```

## Known Limitation

The checksum manifest remains a post-state artifact. The shell can show recent checksum manifests, but the newest checksum created after a sync pass may require the next sync to appear in the in-app state stream.
