# Deployment

This repo deploys as a static Netlify site.

## Netlify Target

- Project: `chat-first-surface-shell`
- URL: `https://chat-first-surface-shell.netlify.app`
- Publish directory: `assistants/chat-first-surface-shell/public`

## Deploy Command

Preferred command:

```bash
npx netlify deploy --prod --no-build --dir assistants/chat-first-surface-shell/public --site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a
```

Equivalent command when `netlify` is installed on PATH:

```bash
netlify deploy --prod --no-build --dir assistants/chat-first-surface-shell/public --site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a
```

Use the local CLI if installed through npm:

```bash
./node_modules/.bin/netlify deploy --prod --no-build --dir assistants/chat-first-surface-shell/public --site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a
```

## Local CLI Hygiene

The previous validated deploys used this existing local binary as a tooling fallback:

```bash
/Users/johnbarros/Documents/Codex/surface-assistant-feature-surface/node_modules/.bin/netlify
```

That is a cross-repo CLI path. It is acceptable only as a temporary local operator fallback when `npx netlify` or a project-local CLI is unavailable. It is not the deploy target, not the project identity, and must always be paired with the explicit `--site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a` flag.

Preferred future hygiene: install or invoke Netlify CLI from this project context and remove reliance on the cross-repo binary path.

## Preflight

```bash
npm run sync:chat-first-state
npm run compile:chat-first-answer-pack
npm run validate
```

Do not deploy to the older `surface-assistant` Netlify project. That is a different target.
