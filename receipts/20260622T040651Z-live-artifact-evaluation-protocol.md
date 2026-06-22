# Receipt: Live Artifact Evaluation Protocol

Timestamp: 2026-06-22T04:06:51Z

## Scope

Added the missing live-app review bridge to the project protocol: external reviewers define behavior checks, Codex executes them in the browser, and the council reviews the returned evidence.

## Changes

- Added `docs/LATTICE_LIVE_ARTIFACT_REVIEW_PROTOCOL.md`.
- Added `docs/LIVE_ARTIFACT_EVAL_WORK_ORDER.md`.
- Added `tools/validate-live-artifact-evaluation-protocol.js`.
- Wired `npm run validate:live-artifact-eval` into `npm run validate`.
- Added the live review protocol and work order to the README documentation index.
- Added the protocol docs to the source manifest and generated source registry.
- Added the live artifact evaluation gate to generated validation state.

## Protocol Invariant

- Static Review Mode reads the page, text, screenshots, and claims.
- Behavior Review Mode produces exact live interaction instructions for Codex.
- Evidence Review Mode reviews Codex's returned results before judging behavior.
- Codex is the browser execution layer.
- Council/reviewer output is interpretation, not proof of live behavior.

## Validation

- `npm run validate:json`
- `npm run validate:js`
- `npm run validate:live-artifact-eval`

## Evidence Requirements Added

Live artifact evaluation must return URL, commit, deploy ID when applicable, viewport, browser surface, commands tested, expected outcomes, actual outcomes, pass/fail status, console status, mobile overflow status when applicable, screenshots when visual framing matters, receipt path, and checksum path when committed.
