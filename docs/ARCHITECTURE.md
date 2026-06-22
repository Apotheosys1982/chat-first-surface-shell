# Architecture

The Chat-First Surface Shell is a static browser app. It does not call a live model and does not upload user files to a server.

## Runtime Shape

- `index.html` loads generated state files before `script.js`.
- `script.js` owns command routing, answer-room routing, artifact rendering, upload intake, and UI state.
- `project-state.js` exposes recent receipts, logs, checksums, and validation gates.
- `state-events.js` exposes structured project events.
- `source-registry.js` separates source trust from ingestion status.
- `compiled-answer-pack.js` exposes bounded answer rooms and route seeds.

## Command Router

Direct artifact commands run before natural-language routing. Examples:

- `dashboard`
- `source map`
- `inbox`
- `events`
- `compiler`
- `receipt`
- `draft`
- `document`
- `report`
- `canvas`
- `html canvas`

When the command is clear, the shell opens the artifact directly. When multiple artifacts match, it renders a compact picker. When the artifact is missing, it returns a compact missing-artifact fallback.

## Source Intake

Upload does not equal approved source. User files start as:

- `sourceStatus: "Uncertain"`
- `ingestionStatus: "Uploaded"`
- `canAnswerFrom: false`

Text-like files can get a local extracted preview. PDF, DOCX, image, spreadsheet, and oversized files remain metadata-only until parser/OCR/source-map support exists.

## Viewport And Motion

The shell uses one vertical message scroller and clamps accidental horizontal movement at the CSS and runtime layers. The closed side tray is clipped in place instead of being transformed offscreen, which prevents mobile browsers from exposing a sideways pan area. Raw touch movement over the message stream does not directly drive chrome collapse; the stream scroll position owns header/composer recede state.

## Generated State

Run:

```bash
npm run sync:chat-first-state
npm run compile:chat-first-answer-pack
```

Both scripts write to the source app and mirror their generated files into `dist/chat-first-surface-shell`.
