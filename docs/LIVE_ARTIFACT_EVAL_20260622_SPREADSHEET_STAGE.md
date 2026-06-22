# Live Artifact Evaluation: Spreadsheet Stage

Timestamp: 2026-06-22T04:36:43Z

## Scope

This is the first live artifact evaluation run under the lattice review protocol. The pass tested the standalone Chat-First Surface Shell in the in-app browser at a mobile viewport and verified that the newly seeded spreadsheet/table artifact follows the canonical registry law.

The local URL under test was:

`http://127.0.0.1:8899/index.html?v=spreadsheet-stage-local`

The browser surface was the Codex in-app browser. The viewport was `393x852`.

## Objective

Confirm that the shell behaves as a command surface instead of a chatbot menu:

- commands resolve through the command lexicon;
- the command lexicon resolves a canonical `artifactId`;
- `openArtifact(artifactId)` reads the registry record;
- the registry selects `stateAdapterId` and `rendererId`;
- the renderer opens the staged artifact;
- unsupported artifact requests do not fabricate surfaces;
- mobile viewport locking prevents horizontal pan or side clipping;
- header and composer motion follows scroll pressure instead of fighting it.

## Command Matrix

| Command | Expected outcome | Actual outcome | Result | Viewport lock |
| --- | --- | --- | --- | --- |
| `dashboard` | Opens `Project state dashboard`. | Opened `Project state dashboard`. | Pass | Pass, `393/393`, `scrollX=0` |
| `artifacts` | Opens `Artifact directory`. | Opened `Artifact directory`. | Pass | Pass, `393/393`, `scrollX=0` |
| `source map` | Opens `Source map`. | Opened `Source map`. | Pass | Pass, `393/393`, `scrollX=0` |
| `inbox` | Opens `Source inbox`. | Opened `Source inbox`. | Pass | Pass, `393/393`, `scrollX=0` |
| `events` | Opens `Event ledger`. | Opened `Event ledger`. | Pass | Pass, `393/393`, `scrollX=0` |
| `compiler` | Opens `Compiler report`. | Opened `Compiler report`. | Pass | Pass, `393/393`, `scrollX=0` |
| `receipt` | Opens `Receipts directory`. | Opened `Receipts directory`. | Pass | Pass, `393/393`, `scrollX=0` |
| `draft` | Opens `Surface Diagnosis Draft`. | Opened `Surface Diagnosis Draft`. | Pass | Pass, `393/393`, `scrollX=0` |
| `spreadsheet` | Opens `Staged spreadsheet`. | Opened `Staged spreadsheet`. | Pass | Pass, `393/393`, `scrollX=0` |
| `table` | Opens `Staged spreadsheet`. | Opened `Staged spreadsheet`. | Pass | Pass, `393/393`, `scrollX=0` |
| `show kanban board` | No fake artifact opens; answer stays bounded. | No artifact opened. | Pass | Pass, `393/393`, `scrollX=0` |

## Chrome Motion Evidence

Mobile scroll pressure was tested with real in-app browser scroll input.

| State | Expected behavior | Actual behavior | Result |
| --- | --- | --- | --- |
| Initial load | Header and composer visible. | Header opacity `1`, composer opacity `1`, no `chrome-receded` class. | Pass |
| Downward pressure | Header and composer collapse. | `data-shell` gained `chrome-receded`; header opacity `0`; composer opacity `0`; stream moved to `scrollTop=153`. | Pass |
| Upward pressure | Header and composer return immediately. | `chrome-receded` removed; header opacity `1`; composer opacity `1`; stream moved to `scrollTop=33`. | Pass |
| Hold after upward pressure | Header and composer stay visible. | Header and composer remained visible; no recollapse. | Pass |
| Lateral pressure | Horizontal movement is clamped. | `documentElement.scrollWidth=393`, `clientWidth=393`, `scrollX=0`. | Pass |

## Console And Viewport Status

- Console warnings/errors: none.
- `document.documentElement.clientWidth`: `393`
- `document.documentElement.scrollWidth`: `393`
- `document.body.clientWidth`: `393`
- `document.body.scrollWidth`: `393`
- `window.scrollX`: `0`
- Message stream width during spreadsheet artifact: `365/365`

## Visual Evidence

The in-app browser captured a mobile screenshot of the `Staged spreadsheet` artifact. The screenshot showed the artifact header, close control, summary cards, and staged row counts inside the viewport without side clipping or horizontal overflow. The binary screenshot was emitted through the browser evidence channel and was not committed as a repo binary.

## Result

Pass.

The seeded spreadsheet/table artifact is live through the canonical command path. Mobile viewport locking, artifact opening, unsupported artifact refusal, and chrome pressure behavior all passed in the local in-app browser run.

## Commands And Validators

- `npm run sync:chat-first-state`
- `npm run compile:chat-first-answer-pack`
- `node tools/validate-chat-first-artifact-router.js`
- `npm run validate:chat-first-shell`
- `npm run validate:live-artifact-eval`

## Commit And Deploy Fields

- Commit hash: recorded in the final GitHub push for this work.
- Deploy ID: not applicable to this local evidence run; production deploy verification is reported separately after Netlify deploy.

