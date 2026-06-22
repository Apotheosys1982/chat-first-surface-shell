# Live Artifact Evaluation Work Order

This is the executable Codex checklist for live Surface Shell evaluations. It turns council review requirements into browser actions and evidence.

## Setup

- Local URL: `http://127.0.0.1:8899/index.html`
- Production URL: `https://chat-first-surface-shell.netlify.app`
- Preferred mobile viewport: `393x852`
- Browser surface: in-app browser
- Required preflight:
  - `npm run sync:chat-first-state`
  - `npm run compile:chat-first-answer-pack`
  - `npm run validate`

## Core Commands

| Command | Expected outcome |
| --- | --- |
| `dashboard` | Opens `Project state dashboard` through the registry-selected renderer. |
| `artifacts` | Opens `Artifact directory`; rows use the same `data-artifact-open` path as commands. |
| `source map` | Opens `Source map` with approved source spine and runtime overlay. |
| `inbox` | Opens `Source inbox` and shows local/quarantined upload posture. |
| `events` | Opens `Event ledger`. |
| `compiler` | Opens `Compiler report`. |
| `receipt` | Opens `Receipts directory`. |
| `draft` | Opens `Surface Diagnosis Draft` in the document stage. |
| `spreadsheet` | Does not open a fake artifact; returns a missing-artifact response. |

## Negative And Boundary Checks

- Ask an unsupported regulated or hidden-instruction prompt.
- Confirm the shell refuses or routes back to source/status artifacts instead of improvising.
- Type `spreadsheet` before a staged spreadsheet artifact exists.
- Confirm the missing-artifact response offers Source Inbox, Source Registry, or source-map draft paths.

## Upload Quarantine Check

When file upload is in scope:

1. Import a non-sensitive text fixture through the composer `+` control.
2. Confirm it appears in Source Inbox as local browser state.
3. Confirm source status is `Uncertain`.
4. Confirm it is not approved source truth.
5. Confirm answer behavior does not change until review, compilation, and validation.

## Mobile Viewport Check

At `393x852`, report:

- `document.documentElement.scrollWidth`
- `document.documentElement.clientWidth`
- `document.body.scrollWidth`
- `window.scrollX`
- header/composer collapse state when scroll behavior is under review
- visible overlap or clipped-side findings

Passing mobile viewport behavior requires:

- no horizontal page overflow
- no sideways pan
- no content cut off past the viewport edge
- no console errors or warnings

## Evidence To Return

Codex must return a compact evidence package:

| Field | Required |
| --- | --- |
| URL tested | yes |
| Commit hash | yes |
| Deploy ID | yes, for production |
| Viewport | yes |
| Browser surface | yes |
| Commands tested | yes |
| Pass/fail table | yes |
| Console status | yes |
| Viewport metrics | yes |
| Screenshots | when visual framing or overlap is under review |
| Receipt path | yes, when committed |
| Checksum path | yes, when committed |

## Receipt Requirement

Save the live result as a receipt with:

- scope
- commands tested
- expected outcomes
- actual outcomes
- pass/fail summary
- console status
- viewport metrics
- URL, commit, and deploy ID
- validator commands

The council should review the receipt and evidence package after Codex execution.
