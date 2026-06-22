# Chat-First Project State Dashboard Pass

Timestamp: 2026-06-21T13:14:48Z

## Root Cause

The chat-first shell was being built and validated, but the app itself did not expose the working state of the project. The side tray still framed recent items as demos instead of showing the receipts/activity stream behind the current build.

## Files Changed

- `assistants/chat-first-surface-shell/public/index.html`
- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/styles.css`
- `dist/chat-first-surface-shell/index.html`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/styles.css`
- `dist/chat-first-surface-shell/assistant-build-metadata.json`
- `tools/validate-chat-first-shell.js`

## User-Facing Changes

- Changed tray label from `Recent demos` to `Recent activity`.
- Added tray entries for:
  - Project state dashboard
  - Recent hardening log
  - Chat shell polish
- Replaced the generic dashboard artifact with a project-state dashboard.
- Added a renderable `activity-log` artifact.
- Added a route for project-state questions such as `what did we fix`, `recent activity`, `receipts`, and `project state`.
- Added low-noise state board/list styling for project activity artifacts.

## Validation Updates

`tools/validate-chat-first-shell.js` now fails if:

- the tray does not expose recent project activity
- project-state artifacts are not registered
- the assistant lacks a project-state route

## Commands Run

```bash
npm run validate:chat-first-shell
npm run validate:chrome-collapse
node --check assistants/chat-first-surface-shell/public/script.js
```

## Validation Results

- `npm run validate:chat-first-shell`: pass
- `npm run validate:chrome-collapse`: pass
- `node --check assistants/chat-first-surface-shell/public/script.js`: pass

## Browser QA Note

Attempted to verify the current `file://` app in the in-app browser. Browser automation rejected the action under the browser URL security policy for local file navigation, so rendered verification was limited to static validation and the synced `dist` file target.

## Known Limitations

- Project activity is currently static in the runtime bundle.
- Receipts/logs/checksums are not yet automatically ingested into the dashboard.
- A future pass should generate the activity stream from receipt metadata instead of hand-maintained entries.
