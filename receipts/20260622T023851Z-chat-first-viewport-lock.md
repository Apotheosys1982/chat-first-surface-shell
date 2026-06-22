# Receipt: Chat-First Viewport Lock

Timestamp: 2026-06-22T02:38:51Z

## Scope

Fixed mobile viewport behavior for the Chat-First Surface Shell so the page does not side-pan, clip content past the screen edge, or let the closed tray create offscreen horizontal overflow.

## Changes

- Locked `html`, `body`, the app shell, message stream, tray activity stream, and artifact body to vertical pan behavior.
- Replaced the closed tray's offscreen transform with an in-place `clip-path` reveal.
- Added runtime horizontal scroll clamping for `window`, message stream, artifact body, and tray activity list.
- Moved chrome recede ownership away from raw stream touch movement and onto the message stream's actual scroll state.
- Added cache-busted asset URLs so mobile browsers fetch the viewport-lock CSS and runtime.
- Added mobile composer isolation so lower content does not visually bleed through the input layer.
- Added validator checks for viewport lock, clipped tray behavior, horizontal scroll clamping, and stream-owned chrome motion.

## Validation

- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- Browser QA at `393x852` mobile viewport:
  - `rootScrollWidth=393`
  - `bodyScrollWidth=393`
  - `streamScrollWidth=365`
  - `streamClientWidth=365`
  - `scrollX=0`
  - `visibleOffenderCount=0`
  - no console warnings or errors
