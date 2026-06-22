# Handoff Packet: Chat-First Surface Shell

Current-status note: this packet is historical context from before the standalone repository correction. For current operator entry, use `docs/AGENT_QUICK_START.md`, `docs/LATTICE_LIVE_ARTIFACT_REVIEW_PROTOCOL.md`, and the latest receipt/checksum first.

Current standalone repository:

`/Users/johnbarros/Documents/Codex/chat-first-surface-shell`

Current GitHub remote:

`https://github.com/Apotheosys1982/chat-first-surface-shell`

Current Netlify site:

`https://chat-first-surface-shell.netlify.app`

Generated: 2026-06-22  
Repo: `/Users/johnbarros/Documents/Codex/surface-assistant-feature-surface`  
Branch: `codex/sv2-biosphere-kids-surface`  
Primary current surface: `assistants/chat-first-surface-shell/public/index.html`

## Immediate Context

The user is moving to a remote/iOS workflow and may start a fresh Codex session because this thread is too large to load cleanly on mobile.

The next agent should treat this file as the working-state packet. Do not restart from scratch. The current work is a live prototype of a **chat-first Surface Assistant Shell** where:

- The assistant is the app.
- The composer is the command line for the surface.
- The shell routes direct artifact commands before natural-language answer-room routing.
- Registered artifacts open in a full-viewport artifact layer.
- Source intake is quarantined before it becomes answerable source truth.
- Recent receipts/logs/checksums are synced into project state so the app can render its own working history.

Core operating line:

> Say the thing you want. The shell opens the right artifact.

## User Expectations And Non-Negotiables

The user has been very clear about these interaction invariants:

1. Do not improvise UI patterns from scratch when repo patterns already exist.
2. Motion must use the shared motion CSS/token layer, not abrupt show/hide behavior.
3. Assistant chrome collapse means the **entire header and entire composer container** recede and the message viewport reclaims that space. Do not collapse only text.
4. The composer must be a premium rectangular/native message box, not a pill.
5. Avoid pill-inside-pill UI. Prefer borderless or very thin tonal separation.
6. Artifact modals/panels must be full viewport, professional, top-aligned, and close back to the same chat state.
7. Receipts/logs/checksums/state updates must be synced into the shell after meaningful changes.
8. Uploads do not become approved sources automatically.
9. Do not claim native HTML-in-Canvas is active unless the browser actually exposes the native path.
10. Do not deploy unless explicitly asked.

## Current Git State Warning

The repo is dirty. Many files are modified or untracked. This is expected based on the recent workstream, but the next agent must inspect before committing.

Current branch:

`codex/sv2-biosphere-kids-surface`

Important dirty/untracked categories:

- Chat-first shell source: `assistants/chat-first-surface-shell/`
- Chat-first shell dist mirror: `dist/chat-first-surface-shell/`
- Chat-first tools:
  - `tools/sync-chat-first-state.js`
  - `tools/compile-chat-first-answer-pack.js`
  - `tools/validate-chat-first-shell.js`
  - `tools/validate-chat-first-artifact-router.js`
  - `tools/validate-chat-first-html-canvas-stage.js`
  - `tools/validate-chat-first-ingestion.js`
  - `tools/validate-chrome-collapse-invariant.js`
- Planning docs:
  - `PLANNING_CHAT_FIRST_SURFACE_ASSISTANT_SHELL.md`
  - `PLANNING_PREMIUM_CHAT_UI_SYSTEM.md`
  - `PLANNING_OFFER_CONTEXT_ALIGNMENT.md`
  - `PLANNING_BOUNDED_ASSISTANT_ROUTING_SYSTEM.md`
- Latest receipts/logs/checksums are untracked in Git, even though they are valid architecture receipts on disk.
- There are also unrelated or earlier changes for SV2, WebMNEM, PE, Storage, templates, and agent-mode standards. Do not revert them without explicit instruction.

If asked to commit, inspect `git status --short` first and either commit the intended scope clearly or ask if unrelated dirty files should be included.

## Current Running App

The user’s in-app browser may show:

`http://127.0.0.1:8899/index.html`

The local HTTP server used during QA was stopped at the end of the last pass. To serve the source shell again:

```bash
cd /Users/johnbarros/Documents/Codex/surface-assistant-feature-surface
python3 -m http.server 8899 --directory assistants/chat-first-surface-shell/public
```

The source URL:

`http://127.0.0.1:8899/index.html`

The dist file also exists:

`/Users/johnbarros/Documents/Codex/surface-assistant-feature-surface/dist/chat-first-surface-shell/index.html`

Browser automation blocked direct `file://` navigation. Use local HTTP for browser QA.

## What Exists Now

### 1. Chat-First Shell Runtime

Source:

`assistants/chat-first-surface-shell/public/`

Mirror:

`dist/chat-first-surface-shell/`

Important files:

- `index.html`
- `styles.css`
- `script.js`
- `project-state.js`
- `state-events.js`
- `source-registry.js`
- `compiled-answer-pack.js`

The shell opens directly into the assistant interface. There is no landing page before the assistant.

### 2. Artifact Command Router

Implemented in:

`assistants/chat-first-surface-shell/public/script.js`

Direct commands route before normal answer-room routing:

- `dashboard`
- `source map`
- `source registry`
- `inbox`
- `events`
- `compiler`
- `receipt`
- `checklist`
- `SOP`
- `draft`
- `document`
- `report`
- `canvas`
- `html canvas`
- `diagnosis draft`
- `spreadsheet`
- `table`
- `new spreadsheet`
- `show all spreadsheets`
- `validate spreadsheet`
- `export spreadsheet`

Canonical artifacts include:

- `project-state-dashboard`
- `artifact-directory`
- `source-map`
- `source-registry`
- `document-inbox`
- `event-ledger`
- `activity-log`
- `compiler-report`
- `receipts-directory`
- `staged-spreadsheet`
- `checklist`
- `surface-diagnosis-draft`

Spreadsheet/table commands now resolve registered workbook artifacts. With one spreadsheet they open it; with multiple spreadsheets they render a picker. New local workbooks are editable, exportable, and persisted in the browser under `chatFirstSurfaceSpreadsheets.v1`, but user-created/uploaded workbooks remain `Uncertain`, unapproved, and `canAnswerFrom=false` until review, compilation, and validation.

If an artifact is missing, the router returns a compact missing-artifact fallback instead of a long generic answer.

### 3. HTML-in-Canvas Document Stage Spike

Latest completed pass:

`20260622T012134Z-html-canvas-document-stage-spike`

Added:

- Artifact: `surface-diagnosis-draft`
- Artifact type: `documentSurface`
- Renderer: `htmlCanvasDocumentStage`
- Stage type: `htmlInCanvas`
- Render function: `renderHtmlCanvasDocumentStage`

Commands:

- `draft`
- `document`
- `report`
- `canvas`
- `html canvas`
- `diagnosis draft`

Expected behavior:

1. User types `draft`.
2. Shell adds short status: `Opening document stage.`
3. Full-viewport artifact opens.
4. It attempts native HTML-in-Canvas using:
   - `canvas layoutsubtree`
   - `CanvasRenderingContext2D.drawElementImage`
   - `canvas.requestPaint`
5. Renderer status is visible.

Manual QA result:

`Renderer: native HTML-in-Canvas unavailable in this browser`

Fallback DOM rendering was visible and correct. This is acceptable and honest. Do not pretend native support is active.

### 4. Controlled Ingestion Spine

Current invariant:

> Upload does not equal approved source. Event does not equal truth. Ingestion comes before answer.

Implemented pieces:

- `project-state.js`
- `state-events.js`
- `source-registry.js`
- `compiled-answer-pack.js`
- local document import through composer `+`
- IndexedDB/localStorage storage posture
- Source Inbox artifact
- Source Registry artifact
- Event Ledger artifact
- Compiler Report artifact

Upload behavior:

- User uploads start as `Uncertain`.
- User uploads do not become `Active` automatically.
- User uploads do not become `Approved` automatically.
- `canAnswerFrom` remains `false`.
- Text-like files can get extracted previews.
- PDF/DOCX/images/spreadsheets/oversized files are metadata-only unless parser/OCR/source mapping exists.

## Latest Receipts

Most relevant recent receipts:

- `receipts/20260622T012134Z-html-canvas-document-stage-spike.md`
- `receipts/20260621T191436Z-artifact-command-router-registry-spine.md`
- `receipts/20260621T151818Z-chat-first-visible-source-inbox-storage.md`
- `receipts/20260621T150711Z-chat-first-controlled-ingestion-route-compiler.md`
- `receipts/20260621T143103Z-chat-first-stream-autofollow.md`
- `receipts/20260621T142800Z-chat-first-precision-polish-state-loop.md`
- `receipts/20260621T140604Z-chat-first-precision-polish-mode-separation.md`
- `receipts/20260621T134949Z-chat-first-scrollable-dynamic-tray-activity.md`

Latest checksum:

`checksums/20260622T012134Z-html-canvas-document-stage-spike.sha256`

Latest shell state references:

- `project-state.js` latest receipt label: `HTML-in-Canvas document stage`
- `state-events.js` latest event: `event-20260622T012134Z`
- `source-registry.js` includes receipt source: `receipt-20260622T012134Z`

## Validation Status

Latest completed validation commands passed:

```bash
npm run sync:chat-first-state
node tools/compile-chat-first-answer-pack.js
node tools/validate-chat-first-artifact-router.js
node tools/validate-chat-first-html-canvas-stage.js
npm run validate:chat-first-shell
npm run validate:chrome-collapse
npm run validate:json
npm run validate:js
npm run validate:code
npm run validate:checksum
```

Latest checksum validation passed against:

`checksums/20260622T012134Z-html-canvas-document-stage-spike.sha256`

## Manual QA Already Done

Served local shell at:

`http://127.0.0.1:8899/index.html`

Tested artifact commands:

- `draft` -> opened `Surface Diagnosis Draft`
- `document` -> opened `Surface Diagnosis Draft`
- `report` -> opened `Surface Diagnosis Draft`
- `canvas` -> opened `Surface Diagnosis Draft`
- `dashboard` -> opened `Project state dashboard`
- `source map` -> opened `Source map`
- `inbox` -> opened `Source inbox`
- `events` -> opened `Event ledger`
- `compiler` -> opened `Compiler report`
- `receipt` -> opened `Receipt stream`

Tested natural-language routing:

- `What changed recently?`
- `What receipts exist?`
- `Can you answer from this PDF?`
- `Why can’t you answer from this upload yet?`

Natural-language prompts stayed in answer routing and did not get hijacked by artifact commands.

## Current Architecture Files To Read First

For a fresh agent, read these before changing anything:

1. `HANDOFF_CHAT_FIRST_SURFACE_SHELL_20260622.md`
2. `assistants/chat-first-surface-shell/public/script.js`
3. `assistants/chat-first-surface-shell/public/styles.css`
4. `tools/validate-chat-first-shell.js`
5. `tools/validate-chat-first-artifact-router.js`
6. `tools/validate-chat-first-html-canvas-stage.js`
7. `tools/validate-chat-first-ingestion.js`
8. `tools/sync-chat-first-state.js`
9. `tools/compile-chat-first-answer-pack.js`
10. `receipts/20260622T012134Z-html-canvas-document-stage-spike.md`

## Likely Next Work

Possible next implementation passes:

1. Build a real renderer/state-adapter registry instead of keeping renderer definitions embedded in `script.js`.
2. Add first-class staged renderers for:
   - dashboard stage
   - source map stage
   - checklist/SOP stage
   - document/report export-ready stage
3. Improve artifact command ambiguity handling with a compact picker that feels native.
4. Add export/print support to document artifacts after the renderer contract is stable.
5. Add a local source-map draft workflow for uploaded docs.
6. Commit the current chat-first shell scope cleanly after deciding whether to include all earlier untracked receipts/logs/checksums.

## Do Not Do

- Do not deploy unless the user explicitly asks.
- Do not remove the existing artifact command router.
- Do not weaken upload quarantine.
- Do not add a live LLM call.
- Do not add server upload.
- Do not claim native HTML-in-Canvas is active unless the browser actually exposes the API.
- Do not convert this back into a landing page.
- Do not use generic chatbot widget styling.
- Do not reintroduce pill composer UI.
- Do not make only header text collapse; full chrome collapse is the invariant.

## Quick Resume Commands

Start local shell:

```bash
cd /Users/johnbarros/Documents/Codex/surface-assistant-feature-surface
python3 -m http.server 8899 --directory assistants/chat-first-surface-shell/public
```

Sync and validate:

```bash
npm run sync:chat-first-state
node tools/compile-chat-first-answer-pack.js
npm run validate:chat-first-shell
npm run validate:chrome-collapse
npm run validate:checksum
```

Full validation:

```bash
npm run validate:code
npm run validate:checksum
```

Check state:

```bash
git status --short
rg -n "HTML-in-Canvas document stage|event-20260622T012134Z" assistants/chat-first-surface-shell/public
```

## Last Known Good Statement

As of this handoff, the chat-first shell has:

- direct artifact command routing,
- controlled source ingestion,
- event/receipt/checksum state sync,
- full-viewport artifact layer,
- stream auto-follow,
- chrome collapse validation,
- visible Source Inbox storage posture,
- and a first HTML-in-Canvas document stage spike with honest fallback diagnostics.

The next agent should continue from here, not rebuild it.
