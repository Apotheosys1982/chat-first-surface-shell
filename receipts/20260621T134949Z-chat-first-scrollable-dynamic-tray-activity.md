# Chat-First Scrollable Dynamic Tray Activity

Timestamp: 20260621T134949Z

## Root Cause

The side tray showed a hardcoded Recent Activity list and did not provide a dedicated scroll region. As the shell generated more receipts and activity, the tray became stale and could not expose a longer project history cleanly.

## Files Modified

- assistants/chat-first-surface-shell/public/index.html
- assistants/chat-first-surface-shell/public/script.js
- assistants/chat-first-surface-shell/public/styles.css
- tools/validate-chat-first-shell.js

## Behavior Added

- Recent Activity in the side tray now has a dedicated render target.
- The tray hydrates Recent Activity from generated project state through the same `projectActivity` source used by the dashboard.
- The tray owns viewport height and keeps its Recent Activity list internally scrollable.
- Receipt items route to receipts/source inbox/dashboard/activity views instead of staying as inert stale labels.

## Validator Updates

- Validates the tray has a dynamic Recent Activity render target.
- Validates the tray owns viewport height and hides overflow at the shell level.
- Validates Recent Activity scrolls internally with `overflow-y: auto`.
- Validates the tray activity list is hydrated from project state.

## Validation Results

- `npm run validate:js`: pass, 179 files checked, 0 failures
- `npm run validate:chat-first-shell`: pass, 86 checks, 0 failures
- `npm run validate:chrome-collapse`: pass, 62 checks, 0 failures
- `npm run validate:checksum`: pass with `checksums/20260621T134949Z-chat-first-scrollable-dynamic-tray-activity.sha256`

## Build Sync

- Ran `npm run sync:chat-first-state` so Recent Activity uses the latest receipt and checksum state.
- Synced `assistants/chat-first-surface-shell/public/` into `dist/chat-first-surface-shell/`.

## Known Limitations

- The tray activity list is generated from local receipt/checksum state; it is not a remote activity feed.
- Browser visual QA may require serving the static dist over localhost instead of opening `file://`.
