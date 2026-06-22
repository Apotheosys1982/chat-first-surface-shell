# Agent Quick Start

Read this before changing the shell.

## First Checks

```bash
cd /Users/johnbarros/Documents/Codex/chat-first-surface-shell
git status --short --branch
git log -1 --oneline
npm run validate
```

Expected project identity:

- Repo: `https://github.com/Apotheosys1982/chat-first-surface-shell`
- Branch: `main`
- Production URL: `https://chat-first-surface-shell.netlify.app`
- Netlify site ID: `e69fb33f-e59a-4e37-9c4c-67d9963b8a5a`
- Runtime: static browser app

## Non-Negotiable Law

One artifact. One registry record. One open path. Renderer selected by registry.

Do not add a button, tray row, answer action, or command route that bypasses `openArtifact(artifactId)`.

## Ten Command Operator Block

```bash
cd /Users/johnbarros/Documents/Codex/chat-first-surface-shell
git status --short --branch
git log -1 --oneline
npm run sync:chat-first-state
npm run compile:chat-first-answer-pack
rsync -a --delete assistants/chat-first-surface-shell/public/ dist/chat-first-surface-shell/
npm run validate
python3 -m http.server 8899 --directory assistants/chat-first-surface-shell/public
# Open http://127.0.0.1:8899/index.html in the in-app browser.
# Run the live artifact evaluation work order before claiming behavior passed.
```

## Do Not Build Next

Do not implement sockets yet.
Do not implement autonomous cross-pane control yet.
Do not build the PDF field guide yet.
Do not build the longform content engine yet.
Do not build twelve artifacts at once.
Do not touch SV2 from this repo.

Build the next artifact through the registry, validator, live work order, receipt, and checksum.

## Current Canonical Commands

| Command | Expected artifact |
| --- | --- |
| `dashboard` | `project-state-dashboard` |
| `artifacts` | `artifact-directory` |
| `source map` | `source-map` |
| `inbox` | `document-inbox` |
| `events` | `event-ledger` |
| `compiler` | `compiler-report` |
| `receipt` | `receipts-directory` |
| `draft` | `surface-diagnosis-draft` |
| `spreadsheet` | Opens the only spreadsheet artifact, or shows the spreadsheet picker when multiple workbook artifacts exist |
| `table` | Same spreadsheet/table artifact picker path |
| `new spreadsheet` | Creates a blank local workbook artifact, then opens it through `openArtifact(artifactId)` |

## Live Evidence Rule

Static review is not enough for this app.

Council or reviewer defines the test.
Codex executes the browser test.
Codex returns evidence.
Council interprets the evidence.

Evidence must include URL, commit, deploy ID when deployed, viewport, browser surface, commands tested, actual outcomes, pass/fail, console status, receipt path, and checksum path when committed.

## Netlify Hygiene

Preferred deploy path:

```bash
npx netlify deploy --prod --no-build --dir assistants/chat-first-surface-shell/public --site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a
```

The previous local environment reused this cross-repo binary:

```bash
/Users/johnbarros/Documents/Codex/surface-assistant-feature-surface/node_modules/.bin/netlify
```

That binary path is a tooling fallback only. It is not the project identity and must not be used to infer deploy target. Always pass the explicit site ID above.
