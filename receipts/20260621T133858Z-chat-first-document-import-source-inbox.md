# Chat-First Document Import Source Inbox

Timestamp: 20260621T133858Z

## Root Cause

The composer plus control was still decorative: it opened the artifact dashboard instead of performing a real document intake action. In a chat-first shell, visible composer controls must either do the job they imply or be removed.

## Files Modified

- assistants/chat-first-surface-shell/public/index.html
- assistants/chat-first-surface-shell/public/script.js
- assistants/chat-first-surface-shell/public/styles.css
- tools/validate-chat-first-shell.js

## Behavior Added

- Composer plus button now opens a browser-native file picker.
- Imported documents are stored in local browser state under a Source Inbox.
- Text-like files store a bounded local preview.
- PDFs, DOC, DOCX, oversized files, and binary files are indexed as metadata only until a parser layer exists.
- Source Map now distinguishes approved source spine from locally imported source candidates.
- Assistant can answer document/import/source-inbox questions and render the Source Inbox.

## Validator Updates

- Validates the composer plus button imports documents instead of opening a decorative artifact.
- Validates hidden multi-file document input exists.
- Validates FileReader/localStorage document intake runtime exists.
- Validates Source Inbox artifact is registered.
- Validates document import route exists.

## Validation Commands And Results

- `node --check assistants/chat-first-surface-shell/public/script.js`: pass
- `node --check dist/chat-first-surface-shell/script.js`: pass
- `node --check tools/validate-chat-first-shell.js`: pass
- `npm run validate:js`: pass, 179 files checked, 0 failures
- `npm run validate:chat-first-shell`: pass, 78 checks, 0 failures
- `npm run validate:chrome-collapse`: pass, 62 checks, 0 failures
- `npm run validate:checksum`: pass with `checksums/20260621T133858Z-chat-first-document-import-source-inbox.sha256`

## Build Sync

- Synced `assistants/chat-first-surface-shell/public/` into `dist/chat-first-surface-shell/`.
- Ran `npm run sync:chat-first-state` so the shell renders this receipt and checksum in project state.

## Known Limitations

- This static shell does not parse PDF/DOC/DOCX content yet.
- Imported documents remain local to the current browser storage and are not deployed source-of-truth files.
- Browser interaction QA for local file import may require a non-file:// browser harness.
