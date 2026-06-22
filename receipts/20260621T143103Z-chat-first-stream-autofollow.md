# Chat-First Stream Auto-Follow

Timestamp: 20260621T143103Z

## Root Cause Addressed

After a user submitted a question, the assistant could begin streaming below the visible viewport while the chrome was already receded. The user then had to manually scroll to confirm whether anything happened.

## Files Changed

- `assistants/chat-first-surface-shell/public/script.js`
- `assistants/chat-first-surface-shell/public/project-state.js`
- `dist/chat-first-surface-shell/script.js`
- `dist/chat-first-surface-shell/project-state.js`
- `tools/sync-chat-first-state.js`
- `tools/validate-chat-first-shell.js`

## Changes

- Added `autoFollowStreaming` state to distinguish assistant-driven stream following from user-driven scrolling.
- Added `scrollStreamToBottom()` as the single programmatic scroll helper.
- New submitted answers call `streamAssistantMessage(..., { follow: true })`.
- Every streaming tick pulls the message stream down while auto-follow is active.
- Auto-follow releases after final render actions are appended.
- Manual upward wheel/touch pressure cancels auto-follow so the UI does not fight the user.
- Hardened `tools/validate-chat-first-shell.js` with explicit stream-follow gates.
- Synced project state and mirrored the updated shell into `dist/chat-first-surface-shell`.

## Validation Results

Passed:

- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- `npm run validate:json`
- `npm run validate:js`
- `npm run validate:checksum`

Browser validation note:

- In-app Browser automation was attempted against the current local `file://` shell URL during this workstream.
- Browser Use rejected navigation/reload due URL policy for the local file URL.
- No browser-policy workaround was used.

## Known Limitations

- Rendered browser QA was not captured because the Browser tool blocked local file URL automation.
- This pass did not deploy.
- This pass only targets the chat-first shell stream-follow behavior and its enforcement gates.
