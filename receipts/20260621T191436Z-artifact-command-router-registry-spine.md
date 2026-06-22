# Artifact Command Router + Registry Spine

Timestamp: 20260621T191436Z

## Summary

Implemented the first real artifact operating shell pass for `chat-first-surface-shell`.

The composer now checks a dedicated Artifact Command Router before falling back to bounded answer-room routing. Short artifact commands can open registered artifacts directly with compact status copy instead of producing long generic assistant responses.

Core invariant:

Short command -> resolve artifact -> render view.

Natural language question -> bounded answer route.

## Files Changed

- `assistants/chat-first-surface-shell/public/script.js`
- `dist/chat-first-surface-shell/script.js`
- `tools/validate-chat-first-artifact-router.js`
- `package.json`

Generated after receipt:

- `assistants/chat-first-surface-shell/public/project-state.js`
- `assistants/chat-first-surface-shell/public/state-events.js`
- `assistants/chat-first-surface-shell/public/source-registry.js`
- `assistants/chat-first-surface-shell/public/compiled-answer-pack.js`
- mirrored `dist/chat-first-surface-shell/*` state files
- `checksums/20260621T191436Z-artifact-command-router-registry-spine.sha256`

## Implementation Details

- Added `artifactRegistry` with registry-shaped metadata for seeded artifacts.
- Added `artifactCommandLexicon` for direct composer commands and aliases.
- Added `resolveArtifactCommand(input, context)` before `route(input)`.
- Added direct-open, ambiguous-picker, missing-artifact, and not-artifact-command outcomes.
- Added compact picker and missing-artifact UI helpers.
- Preserved existing `data-artifact-open` behavior.
- Preserved existing bounded answer routing for natural-language questions.
- Preserved upload quarantine and source trust rules.

Seeded commands:

- `dashboard`
- `source map`
- `source registry`
- `inbox`
- `events`
- `compiler`
- `receipt`
- `checklist`
- `SOP`

Missing-artifact fallback commands:

- `spreadsheet`
- `table`
- `draft`
- `document`
- `report`

## Validation Results

Passed:

- `node tools/validate-chat-first-artifact-router.js`
- `npm run validate:js`
- `npm run validate:json`
- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- `node tools/validate-chat-first-ingestion.js`

Follow-up validation after state sync and final checksum is expected to include:

- `npm run sync:chat-first-state`
- `node tools/compile-chat-first-answer-pack.js`
- `npm run validate:checksum`
- `npm run validate:code`

## Known Limitations

- HTML-in-Canvas staged rendering is not implemented in this pass.
- Spreadsheet/table/document/report artifacts currently return compact missing-artifact fallback instead of fake rendered views.
- Ambiguous picker path exists, but the current seeded command set mostly uses preferred artifacts for direct opening.
- This remains static/browser-local. No live LLM, server upload, or automatic source approval was added.

## Next Recommended Pass

Move artifact registry data out of `script.js` into a compiled `artifact-registry.js` or combined compiler output, then add real staged renderers for dashboard/source map/checklist/document surface.
