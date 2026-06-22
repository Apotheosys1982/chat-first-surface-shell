# Receipt: Renderer Visual Contracts

Timestamp: 2026-06-22T05:16:06Z

## Scope

Implemented the premium staged renderer visual contract law across the Chat-First Surface Shell.

Core law: The artifact must look like the thing it is.

This pass corrected registry metadata, renderer assignment, staged visual systems, validation gates, and mobile containment for the major artifact classes. The work stayed inside the standalone `chat-first-surface-shell` repository.

## Renderer Inventory And Corrections

| Artifact | Plane | Visual contract | Renderer | State adapter | Result |
| --- | --- | --- | --- | --- | --- |
| `project-state-dashboard` | work | dashboard | `dashboardStageRenderer` | `projectStateAdapter` | Confirmed and upgraded with explicit fields. |
| `staged-spreadsheet` | work | spreadsheet | `spreadsheetStageRenderer` | `spreadsheetStageAdapter` | Corrected from generic stage renderer. |
| `surface-diagnosis-draft` | work | document | `htmlCanvasDocumentStage` | `documentStageAdapter` | Confirmed as approved document stage renderer. |
| `source-map` | work | sourceMap | `sourceMapStageRenderer` | `sourceMapAdapter` | Corrected away from native shell panel renderer. |
| `source-registry` | work | sourceMap | `sourceMapStageRenderer` | `sourceRegistryAdapter` | Corrected to same source-governance visual contract. |
| `checklist` | work | checklist | `checklistStageRenderer` | `checklistAdapter` | Corrected from generic stage renderer. |
| `receipts-directory` | work | receipt | `receiptProofRenderer` | `receiptAdapter` | Corrected away from native shell panel renderer. |
| `artifact-directory` | control | nativeControl | `nativeShellPanelRenderer` | `artifactDirectoryAdapter` | Native control by design. |
| `document-inbox` | control | nativeControl | `nativeShellPanelRenderer` | `documentInboxAdapter` | Native control by design. |
| `extracted-text` | control | nativeControl | `nativeShellPanelRenderer` | `extractedTextAdapter` | Native control by design. |
| `source-map-draft` | control | nativeControl | `nativeShellPanelRenderer` | `sourceMapDraftAdapter` | Native control by design. |
| `event-ledger` | control | nativeControl | `nativeShellPanelRenderer` | `eventLedgerAdapter` | Native control by design. |
| `activity-log` | control | nativeControl | `nativeShellPanelRenderer` | `activityLogAdapter` | Native control by design. |
| `compiler-report` | control | nativeControl | `nativeShellPanelRenderer` | `compilerReportAdapter` | Native control by design, with mobile overflow fixed. |

## Implementation

- Added explicit `artifactPlane` and `visualContract` fields across the artifact registry.
- Added renderer implementations and registry rows for:
  - `spreadsheetStageRenderer`
  - `sourceMapStageRenderer`
  - `receiptProofRenderer`
  - `checklistStageRenderer`
- Preserved `dashboardStageRenderer` and `htmlCanvasDocumentStage` as the canonical dashboard and document renderers.
- Removed the old generic `artifactStageRenderer` path from active registry use.
- Updated `openArtifact()` to stamp `data-artifact-plane`, `data-visual-contract`, and `data-renderer-id` on the artifact layer, panel, and body.
- Updated the artifact directory so each row exposes artifact plane, visual contract, renderer ID, and state adapter ID.
- Updated command routing so `checklist`, `SOP`, `spreadsheet`, `table`, `source map`, `source registry`, `receipt`, `draft`, `report`, and `canvas` resolve to canonical registered artifacts.

## Visual Contract Work

- Dashboard now renders as an operational dashboard with hero status, metrics, validation gates, source posture, recent activity, and proof packet sections.
- Spreadsheet now renders as a spreadsheet/table surface with titlebar, toolbar, row grid, status strip, mobile row labels, and source-boundary copy.
- Source map and source registry now render as a source-governance surface with source status board, ingestion matrix, source cards, and answerability badges.
- Receipt directory now renders as a validation-proof surface with latest receipt, checksum, log, validation commands, and proof timeline.
- Checklist now renders as a process/SOP runner with required steps, owner/status labels, completion markers, and boundary warning.
- Document stage remains the approved HTML-in-Canvas document surface and now has responsive table containment.

## Validation Added

Added `tools/validate-chat-first-renderer-visual-contracts.js`.

The validator fails when:

- Any registered artifact lacks `artifactPlane`.
- Any registered artifact lacks `visualContract`.
- Any work artifact uses `nativeShellPanelRenderer`.
- Any contract-specific artifact uses the wrong renderer.
- `project-state-dashboard`, `staged-spreadsheet`, `surface-diagnosis-draft`, `source-map`, `checklist`, or `receipts-directory` are assigned to generic/native renderers.
- Required renderer registrations are missing.
- `openArtifact()` stops applying visual contract metadata to the runtime DOM.
- Required visual grammar markers disappear from JS or CSS.

The validator is wired into:

- `npm run validate:chat-first-shell`
- `npm run validate`

## Browser Evaluation

Browser surface: Codex in-app browser.

Local URL: `http://127.0.0.1:8899/index.html?v=renderer-contracts-final-matrix-2`

Viewport: `393x852`.

Commands tested:

| Command | Expected artifact | Contract | Renderer | Result |
| --- | --- | --- | --- | --- |
| `dashboard` | Project state dashboard | dashboard | `dashboardStageRenderer` | Pass |
| `spreadsheet` | Staged spreadsheet | spreadsheet | `spreadsheetStageRenderer` | Pass |
| `table` | Staged spreadsheet | spreadsheet | `spreadsheetStageRenderer` | Pass |
| `draft` | Surface Diagnosis Draft | document | `htmlCanvasDocumentStage` | Pass |
| `report` | Surface Diagnosis Draft | document | `htmlCanvasDocumentStage` | Pass |
| `canvas` | Surface Diagnosis Draft | document | `htmlCanvasDocumentStage` | Pass |
| `source map` | Source map | sourceMap | `sourceMapStageRenderer` | Pass |
| `source registry` | Source registry | sourceMap | `sourceMapStageRenderer` | Pass |
| `checklist` | Build checklist | checklist | `checklistStageRenderer` | Pass |
| `SOP` | Build checklist | checklist | `checklistStageRenderer` | Pass |
| `receipt` | Receipts directory | receipt | `receiptProofRenderer` | Pass |
| `artifacts` | Artifact directory | nativeControl | `nativeShellPanelRenderer` | Pass |
| `inbox` | Source inbox | nativeControl | `nativeShellPanelRenderer` | Pass |
| `events` | Event ledger | nativeControl | `nativeShellPanelRenderer` | Pass |
| `compiler` | Compiler report | nativeControl | `nativeShellPanelRenderer` | Pass |

Mobile geometry result for every command:

- `documentElement clientWidth/scrollWidth`: `393/393`
- `body clientWidth/scrollWidth`: `393/393`
- `artifactBody clientWidth/scrollWidth`: `393/393`
- overflowing descendants: `0`
- `window.scrollX`: `0`

Console result:

- No warning or error entries reported by `tab.dev.logs`.

Screenshots captured in the in-app browser evidence channel:

- Project state dashboard
- Staged spreadsheet
- Source map
- Build checklist

## Mobile Containment Fixes From Visual QA

The first screenshot pass caught a source-map headline clipping inside its own panel even though page-level horizontal scroll was locked. Additional inspection found:

- Source-governance hero grid was being widened by intrinsic headline/content sizing.
- Source-list status chip could force internal overflow.
- Document diagnosis table could exceed its frame on mobile.
- Compiler report rows could be widened by long compiled route regex strings.

Fixes applied:

- Added staged-surface `min-width: 0` and `max-width: 100%` containment.
- Added staged headline wrapping.
- Allowed long source-list status chips to wrap inside their header.
- Added fixed layout and cell wrapping to the document diagnosis table.
- Added state-list/state-row containment and mobile wrapping for long route strings.

## Chrome Motion Evidence

Final mobile scroll-pressure QA:

- Downward pressure: shell stayed `chrome-receded`; header opacity `0`; composer opacity `0`.
- Upward pressure: `chrome-receded` removed; header opacity `1`; composer opacity `1`.
- Hold after upward pressure: header and composer remained visible.
- Width lock held through the gesture sequence: `393/393`, `scrollX=0`.

## Validation Commands

- `npm run validate:js`
- `node tools/validate-chat-first-shell.js`
- `node tools/validate-chat-first-artifact-router.js`
- `node tools/validate-chat-first-renderer-visual-contracts.js`
- `node tools/validate-chat-first-html-canvas-stage.js`
- `node tools/validate-chat-first-ingestion.js`
- `npm run validate:chat-first-shell`

## Deploy Status

Production deploy is pending final state sync, checksum generation, full validation, commit, and Netlify production deployment after this receipt is incorporated.
