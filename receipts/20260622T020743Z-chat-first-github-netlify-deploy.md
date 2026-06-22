# Receipt: Chat-First Shell GitHub And Netlify Deploy

Timestamp: 2026-06-22T02:07:43Z

## Scope

Prepared the chat-first Surface Assistant Shell for remote browser testing by connecting the current workstream to the configured GitHub remote and creating a dedicated Netlify project handle.

## GitHub

- Active GitHub account: `Apotheosys1982`
- Requested handle spelling `Apotheosis1982` returned 404 through `gh api users/Apotheosis1982`.
- Repository: `https://github.com/Apotheosys1982/surface-assistant-feature-surface`
- Repository visibility: private
- Working branch: `codex/sv2-biosphere-kids-surface`

## Netlify

- Netlify team: `ApotheosysAi`
- Netlify account slug: `john-p-s-barros`
- Dedicated project: `chat-first-surface-shell`
- Production URL: `https://chat-first-surface-shell.netlify.app`
- Admin URL: `https://app.netlify.com/projects/chat-first-surface-shell`
- Project ID: `e69fb33f-e59a-4e37-9c4c-67d9963b8a5a`

## Validation

Completed before deployment receipt generation:

- `npm run sync:chat-first-state`
- `node tools/compile-chat-first-answer-pack.js`
- `node tools/validate-chat-first-artifact-router.js`
- `node tools/validate-chat-first-html-canvas-stage.js`
- `npm run validate:chat-first-shell`
- `npm run validate:chrome-collapse`
- `npm run validate:json`
- `npm run validate:js`

## Notes

The Netlify deploy target is the static chat-first shell directory, not the older root `surface-assistant` site. Upload quarantine, artifact command routing, and native HTML-in-Canvas fallback diagnostics remain unchanged.
