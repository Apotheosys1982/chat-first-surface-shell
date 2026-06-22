# Chat-First Visible Source Inbox Storage

Timestamp: 20260621T151818Z

## Issue

The chat-first shell had a working local document intake path, but the visible UI did not clearly show where imported files were stored. That made the plus button feel like a black box even though the runtime had a quarantined source overlay.

## Answer

Uploaded files are stored only in the browser:

- File blobs: IndexedDB database `chatFirstSurfaceSources`, object store `blobs`, when available.
- Metadata/status/preview: localStorage key `chatFirstSurfaceDocuments.v1`.
- Approval posture: uploaded files remain `Uncertain`, unapproved, and `canAnswerFrom=false`.
- Network posture: no server upload is performed in this static shell.

## Files Changed

- `assistants/chat-first-surface-shell/public/index.html`
- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/styles.css`
- `dist/chat-first-surface-shell/index.html`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/styles.css`
- `tools/validate-chat-first-ingestion.js`

## Changes

- Added a dedicated `Source inbox` item to the workspace tray.
- Added a visible Source Inbox status strip under the composer.
- Added runtime status hydration for upload count, IndexedDB cache count, extracted preview count, source-map-needed count, and approval state.
- Updated the upload response to state the exact local storage path.
- Expanded the Source Inbox artifact with a storage map for IndexedDB, localStorage, and approval state.
- Added validation coverage requiring a visible source inbox storage status surface in both source and `dist`.
- Mirrored source changes into `dist/chat-first-surface-shell`.

## Validation Results

Passed:

- `node tools/compile-chat-first-answer-pack.js`
- `npm run validate:chat-first-shell`
- `node tools/validate-chat-first-ingestion.js`

## Browser Validation Note

The in-app Browser refused to reload the active `file://` page because of its URL policy. No workaround was attempted. Static validation confirmed the updated source and `dist` UI contracts.

