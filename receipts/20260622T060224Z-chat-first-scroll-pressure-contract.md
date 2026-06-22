# Receipt: Chat-First Scroll Pressure Contract

Timestamp: 2026-06-22T06:02:24Z

## Scope

Corrected the chat feed chrome state machine so header and composer visibility follows user pressure direction, not scroll position.

The required behavior is:

- scrolling down the feed to read more content hides the header and message composer;
- trying to scroll back up the feed reveals the header and message composer immediately;
- once revealed, header and composer stay revealed until the user applies down-feed pressure again.

## Failure

Earlier receipts claimed the header/composer direction behavior was fixed, but the runtime still contained a conflicting scroll-position rule.

After upward pressure revealed the chrome, the stream scroll handler could hide it again merely because `stream.scrollTop` was still greater than `CHROME_SCROLL_THRESHOLD`.

The bad condition was:

```js
delta > CHROME_SCROLL_THRESHOLD || (!shell?.classList.contains("chrome-receded") && top > CHROME_SCROLL_THRESHOLD)
```

That meant scroll position could override pressure direction.

## Root Cause

There were two authorities controlling the same `chrome-receded` state:

- gesture pressure through wheel/touch input;
- stream scroll position through the scroll handler.

The user contract says pressure direction owns chrome visibility. Scroll position can reveal at top or during upward movement, but it cannot hide the chrome just because the user is still deep in the feed.

## Change

Updated `assistants/chat-first-surface-shell/public/script.js`.

The stream scroll handler now:

- reveals chrome when `scrollTop <= 2`;
- reveals chrome on upward scroll delta;
- no longer hides chrome based on positive scroll delta or deep scroll position.

Down-feed pressure still hides chrome through `wheel` and `touchmove` handlers via `gestureOwnsChrome()`.

Updated validators:

- `tools/validate-chat-first-shell.js`
- `tools/validate-chrome-collapse-invariant.js`

New invariant:

- stream position must not auto-hide chrome after upward pressure reveals it.

## Local In-App Browser Evidence

Browser surface: Codex in-app browser.

Local URL:

`http://127.0.0.1:8899/index.html?v=scroll-pressure-contract-local`

Viewport:

`393x852`

Initial metrics:

- `chromeReceded`: `false`
- header opacity: `1`
- composer opacity: `1`
- stream `clientHeight`: `852`
- stream `scrollHeight`: `1005`
- page width: `393/393`
- `window.scrollX`: `0`
- console warnings/errors: none

Interaction sequence:

| Step | Expected | Actual |
| --- | --- | --- |
| Initial | Header/composer visible. | `chromeReceded=false`, header opacity `1`, composer opacity `1`. |
| Down-feed pressure | Header/composer hide. | `chromeReceded=true`, header/composer opacity near `0`, `scrollTop=153`. |
| Up-feed pressure | Header/composer reveal. | `chromeReceded=false`, header/composer opacity near `1`, `scrollTop=83`. |
| Hold after up pressure | Header/composer stay revealed. | After hold, `chromeReceded=false`, header opacity `1`, composer opacity `1`, `scrollTop=83`. |
| Second down-feed pressure | Header/composer hide again. | `chromeReceded=true`, header/composer opacity near `0`, `scrollTop=153`. |

This specifically validates that chrome no longer re-collapses merely because the feed is still scrolled down.

## Validation Commands

- `npm run validate:js`
- `npm run validate:chrome-collapse`

Full validation, checksum generation, commit, push, and production deployment follow this receipt.
