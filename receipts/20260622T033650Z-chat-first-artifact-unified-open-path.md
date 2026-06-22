# Receipt: Chat-First Artifact Unified Open Path

Timestamp: 2026-06-22T03:36:50Z

## Scope

Unified artifact opening so commands and artifact-list clicks resolve through one canonical artifact registry and one `openArtifact(artifactId)` path.

## Changes

- Replaced the legacy dashboard ID with the canonical `project-state-dashboard` artifact ID.
- Added `artifact-directory` as the Artifacts control-plane view instead of using the dashboard as a directory.
- Made `dashboard` resolve directly to `project-state-dashboard`.
- Made the Artifacts directory render registered artifacts as rows whose buttons call the same `data-artifact-open` path.
- Changed `openArtifact` to require a registry record, then select `stateAdapterId` and `rendererId` from that registry record.
- Added explicit `stageMode`, `sourceDependencies`, `status`, and `actions` metadata to registry records.
- Added validation that forbids the legacy `artifact-dashboard` runtime path.

## Validation

- `npm run validate:js`
- `npm run validate:chat-first-shell`
- In-app Browser QA at `393x852` mobile viewport:
  - Page loaded as `Chat-First Surface Shell`.
  - Runtime DOM contained no `artifact-dashboard` ID.
  - Typing `dashboard` opened `Project state dashboard`.
  - Opening `Artifacts` opened `Artifact directory`.
  - Clicking `Project state dashboard` inside `Artifact directory` opened the same staged dashboard artifact.
  - Console warnings/errors: `0`.
