# Chat-First Precision Polish + Mode Separation

Timestamp: 20260621T140604Z

## Root Cause Addressed

The chat-first shell had the right product shape, but the visible UI still leaked too much internal/prototype structure. The tray recent activity rendered long receipt paths directly in cards, source-map rows led with raw planning filenames, and artifact views needed tighter source/dash/receipt consistency.

## Files Changed

- `assistants/chat-first-surface-shell/public/index.html`
- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/styles.css`
- `assistants/chat-first-surface-shell/public/project-state.js`
- `dist/chat-first-surface-shell/index.html`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/styles.css`
- `dist/chat-first-surface-shell/project-state.js`
- `tools/validate-chat-first-shell.js`

## Changes

- Added explicit `data-surface-mode="builder"` mode marker.
- Shifted primary copy toward operator language: ask from approved sources, render the right view, keep working.
- Added mode-aware source labels: Assistant Shell Plan, Premium UI Plan, Offer Context Plan, Routing System Plan.
- Preserved raw filenames as metadata instead of primary source-map titles.
- Converted tray recent activity secondary text from long receipt paths to compact status/timestamp metadata.
- Added source-map and activity-row metadata styling.
- Darkened and quieted the composer glass.
- Reduced border weight across tray/artifact/action rows.
- Reset artifact body scroll position on open.
- Mirrored source shell into `dist/chat-first-surface-shell`.
- Hardened `tools/validate-chat-first-shell.js` for mode marker, friendly labels, metadata preservation, compact tray activity, scroll reset, and clamped recent activity text.

## Validation Results

Passed:

- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- `npm run validate:json`
- `npm run validate:js`

Browser validation note:

- In-app Browser automation was attempted against the current `file://` shell URL.
- Browser Use rejected navigation/reload due URL policy for the local file URL.
- No workaround browser automation path was used.

## Known Limitations

- No live in-app browser screenshot was captured because the Browser tool blocked the local file URL.
- This pass did not deploy and did not alter other surfaces.
- Buyer/demo mode exists as a lightweight mode marker and copy discipline; it is not a full separate runtime yet.
