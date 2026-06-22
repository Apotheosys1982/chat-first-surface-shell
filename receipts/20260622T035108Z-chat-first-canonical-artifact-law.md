# Receipt: Chat-First Canonical Artifact Law

Timestamp: 2026-06-22T03:51:08Z

## Scope

Applied the one-artifact law across the major artifact command classes so commands, tray buttons, answer actions, and artifact directory rows resolve through the same registry-backed open path.

## Changes

- Renamed the receipt runtime artifact from `validation-receipt` to the canonical `receipts-directory`.
- Updated tray receipt buttons, generated answer actions, activity targets, and the receipt command lexicon to point at `receipts-directory`.
- Kept `spreadsheet` and `table` commands as explicit missing-artifact paths until a real staged spreadsheet artifact is seeded.
- Added router validation for canonical registry contracts across dashboard, artifact directory, source map, source inbox, event ledger, compiler report, receipts directory, and surface diagnosis draft.
- Added router validation that major commands prefer their canonical artifact IDs.
- Added validation that forbids the old `validation-receipt` runtime path, matching the existing ban on `artifact-dashboard`.
- Updated cache-busted asset URLs to the artifact-law build tag.

## Validation

- `npm run validate:js`
- `npm run validate:chat-first-shell`
- `node tools/validate-chat-first-artifact-router.js`
- In-app Browser QA at `393x852` mobile viewport:
  - Runtime DOM contained no `artifact-dashboard` ID.
  - Runtime DOM contained no `validation-receipt` ID.
  - Runtime DOM contained `receipts-directory`.
  - Typing `receipt` opened `Receipts directory`.
  - Typing `dashboard` opened `Project state dashboard`.
  - Typing `source map` opened `Source map`.
  - Typing `inbox` opened `Source inbox`.
  - Typing `events` opened `Event ledger`.
  - Typing `compiler` opened `Compiler report`.
  - Typing `draft` opened `Surface Diagnosis Draft`.
  - Typing `artifacts` opened `Artifact directory`.
  - Typing `spreadsheet` rendered the missing-artifact response instead of opening a fake artifact.
  - Mobile viewport metrics stayed at `scrollWidth=393`, `clientWidth=393`, `scrollX=0`.
