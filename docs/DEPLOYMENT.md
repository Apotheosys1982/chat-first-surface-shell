# Deployment

This repo deploys as a static Netlify site.

## Netlify Target

- Project: `chat-first-surface-shell`
- URL: `https://chat-first-surface-shell.netlify.app`
- Publish directory: `assistants/chat-first-surface-shell/public`

## Deploy Command

```bash
netlify deploy --prod --dir assistants/chat-first-surface-shell/public --site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a
```

Use the local CLI if installed through npm:

```bash
./node_modules/.bin/netlify deploy --prod --dir assistants/chat-first-surface-shell/public --site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a
```

## Preflight

```bash
npm run sync:chat-first-state
npm run compile:chat-first-answer-pack
npm run validate
```

Do not deploy to the older `surface-assistant` Netlify project. That is a different target.

