# Chat-First Controlled Ingestion + Route Compiler

Timestamp: 20260621T150711Z

## Root Cause Addressed

The chat-first shell had a bounded assistant shape, but it did not yet have a formal bridge for new material entering the workspace. That left an architectural risk: runtime uploads could be confused with approved compiled source material.

This pass locks the distinction:

- Base compiled answer pack = approved runtime behavior.
- Runtime source overlay = local, quarantined, inspectable material.
- Upload does not equal approved source.
- Event does not equal truth.
- Ingestion comes before answer.

## Files Changed

- `assistants/chat-first-surface-shell/public/index.html`
- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/project-state.js`
- `assistants/chat-first-surface-shell/public/state-events.js`
- `assistants/chat-first-surface-shell/public/source-registry.js`
- `assistants/chat-first-surface-shell/public/compiled-answer-pack.js`
- `dist/chat-first-surface-shell/index.html`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/project-state.js`
- `dist/chat-first-surface-shell/state-events.js`
- `dist/chat-first-surface-shell/source-registry.js`
- `dist/chat-first-surface-shell/compiled-answer-pack.js`
- `tools/sync-chat-first-state.js`
- `tools/compile-chat-first-answer-pack.js`
- `tools/validate-chat-first-shell.js`
- `tools/validate-chat-first-ingestion.js`
- `package.json`

## Changes

- Extended `tools/sync-chat-first-state.js` so receipts/logs/checksums become structured `codex_update` events.
- Added generated `state-events.js` for the shell event ledger.
- Added generated `source-registry.js` with source status and ingestion status on every source record.
- Added source registry metadata for origin, visibility scope, extraction status, MIME type, hash/blob fields, search/render/answer permissions, route seed status, and approval posture.
- Added `tools/compile-chat-first-answer-pack.js`.
- Added generated `compiled-answer-pack.js` as the base approved behavior map loaded before runtime.
- Updated runtime routing so `script.js` consumes `window.CHAT_FIRST_ANSWER_PACK` instead of relying only on inline answer rooms.
- Upgraded the plus button into local source intake.
- Added IndexedDB persistence for uploaded blobs where available, with localStorage metadata fallback.
- Added text extraction only for text-like files within size limits.
- Added metadata-only handling for PDF, DOCX, image, spreadsheet, oversized, and binary files.
- Added runtime upload responses that explicitly say uploaded files are source candidates, not approved truth.
- Added artifacts for Event Ledger, Source Registry, Source Inbox, Extracted Text, Source Map Draft, and Compiler Report.
- Updated shell validation to understand the new generated file chain.
- Added `tools/validate-chat-first-ingestion.js` and wired it into `validate:chat-first-shell`.
- Mirrored the updated source shell into `dist/chat-first-surface-shell`.

## Validation Results

Passed:

- `npm run sync:chat-first-state`
- `node tools/compile-chat-first-answer-pack.js`
- `npm run validate:chat-first-shell`
- `node tools/validate-chat-first-ingestion.js`
- `npm run validate:chrome-collapse`
- `npm run validate:json`
- `npm run validate:js`

Final checksum validation is run after this receipt is included in the latest checksum manifest.

## Runtime Behavior Locked

- Uploaded `.txt`/`.md`/text-like files can be locally extracted and searched.
- Uploaded PDFs, DOCX files, images, spreadsheets, oversized files, and binary files are registered as metadata-only until parser/OCR/source mapping exists.
- Runtime uploads default to `Uncertain` and never become `Active` automatically.
- Runtime uploads never become `Approved` automatically.
- Runtime uploads use `canAnswerFrom: false`.
- Search over uploads is limited to extracted text previews.
- Compile requests route to review, approval, compilation, and validation instead of instant learning.

## Browser Validation Note

The in-app Browser automation has previously rejected local `file://` reload/navigation for this shell due URL policy. No browser-policy workaround was used in this pass.

## Known Limitations

- No server upload layer was added.
- No PDF, DOCX, OCR, image, or spreadsheet parser was added.
- Uploaded files remain local browser/session material.
- Rendered browser QA was not captured in this pass because the Browser tool blocks local file URL automation.
- This pass did not deploy.
