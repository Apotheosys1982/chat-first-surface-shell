# Real Editable Spreadsheet Artifacts

Timestamp: `20260622T061109Z`

## Objective

Convert the staged spreadsheet from a static seeded demo into a real local workbook artifact system inside the Chat-First Surface Shell.

## Root Correction

The old behavior was:

`spreadsheet` -> forced `staged-spreadsheet` -> hardcoded rows -> disabled/fake controls

The corrected behavior is:

`spreadsheet` -> opens the only workbook or shows a workbook picker -> `openArtifact(artifactId)` -> registry-selected spreadsheet renderer -> editable local workbook state

## Implemented

- Added browser-local workbook store: `chatFirstSurfaceSpreadsheets.v1`.
- Converted `Operations workbook.xlsx` into an editable seeded workbook.
- Added contenteditable spreadsheet cells with active-cell selection.
- Added formula/status bar synchronization with selected cell value.
- Persisted cell edits in browser local storage.
- Added blank local workbook creation through `new spreadsheet`, picker action, and Source Inbox action.
- Changed spreadsheet/table command routing so it does not force `staged-spreadsheet` when multiple workbook artifacts exist.
- Added compact spreadsheet picker with origin, source status, ingestion status, answerability, and last-updated metadata.
- Added basic CSV export.
- Wired Source and Validate toolbar actions.
- Wired Undo/Redo around edit history.
- Left File/Edit/View/Insert/Data/Review, Filter, Sort, Freeze, and Add Sheet disabled with explicit titles instead of fake live controls.
- Parsed CSV/TSV uploads into editable quarantined spreadsheet artifacts when readable text is available.
- Preserved trust boundary: user-created and uploaded spreadsheet artifacts are renderable/editable/exportable, but `canAnswerFrom=false` until review, compilation, and validation.

## Validation Evidence

Static validators:

- `npm run validate:js`
- `node tools/validate-chat-first-artifact-router.js`
- `node tools/validate-chat-first-renderer-visual-contracts.js`
- `node tools/validate-chat-first-shell.js`

Live in-app Browser check:

- URL: `http://127.0.0.1:8899/index.html?v=editable-spreadsheet-local`
- Viewport: `393x852`
- Console warnings/errors: none
- Page width: `393/393`
- Horizontal page scroll: `0`

Live behavior tested:

1. Typed `spreadsheet`.
2. Confirmed `Operations workbook.xlsx` opened through artifact layer.
3. Edited cell `A2` to `Client onboarding - edited locally`.
4. Closed and reopened spreadsheet.
5. Confirmed edited value persisted.
6. Typed `new spreadsheet`.
7. Confirmed `Untitled spreadsheet 1` opened as a local workbook.
8. Confirmed new workbook was `Uncertain / Pending review / not answerable`.
9. Closed and typed `spreadsheet`.
10. Confirmed picker showed `Operations workbook.xlsx`, `Untitled spreadsheet 1`, and `New spreadsheet`.
11. Opened the user-created workbook from picker.
12. Clicked `Validate`.
13. Confirmed validation showed `Needs review`, no filled rows, and not approved for answers.
14. Clicked `Source`.
15. Confirmed source panel showed `origin=userCreated`, `visibilityScope=localSession`, `sourceStatus=Uncertain`, `ingestionStatus=Pending review`, and `canAnswerFrom=false`.
16. Clicked `Export CSV`.
17. Confirmed CSV export feedback: no server upload occurred.

## Invariants Added

- Spreadsheet cells must edit and persist through browser-local workbook state.
- Spreadsheet/table commands must not force `staged-spreadsheet`.
- Spreadsheet picker must include a create path.
- Export/Undo/Redo/Source/Validate must be wired.
- Unimplemented spreadsheet controls must be explicitly disabled or report local-prototype status.
- Parsed spreadsheet uploads can render as artifacts but must not auto-approve source truth.

## Files Changed

- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/styles.css`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/styles.css`
- `tools/validate-chat-first-shell.js`
- `tools/validate-chat-first-artifact-router.js`
- `tools/validate-chat-first-renderer-visual-contracts.js`
- `tools/sync-chat-first-state.js`
- `docs/AGENT_QUICK_START.md`
- `docs/HANDOFF_CHAT_FIRST_SURFACE_SHELL_20260622.md`
- `HANDOFF_CHAT_FIRST_SURFACE_SHELL_20260622.md`

## Remaining Boundaries

- `.xlsx` parsing is not implemented in this static shell.
- Multi-sheet switching is not implemented.
- Filter, sort, freeze panes, insert rows, and share links are not implemented.
- Local workbook data is browser-local only and is not synced to a server.
