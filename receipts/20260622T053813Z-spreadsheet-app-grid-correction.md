# Receipt: Spreadsheet App Grid Correction

Timestamp: 2026-06-22T05:38:13Z

## Scope

Corrected the staged spreadsheet artifact so it reads as a standalone spreadsheet application instead of a dashboard/card report with spreadsheet labels.

This receipt is a correction receipt, not a feature-add receipt. The prior renderer had a canonical registry path and passed route validation, but the visual output still violated the product law:

The artifact must look like the thing it is.

For spreadsheets, that means workbook chrome, sheet controls, column letters, row numbers, cells, selected-cell state, sheet tabs, and grid-contained scrolling. It does not mean stacked mobile cards, summary panels, or dashboard copy.

## Root Cause

The previous `staged-spreadsheet` renderer mixed three ideas:

- a spreadsheet command route;
- a table-ish data preview;
- a dashboard/report visual treatment.

The mobile CSS then made the problem worse by intentionally converting spreadsheet rows into card rows:

- `.spreadsheet-header { display: none; }`
- `.spreadsheet-row { grid-template-columns: 1fr; }`
- `.spreadsheet-row > div::before { content: attr(data-label); }`

That made the mobile surface easier to fit, but it destroyed the spreadsheet grammar. It also let the renderer pass because the old validator only checked marker presence, not whether the mobile contract preserved an actual grid.

## HTML-in-Canvas Status

The document renderer currently checks for browser-native HTML-in-Canvas support through:

- `CanvasRenderingContext2D.drawElementImage()`
- `HTMLCanvasElement.requestPaint()`

In the tested browser path, those APIs are not available. The code therefore takes the honest fallback path:

- copies the document DOM into the fallback surface with `fallback.innerHTML = documentNode.outerHTML`;
- marks the canvas as native-unavailable;
- reports `Renderer: native HTML-in-Canvas unavailable in this browser`.

That means HTML-in-Canvas is still an experimental diagnostic path, not the production answer for artifact rendering. A canvas is a bitmap drawing surface. It is not a normal interactive DOM container. Until the draw-element path exists in the browser target, production artifact fidelity should come from contract-specific DOM, iframe, PDF, workbook, or dedicated renderers rather than pretending canvas can host arbitrary HTML like a native document surface.

## Implementation

Updated `spreadsheetStageHtml()` in `assistants/chat-first-surface-shell/public/script.js`.

The staged spreadsheet now renders:

- workbook app bar: `Operations workbook.xlsx`;
- workbook actions: `Share`, `Export`;
- menu bar: `File`, `Edit`, `View`, `Insert`, `Data`, `Review`;
- toolbar groups: `Undo`, `Redo`, `Filter`, `Sort`, `Freeze`, `Source`, `Validate`;
- formula bar with name box `A2`, `fx`, and formula text;
- ARIA `role="grid"` on the spreadsheet grid;
- column header row with column letters `A` through `F`;
- row-number gutter;
- individual `.sheet-cell` grid cells;
- selected active cell state on `A2`;
- fill-handle marker on the active cell;
- populated operations rows;
- blank trailing sheet rows;
- sheet tabs: `Operations`, `Sources`, `Validation`, `+`;
- status bar with renderer and adapter identity.

Updated `assistants/chat-first-surface-shell/public/styles.css`.

The spreadsheet visual contract now:

- uses an opaque app-like background for the artifact panel and body;
- removes the old card/report framing;
- fills the artifact body as an app surface;
- keeps the grid in its own scroll container;
- uses sticky column headers and sticky row headers;
- preserves cell borders, row heights, and workbook controls;
- keeps mobile as a spreadsheet grid instead of converting it to cards.

Updated `tools/validate-chat-first-renderer-visual-contracts.js`.

The spreadsheet validator now requires:

- `spreadsheet-shell`;
- `spreadsheet-grid`;
- `spreadsheet-formula-bar`;
- `sheet-column-header`;
- `sheet-cell`;
- `sheet-tab-strip`;
- `role="grid"` in the renderer output.

The validator now fails if the mobile stylesheet reintroduces:

- hidden spreadsheet headers;
- one-column spreadsheet rows;
- `data-label` pseudo-card conversion for cells.

## Local Browser Evidence

Browser surface: Codex in-app browser.

Local URL, mobile: `http://127.0.0.1:8899/index.html?v=spreadsheet-app-grid-live-local-2`

Viewport: `393x852`

Command tested:

`spreadsheet`

Mobile metrics:

- `document.body.scrollWidth`: `393`
- `document.documentElement.scrollWidth`: `393`
- `document.documentElement.clientWidth`: `393`
- `window.scrollX`: `0`
- artifact panel width: `393`
- artifact body width: `393`
- spreadsheet grid client width: `393`
- spreadsheet grid scroll width: `1076`
- formula bar present: yes
- column header present: yes
- selected cell present: yes
- sheet tab strip present: yes
- sheet cell count: `102`
- old card pseudo-rule present: no

Internal sheet scroll test:

- grid scroll before: `0`
- in-app browser scroll gesture over spreadsheet grid: `scrollX=520`, `scrollY=0`
- grid scroll after: `520`
- page `window.scrollX` after gesture: `0`
- body/page width after gesture: `393/393`

This confirms that the sheet scrolls inside the grid while the page remains viewport-locked.

Local URL, desktop: `http://127.0.0.1:8899/index.html?v=spreadsheet-app-grid-live-desktop`

Viewport: `1280x900`

Desktop metrics:

- `document.body.scrollWidth`: `1280`
- `document.documentElement.scrollWidth`: `1280`
- `document.documentElement.clientWidth`: `1280`
- `window.scrollX`: `0`
- formula bar present: yes
- column header present: yes
- selected cell present: yes
- sheet tab strip present: yes
- sheet cell count: `102`
- console warnings/errors: none

Screenshots were captured in the in-app browser evidence channel:

- mobile staged spreadsheet after internal horizontal grid scroll;
- desktop staged spreadsheet artifact.

## Validation Commands

Passed before this receipt was written:

- `npm run validate:js`
- `node tools/validate-chat-first-renderer-visual-contracts.js`

Expected final validation after state sync and checksum generation:

- `npm run sync:chat-first-state`
- `npm run compile:chat-first-answer-pack`
- `npm run validate`

## Product Interpretation

The correction changes the artifact from "data shown in a themed panel" to "spreadsheet app rendered inside the artifact surface."

The next renderer standard remains:

- spreadsheets must look and behave like spreadsheets;
- dashboards must look and behave like dashboards;
- documents must look and behave like documents;
- PDFs must use a real PDF-style viewing contract;
- websites must use a website/iframe/browser-stage contract;
- HTML-in-Canvas must stay labeled experimental until the target browser supports the native draw-element path.

## Pending

- Sync project state so this receipt appears in the shell.
- Generate checksum manifest.
- Run full validation.
- Commit and push.
- Deploy to Netlify production.
- Smoke test production with the same mobile spreadsheet checks.
