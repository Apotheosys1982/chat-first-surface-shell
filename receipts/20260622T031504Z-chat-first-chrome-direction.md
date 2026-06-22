# Receipt: Chat-First Chrome Direction

Timestamp: 2026-06-22T03:15:04Z

## Scope

Fixed mobile chrome direction behavior so message-stream pressure controls header/composer visibility immediately.

## Changes

- Allowed gestures that begin inside `[data-message-stream]` to drive chrome recede/reveal direction.
- Preserved exclusions for composer, textarea, artifact layer, and side tray so controls keep their own gestures.
- Kept `.message-stream` geometry stable during chrome collapse; no padding or height mutation was reintroduced.
- Updated chrome-collapse validators so stream touch pressure must control chrome direction.
- Cache-busted shell assets with `20260622-chrome-direction`.

## Expected Behavior

- Moving down the feed collapses the header and message composer.
- Any reverse pressure inside the feed reveals the header and message composer immediately.
- Header and composer stay revealed until the user moves down the feed again.

## Validation

- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- In-app Browser QA at `393x852` mobile viewport:
  - Initial state: `chromeReceded=false`, `headerOpacity=1`, `composerOpacity=1`, `streamScrollWidth=365`, `streamClientWidth=365`, `scrollX=0`.
  - Down-feed movement: `chromeReceded=true`, `headerOpacity=0`, `composerOpacity=0`, stream width/height/padding unchanged.
  - Reverse pressure: `chromeReceded=false` immediately, then settled at `headerOpacity=1`, `composerOpacity=1`, stream width/height/padding unchanged.
  - Second down-feed movement: `chromeReceded=true`, proving chrome stays revealed until direction changes.
  - Console warnings/errors: `0`.
