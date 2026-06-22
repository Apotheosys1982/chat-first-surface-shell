# Receipt: Chat-First Scroll Stability

Timestamp: 2026-06-22T02:49:05Z

## Scope

Fixed the mobile chat scroll conflict where header/composer collapse motion fought the message stream scroll gesture.

## Changes

- Removed animated `padding-top` and `padding-bottom` changes from `.message-stream`.
- Kept the message stream geometry stable while `.chrome-receded` is toggled.
- Preserved chrome collapse through transform/opacity on `.workspace-header` and `.assistant-composer`.
- Added stable `scroll-padding-top` and `scroll-padding-bottom` around the overlay chrome.
- Debounced duplicate chrome recede requests so repeated scroll events do not schedule redundant class toggles.
- Updated validators so chrome collapse is required to leave message-stream padding and geometry stable.
- Cache-busted shell assets with `20260622-scroll-stability`.

## Validation

- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- In-app Browser QA at `393x852` mobile viewport before scroll:
  - `rootScrollWidth=393`
  - `bodyScrollWidth=393`
  - `streamClientWidth=365`
  - `streamScrollWidth=365`
  - `streamClientHeight=852`
  - `streamScrollHeight=1005`
  - `streamPaddingTop=132px`
  - `streamPaddingBottom=190px`
  - `scrollX=0`
  - `visibleOffenderCount=0`
- In-app Browser QA at `393x852` mobile viewport after scroll/chrome recede:
  - `chromeReceded=true`
  - `streamClientWidth=365`
  - `streamScrollWidth=365`
  - `streamClientHeight=852`
  - `streamScrollHeight=1005`
  - `streamPaddingTop=132px`
  - `streamPaddingBottom=190px`
  - `rootScrollWidth=393`
  - `bodyScrollWidth=393`
  - `scrollX=0`
  - `visibleOffenderCount=0`
  - console warnings/errors: `0`
