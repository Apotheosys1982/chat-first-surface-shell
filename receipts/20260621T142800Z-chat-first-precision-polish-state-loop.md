# Chat-First Precision Polish State Loop

Timestamp: 20260621T142800Z

## Root Cause Addressed

The chat-first shell had the right workspace shape, but the recent activity tray could still visually collide when real receipt labels became long. The shell also needed stronger enforcement that generated project state uses readable labels, source-map rows lead with human labels, and artifact panels open as professional full-viewport workspace views.

## Files Changed

- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/styles.css`
- `assistants/chat-first-surface-shell/public/project-state.js`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/styles.css`
- `dist/chat-first-surface-shell/project-state.js`
- `tools/sync-chat-first-state.js`
- `tools/validate-chat-first-shell.js`

## Changes

- Added friendly generated labels for recent receipts/checksums/logs in `tools/sync-chat-first-state.js`.
- Kept raw receipt paths and source filenames available as metadata instead of primary visible card copy.
- Made tray recent activity a compact, internally scrollable workspace list with single-line clamped titles and metadata.
- Added mode-aware source posture copy for builder versus buyer/demo mode.
- Tightened source-map copy so it reads like an operating surface, not a file dump.
- Added artifact panel motion using shared motion tokens.
- Mirrored the updated shell into `dist/chat-first-surface-shell`.
- Hardened `tools/validate-chat-first-shell.js` for friendly state labels, title clamping, artifact panel motion, and source-copy mode separation.

## Validation Results

Passed:

- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- `npm run validate:json`
- `npm run validate:js`

Browser validation note:

- In-app Browser automation was attempted against the current local `file://` shell URL.
- Browser Use rejected navigation/reload due URL policy for the local file URL.
- No browser-policy workaround was used.

## Known Limitations

- No live browser screenshot was captured because the Browser tool blocked the local file URL.
- This pass did not deploy.
- This pass only targets `chat-first-surface-shell`, its state sync, and its validator.
