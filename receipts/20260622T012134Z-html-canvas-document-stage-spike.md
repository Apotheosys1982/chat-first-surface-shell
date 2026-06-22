# HTML-in-Canvas Document Stage Spike

Timestamp: 2026-06-22T01:21:34Z

## Summary

Implemented the first visible HTML-in-Canvas artifact-stage spike for the chat-first Surface Shell.

The command path is now:

`draft/document/report/canvas` -> Artifact Command Router -> `surface-diagnosis-draft` -> `htmlCanvasDocumentStage` renderer -> full-viewport artifact layer.

## Files Changed

- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/styles.css`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/styles.css`
- `tools/validate-chat-first-artifact-router.js`
- `tools/validate-chat-first-html-canvas-stage.js`
- `tools/sync-chat-first-state.js`
- `package.json`

## Artifact Added

- `surface-diagnosis-draft`
- Type: `documentSurface`
- Renderer: `htmlCanvasDocumentStage`
- Commands: `draft`, `document`, `report`, `canvas`, `html canvas`, `diagnosis draft`

## Renderer Added

- `htmlCanvasDocumentStage`
- Stage type: `htmlInCanvas`
- Render function: `renderHtmlCanvasDocumentStage`
- Supports HTML-in-Canvas: true
- Edit/export/print/snapshot: false for this spike
- Close behavior: return to chat state

## Native API Attempt

The renderer attempts the browser-native draw-element path by checking:

- `canvas layoutsubtree`
- `CanvasRenderingContext2D.drawElementImage`
- `canvas.requestPaint`

The stage shows one of these states:

- `Renderer: HTML-in-Canvas active`
- `Renderer: native HTML-in-Canvas unavailable in this browser`
- `Renderer: diagnostic error`

The local browser QA run showed:

`Renderer: native HTML-in-Canvas unavailable in this browser`

Fallback DOM rendering was active and visible. This is expected when the browser does not expose the experimental draw-element API.

## Manual QA

Verified over local HTTP at `http://127.0.0.1:8899/index.html`.

Commands tested:

- `draft` -> opened `Surface Diagnosis Draft`
- `document` -> opened `Surface Diagnosis Draft`
- `report` -> opened `Surface Diagnosis Draft`
- `canvas` -> opened `Surface Diagnosis Draft`
- `dashboard` -> existing dashboard still opened
- `source map` -> existing source map still opened
- `inbox` -> existing source inbox still opened
- `events` -> existing event ledger still opened
- `compiler` -> existing compiler report still opened
- `receipt` -> existing receipt stream still opened

Natural-language routing remained separate:

- `What changed recently?`
- `What receipts exist?`
- `Can you answer from this PDF?`
- `Why can’t you answer from this upload yet?`

## Validation Commands

- `node tools/validate-chat-first-artifact-router.js`
- `node tools/validate-chat-first-html-canvas-stage.js`
- `npm run validate:js`
- `npm run validate:chat-first-shell`

Additional release-gate validation runs after state sync/checksum are recorded in the corresponding log.

## Known Limitations

- Native HTML-in-Canvas is experimental and was unavailable in the current QA browser.
- The fallback is a controlled premium DOM-rendered document stage.
- This pass does not add editing, PDF export, server upload, live LLM calls, or a general renderer framework.

## Next Recommended Stage

Add renderer/state adapter contracts for additional registered artifacts:

- dashboard stage
- source map stage
- checklist/SOP stage
- document/report stage with export and print options
