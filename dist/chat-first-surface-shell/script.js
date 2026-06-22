(function () {
  const shell = document.querySelector("[data-shell]");
  const stream = document.querySelector("[data-message-stream]");
  const composer = document.querySelector("[data-composer]");
  const textarea = composer?.querySelector("textarea[name='question']");
  const documentInput = document.querySelector("[data-document-input]");
  const sourceInboxStatus = document.querySelector("[data-source-inbox-status]");
  const tray = document.querySelector("[data-tray]");
  const trayActivityList = document.querySelector("[data-tray-activity-list]");
  const trayScrim = document.querySelector("[data-tray-scrim]");
  const artifactLayer = document.querySelector("[data-artifact-layer]");
  const artifactTitle = document.querySelector("[data-artifact-title]");
  const artifactMeta = document.querySelector("[data-artifact-meta]");
  const artifactBody = document.querySelector("[data-artifact-body]");
  const artifactPanel = artifactLayer?.querySelector(".artifact-panel");
  let lastScrollTop = 0;
  let lastTouchX = null;
  let lastTouchY = null;
  let lastFocusTarget = null;
  let lastChromeGestureAt = 0;
  let lastProgrammaticScrollAt = 0;
  let chromeRecedeFrame = 0;
  let pendingChromeReceded = null;
  let horizontalLockFrame = 0;
  let autoFollowStreaming = false;
  const GESTURE_EPSILON = 2;
  const CHROME_SCROLL_THRESHOLD = 10;
  const STREAM_INTERVAL_MS = 18;
  const DOCUMENT_STORE_KEY = "chatFirstSurfaceDocuments.v1";
  const SPREADSHEET_STORE_KEY = "chatFirstSurfaceSpreadsheets.v1";
  const MAX_DOCUMENTS = 12;
  const MAX_SPREADSHEETS = 12;
  const MAX_PREVIEW_CHARS = 4200;
  const MAX_READABLE_BYTES = 750 * 1024;
  const DEFAULT_SPREADSHEET_ROW_COUNT = 20;
  const projectState = window.CHAT_FIRST_PROJECT_STATE || {};
  const stateEvents = Array.isArray(window.CHAT_FIRST_STATE_EVENTS) ? window.CHAT_FIRST_STATE_EVENTS : [];
  const sourceRegistry = window.CHAT_FIRST_SOURCE_REGISTRY || { sources: [] };
  const compiledAnswerPack = window.CHAT_FIRST_ANSWER_PACK || { answerRooms: [] };
  const recentReceipts = Array.isArray(projectState.recentReceipts) ? projectState.recentReceipts : [];
  const recentLogs = Array.isArray(projectState.recentLogs) ? projectState.recentLogs : [];
  const recentChecksums = Array.isArray(projectState.recentChecksums) ? projectState.recentChecksums : [];
  const latestReceipt = recentReceipts[0];
  const latestChecksum = recentChecksums[0];
  const latestEvent = stateEvents[0];
  const shellMode = document.documentElement.dataset.surfaceMode || "builder";
  let uploadedDocuments = loadUploadedDocuments();
  const allowedSourceStatuses = ["Active", "Deprecated", "Uncertain", "Superseded"];
  const allowedIngestionStatuses = ["Uploaded", "Extracted", "Pending review", "Compiled", "Approved", "Rejected", "Needs source map"];
  const stagedSpreadsheetRows = [
    {
      area: "Client onboarding",
      owner: "Operations",
      status: "Blocked",
      sourcePosture: "Needs source map",
      nextAction: "Confirm which checklist is current before answer routes compile."
    },
    {
      area: "Invoice exceptions",
      owner: "Finance",
      status: "Review",
      sourcePosture: "Uncertain",
      nextAction: "Import sample policy language; keep rows quarantined until approved."
    },
    {
      area: "Support FAQ",
      owner: "CX",
      status: "Ready",
      sourcePosture: "Active",
      nextAction: "Convert repeated questions into bounded answer rooms."
    },
    {
      area: "Renewal handoff",
      owner: "Sales",
      status: "Draft",
      sourcePosture: "Pending review",
      nextAction: "Stage customer-safe fields; exclude account-specific private data."
    },
    {
      area: "SOP cleanup",
      owner: "Admin",
      status: "Ready",
      sourcePosture: "Active",
      nextAction: "Open checklist and source map before publishing the workflow view."
    }
  ];
  const spreadsheetColumns = [
    { letter: "A", key: "area", label: "Area", width: 190 },
    { letter: "B", key: "owner", label: "Owner", width: 150 },
    { letter: "C", key: "status", label: "Status", width: 132 },
    { letter: "D", key: "sourcePosture", label: "Source posture", width: 170 },
    { letter: "E", key: "nextAction", label: "Next action", width: 360 },
    { letter: "F", key: "command", label: "Command", width: 180 }
  ];

  const sourceDocuments = Array.isArray(sourceRegistry.sources)
    ? sourceRegistry.sources.filter((source) => source.origin !== "userUpload")
    : [];
  let spreadsheetStore = loadSpreadsheetStore();
  let activeSpreadsheetId = "staged-spreadsheet";

  function sourcePostureCopy() {
    if (shellMode === "builder") {
      return "These are the working source documents this local shell is allowed to explain. The readable label comes first; the actual repo filename stays visible as metadata for inspection.";
    }
    return "These are the approved source areas this assistant is allowed to explain. Technical file names stay available as metadata, but the primary labels are written for people.";
  }

  function columnLetter(index) {
    let letter = "";
    let value = index + 1;
    while (value > 0) {
      const remainder = (value - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      value = Math.floor((value - 1) / 26);
    }
    return letter;
  }

  function defaultSpreadsheetColumns(count = spreadsheetColumns.length) {
    return Array.from({ length: count }, (_, index) => {
      const seeded = spreadsheetColumns[index] || {};
      return {
        letter: seeded.letter || columnLetter(index),
        key: seeded.key || `column${index + 1}`,
        label: seeded.label || `Column ${columnLetter(index)}`,
        width: seeded.width || (index === 4 ? 320 : 160)
      };
    });
  }

  function blankSpreadsheetRows(rowCount = DEFAULT_SPREADSHEET_ROW_COUNT, columnCount = spreadsheetColumns.length) {
    return Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => ""));
  }

  function seedSpreadsheetRows() {
    const commandByArea = {
      "Client onboarding": "checklist",
      "Invoice exceptions": "source map",
      "Support FAQ": "dashboard",
      "Renewal handoff": "receipt",
      "SOP cleanup": "SOP"
    };
    const seeded = stagedSpreadsheetRows.map((row) => [
      row.area,
      row.owner,
      row.status,
      row.sourcePosture,
      row.nextAction,
      commandByArea[row.area] || "inspect"
    ]);
    return [
      ...seeded,
      ...blankSpreadsheetRows(Math.max(0, DEFAULT_SPREADSHEET_ROW_COUNT - seeded.length))
    ];
  }

  function createSeedSpreadsheetWorkbook() {
    const nowIso = new Date().toISOString();
    return {
      artifactId: "staged-spreadsheet",
      artifactType: "spreadsheet",
      title: "Operations workbook.xlsx",
      description: "Editable seeded operations workbook for artifact renderer validation.",
      origin: "seedDemo",
      visibilityScope: "builderDemo",
      sourceStatus: "Active",
      ingestionStatus: "Compiled",
      canRender: true,
      canEdit: true,
      canExport: true,
      canAnswerFrom: true,
      rendererId: "spreadsheetStageRenderer",
      stateAdapterId: "spreadsheetStageAdapter",
      createdAt: nowIso,
      updatedAt: nowIso,
      columns: defaultSpreadsheetColumns(),
      tableData: seedSpreadsheetRows(),
      sheets: ["Operations"],
      activeSheet: "Operations",
      selectedCell: { rowIndex: 0, columnIndex: 0 },
      editHistory: [],
      redoHistory: []
    };
  }

  function normalizeSpreadsheetWorkbook(candidate, fallback = {}) {
    const seed = fallback.artifactId ? fallback : createSeedSpreadsheetWorkbook();
    const raw = candidate && typeof candidate === "object" ? candidate : {};
    const columns = Array.isArray(raw.columns) && raw.columns.length
      ? raw.columns.map((column, index) => ({
        letter: column.letter || columnLetter(index),
        key: column.key || `column${index + 1}`,
        label: column.label || column.letter || columnLetter(index),
        width: Number(column.width) || (index === 4 ? 320 : 160)
      }))
      : seed.columns.map((column) => ({ ...column }));
    const tableData = Array.isArray(raw.tableData)
      ? raw.tableData.map((row) => Array.from({ length: columns.length }, (_, index) => String(Array.isArray(row) ? row[index] || "" : "")))
      : seed.tableData.map((row) => row.slice());
    while (tableData.length < DEFAULT_SPREADSHEET_ROW_COUNT) {
      tableData.push(Array.from({ length: columns.length }, () => ""));
    }
    const selectedCell = raw.selectedCell && Number.isInteger(raw.selectedCell.rowIndex) && Number.isInteger(raw.selectedCell.columnIndex)
      ? {
        rowIndex: Math.max(0, Math.min(tableData.length - 1, raw.selectedCell.rowIndex)),
        columnIndex: Math.max(0, Math.min(columns.length - 1, raw.selectedCell.columnIndex))
      }
      : { rowIndex: 0, columnIndex: 0 };
    return {
      artifactId: raw.artifactId || seed.artifactId,
      artifactType: "spreadsheet",
      title: raw.title || seed.title,
      description: raw.description || seed.description,
      origin: raw.origin || seed.origin || "userCreated",
      visibilityScope: raw.visibilityScope || seed.visibilityScope || "localSession",
      sourceStatus: allowedSourceStatuses.includes(raw.sourceStatus) ? raw.sourceStatus : seed.sourceStatus || "Uncertain",
      ingestionStatus: allowedIngestionStatuses.includes(raw.ingestionStatus) ? raw.ingestionStatus : seed.ingestionStatus || "Pending review",
      canRender: raw.canRender !== false,
      canEdit: raw.canEdit !== false,
      canExport: raw.canExport !== false,
      canAnswerFrom: typeof raw.canAnswerFrom === "boolean" ? raw.canAnswerFrom : Boolean(seed.canAnswerFrom),
      rendererId: "spreadsheetStageRenderer",
      stateAdapterId: "spreadsheetStageAdapter",
      createdAt: raw.createdAt || seed.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || seed.updatedAt || new Date().toISOString(),
      columns,
      rows: tableData.length,
      tableData,
      cells: raw.cells || {},
      sheets: Array.isArray(raw.sheets) && raw.sheets.length ? raw.sheets : seed.sheets || ["Sheet 1"],
      activeSheet: raw.activeSheet || seed.activeSheet || "Sheet 1",
      selectedCell,
      editHistory: Array.isArray(raw.editHistory) ? raw.editHistory.slice(-80) : [],
      redoHistory: Array.isArray(raw.redoHistory) ? raw.redoHistory.slice(-80) : []
    };
  }

  function loadSpreadsheetStore() {
    const seed = createSeedSpreadsheetWorkbook();
    try {
      const parsed = JSON.parse(localStorage.getItem(SPREADSHEET_STORE_KEY) || "{}");
      const workbooks = Array.isArray(parsed.workbooks) ? parsed.workbooks : [];
      const normalized = workbooks.map((workbook) => normalizeSpreadsheetWorkbook(workbook, workbook.artifactId === seed.artifactId ? seed : {}));
      const hasSeed = normalized.some((workbook) => workbook.artifactId === seed.artifactId);
      return {
        version: 1,
        workbooks: [
          hasSeed ? normalized.find((workbook) => workbook.artifactId === seed.artifactId) : seed,
          ...normalized.filter((workbook) => workbook.artifactId !== seed.artifactId)
        ].slice(0, MAX_SPREADSHEETS)
      };
    } catch (error) {
      return { version: 1, workbooks: [seed] };
    }
  }

  function saveSpreadsheetStore() {
    try {
      localStorage.setItem(SPREADSHEET_STORE_KEY, JSON.stringify({
        version: 1,
        workbooks: spreadsheetStore.workbooks.slice(0, MAX_SPREADSHEETS)
      }));
    } catch (error) {
      // Local storage can be unavailable in private browsing or locked-down contexts.
    }
  }

  function spreadsheetWorkbooks() {
    return spreadsheetStore.workbooks;
  }

  function getSpreadsheetWorkbook(artifactId = activeSpreadsheetId) {
    return spreadsheetWorkbooks().find((workbook) => workbook.artifactId === artifactId) || spreadsheetWorkbooks()[0] || createSeedSpreadsheetWorkbook();
  }

  function spreadsheetSourceRecords() {
    return spreadsheetWorkbooks().map((workbook) => ({
      sourceId: workbook.artifactId,
      id: workbook.artifactId,
      title: workbook.title,
      name: workbook.title,
      origin: workbook.origin,
      visibilityScope: workbook.visibilityScope,
      sourceStatus: workbook.sourceStatus,
      ingestionStatus: workbook.ingestionStatus,
      canAnswerFrom: workbook.canAnswerFrom,
      summary: `${workbook.canEdit ? "Editable" : "Read-only"} workbook artifact. Renderable locally; answer truth is gated by source status and ingestion status.`,
      path: `localStorage:${SPREADSHEET_STORE_KEY}`
    }));
  }

  function workbookCellName(workbook, rowIndex, columnIndex) {
    const column = workbook.columns[columnIndex] || { letter: columnLetter(columnIndex) };
    return `${column.letter}${rowIndex + 2}`;
  }

  function workbookCellValue(workbook, rowIndex, columnIndex) {
    const row = workbook.tableData[rowIndex] || [];
    return String(row[columnIndex] || "");
  }

  function setWorkbookCellValue(workbook, rowIndex, columnIndex, value) {
    while (workbook.tableData.length <= rowIndex) {
      workbook.tableData.push(Array.from({ length: workbook.columns.length }, () => ""));
    }
    while (workbook.tableData[rowIndex].length < workbook.columns.length) {
      workbook.tableData[rowIndex].push("");
    }
    workbook.tableData[rowIndex][columnIndex] = String(value || "");
    workbook.updatedAt = new Date().toISOString();
  }

  function recordWorkbookEdit(workbook, rowIndex, columnIndex, before, after) {
    if (before === after) return;
    workbook.editHistory = Array.isArray(workbook.editHistory) ? workbook.editHistory : [];
    workbook.redoHistory = [];
    workbook.editHistory.push({
      rowIndex,
      columnIndex,
      before,
      after,
      at: new Date().toISOString()
    });
    workbook.editHistory = workbook.editHistory.slice(-80);
  }

  function createBlankSpreadsheetWorkbook(title = "") {
    const nowIso = new Date().toISOString();
    const existingCount = spreadsheetWorkbooks().filter((workbook) => workbook.origin === "userCreated").length + 1;
    return normalizeSpreadsheetWorkbook({
      artifactId: `local-spreadsheet-${Date.now()}`,
      title: title || `Untitled spreadsheet ${existingCount}`,
      description: "Blank local spreadsheet artifact created in this browser.",
      origin: "userCreated",
      visibilityScope: "localSession",
      sourceStatus: "Uncertain",
      ingestionStatus: "Pending review",
      canRender: true,
      canEdit: true,
      canExport: true,
      canAnswerFrom: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      columns: defaultSpreadsheetColumns(),
      tableData: blankSpreadsheetRows(),
      sheets: ["Sheet 1"],
      activeSheet: "Sheet 1",
      selectedCell: { rowIndex: 0, columnIndex: 0 },
      editHistory: [],
      redoHistory: []
    });
  }

  function parseDelimitedRows(text, delimiter) {
    return String(text || "")
      .split(/\r?\n/)
      .filter((line) => line.trim().length)
      .slice(0, DEFAULT_SPREADSHEET_ROW_COUNT)
      .map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, "")));
  }

  function createSpreadsheetFromDelimitedText(fileName, text, delimiter = ",") {
    const rows = parseDelimitedRows(text, delimiter);
    if (!rows.length) return null;
    const columnCount = Math.max(spreadsheetColumns.length, ...rows.map((row) => row.length));
    const columns = defaultSpreadsheetColumns(columnCount);
    const tableData = rows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] || ""));
    while (tableData.length < DEFAULT_SPREADSHEET_ROW_COUNT) {
      tableData.push(Array.from({ length: columnCount }, () => ""));
    }
    const nowIso = new Date().toISOString();
    return normalizeSpreadsheetWorkbook({
      artifactId: `uploaded-spreadsheet-${Date.now()}`,
      title: fileName || "Uploaded spreadsheet candidate",
      description: "Parsed local CSV/TSV upload. It is renderable and editable, but not approved answer truth.",
      origin: "userUpload",
      visibilityScope: "localSession",
      sourceStatus: "Uncertain",
      ingestionStatus: "Extracted",
      canRender: true,
      canEdit: true,
      canExport: true,
      canAnswerFrom: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      columns,
      tableData,
      sheets: ["Imported"],
      activeSheet: "Imported",
      selectedCell: { rowIndex: 0, columnIndex: 0 },
      editHistory: [],
      redoHistory: []
    });
  }

  function isDelimitedSpreadsheetFile(file) {
    return /\.(csv|tsv)$/i.test(file.name || "") || /text\/(csv|tab-separated-values)/i.test(file.type || "");
  }

  const projectActivity = [
    ...recentReceipts.slice(0, 4).map((item) => ({
      title: item.label,
      status: "Receipt",
      detail: "Generated receipt from the current shell workstream.",
      path: item.path,
      timestamp: item.timestamp
    })),
    {
      title: "Chrome collapse invariant",
      status: "Validated",
      detail: "Header and composer collapse as full chrome, not just text. Gesture direction owns the motion path."
    },
    {
      title: "Motion standard hardening",
      status: "Active",
      detail: "Assistant chrome uses the shared motion-token classes instead of abrupt show/hide behavior."
    },
    {
      title: "Composer polish",
      status: "Patched",
      detail: "The composer is a native message box with a darker glass overlay, not a pill input."
    },
    {
      title: "Smalltalk route",
      status: "Patched",
      detail: "Simple greetings like hi and how are you now get a bounded, human response instead of a fallback loop."
    },
    {
      title: "Typography pass",
      status: "Patched",
      detail: "The shell moved to Playfair Display and Plus Jakarta Sans for a calmer premium read."
    },
    {
      title: "Project-state rendering",
      status: "Current pass",
      detail: "The shell now exposes recent activity and validation state as renderable artifacts inside the app."
    }
  ];

  function activityRows() {
    return projectActivity.map((item) => `
      <div class="state-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.detail)}</span>
          ${item.path ? `<small class="state-meta">${escapeHtml(item.path)}</small>` : ""}
        </div>
        <em>${escapeHtml(item.status)}</em>
      </div>
    `).join("");
  }

  function trayActivityMeta(item) {
    if (item.status === "Receipt") {
      return `${item.status}${item.timestamp ? ` · ${item.timestamp}` : ""}`;
    }
    return item.status;
  }

  function activityTarget(item) {
    const title = String(item.title || "");
    const status = String(item.status || "");
    if (/document|source inbox/i.test(title)) return 'data-artifact-open="document-inbox"';
    if (/dashboard|project state/i.test(title)) return 'data-artifact-open="project-state-dashboard"';
    if (/receipt|checksum/i.test(title) || /receipt/i.test(status)) return 'data-artifact-open="receipts-directory"';
    return 'data-artifact-open="activity-log"';
  }

  function renderTrayActivity() {
    if (!trayActivityList) return;
    trayActivityList.innerHTML = projectActivity.map((item) => `
      <button type="button" class="recent-item" ${activityTarget(item)}>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(trayActivityMeta(item))}</span>
      </button>
    `).join("");
  }

  function sourceRows() {
    return sourceDocuments.map((item) => `
      <div class="state-row source-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.summary)}</span>
          <small class="state-meta">${escapeHtml(item.path || item.sourceId)} · ${escapeHtml(item.origin)} · ${escapeHtml(item.visibilityScope)}</small>
        </div>
        <em>${escapeHtml(item.sourceStatus)} / ${escapeHtml(item.ingestionStatus)}</em>
      </div>
    `).join("");
  }

  function stateRows(items, emptyText = "No state entries generated yet.") {
    if (!items.length) {
      return `<div class="state-row"><div><strong>Empty</strong><span>${emptyText}</span></div><em>Missing</em></div>`;
    }
    return items.map((item) => `
      <div class="state-row">
        <div>
          <strong>${escapeHtml(item.label || item.command || item.filename || item.path)}</strong>
          <span>${escapeHtml(item.path || item.purpose || "")}</span>
        </div>
        <em>${escapeHtml(item.timestamp || item.status || "Tracked")}</em>
      </div>
    `).join("");
  }

  function statusTone(value) {
    const normalized = String(value || "").toLowerCase();
    if (/active|approved|compiled|ready|pass|validated/.test(normalized)) return "positive";
    if (/uncertain|review|pending|needs|draft|blocked/.test(normalized)) return "warning";
    if (/rejected|deprecated|superseded|fail|unapproved/.test(normalized)) return "critical";
    return "neutral";
  }

  function statusChip(value) {
    const label = String(value || "Tracked");
    return `<span class="status-chip" data-tone="${statusTone(label)}">${escapeHtml(label)}</span>`;
  }

  function countBy(items, key, allowedValues) {
    const counts = Object.fromEntries(allowedValues.map((value) => [value, 0]));
    for (const item of items || []) {
      const value = item?.[key] || "Unknown";
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }

  function dashboardStageHtml() {
    const validations = projectState.validations || [];
    const activeSources = sourceDocuments.filter((source) => source.sourceStatus === "Active").length;
    const compiledSources = sourceDocuments.filter((source) => source.ingestionStatus === "Compiled" || source.ingestionStatus === "Approved").length;
    return `
      <div class="dashboard-stage">
        <section class="dashboard-hero">
          <div>
            <p class="state-label">Operational dashboard</p>
            <h3>Shell state is live, bounded, and inspectable.</h3>
            <p>Command routes, receipts, checksums, source posture, and validation gates are staged as operating data instead of hidden repo trivia.</p>
          </div>
          <div class="dashboard-status-strip" aria-label="Dashboard status strip">
            ${statusChip("Active")}
            ${statusChip("Compiled")}
            ${statusChip("Validated")}
          </div>
        </section>
        <section class="dashboard-metric-grid" aria-label="Dashboard metrics">
          <div class="dashboard-metric">
            <span>Receipts</span>
            <strong>${escapeHtml(String(recentReceipts.length))}</strong>
            <small>Latest: ${latestReceipt ? escapeHtml(latestReceipt.label) : "not synced"}</small>
          </div>
          <div class="dashboard-metric">
            <span>Validation gates</span>
            <strong>${escapeHtml(String(validations.length))}</strong>
            <small>${validations[0] ? escapeHtml(validations[0].command) : "No gate registered"}</small>
          </div>
          <div class="dashboard-metric">
            <span>Active sources</span>
            <strong>${escapeHtml(String(activeSources))}</strong>
            <small>${escapeHtml(String(compiledSources))} compiled or approved records</small>
          </div>
          <div class="dashboard-metric">
            <span>Runtime overlay</span>
            <strong>${escapeHtml(String(uploadedDocuments.length))}</strong>
            <small>Local candidates, never trusted automatically</small>
          </div>
        </section>
        <section class="dashboard-grid">
          <div class="dashboard-panel dashboard-panel-wide">
            <div class="dashboard-panel-header">
              <div>
                <p class="state-label">Recent activity</p>
                <h4>Event timeline</h4>
              </div>
              ${latestEvent ? statusChip(latestEvent.status) : statusChip("Not synced")}
            </div>
            <div class="dashboard-timeline">${projectActivity.slice(0, 6).map((item) => `
              <div class="dashboard-timeline-row">
                <span aria-hidden="true"></span>
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <small>${escapeHtml(item.detail)}</small>
                </div>
                ${statusChip(item.status)}
              </div>
            `).join("")}</div>
          </div>
          <div class="dashboard-panel">
            <div class="dashboard-panel-header">
              <div>
                <p class="state-label">Source posture</p>
                <h4>Trust cluster</h4>
              </div>
            </div>
            <div class="dashboard-stack">
              ${Object.entries(countBy(sourceDocuments, "sourceStatus", allowedSourceStatuses)).map(([label, count]) => `
                <div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(count))}</strong></div>
              `).join("")}
            </div>
          </div>
          <div class="dashboard-panel">
            <div class="dashboard-panel-header">
              <div>
                <p class="state-label">Validation</p>
                <h4>Gate cluster</h4>
              </div>
            </div>
            <div class="dashboard-validation-list">${validations.slice(0, 5).map((gate) => `
              <div>
                <strong>${escapeHtml(gate.command)}</strong>
                <small>${escapeHtml(gate.purpose || "Required gate")}</small>
              </div>
            `).join("")}</div>
          </div>
        </section>
      </div>
    `;
  }

  function formatBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function loadUploadedDocuments() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DOCUMENT_STORE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.slice(0, MAX_DOCUMENTS) : [];
    } catch (error) {
      return [];
    }
  }

  function saveUploadedDocuments() {
    try {
      localStorage.setItem(DOCUMENT_STORE_KEY, JSON.stringify(uploadedDocuments.slice(0, MAX_DOCUMENTS)));
    } catch (error) {
      uploadedDocuments = uploadedDocuments.map((doc) => ({ ...doc, preview: "" }));
      try {
        localStorage.setItem(DOCUMENT_STORE_KEY, JSON.stringify(uploadedDocuments.slice(0, MAX_DOCUMENTS)));
      } catch (secondError) {
        // Local storage can be unavailable in private browsing or locked-down contexts.
      }
    }
  }

  function uploadStorageSummary() {
    const total = uploadedDocuments.length;
    const extracted = uploadedDocuments.filter((doc) => doc.ingestionStatus === "Extracted").length;
    const needsMap = uploadedDocuments.filter((doc) => doc.ingestionStatus === "Needs source map").length;
    const indexed = uploadedDocuments.filter((doc) => doc.storageMode === "indexedDB").length;
    if (!total) {
      return {
        label: "Local only · 0 candidates",
        detail: "Files added with + are kept in this browser Source Inbox. Nothing is sent to a server."
      };
    }
    return {
      label: `${total} candidate${total === 1 ? "" : "s"} · ${indexed} file${indexed === 1 ? "" : "s"} cached locally`,
      detail: `${extracted} extracted preview${extracted === 1 ? "" : "s"} · ${needsMap} need source map · none approved`
    };
  }

  function renderSourceInboxStatus() {
    if (!sourceInboxStatus) return;
    const summary = uploadStorageSummary();
    sourceInboxStatus.innerHTML = `
      <span>Source Inbox</span>
      <strong>${escapeHtml(summary.label)}</strong>
      <small>${escapeHtml(summary.detail)}</small>
    `;
  }

  function isReadableTextFile(file) {
    return /^text\//i.test(file.type || "") ||
      /\.(txt|md|markdown|json|csv|tsv|html|xml|yaml|yml|log)$/i.test(file.name || "");
  }

  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.readAsText(file);
    });
  }

  function openDocumentDb() {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    return new Promise((resolve) => {
      const request = indexedDB.open("chatFirstSurfaceSources", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("blobs", { keyPath: "blobId" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async function saveDocumentBlob(blobId, file) {
    const db = await openDocumentDb();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction("blobs", "readwrite");
      tx.objectStore("blobs").put({
        blobId,
        file,
        savedAt: new Date().toISOString()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function hashFile(file) {
    if (!window.crypto?.subtle || typeof file.arrayBuffer !== "function") return "";
    try {
      const buffer = await file.arrayBuffer();
      const digest = await window.crypto.subtle.digest("SHA-256", buffer);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    } catch (error) {
      return "";
    }
  }

  function documentRows() {
    if (!uploadedDocuments.length) {
      return `
        <div class="state-row">
          <div>
            <strong>No local documents imported yet</strong>
            <span>Use the + control inside the composer to add a document to this browser's Source Inbox.</span>
          </div>
          <em>Empty</em>
        </div>
      `;
    }
    return uploadedDocuments.map((doc) => `
      <div class="state-row document-row">
        <div>
          <strong>${escapeHtml(doc.name)}</strong>
          <span>${escapeHtml(doc.summary)}</span>
          <small class="state-meta">
            ${escapeHtml(doc.origin)} · ${escapeHtml(doc.visibilityScope)} · Source: ${escapeHtml(doc.sourceStatus)} · Ingestion: ${escapeHtml(doc.ingestionStatus)} · Answerable: ${doc.canAnswerFrom ? "yes" : "no"}
          </small>
          ${doc.spreadsheetArtifactId ? `<button type="button" class="inline-artifact-link" data-artifact-open="${escapeHtml(doc.spreadsheetArtifactId)}">Open parsed spreadsheet artifact</button>` : ""}
          ${doc.preview ? `<pre class="doc-preview">${escapeHtml(doc.preview)}</pre>` : ""}
        </div>
        <em>${escapeHtml(doc.sourceStatus)} / ${escapeHtml(doc.ingestionStatus)}</em>
      </div>
    `).join("");
  }

  function documentInboxHtml() {
    const summary = uploadStorageSummary();
    return `
      <div class="state-section source-inbox-view">
        <h3>Local Source Inbox</h3>
        <p>Documents imported through the composer are kept in this browser's local state. They are not uploaded to a server in this static shell.</p>
        <div class="storage-map" aria-label="Local storage map">
          <div>
            <strong>File cache</strong>
            <span>IndexedDB database <code>chatFirstSurfaceSources</code>, object store <code>blobs</code>, when the browser allows blob storage.</span>
          </div>
          <div>
            <strong>Metadata index</strong>
            <span>localStorage key <code>${DOCUMENT_STORE_KEY}</code> stores file name, status, hash, preview, and review state.</span>
          </div>
          <div>
            <strong>Approval state</strong>
            <span>${escapeHtml(summary.label)}. Uploads stay <code>Uncertain</code> and <code>canAnswerFrom=false</code> until review, compile, and validation.</span>
          </div>
        </div>
        <p class="document-note">Uploaded files are a runtime source overlay: local, quarantined, inspectable, and not trusted. Text-like files store a short extracted preview. PDFs, DOC, DOCX, images, spreadsheets, oversized files, and binary files are metadata-only until a parser, OCR, or source-map review exists.</p>
        <div class="source-inbox-actions">
          <button type="button" class="artifact-action wm-motion-focusable" data-spreadsheet-create>
            <span class="artifact-icon" aria-hidden="true">▦</span>
            <span><strong>Create blank spreadsheet</strong><small>Local editable artifact · not approved source truth</small></span>
          </button>
        </div>
        <div class="state-list">${documentRows()}</div>
      </div>
    `;
  }

  async function importDocuments(files) {
    const selected = Array.from(files || []).filter(Boolean);
    if (!selected.length) return;

    const imported = [];
    const importedSpreadsheetIds = [];
    for (const [index, file] of selected.entries()) {
      const createdAt = new Date().toISOString();
      const contentHash = await hashFile(file);
      const blobId = `upload-${contentHash || Date.now()}-${index}`;
      const blobStored = await saveDocumentBlob(blobId, file);
      const readable = isReadableTextFile(file) && file.size <= MAX_READABLE_BYTES;
      let preview = "";
      let sourceStatus = "Uncertain";
      let ingestionStatus = readable ? "Uploaded" : "Needs source map";
      let extractionStatus = readable ? "not_attempted" : "unsupported";
      let extractionMethod = readable ? "browser_file_reader" : "none";
      let canSearch = false;
      let spreadsheetArtifactId = "";
      let summary = `${file.type || "Unknown type"} · ${formatBytes(file.size)} · Imported ${new Date().toLocaleString()}`;

      if (readable) {
        try {
          const text = await readFileText(file);
          preview = text.slice(0, MAX_PREVIEW_CHARS).trim();
          ingestionStatus = preview.length ? "Extracted" : "Needs source map";
          extractionStatus = preview.length ? "extracted" : "failed";
          canSearch = Boolean(preview.length);
          summary = `${file.type || "Text file"} · ${formatBytes(file.size)} · ${preview.length ? "Extracted text preview is searchable locally; not approved as truth" : "No readable text found; source mapping needed"}`;
          if (preview && isDelimitedSpreadsheetFile(file)) {
            const workbook = createSpreadsheetFromDelimitedText(file.name || "Uploaded spreadsheet candidate", text, /\.tsv$/i.test(file.name || "") ? "\t" : ",");
            if (workbook) {
              spreadsheetStore.workbooks = [workbook, ...spreadsheetStore.workbooks].slice(0, MAX_SPREADSHEETS);
              saveSpreadsheetStore();
              syncSpreadsheetArtifacts();
              spreadsheetArtifactId = workbook.artifactId;
              importedSpreadsheetIds.push(workbook.artifactId);
              summary = `${file.type || "Delimited text"} · ${formatBytes(file.size)} · Parsed into editable local spreadsheet artifact; still not approved as source truth`;
            }
          }
        } catch (error) {
          ingestionStatus = "Needs source map";
          extractionStatus = "failed";
          summary = `${file.type || "Unknown type"} · ${formatBytes(file.size)} · Preview read failed; metadata indexed locally; source mapping needed`;
        }
      } else if (file.size > MAX_READABLE_BYTES && isReadableTextFile(file)) {
        extractionStatus = "unsupported";
        summary = `${file.type || "Text file"} · ${formatBytes(file.size)} · Too large for static preview; metadata indexed locally; source mapping needed`;
      } else {
        extractionStatus = "unsupported";
        summary = `${file.type || "Binary or packaged file"} · ${formatBytes(file.size)} · Parser/OCR not installed; metadata indexed locally; source mapping needed`;
      }

      imported.push({
        id: blobId,
        sourceId: blobId,
        name: file.name || "Untitled document",
        title: file.name || "Untitled document",
        origin: "userUpload",
        visibilityScope: "localSession",
        sourceStatus,
        ingestionStatus,
        extractionStatus,
        extractionMethod,
        type: file.type || "unknown",
        mimeType: file.type || "unknown",
        size: file.size || 0,
        sizeBytes: file.size || 0,
        importedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
        approvalMode: "not_approved",
        approvedBy: "",
        canSearch,
        canRender: true,
        canAnswerFrom: false,
        spreadsheetArtifactId,
        routeSeedStatus: canSearch ? "temporary_overlay" : "needs_source_map",
        contentHash,
        blobId: blobStored ? blobId : "",
        storageMode: blobStored ? "indexedDB" : "metadata_only",
        summary,
        preview
      });
    }

    uploadedDocuments = [...imported, ...uploadedDocuments].slice(0, MAX_DOCUMENTS);
    saveUploadedDocuments();
    renderSourceInboxStatus();

    addMessage("system", `<span>${imported.length} document${imported.length === 1 ? "" : "s"} registered as quarantined source candidate${imported.length === 1 ? "" : "s"}.</span>`);
    streamAssistantMessage(
      `I registered this in the local Source Inbox. The file cache uses IndexedDB when available; the metadata index uses localStorage key ${DOCUMENT_STORE_KEY}. Nothing was sent to a server. It is not approved as a source yet. I can show it, search extracted text if available, create a source-map draft, or queue it for surface diagnosis.`,
      ["document-inbox", "extracted-text", "source-map-draft", "source-registry", ...importedSpreadsheetIds]
    );
  }

  function eventRows() {
    if (!stateEvents.length) {
      return `<div class="state-row"><div><strong>No state events generated yet</strong><span>Run npm run sync:chat-first-state after a receipt/log/checksum pass.</span></div><em>Missing</em></div>`;
    }
    return stateEvents.map((event) => `
      <div class="state-row">
        <div>
          <strong>${escapeHtml(event.title)}</strong>
          <span>${escapeHtml(event.summary)}</span>
          <small class="state-meta">${escapeHtml(event.eventId)} · ${escapeHtml(event.eventType)} · Receipt: ${escapeHtml(event.receiptPath || "none")} · Checksum: ${escapeHtml(event.checksumPath || "pending")}</small>
        </div>
        <em>${escapeHtml(event.status)}</em>
      </div>
    `).join("");
  }

  function sourceRegistryRows() {
    const registryRows = Array.isArray(sourceRegistry.sources) ? sourceRegistry.sources : [];
    return registryRows.map((source) => `
      <div class="state-row source-row">
        <div>
          <strong>${escapeHtml(source.title)}</strong>
          <span>${escapeHtml(source.summary)}</span>
          <small class="state-meta">${escapeHtml(source.sourceId)} · ${escapeHtml(source.origin)} · ${escapeHtml(source.visibilityScope)} · canAnswerFrom=${source.canAnswerFrom ? "true" : "false"}</small>
        </div>
        <em>${escapeHtml(source.sourceStatus)} / ${escapeHtml(source.ingestionStatus)}</em>
      </div>
    `).join("");
  }

  function extractedTextRows() {
    const searchable = uploadedDocuments.filter((doc) => doc.canSearch && doc.preview);
    if (!searchable.length) {
      return `<div class="state-row"><div><strong>No extracted upload text yet</strong><span>Text-like files under the local preview limit can be extracted and searched. PDF, DOCX, image, scanned, spreadsheet, and oversized uploads remain metadata-only until parser/OCR/source mapping exists.</span></div><em>Empty</em></div>`;
    }
    return searchable.map((doc) => `
      <div class="state-row document-row">
        <div>
          <strong>${escapeHtml(doc.name)}</strong>
          <span>I can search this extracted preview, but I cannot treat it as an approved source of truth until it is reviewed and compiled.</span>
          <pre class="doc-preview">${escapeHtml(doc.preview)}</pre>
        </div>
        <em>${escapeHtml(doc.sourceStatus)} / ${escapeHtml(doc.ingestionStatus)}</em>
      </div>
    `).join("");
  }

  function sourceMapDraftRows() {
    if (!uploadedDocuments.length) {
      return `<div class="state-row"><div><strong>No source-map candidates yet</strong><span>Import a file with the + control to create local source-map draft candidates.</span></div><em>Empty</em></div>`;
    }
    return uploadedDocuments.map((doc) => `
      <div class="state-row">
        <div>
          <strong>${escapeHtml(doc.name)}</strong>
          <span>${doc.canSearch ? "Detected searchable extracted text. Candidate can be reviewed for route seeds." : "Metadata-only candidate. Parser, OCR, or manual source mapping is needed before route seeds can be trusted."}</span>
          <small class="state-meta">routeSeedStatus=${escapeHtml(doc.routeSeedStatus)} · extractionStatus=${escapeHtml(doc.extractionStatus)} · approvalMode=${escapeHtml(doc.approvalMode)}</small>
        </div>
        <em>${escapeHtml(doc.ingestionStatus)}</em>
      </div>
    `).join("");
  }

  function compilerReportHtml() {
    const rooms = Array.isArray(compiledAnswerPack.answerRooms) ? compiledAnswerPack.answerRooms : [];
    const seeds = Array.isArray(compiledAnswerPack.routeSeedSummary) ? compiledAnswerPack.routeSeedSummary : [];
    return `
      <div class="state-board">
        <section class="state-panel state-panel-wide">
          <p class="state-label">Compiler invariant</p>
          <h3>Base compiled answer pack is approved behavior. Runtime overlay is quarantined material.</h3>
          <p>${escapeHtml(compiledAnswerPack.invariant || "Upload does not equal approved source. Event does not equal truth. Ingestion comes before answer.")}</p>
        </section>
        <section class="state-panel">
          <p class="state-label">Answer rooms</p>
          <strong>${rooms.length}</strong>
          <span>Compiled deterministic route rooms loaded before runtime script.</span>
        </section>
        <section class="state-panel">
          <p class="state-label">State events</p>
          <strong>${escapeHtml(String(compiledAnswerPack.eventCount || stateEvents.length))}</strong>
          <span>Receipt-backed events compiled from repo-time state.</span>
        </section>
        <section class="state-panel">
          <p class="state-label">Runtime overlay</p>
          <strong>${uploadedDocuments.length}</strong>
          <span>Local uploaded candidates; none are trusted automatically.</span>
        </section>
      </div>
      <div class="state-section">
        <h3>Route seed summary</h3>
        <div class="state-list">${seeds.map((seed) => `
          <div class="state-row">
            <div>
              <strong>${escapeHtml(seed.seedId)}</strong>
              <span>${escapeHtml(seed.source)} · ${escapeHtml((seed.routeFamilies || []).join(", "))}</span>
            </div>
            <em>${escapeHtml(seed.status)}</em>
          </div>
        `).join("")}</div>
      </div>
      <div class="state-section">
        <h3>Compiled answer rooms</h3>
        <div class="state-list">${rooms.map((room) => `
          <div class="state-row">
            <div>
              <strong>${escapeHtml(room.id)}</strong>
              <span>${escapeHtml(room.routeFamily)} · ${escapeHtml(room.pattern)}</span>
            </div>
            <em>Compiled</em>
          </div>
        `).join("")}</div>
      </div>
    `;
  }

  function sourceCard(source) {
    const isAnswerable = Boolean(source.canAnswerFrom);
    return `
      <div class="source-governance-card" data-source-status="${escapeHtml(source.sourceStatus || "Unknown")}" data-ingestion-status="${escapeHtml(source.ingestionStatus || "Unknown")}">
        <div>
          <strong>${escapeHtml(source.title || source.name || source.sourceId)}</strong>
          <span>${escapeHtml(source.summary || "Source record has no summary yet.")}</span>
          <small>${escapeHtml(source.path || source.sourceId || source.id)} · ${escapeHtml(source.origin || "unknown origin")} · ${escapeHtml(source.visibilityScope || "unknown scope")}</small>
        </div>
        <div class="source-trust-stack">
          ${statusChip(source.sourceStatus || "Uncertain")}
          ${statusChip(source.ingestionStatus || "Needs source map")}
          <span class="answerability-badge" data-answerable="${isAnswerable ? "true" : "false"}">${isAnswerable ? "Answerable" : "Not answerable"}</span>
        </div>
      </div>
    `;
  }

  function sourceMapStageHtml() {
    const spreadsheetSources = spreadsheetSourceRecords();
    const allSources = [...sourceDocuments, ...uploadedDocuments, ...spreadsheetSources];
    const sourceGroups = countBy(allSources, "sourceStatus", allowedSourceStatuses);
    const ingestionGroups = countBy(allSources, "ingestionStatus", allowedIngestionStatuses);
    return `
      <div class="source-governance">
        <section class="source-governance-hero">
          <div>
            <p class="state-label">Source governance</p>
            <h3>Trust boundaries are the interface.</h3>
            <p>${escapeHtml(sourcePostureCopy())}</p>
          </div>
          <div class="source-governance-summary">
            <strong>${escapeHtml(String(sourceDocuments.length))}</strong>
            <span>approved spine records</span>
            <small>${escapeHtml(String(uploadedDocuments.length))} local quarantined overlays</small>
          </div>
        </section>
        <section class="source-status-board" aria-label="Source status groups">
          ${allowedSourceStatuses.map((status) => `
            <div class="source-status-column" data-tone="${statusTone(status)}">
              <span>${escapeHtml(status)}</span>
              <strong>${escapeHtml(String(sourceGroups[status] || 0))}</strong>
              <small>Source status</small>
            </div>
          `).join("")}
        </section>
        <section class="ingestion-matrix" aria-label="Ingestion status matrix">
          <div class="ingestion-matrix-title">
            <p class="state-label">Ingestion status</p>
            <h4>Processing is separate from truth.</h4>
          </div>
          <div class="ingestion-matrix-grid">
            ${allowedIngestionStatuses.map((status) => `
              <div>
                <span>${escapeHtml(status)}</span>
                <strong>${escapeHtml(String(ingestionGroups[status] || 0))}</strong>
              </div>
            `).join("")}
          </div>
        </section>
        <section class="source-governance-list">
          <div class="source-list-header">
            <div>
              <p class="state-label">Source cards</p>
              <h4>Approved spine and runtime overlay</h4>
            </div>
            ${statusChip("canAnswerFrom shown per source")}
          </div>
          <div class="source-card-grid">${allSources.length ? allSources.map(sourceCard).join("") : `
            <div class="source-governance-card">
              <div><strong>No sources registered</strong><span>Run the state sync pipeline to generate the source registry.</span></div>
              <div class="source-trust-stack">${statusChip("Missing")}</div>
            </div>
          `}</div>
        </section>
      </div>
    `;
  }

  function spreadsheetStageHtml(adaptedState = {}) {
    const workbook = normalizeSpreadsheetWorkbook(adaptedState.workbook || getSpreadsheetWorkbook(activeSpreadsheetId));
    const selected = workbook.selectedCell || { rowIndex: 0, columnIndex: 0 };
    const selectedName = workbookCellName(workbook, selected.rowIndex, selected.columnIndex);
    const selectedValue = workbookCellValue(workbook, selected.rowIndex, selected.columnIndex);
    const filledRows = workbook.tableData.filter((row) => row.some((cell) => String(cell || "").trim())).length;
    const answerLabel = workbook.canAnswerFrom ? "answerable" : "not answerable";
    const reviewRows = workbook.canAnswerFrom ? 0 : filledRows;
    const columnGrid = `48px ${workbook.columns.map((column) => `${Number(column.width) || 160}px`).join(" ")}`;
    const minWidth = 48 + workbook.columns.reduce((total, column) => total + (Number(column.width) || 160), 0);
    const gridStyle = `grid-template-columns:${columnGrid};min-width:${minWidth}px`;
    const rowHtml = workbook.tableData.map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      return `
        <div class="spreadsheet-row${row.some((cell) => String(cell || "").trim()) ? "" : " sheet-row-empty"}" role="row" aria-rowindex="${rowIndex + 2}" style="${gridStyle}">
          <div class="sheet-row-header" role="rowheader">${rowNumber}</div>
          ${workbook.columns.map((column, columnIndex) => {
            const cellName = workbookCellName(workbook, rowIndex, columnIndex);
            const cellValue = String(row[columnIndex] || "");
            const isSelected = selected.rowIndex === rowIndex && selected.columnIndex === columnIndex;
            const isLong = cellValue.length > 38 || /next|action|description/i.test(column.key || "");
            const isStrong = columnIndex === 0 && cellValue;
            return `<div
              class="sheet-cell${isSelected ? " is-selected" : ""}${isLong ? " sheet-cell-long" : ""}${isStrong ? " sheet-cell-text" : ""}"
              role="gridcell"
              tabindex="0"
              contenteditable="${workbook.canEdit ? "true" : "false"}"
              spellcheck="false"
              data-spreadsheet-cell
              data-sheet-id="${escapeHtml(workbook.artifactId)}"
              data-row-index="${rowIndex}"
              data-col-index="${columnIndex}"
              data-cell="${escapeHtml(cellName)}"
              aria-label="${escapeHtml(`${cellName} ${column.label}`)}">${escapeHtml(cellValue)}</div>`;
          }).join("")}
        </div>
      `;
    }).join("");
    return `
      <div class="spreadsheet-shell" data-sheet-id="${escapeHtml(workbook.artifactId)}">
        <div class="spreadsheet-appbar">
          <div class="sheet-file">
            <strong>${escapeHtml(workbook.title)}</strong>
            <span>${escapeHtml(String(filledRows))} filled rows · ${escapeHtml(workbook.origin)} · ${escapeHtml(workbook.sourceStatus)} / ${escapeHtml(workbook.ingestionStatus)} · ${escapeHtml(answerLabel)}</span>
          </div>
          <div class="sheet-app-actions" aria-label="Workbook actions">
            <button type="button" data-spreadsheet-action="share" data-sheet-id="${escapeHtml(workbook.artifactId)}">Share</button>
            <button type="button" data-spreadsheet-action="export" data-sheet-id="${escapeHtml(workbook.artifactId)}">Export CSV</button>
          </div>
        </div>
        <div class="sheet-menu" role="menubar" aria-label="Spreadsheet menu">
          <button type="button" role="menuitem" disabled title="File menus are not implemented in this local prototype.">File</button>
          <button type="button" role="menuitem" disabled title="Edit menus are represented by toolbar actions in this prototype.">Edit</button>
          <button type="button" role="menuitem" disabled title="View menus are not implemented in this local prototype.">View</button>
          <button type="button" role="menuitem" disabled title="Insert is not implemented in this local prototype.">Insert</button>
          <button type="button" role="menuitem" disabled title="Data tools are intentionally limited to validation/export for v1.">Data</button>
          <button type="button" role="menuitem" disabled title="Review is represented by the Validate control for v1.">Review</button>
        </div>
        <div class="spreadsheet-toolbar" aria-label="Spreadsheet toolbar">
          <div class="sheet-tool-group">
            <button type="button" data-spreadsheet-action="undo" data-sheet-id="${escapeHtml(workbook.artifactId)}"${workbook.editHistory.length ? "" : " disabled title=\"No edits to undo yet.\""}>Undo</button>
            <button type="button" data-spreadsheet-action="redo" data-sheet-id="${escapeHtml(workbook.artifactId)}"${workbook.redoHistory.length ? "" : " disabled title=\"No edits to redo yet.\""}>Redo</button>
          </div>
          <div class="sheet-tool-group">
            <button type="button" disabled title="Filter is not implemented in this local spreadsheet prototype.">Filter</button>
            <button type="button" disabled title="Sort is not implemented in this local spreadsheet prototype.">Sort</button>
            <button type="button" disabled title="Freeze panes are not implemented in this local spreadsheet prototype.">Freeze</button>
          </div>
          <div class="sheet-tool-group">
            <button type="button" data-spreadsheet-action="source" data-sheet-id="${escapeHtml(workbook.artifactId)}">Source</button>
            <button type="button" data-spreadsheet-action="validate" data-sheet-id="${escapeHtml(workbook.artifactId)}">Validate</button>
          </div>
        </div>
        <div class="spreadsheet-formula-bar" aria-label="Formula bar">
          <span class="sheet-name-box" data-spreadsheet-name-box>${escapeHtml(selectedName)}</span>
          <span class="sheet-fx">fx</span>
          <input class="sheet-formula-input" data-spreadsheet-formula data-sheet-id="${escapeHtml(workbook.artifactId)}" value="${escapeHtml(selectedValue)}" aria-label="Selected cell value">
        </div>
        <div class="sheet-feedback" data-spreadsheet-feedback>
          Local workbook state saves to <code>${SPREADSHEET_STORE_KEY}</code>. Renderable does not mean approved answer truth.
        </div>
        <div class="spreadsheet-grid" role="grid" aria-label="${escapeHtml(workbook.title)}" aria-rowcount="${workbook.tableData.length + 1}" aria-colcount="${workbook.columns.length}">
          <div class="sheet-column-header" role="row" aria-rowindex="1" style="${gridStyle}">
            <div class="sheet-corner" role="columnheader"></div>
            ${workbook.columns.map((column) => `<div class="sheet-column" role="columnheader" aria-label="${escapeHtml(column.label)}"><span>${escapeHtml(column.letter)}</span><small>${escapeHtml(column.label)}</small></div>`).join("")}
          </div>
          ${rowHtml}
        </div>
        <div class="sheet-tab-strip" aria-label="Workbook sheets">
          ${(workbook.sheets || [workbook.activeSheet || "Sheet 1"]).map((sheet) => `<button type="button" class="sheet-tab${sheet === workbook.activeSheet ? " is-active" : ""}" disabled title="Multi-sheet switching is not implemented yet.">${escapeHtml(sheet)}</button>`).join("")}
          <button type="button" class="sheet-tab sheet-tab-add" disabled title="Add sheet is not implemented in this local prototype.">+</button>
        </div>
        <div class="sheet-statusbar">
          <span>${escapeHtml(workbook.canEdit ? "Editable" : "Read-only")}</span>
          <span>${escapeHtml(String(filledRows))} filled · ${escapeHtml(String(reviewRows))} gated</span>
          <span>Renderer: spreadsheetStageRenderer</span>
          <span>Adapter: spreadsheetStageAdapter</span>
        </div>
      </div>
    `;
  }

  function receiptProofHtml() {
    const validations = projectState.validations || [];
    const latestLog = recentLogs[0];
    return `
      <div class="receipt-proof">
        <section class="receipt-proof-header">
          <div>
            <p class="state-label">Validation proof</p>
            <h3>Latest receipt packet</h3>
            <p>Receipts, logs, checksums, and validation commands are staged as an audit surface.</p>
          </div>
          <div class="receipt-stamp">
            <span>Latest timestamp</span>
            <strong>${escapeHtml(latestReceipt?.timestamp || projectState.generatedAt || "not synced")}</strong>
          </div>
        </section>
        <section class="proof-grid">
          <div class="proof-card">
            <span>Receipt path</span>
            <strong>${escapeHtml(latestReceipt?.label || "No receipt")}</strong>
            <small>${escapeHtml(latestReceipt?.path || "Run sync after creating receipts.")}</small>
          </div>
          <div class="proof-card">
            <span>Checksum path</span>
            <strong>${escapeHtml(latestChecksum?.label || "No checksum")}</strong>
            <small>${escapeHtml(latestChecksum?.path || "Checksum manifest missing.")}</small>
          </div>
          <div class="proof-card">
            <span>Log path</span>
            <strong>${escapeHtml(latestLog?.label || "No log")}</strong>
            <small>${escapeHtml(latestLog?.path || "Log stream missing.")}</small>
          </div>
        </section>
        <section class="validation-command-board">
          <div class="source-list-header">
            <div>
              <p class="state-label">Validation commands</p>
              <h4>Required gates</h4>
            </div>
            ${statusChip("Pass required")}
          </div>
          <div class="validation-command-list">${validations.map((gate) => `
            <div>
              <code>${escapeHtml(gate.command)}</code>
              <span>${escapeHtml(gate.purpose || "Required validation command")}</span>
              ${statusChip(gate.status || "required")}
            </div>
          `).join("")}</div>
        </section>
        <section class="proof-timeline">
          <div>
            <p class="state-label">Evidence stream</p>
            <h4>Recent proof packets</h4>
          </div>
          <div>${recentReceipts.slice(0, 6).map((receipt) => `
            <div class="proof-timeline-row">
              <span>${escapeHtml(receipt.timestamp || "tracked")}</span>
              <strong>${escapeHtml(receipt.label || receipt.filename)}</strong>
              <small>${escapeHtml(receipt.path)}</small>
            </div>
          `).join("")}</div>
        </section>
      </div>
    `;
  }

  function checklistStageHtml() {
    const steps = [
      {
        title: "Open the source map before answering",
        owner: "Operator",
        status: "Required",
        detail: "Confirm which source records are Active, Compiled, and answerable."
      },
      {
        title: "Route artifact commands before answer rooms",
        owner: "Runtime",
        status: "Active",
        detail: "Dashboard, spreadsheet, source map, checklist, receipt, and document commands open registered artifacts."
      },
      {
        title: "Keep uploads quarantined",
        owner: "Source reviewer",
        status: "Required",
        detail: "User files are local candidates until source review, compilation, and validation happen."
      },
      {
        title: "Validate before deploy",
        owner: "Codex",
        status: "Required",
        detail: "Run shell, renderer, chrome, live-eval, and checksum gates before production deployment."
      }
    ];
    return `
      <div class="checklist-runner">
        <section class="checklist-header">
          <div>
            <p class="state-label">Process runner</p>
            <h3>Build checklist</h3>
            <p>This artifact is a staged SOP surface: ordered work, owner labels, source posture, and clear completion semantics.</p>
          </div>
          <div class="checklist-progress">
            <strong>${escapeHtml(String(steps.length))}</strong>
            <span>required steps</span>
          </div>
        </section>
        <section class="process-meta-row">
          <div><span>Current source</span><strong>authored-demo-artifact</strong></div>
          <div><span>Contract</span><strong>checklistStageRenderer</strong></div>
          <div><span>Status</span><strong>Active</strong></div>
        </section>
        <section class="check-step-list">
          ${steps.map((step, index) => `
            <div class="check-step">
              <span class="check-index">${index + 1}</span>
              <span class="check-box" aria-hidden="true"></span>
              <div>
                <strong>${escapeHtml(step.title)}</strong>
                <p>${escapeHtml(step.detail)}</p>
                <small>${escapeHtml(step.owner)} · ${escapeHtml(step.status)}</small>
              </div>
              ${statusChip(step.status)}
            </div>
          `).join("")}
        </section>
        <section class="checklist-warning">
          <strong>Boundary</strong>
          <span>Do not treat this as a document paragraph dump. This renderer is for process execution and SOP review.</span>
        </section>
      </div>
    `;
  }

  function documentDraftStageHtml() {
    return `
      <div class="html-canvas-stage" data-html-canvas-document-stage>
        <div class="html-canvas-stage-top">
          <div>
            <p class="state-label">Document stage</p>
            <h3>Surface Diagnosis Draft</h3>
            <p>Command → renderer → state injection → HTML-in-Canvas stage.</p>
          </div>
          <div class="renderer-status" data-renderer-status>
            <span>Renderer</span>
            <strong>Attempting native path…</strong>
            <small data-renderer-detail>Checking for drawElementImage().</small>
          </div>
        </div>
        <div class="html-canvas-frame">
          <canvas class="html-canvas-surface" data-html-canvas-surface layoutsubtree="true" aria-label="Surface Diagnosis Draft document stage">
            <article class="diagnosis-document" data-html-canvas-document>
              <header class="diagnosis-document-header">
                <p>Surface Diagnosis Draft</p>
                <h4>Turning messy business knowledge into a command surface.</h4>
                <div class="diagnosis-status-row">
                  <span>Approved source pack</span>
                  <span>Static runtime</span>
                  <span>Draft artifact</span>
                </div>
              </header>
              <section>
                <h5>1. What changed</h5>
                <p>This shell now separates natural-language questions from artifact commands. If the user says <strong>draft</strong>, <strong>document</strong>, <strong>report</strong>, or <strong>canvas</strong>, the command router opens this registered document surface before normal answer routing runs.</p>
              </section>
              <section>
                <h5>2. Why it matters</h5>
                <p>The app does not need to generate code live. It summons registered renderers and injects current state. The assistant names the need, then stages the right interface.</p>
              </section>
              <section>
                <h5>3. Command examples</h5>
                <div class="diagnosis-command-grid">
                  <span>dashboard</span>
                  <span>source map</span>
                  <span>inbox</span>
                  <span>events</span>
                  <span>compiler</span>
                  <span>draft</span>
                </div>
              </section>
              <section class="diagnosis-callout">
                <h5>4. Source boundary</h5>
                <p>Uploads enter quarantine first. They can be inspected before they are trusted. Upload does not equal approved source; event does not equal truth; ingestion comes before answer.</p>
              </section>
              <section>
                <h5>5. Next step</h5>
                <p>Use the artifact registry to stage dashboard, source map, checklist, and document surfaces on demand.</p>
                <ul class="diagnosis-checklist">
                  <li>Keep the command router ahead of answer-room routing.</li>
                  <li>Keep renderers registered, validated, and state-fed.</li>
                  <li>Keep fallback honest when browser-native APIs are unavailable.</li>
                </ul>
              </section>
              <section>
                <h5>State table</h5>
                <table class="diagnosis-table">
                  <thead>
                    <tr><th>Layer</th><th>Status</th><th>Source</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Command router</td><td>Active</td><td>script.js</td></tr>
                    <tr><td>Document renderer</td><td>Spike</td><td>htmlCanvasDocumentStage</td></tr>
                    <tr><td>Native canvas path</td><td data-document-native-status>Detecting</td><td>drawElementImage()</td></tr>
                  </tbody>
                </table>
              </section>
              <footer>
                <p>Source note: this artifact is a seed demo generated from approved shell state, not a user upload and not a live model response.</p>
              </footer>
            </article>
          </canvas>
          <div class="html-canvas-fallback" data-html-canvas-fallback hidden></div>
        </div>
      </div>
    `;
  }

  function setRendererStatus(stage, label, detail, mode) {
    const status = stage?.querySelector("[data-renderer-status]");
    const nativeStatus = stage?.querySelector("[data-document-native-status]");
    if (status) {
      status.dataset.rendererMode = mode || "diagnostic";
      const strong = status.querySelector("strong");
      const small = status.querySelector("[data-renderer-detail]");
      if (strong) strong.textContent = label;
      if (small) small.textContent = detail;
    }
    if (nativeStatus) nativeStatus.textContent = label.replace(/^Renderer:\s*/i, "");
  }

  function renderHtmlCanvasDocumentStage(artifact) {
    artifactBody.innerHTML = documentDraftStageHtml();
    const stage = artifactBody.querySelector("[data-html-canvas-document-stage]");
    const canvas = artifactBody.querySelector("[data-html-canvas-surface]");
    const documentNode = artifactBody.querySelector("[data-html-canvas-document]");
    const fallback = artifactBody.querySelector("[data-html-canvas-fallback]");
    const context = canvas?.getContext?.("2d");
    const nativeAvailable = Boolean(
      canvas &&
      documentNode &&
      context &&
      typeof context.drawElementImage === "function" &&
      typeof canvas.requestPaint === "function"
    );

    if (!nativeAvailable) {
      if (fallback && documentNode) {
        fallback.innerHTML = documentNode.outerHTML;
        fallback.hidden = false;
      }
      canvas?.classList.add("is-native-unavailable");
      setRendererStatus(
        stage,
        "Renderer: native HTML-in-Canvas unavailable in this browser",
        "Fallback active. Enable the browser draw-element implementation to test the native path.",
        "fallback"
      );
      return;
    }

    const draw = () => {
      try {
        const frame = canvas.parentElement;
        const frameWidth = Math.max(320, Math.floor(frame.getBoundingClientRect().width));
        const contentHeight = Math.max(documentNode.scrollHeight || 0, 940);
        const dpr = window.devicePixelRatio || 1;
        canvas.style.height = `${contentHeight}px`;
        canvas.width = Math.round(frameWidth * dpr);
        canvas.height = Math.round(contentHeight * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, frameWidth, contentHeight);
        const transform = context.drawElementImage(documentNode, 0, 0);
        if (transform && typeof transform.toString === "function") {
          documentNode.style.transform = transform.toString();
        }
        setRendererStatus(
          stage,
          "Renderer: HTML-in-Canvas active",
          "Native drawElementImage() executed for this document stage.",
          "native"
        );
      } catch (error) {
        if (fallback && documentNode) {
          fallback.innerHTML = documentNode.outerHTML;
          fallback.hidden = false;
        }
        canvas?.classList.add("is-native-error");
        setRendererStatus(
          stage,
          "Renderer: diagnostic error",
          error?.message || "Native draw-element attempt failed; fallback active.",
          "error"
        );
      }
    };

    canvas.addEventListener("paint", draw);
    requestAnimationFrame(() => {
      draw();
      canvas.requestPaint();
    });
  }

  function artifactDirectoryHtml() {
    const visibleArtifacts = artifactRegistry.filter((entry) => entry.artifactId !== "artifact-directory");
    const stageLabel = (entry) => entry.artifactPlane === "work"
      ? `${entry.visualContract} work artifact`
      : "Native control plane";
    return `
      <div class="state-section artifact-directory-view">
        <h3>Artifact directory</h3>
        <p>Registered artifacts open through one path: command router or list click resolves an artifact ID, then <code>openArtifact(artifactId)</code> uses the registry renderer.</p>
        <div class="state-list">${visibleArtifacts.map((entry) => `
          <button type="button" class="state-row artifact-directory-row" data-artifact-open="${escapeHtml(entry.artifactId)}">
            <div>
              <strong>${escapeHtml(entry.title)}</strong>
              <span>${escapeHtml(entry.description)}</span>
              <small class="state-meta">${escapeHtml(entry.artifactId)} · ${escapeHtml(entry.artifactPlane)} · ${escapeHtml(entry.visualContract)} · ${escapeHtml(entry.rendererId)} · ${escapeHtml(entry.stateAdapterId || "staticArtifactAdapter")}</small>
            </div>
            <em>${escapeHtml(stageLabel(entry))}</em>
          </button>
        `).join("")}</div>
      </div>
    `;
  }

  const artifacts = {
    "artifact-directory": {
      title: "Artifact directory",
      meta: "Control plane · Registry",
      html: () => artifactDirectoryHtml()
    },
    "project-state-dashboard": {
      title: "Project state dashboard",
      meta: "Runtime state · Local build · Active",
      html: () => dashboardStageHtml()
    },
    "event-ledger": {
      title: "Event ledger",
      meta: "Events · Codex update stream · Active",
      html: () => `
        <div class="state-section">
          <h3>Event ledger</h3>
          <p>Codex updates become structured events before they become answerable project state. Events are not truth by themselves; they become route seeds only through compilation and validation.</p>
          <div class="state-list">${eventRows()}</div>
        </div>
      `
    },
    "activity-log": {
      title: "Recent hardening log",
      meta: "Activity · Surface shell · Active",
      html: `
        <div class="state-section">
          <h3>What changed recently</h3>
          <p>The point is to make the surface explain the working state instead of forcing the repo history to stay invisible.</p>
          <div class="state-list">${activityRows()}</div>
        </div>
      `
    },
    "source-map": {
      title: "Source map",
      meta: "Source posture · Active",
      html: () => sourceMapStageHtml()
    },
    "source-registry": {
      title: "Source registry",
      meta: "Source lifecycle · Base pack + runtime overlay",
      html: () => sourceMapStageHtml()
    },
    "document-inbox": {
      title: "Source inbox",
      meta: "Documents · Runtime overlay · Quarantined",
      html: () => documentInboxHtml()
    },
    "surface-diagnosis-draft": {
      title: "Surface Diagnosis Draft",
      meta: "Document stage · HTML-in-Canvas",
      html: () => documentDraftStageHtml()
    },
    "extracted-text": {
      title: "Extracted text",
      meta: "Upload preview · Searchable overlay · Unapproved",
      html: () => `
        <div class="state-section">
          <h3>Extracted text previews</h3>
          <p>Search is not the same as understanding. Extracted upload text can be searched locally, but it cannot be used as approved source truth until review, compilation, and validation happen.</p>
          <div class="state-list">${extractedTextRows()}</div>
        </div>
      `
    },
    "source-map-draft": {
      title: "Source map draft",
      meta: "Draft candidates · Needs review",
      html: () => `
        <div class="state-section">
          <h3>Source map draft candidates</h3>
          <p>Uploaded files can suggest route seeds or source-map candidates, but the durable assistant only changes after source review, approval, compilation, and validation.</p>
          <div class="state-list">${sourceMapDraftRows()}</div>
        </div>
      `
    },
    "compiler-report": {
      title: "Compiler report",
      meta: "Answer pack · Compiled behavior map",
      html: () => compilerReportHtml()
    },
    "staged-spreadsheet": {
      title: "Operations workbook.xlsx",
      meta: "Spreadsheet stage · Editable local workbook · Active",
      html: (adaptedState) => spreadsheetStageHtml(adaptedState)
    },
    "receipts-directory": {
      title: "Receipts directory",
      meta: "Receipts · Generated state · Active",
      html: () => receiptProofHtml()
    },
    "checklist": {
      title: "Build checklist",
      meta: "Checklist · Demo artifact · Active",
      html: () => checklistStageHtml()
    }
  };

  function renderArtifactHtml(artifact, context = {}) {
    artifactBody.innerHTML = typeof artifact.html === "function"
      ? artifact.html(context.adaptedState, context)
      : artifact.html;
  }

  function renderNativeShellPanel(artifact, registryEntry, context) {
    renderArtifactHtml(artifact, context);
  }

  function renderDashboardStage(artifact, registryEntry, context) {
    renderArtifactHtml(artifact, context);
  }

  function renderSpreadsheetStage(artifact, registryEntry, context) {
    renderArtifactHtml(artifact, context);
  }

  function renderSourceMapStage(artifact, registryEntry, context) {
    renderArtifactHtml(artifact, context);
  }

  function renderReceiptProof(artifact, registryEntry, context) {
    renderArtifactHtml(artifact, context);
  }

  function renderChecklistStage(artifact, registryEntry, context) {
    renderArtifactHtml(artifact, context);
  }

  const rendererRegistry = {
    nativeShellPanelRenderer: {
      rendererId: "nativeShellPanelRenderer",
      artifactTypesSupported: ["artifactDirectory", "sourceInbox", "extractedText", "sourceMapDraft", "eventLedger", "compilerReport"],
      stageType: "shellPanel",
      renderFunctionName: "renderNativeShellPanel",
      closeBehavior: "returnToChatState",
      render: renderNativeShellPanel
    },
    dashboardStageRenderer: {
      rendererId: "dashboardStageRenderer",
      artifactTypesSupported: ["dashboard"],
      stageType: "artifactStage",
      renderFunctionName: "renderDashboardStage",
      closeBehavior: "returnToChatState",
      render: renderDashboardStage
    },
    spreadsheetStageRenderer: {
      rendererId: "spreadsheetStageRenderer",
      artifactTypesSupported: ["spreadsheet", "table"],
      stageType: "artifactStage",
      renderFunctionName: "renderSpreadsheetStage",
      closeBehavior: "returnToChatState",
      render: renderSpreadsheetStage
    },
    sourceMapStageRenderer: {
      rendererId: "sourceMapStageRenderer",
      artifactTypesSupported: ["sourceMap", "sourceRegistry"],
      stageType: "artifactStage",
      renderFunctionName: "renderSourceMapStage",
      closeBehavior: "returnToChatState",
      render: renderSourceMapStage
    },
    receiptProofRenderer: {
      rendererId: "receiptProofRenderer",
      artifactTypesSupported: ["receiptsDirectory", "receipt", "validationReport"],
      stageType: "artifactStage",
      renderFunctionName: "renderReceiptProof",
      closeBehavior: "returnToChatState",
      render: renderReceiptProof
    },
    checklistStageRenderer: {
      rendererId: "checklistStageRenderer",
      artifactTypesSupported: ["checklist", "sop", "processMap"],
      stageType: "artifactStage",
      renderFunctionName: "renderChecklistStage",
      closeBehavior: "returnToChatState",
      render: renderChecklistStage
    },
    htmlCanvasDocumentStage: {
      rendererId: "htmlCanvasDocumentStage",
      artifactTypesSupported: ["documentSurface", "report", "draft"],
      stageType: "htmlInCanvas",
      renderFunctionName: "renderHtmlCanvasDocumentStage",
      supportsHTMLInCanvas: true,
      supportsEdit: false,
      supportsExport: false,
      supportsPrint: false,
      supportsSnapshot: false,
      closeBehavior: "returnToChatState",
      validationRules: [
        "attempt native drawElementImage path",
        "show renderer status",
        "fallback honestly when unavailable"
      ],
      render: renderHtmlCanvasDocumentStage
    }
  };

  const stateAdapterRegistry = {
    staticArtifactAdapter: (context) => context,
    artifactDirectoryAdapter: (context) => ({
      ...context,
      registeredArtifacts: artifactRegistry.map((entry) => ({ ...entry }))
    }),
    projectStateDashboardAdapter: (context) => ({
      ...context,
      latestReceipt,
      latestChecksum,
      latestEvent,
      recentReceipts,
      recentLogs,
      recentChecksums,
      validations: projectState.validations || []
    }),
    sourceMapAdapter: (context) => ({ ...context, sourceDocuments, uploadedDocuments }),
    sourceRegistryAdapter: (context) => ({ ...context, sourceRegistry, uploadedDocuments }),
    sourceInboxAdapter: (context) => ({ ...context, uploadedDocuments }),
    documentDraftAdapter: (context) => context,
    eventLedgerAdapter: (context) => ({ ...context, stateEvents }),
    activityLogAdapter: (context) => ({ ...context, projectActivity }),
    compilerReportAdapter: (context) => ({ ...context, compiledAnswerPack }),
    spreadsheetStageAdapter: (context) => ({
      ...context,
      stagedSpreadsheetRows,
      workbook: getSpreadsheetWorkbook(context.registryEntry?.artifactId || activeSpreadsheetId),
      workbooks: spreadsheetWorkbooks()
    }),
    receiptStreamAdapter: (context) => ({ ...context, recentReceipts, recentLogs, recentChecksums }),
    checklistAdapter: (context) => context
  };

  const artifactRegistry = [
    {
      artifactId: "project-state-dashboard",
      artifactType: "dashboard",
      artifactPlane: "work",
      visualContract: "dashboard",
      title: "Project state dashboard",
      description: "Current shell status, recent receipts, validation gates, source posture, and working activity.",
      commandAliases: ["dashboard", "metrics", "report view", "board", "project state", "status"],
      rendererId: "dashboardStageRenderer",
      stateAdapterId: "projectStateDashboardAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["project-state", "state-events", "source-registry", "compiled-answer-pack", "receipts", "checksums"],
      status: "Active",
      actions: ["open_event_ledger", "open_source_registry", "inspect_receipts"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactStage",
      editable: false,
      exportable: false,
      printable: false,
      origin: "compiledProjectState",
      visibilityMode: "builder"
    },
    {
      artifactId: "artifact-directory",
      artifactType: "artifactDirectory",
      artifactPlane: "control",
      visualContract: "nativeControl",
      title: "Artifact directory",
      description: "Registry-backed directory for opening artifacts through the same path as composer commands.",
      commandAliases: ["artifacts", "artifact list", "artifact directory", "views"],
      rendererId: "nativeShellPanelRenderer",
      stateAdapterId: "artifactDirectoryAdapter",
      stageMode: "shellPanel",
      sourceDependencies: ["artifact-registry"],
      status: "Active",
      actions: ["open_registered_artifact"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "shellPanel",
      editable: false,
      exportable: false,
      printable: false,
      origin: "artifactRegistry",
      visibilityMode: "builder"
    },
    {
      artifactId: "source-map",
      artifactType: "sourceMap",
      artifactPlane: "work",
      visualContract: "sourceMap",
      title: "Source map",
      description: "Approved source spine plus local quarantined upload overlay.",
      commandAliases: ["source map", "sources", "approved sources", "source posture"],
      rendererId: "sourceMapStageRenderer",
      stateAdapterId: "sourceMapAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["source-registry", "runtime-source-overlay"],
      status: "Active",
      actions: ["inspect_sources", "open_source_registry"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactStage",
      editable: false,
      exportable: false,
      printable: false,
      origin: "sourceRegistry",
      visibilityMode: "all"
    },
    {
      artifactId: "source-registry",
      artifactType: "sourceRegistry",
      artifactPlane: "work",
      visualContract: "sourceMap",
      title: "Source registry",
      description: "Source and ingestion status records for base sources and runtime overlays.",
      commandAliases: ["source registry", "registry", "source status", "ingestion status"],
      rendererId: "sourceMapStageRenderer",
      stateAdapterId: "sourceRegistryAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["source-registry", "runtime-source-overlay"],
      status: "Active",
      actions: ["inspect_statuses", "open_source_map"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactStage",
      editable: false,
      exportable: false,
      printable: false,
      origin: "sourceRegistry",
      visibilityMode: "all"
    },
    {
      artifactId: "document-inbox",
      artifactType: "sourceInbox",
      artifactPlane: "control",
      visualContract: "nativeControl",
      title: "Source inbox",
      description: "Local uploaded source candidates, extracted previews, and source-map needs.",
      commandAliases: ["inbox", "source inbox", "uploads", "uploaded files", "candidates"],
      rendererId: "nativeShellPanelRenderer",
      stateAdapterId: "sourceInboxAdapter",
      stageMode: "shellPanel",
      sourceDependencies: ["runtime-source-overlay"],
      status: "Active",
      actions: ["import_document", "inspect_extracted_text"],
      sourceStatusRequirement: "Uncertain",
      ingestionStatusRequirement: "Uploaded",
      renderMode: "shellPanel",
      editable: false,
      exportable: false,
      printable: false,
      origin: "runtimeUploadOverlay",
      visibilityMode: "all"
    },
    {
      artifactId: "extracted-text",
      artifactType: "extractedText",
      artifactPlane: "control",
      visualContract: "nativeControl",
      title: "Extracted text",
      description: "Searchable local upload previews that remain unapproved until review.",
      commandAliases: ["extracted text", "upload text", "search previews"],
      rendererId: "nativeShellPanelRenderer",
      stateAdapterId: "sourceInboxAdapter",
      stageMode: "shellPanel",
      sourceDependencies: ["runtime-source-overlay"],
      status: "Unapproved",
      actions: ["inspect_preview", "open_source_inbox"],
      sourceStatusRequirement: "Uncertain",
      ingestionStatusRequirement: "Extracted",
      renderMode: "shellPanel",
      editable: false,
      exportable: false,
      printable: false,
      origin: "runtimeUploadOverlay",
      visibilityMode: "builder"
    },
    {
      artifactId: "source-map-draft",
      artifactType: "sourceMapDraft",
      artifactPlane: "control",
      visualContract: "nativeControl",
      title: "Source map draft",
      description: "Draft source-map candidates from local uploads that need review before compilation.",
      commandAliases: ["source map draft", "draft source map", "source candidates"],
      rendererId: "nativeShellPanelRenderer",
      stateAdapterId: "sourceMapAdapter",
      stageMode: "shellPanel",
      sourceDependencies: ["runtime-source-overlay", "source-registry"],
      status: "Needs review",
      actions: ["inspect_candidates", "open_source_registry"],
      sourceStatusRequirement: "Uncertain",
      ingestionStatusRequirement: "Needs source map",
      renderMode: "shellPanel",
      editable: false,
      exportable: false,
      printable: false,
      origin: "runtimeUploadOverlay",
      visibilityMode: "builder"
    },
    {
      artifactId: "surface-diagnosis-draft",
      artifactType: "documentSurface",
      artifactPlane: "work",
      visualContract: "document",
      title: "Surface Diagnosis Draft",
      description: "A premium staged document artifact rendered from approved shell state.",
      commandAliases: ["draft", "document", "report", "canvas", "html canvas", "diagnosis draft"],
      rendererId: "htmlCanvasDocumentStage",
      stageType: "htmlInCanvas",
      stateAdapterId: "documentDraftAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["project-state", "compiled-answer-pack"],
      status: "Active",
      actions: ["render_document_stage"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactStage",
      editable: false,
      exportable: false,
      printable: false,
      canReturnState: false,
      origin: "seedDemo",
      visibilityMode: "builderDemo"
    },
    {
      artifactId: "event-ledger",
      artifactType: "eventLedger",
      artifactPlane: "control",
      visualContract: "nativeControl",
      title: "Event ledger",
      description: "Receipt-backed Codex update events and state changes.",
      commandAliases: ["events", "event ledger", "recent changes", "changes"],
      rendererId: "nativeShellPanelRenderer",
      stateAdapterId: "eventLedgerAdapter",
      stageMode: "shellPanel",
      sourceDependencies: ["state-events", "receipts"],
      status: "Active",
      actions: ["inspect_event", "open_receipts"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "shellPanel",
      editable: false,
      exportable: false,
      printable: false,
      origin: "stateEvents",
      visibilityMode: "builder"
    },
    {
      artifactId: "activity-log",
      artifactType: "eventLedger",
      artifactPlane: "control",
      visualContract: "nativeControl",
      title: "Recent hardening log",
      description: "Human-readable activity log for the current shell hardening sequence.",
      commandAliases: ["activity", "recent activity", "hardening log"],
      rendererId: "nativeShellPanelRenderer",
      stateAdapterId: "activityLogAdapter",
      stageMode: "shellPanel",
      sourceDependencies: ["project-state", "receipts", "logs"],
      status: "Active",
      actions: ["inspect_activity"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "shellPanel",
      editable: false,
      exportable: false,
      printable: false,
      origin: "projectState",
      visibilityMode: "builder"
    },
    {
      artifactId: "compiler-report",
      artifactType: "compilerReport",
      artifactPlane: "control",
      visualContract: "nativeControl",
      title: "Compiler report",
      description: "Compiled answer rooms, route seeds, and bounded runtime invariant.",
      commandAliases: ["compiler", "compiler report", "answer pack", "route compiler"],
      rendererId: "nativeShellPanelRenderer",
      stateAdapterId: "compilerReportAdapter",
      stageMode: "shellPanel",
      sourceDependencies: ["compiled-answer-pack"],
      status: "Active",
      actions: ["inspect_answer_rooms"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "shellPanel",
      editable: false,
      exportable: false,
      printable: false,
      origin: "compiledAnswerPack",
      visibilityMode: "builder"
    },
    {
      artifactId: "staged-spreadsheet",
      artifactType: "spreadsheet",
      artifactPlane: "work",
      visualContract: "spreadsheet",
      title: "Operations workbook.xlsx",
      description: "Editable seeded spreadsheet/table artifact that persists local workbook state.",
      commandAliases: ["spreadsheet", "sheet", "workbook", "csv", "table", "grid", "data table", "table data"],
      rendererId: "spreadsheetStageRenderer",
      stateAdapterId: "spreadsheetStageAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["authored-demo-artifact", "source-registry", "artifact-registry"],
      status: "Active",
      actions: ["edit_cells", "export_csv", "inspect_source_status", "validate_workbook"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactStage",
      editable: true,
      exportable: true,
      printable: false,
      origin: "seedDemo",
      visibilityMode: "all",
      visibilityScope: "builderDemo",
      canRender: true,
      canEdit: true,
      canExport: true,
      canAnswerFrom: true
    },
    {
      artifactId: "receipts-directory",
      artifactType: "receiptsDirectory",
      artifactPlane: "work",
      visualContract: "receipt",
      title: "Receipts directory",
      description: "Latest receipts, logs, checksums, and validation gate state.",
      commandAliases: ["receipt", "receipts", "proof", "validation", "checksum"],
      rendererId: "receiptProofRenderer",
      stateAdapterId: "receiptStreamAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["receipts", "logs", "checksums", "validation-gates"],
      status: "Active",
      actions: ["inspect_receipt", "verify_checksum"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactStage",
      editable: false,
      exportable: false,
      printable: false,
      origin: "projectState",
      visibilityMode: "builder"
    },
    {
      artifactId: "checklist",
      artifactType: "checklist",
      artifactPlane: "work",
      visualContract: "checklist",
      title: "Build checklist",
      description: "Seed checklist artifact for shell behavior and validation discipline.",
      commandAliases: ["checklist", "list", "steps", "task list", "sop", "procedure", "policy", "process", "operating procedure"],
      rendererId: "checklistStageRenderer",
      stateAdapterId: "checklistAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["authored-demo-artifact"],
      status: "Active",
      actions: ["inspect_checklist"],
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactStage",
      editable: false,
      exportable: false,
      printable: false,
      origin: "authoredDemoArtifact",
      visibilityMode: "all"
    }
  ];

  function spreadsheetRegistryEntry(workbook) {
    return {
      artifactId: workbook.artifactId,
      artifactType: "spreadsheet",
      artifactPlane: "work",
      visualContract: "spreadsheet",
      title: workbook.title,
      description: workbook.description,
      commandAliases: ["spreadsheet", "sheet", "workbook", "csv", "table", workbook.title].filter(Boolean),
      rendererId: "spreadsheetStageRenderer",
      stateAdapterId: "spreadsheetStageAdapter",
      stageMode: "artifactStage",
      sourceDependencies: ["runtime-spreadsheet-store", "source-registry", "artifact-registry"],
      status: workbook.sourceStatus,
      actions: ["edit_cells", "export_csv", "inspect_source_status", "validate_workbook"],
      sourceStatusRequirement: workbook.sourceStatus,
      ingestionStatusRequirement: workbook.ingestionStatus,
      renderMode: "artifactStage",
      editable: workbook.canEdit,
      exportable: workbook.canExport,
      printable: false,
      origin: workbook.origin,
      visibilityMode: "all",
      visibilityScope: workbook.visibilityScope,
      canRender: workbook.canRender,
      canEdit: workbook.canEdit,
      canExport: workbook.canExport,
      canAnswerFrom: workbook.canAnswerFrom,
      createdAt: workbook.createdAt,
      updatedAt: workbook.updatedAt
    };
  }

  function syncSpreadsheetArtifacts() {
    for (const workbook of spreadsheetWorkbooks()) {
      const entry = spreadsheetRegistryEntry(workbook);
      const registryIndex = artifactRegistry.findIndex((candidate) => candidate.artifactId === workbook.artifactId);
      if (registryIndex === -1) {
        artifactRegistry.push(entry);
      } else {
        artifactRegistry[registryIndex] = { ...artifactRegistry[registryIndex], ...entry };
      }
      artifacts[workbook.artifactId] = {
        title: workbook.title,
        meta: `Spreadsheet stage · ${workbook.sourceStatus} / ${workbook.ingestionStatus}`,
        html: (adaptedState) => spreadsheetStageHtml(adaptedState)
      };
    }
  }

  syncSpreadsheetArtifacts();

  const artifactCommandLexicon = [
    { command: "dashboard", aliases: ["dashboard", "metrics", "report view", "board"], artifactTypes: ["dashboard"], preferredArtifactId: "project-state-dashboard" },
    { command: "artifacts", aliases: ["artifacts", "artifact list", "artifact directory", "views"], artifactTypes: ["artifactDirectory"], preferredArtifactId: "artifact-directory" },
    { command: "spreadsheet", aliases: ["spreadsheet", "sheet", "workbook", "csv", "table data"], artifactTypes: ["spreadsheet", "table"] },
    { command: "source map", aliases: ["source map", "sources", "approved sources", "source posture"], artifactTypes: ["sourceMap", "sourceRegistry"], preferredArtifactId: "source-map" },
    { command: "source registry", aliases: ["source registry", "registry", "source status", "ingestion status"], artifactTypes: ["sourceRegistry"], preferredArtifactId: "source-registry" },
    { command: "checklist", aliases: ["checklist", "list", "steps", "task list"], artifactTypes: ["checklist", "sop"], preferredArtifactId: "checklist" },
    { command: "SOP", aliases: ["sop", "procedure", "policy", "process", "operating procedure"], artifactTypes: ["sop", "checklist", "processMap"], preferredArtifactId: "checklist" },
    { command: "receipt", aliases: ["receipt", "receipts", "proof", "validation", "checksum"], artifactTypes: ["receiptsDirectory", "receipt", "validationReport"], preferredArtifactId: "receipts-directory" },
    { command: "inbox", aliases: ["inbox", "source inbox", "uploads", "uploaded files", "candidates"], artifactTypes: ["sourceInbox"], preferredArtifactId: "document-inbox" },
    { command: "events", aliases: ["events", "event ledger", "activity", "recent changes", "changes"], artifactTypes: ["eventLedger"], preferredArtifactId: "event-ledger" },
    { command: "compiler", aliases: ["compiler", "compiler report", "answer pack", "route compiler"], artifactTypes: ["compilerReport"], preferredArtifactId: "compiler-report" },
    { command: "draft", aliases: ["draft", "document", "doc", "report draft", "handoff", "writeup", "diagnosis draft"], artifactTypes: ["documentSurface"], preferredArtifactId: "surface-diagnosis-draft" },
    { command: "report", aliases: ["report", "diagnosis report", "surface report", "handoff report"], artifactTypes: ["documentSurface", "report"], preferredArtifactId: "surface-diagnosis-draft" },
    { command: "canvas", aliases: ["canvas", "html canvas", "html-in-canvas", "document stage", "stage"], artifactTypes: ["documentSurface", "report", "draft"], preferredArtifactId: "surface-diagnosis-draft" },
    { command: "table", aliases: ["table", "grid", "data table"], artifactTypes: ["table", "spreadsheet"] }
  ];

  const answerRooms = (Array.isArray(compiledAnswerPack.answerRooms) ? compiledAnswerPack.answerRooms : []).map((room) => ({
    ...room,
    test: new RegExp(room.pattern, "i")
  }));

  function latestUploadAnswer() {
    if (!uploadedDocuments.length) {
      return {
        answer: "No local documents are registered yet. Use the + control to add a file to the runtime Source Inbox. New uploads start quarantined as Uncertain and unapproved.",
        actions: ["document-inbox", "source-registry"]
      };
    }
    const lines = uploadedDocuments.slice(0, 3).map((doc) =>
      `${doc.name}: ${doc.sourceStatus} + ${doc.ingestionStatus}, canSearch=${doc.canSearch ? "yes" : "no"}, canAnswerFrom=no`
    ).join("; ");
    return {
      answer: `Here is the current runtime overlay: ${lines}. These uploads are local source candidates, not approved source truth. I can inspect metadata or search extracted previews where available.`,
      actions: ["document-inbox", "extracted-text", "source-registry"]
    };
  }

  function uploadSearchTerm(input) {
    const searchFor = input.match(/search\s+(?:this\s+)?uploads?\s+for\s+(.+)/i);
    if (searchFor) return searchFor[1].trim();
    const findIn = input.match(/(?:find|look\s+for)\s+(.+?)\s+in\s+(?:this\s+)?uploads?/i);
    return findIn ? findIn[1].trim() : "";
  }

  function searchUploadsAnswer(input) {
    const term = uploadSearchTerm(input);
    if (!term) {
      return {
        answer: "I can search extracted text from local uploads, but I need a term. Try: “search this upload for refund.”",
        actions: ["extracted-text", "document-inbox"]
      };
    }
    const normalized = term.toLowerCase();
    const searchable = uploadedDocuments.filter((doc) => doc.canSearch && doc.preview);
    const matches = searchable
      .map((doc) => {
        const index = doc.preview.toLowerCase().indexOf(normalized);
        if (index === -1) return null;
        const start = Math.max(0, index - 90);
        const end = Math.min(doc.preview.length, index + normalized.length + 140);
        return `${doc.name}: “…${doc.preview.slice(start, end).replace(/\s+/g, " ")}…”`;
      })
      .filter(Boolean);

    if (!searchable.length) {
      return {
        answer: "I do not have extracted text to search yet. PDF, DOCX, image, scanned, spreadsheet, binary, and oversized files need parser/OCR support or manual source mapping before text search works.",
        actions: ["document-inbox", "source-map-draft"]
      };
    }

    if (!matches.length) {
      return {
        answer: `I searched extracted local upload previews for “${term}” and did not find a match. That does not prove the source lacks it; it only means the available extracted preview did not contain it.`,
        actions: ["extracted-text", "document-inbox"]
      };
    }

    return {
      answer: `I found “${term}” in extracted upload text, but this is still unapproved runtime overlay material. I can show the excerpt, but I cannot treat it as source truth until review, compilation, and validation. ${matches.join(" ")}`,
      actions: ["extracted-text", "source-map-draft", "compiler-report"]
    };
  }

  function roomResponse(room, input) {
    if (room.mode === "latest_upload") return latestUploadAnswer();
    if (room.mode === "upload_search") return searchUploadsAnswer(input);
    return {
      answer: room.answer,
      actions: room.actions || []
    };
  }

  function setTray(open) {
    shell.classList.toggle("tray-open", open);
    tray?.setAttribute("aria-hidden", open ? "false" : "true");
    if (trayScrim) trayScrim.hidden = !open;
  }

  function openArtifact(id, trigger) {
    const registryEntry = artifactRegistry.find((entry) => entry.artifactId === id);
    const artifact = registryEntry ? artifacts[registryEntry.artifactId] : null;
    if (!registryEntry || !artifact || !artifactLayer) return;
    const stateAdapter = stateAdapterRegistry[registryEntry.stateAdapterId] || stateAdapterRegistry.staticArtifactAdapter;
    const renderer = rendererRegistry[registryEntry.rendererId];
    if (!renderer || typeof renderer.render !== "function") return;
    if (registryEntry.artifactType === "spreadsheet" || registryEntry.artifactType === "table") {
      activeSpreadsheetId = registryEntry.artifactId;
    }
    const baseContext = { projectState, stateEvents, sourceRegistry, uploadedDocuments, compiledAnswerPack };
    const adaptedState = stateAdapter({ artifact, registryEntry, ...baseContext });
    lastFocusTarget = trigger || document.activeElement;
    artifactTitle.textContent = registryEntry.title || artifact.title;
    artifactMeta.textContent = artifact.meta;
    for (const node of [artifactLayer, artifactPanel, artifactBody]) {
      if (!node) continue;
      node.dataset.artifactPlane = registryEntry.artifactPlane || "control";
      node.dataset.visualContract = registryEntry.visualContract || "nativeControl";
      node.dataset.rendererId = registryEntry.rendererId;
    }
    renderer.render(artifact, registryEntry, { ...baseContext, adaptedState });
    artifactBody.scrollTop = 0;
    artifactLayer.classList.add("is-open");
    artifactLayer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    artifactLayer.querySelector("[data-artifact-close]")?.focus({ preventScroll: true });
  }

  function closeArtifact() {
    artifactLayer?.classList.remove("is-open");
    artifactLayer?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusTarget && typeof lastFocusTarget.focus === "function") {
      lastFocusTarget.focus({ preventScroll: true });
    }
  }

  function setChromeReceded(receded) {
    if (!shell) return;
    const next = Boolean(receded);
    if (shell.classList.contains("chrome-receded") === next) return;
    shell.classList.toggle("chrome-receded", next);
  }

  function requestChromeRecede(receded) {
    if (!shell) return;
    const shouldRecede = Boolean(receded);
    if (shell.classList.contains("chrome-receded") === shouldRecede && pendingChromeReceded === null) return;
    if (pendingChromeReceded === shouldRecede) return;
    pendingChromeReceded = shouldRecede;
    if (chromeRecedeFrame) window.cancelAnimationFrame(chromeRecedeFrame);
    chromeRecedeFrame = window.requestAnimationFrame(() => {
      chromeRecedeFrame = 0;
      const next = pendingChromeReceded;
      pendingChromeReceded = null;
      setChromeReceded(next);
    });
  }

  function now() {
    return window.performance ? window.performance.now() : Date.now();
  }

  function canHandleChromeGesture(target) {
    return !target?.closest?.(".assistant-composer, textarea, .artifact-layer, .side-tray");
  }

  function gestureOwnsChrome(deltaY, target) {
    if (!canHandleChromeGesture(target)) return;
    if (!Number.isFinite(deltaY) || Math.abs(deltaY) < GESTURE_EPSILON) return;
    lastChromeGestureAt = now();
    requestChromeRecede(deltaY > 0);
  }

  function lockHorizontalViewport() {
    if (horizontalLockFrame) return;
    horizontalLockFrame = window.requestAnimationFrame(() => {
      horizontalLockFrame = 0;
      if (window.scrollX) {
        window.scrollTo(0, window.scrollY);
      }
      for (const node of [stream, artifactBody, trayActivityList]) {
        if (node?.scrollLeft) node.scrollLeft = 0;
      }
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function scrollStreamToBottom() {
    if (!stream) return;
    lastProgrammaticScrollAt = now();
    stream.scrollLeft = 0;
    stream.scrollTop = stream.scrollHeight;
    lastScrollTop = stream.scrollTop;
  }

  function addMessage(kind, html) {
    const article = document.createElement("article");
    article.className = `message ${kind}-message`;
    article.innerHTML = html;
    stream.appendChild(article);
    requestAnimationFrame(() => article.classList.add("is-visible"));
    scrollStreamToBottom();
    return article;
  }

  function streamAssistantMessage(text, actions, options = {}) {
    const shouldFollow = options.follow !== false;
    const article = document.createElement("article");
    article.className = "message assistant-message";
    const paragraph = document.createElement("p");
    article.appendChild(paragraph);
    stream.appendChild(article);
    requestAnimationFrame(() => article.classList.add("is-visible"));
    if (shouldFollow) {
      autoFollowStreaming = true;
      scrollStreamToBottom();
    }

    const clean = String(text || "");
    let index = 0;
    const tick = () => {
      index = Math.min(clean.length, index + 2);
      paragraph.textContent = clean.slice(0, index);
      if (shouldFollow && autoFollowStreaming) {
        scrollStreamToBottom();
      }
      if (index < clean.length) {
        window.setTimeout(tick, STREAM_INTERVAL_MS);
      } else if (actions?.length) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = actionsHtml(actions);
        const actionNode = wrapper.firstElementChild;
        if (actionNode) article.appendChild(actionNode);
        if (shouldFollow && autoFollowStreaming) {
          requestAnimationFrame(() => {
            scrollStreamToBottom();
            autoFollowStreaming = false;
          });
        }
      } else {
        autoFollowStreaming = false;
      }
    };
    tick();
    return article;
  }

  function actionsHtml(actions) {
    if (!actions?.length) return "";
    return `<div class="render-actions">${actions.map((id) => {
      const registryEntry = artifactRegistry.find((entry) => entry.artifactId === id);
      const artifact = artifacts[id];
      if (!registryEntry || !artifact) return "";
      return `<button type="button" class="artifact-action wm-motion-focusable" data-artifact-open="${id}">
        <span class="artifact-icon" aria-hidden="true">▧</span>
        <span><strong>${escapeHtml(registryEntry.title)}</strong><small>${escapeHtml(registryEntry.artifactType)} · ${escapeHtml(registryEntry.status || "Registered")}</small></span>
      </button>`;
    }).join("")}</div>`;
  }

  function normalizeArtifactCommandInput(input) {
    return String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[’]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[.!]+$/g, "");
  }

  function commandCandidate(input) {
    let candidate = normalizeArtifactCommandInput(input);
    if (!candidate) return "";
    const actionCommand = /^(please\s+)?(open|show|view|render|launch|load|display|pull\s+up|bring\s+up)\s+(me\s+)?(the\s+)?/.test(candidate);
    if (!actionCommand && /^(what|why|how|when|where|who|can|could|should|would|is|are|do|does|did)\b/.test(candidate)) {
      return "";
    }
    candidate = candidate
      .replace(/^(please\s+)?(open|show|view|render|launch|load|display|pull\s+up|bring\s+up)\s+(me\s+)?(the\s+)?/, "")
      .replace(/^(the|a|an)\s+/, "")
      .trim();
    return candidate.split(" ").length <= 4 ? candidate : "";
  }

  function commandMatches(entry, candidate) {
    return [entry.command, ...(entry.aliases || [])]
      .map((value) => normalizeArtifactCommandInput(value))
      .includes(candidate);
  }

  function registryMatches(entry) {
    const byPreferred = entry.preferredArtifactId
      ? artifactRegistry.filter((artifact) => artifact.artifactId === entry.preferredArtifactId)
      : [];
    if (byPreferred.length) return byPreferred;
    const types = new Set(entry.artifactTypes || []);
    return artifactRegistry.filter((artifact) => types.has(artifact.artifactType));
  }

  function spreadsheetArtifacts() {
    return artifactRegistry
      .filter((entry) => entry.artifactType === "spreadsheet" && artifacts[entry.artifactId])
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  function spreadsheetTitleMatch(input) {
    const normalized = normalizeArtifactCommandInput(input)
      .replace(/^(please\s+)?(open|show|view|render|launch|load|display|pull\s+up|bring\s+up)\s+(me\s+)?(the\s+)?/, "")
      .replace(/^(the|a|an)\s+/, "")
      .trim();
    if (!normalized) return null;
    return spreadsheetArtifacts().find((entry) => {
      const title = normalizeArtifactCommandInput(entry.title);
      const titleWithoutExtension = title.replace(/\.(csv|tsv|xlsx)$/i, "");
      const aliases = [entry.artifactId, title, titleWithoutExtension]
        .map((value) => normalizeArtifactCommandInput(value));
      return aliases.includes(normalized);
    }) || null;
  }

  function resolveArtifactCommand(input, context = {}) {
    const spreadsheetMatch = spreadsheetTitleMatch(input);
    if (spreadsheetMatch) {
      return {
        type: "direct_open",
        command: "spreadsheet",
        artifactId: spreadsheetMatch.artifactId,
        artifact: spreadsheetMatch,
        statusMessage: `Opening ${spreadsheetMatch.title.toLowerCase()}.`
      };
    }

    const candidate = commandCandidate(input);
    if (!candidate) return { type: "not_artifact_command" };

    const entry = artifactCommandLexicon.find((command) => commandMatches(command, candidate));
    if (!entry) return { type: "not_artifact_command" };

    const matches = registryMatches(entry).filter((artifact) => artifacts[artifact.artifactId]);
    if (matches.length === 1) {
      return {
        type: "direct_open",
        command: entry.command,
        artifactId: matches[0].artifactId,
        artifact: matches[0],
        statusMessage: matches[0].artifactId === "surface-diagnosis-draft"
          ? "Opening document stage."
          : `Opening ${matches[0].title.toLowerCase()}.`
      };
    }

    if (matches.length > 1) {
      return {
        type: "ambiguous_picker",
        command: entry.command,
        artifactType: entry.missingType || entry.command,
        candidates: matches
      };
    }

    return {
      type: "missing_artifact",
      command: entry.command,
      artifactType: entry.missingType || entry.command,
      uploadedCount: Array.isArray(context.uploadedDocuments) ? context.uploadedDocuments.length : 0,
      fallbackActions: ["document-inbox", "source-registry", "source-map-draft"]
    };
  }

  function artifactPickerHtml(result) {
    if (/spreadsheet|table/i.test(result.artifactType || result.command || "")) {
      return spreadsheetPickerHtml(result);
    }
    return `
      <p>I found multiple ${escapeHtml(result.artifactType)} artifacts. Choose one.</p>
      <div class="render-actions">${result.candidates.map((candidate) => `
        <button type="button" class="artifact-action wm-motion-focusable" data-artifact-open="${escapeHtml(candidate.artifactId)}">
          <span class="artifact-icon" aria-hidden="true">▧</span>
          <span>
            <strong>${escapeHtml(candidate.title)}</strong>
            <small>${escapeHtml(candidate.artifactType)} · ${escapeHtml(candidate.sourceStatusRequirement || "Tracked")} / ${escapeHtml(candidate.ingestionStatusRequirement || "Registered")}</small>
          </span>
        </button>
      `).join("")}</div>
    `;
  }

  function spreadsheetPickerHtml(result = {}) {
    const candidates = result.candidates?.length ? result.candidates : spreadsheetArtifacts();
    return `
      <p>${candidates.length > 1 ? "Choose a spreadsheet artifact." : "Spreadsheet artifacts are renderable local workbooks. Source truth is still gated separately."}</p>
      <div class="render-actions spreadsheet-picker-actions">
        ${candidates.map((candidate) => `
          <button type="button" class="artifact-action wm-motion-focusable" data-artifact-open="${escapeHtml(candidate.artifactId)}">
            <span class="artifact-icon" aria-hidden="true">▦</span>
            <span>
              <strong>${escapeHtml(candidate.title)}</strong>
              <small>${escapeHtml(candidate.origin || "unknown")} · ${escapeHtml(candidate.sourceStatusRequirement || "Uncertain")} / ${escapeHtml(candidate.ingestionStatusRequirement || "Pending review")} · ${candidate.canAnswerFrom ? "answerable" : "not answerable"}${candidate.updatedAt ? ` · ${escapeHtml(new Date(candidate.updatedAt).toLocaleString())}` : ""}</small>
            </span>
          </button>
        `).join("")}
        <button type="button" class="artifact-action wm-motion-focusable" data-spreadsheet-create>
          <span class="artifact-icon" aria-hidden="true">＋</span>
          <span><strong>New spreadsheet</strong><small>Blank local workbook · Uncertain / Pending review · not answerable</small></span>
        </button>
      </div>
    `;
  }

  function missingArtifactHtml(result) {
    const isSpreadsheet = /spreadsheet|table/i.test(result.artifactType || result.command || "");
    return `
      <p>No ${escapeHtml(result.artifactType)} artifact is registered for this surface yet.</p>
      <p class="message-note">${isSpreadsheet ? "I can create a blank local spreadsheet artifact. It will be renderable/editable immediately, but it will not be approved source truth." : "I can open the Source Inbox, show the Source Registry, or create a source-map draft path. Imported files stay quarantined until review, compilation, and validation."}</p>
      ${isSpreadsheet ? spreadsheetPickerHtml({ candidates: [] }) : actionsHtml(result.fallbackActions)}
    `;
  }

  function spreadsheetValidationSummary(workbook) {
    const filledRows = workbook.tableData.filter((row) => row.some((cell) => String(cell || "").trim())).length;
    const filledCells = workbook.tableData.reduce((total, row) => total + row.filter((cell) => String(cell || "").trim()).length, 0);
    const issues = [];
    if (!workbook.columns.length) issues.push("No columns");
    if (!filledRows) issues.push("No filled rows");
    if (!workbook.canRender) issues.push("Cannot render");
    if (!workbook.canEdit) issues.push("Read-only");
    if (!workbook.canExport) issues.push("Export disabled");
    if (!workbook.canAnswerFrom) issues.push("Not approved answer truth");
    return {
      filledRows,
      filledCells,
      issues,
      status: issues.length ? "Needs review" : "Ready"
    };
  }

  function spreadsheetSourceStatusHtml(workbook) {
    return `
      <strong>${escapeHtml(workbook.title)}</strong>
      <span>Origin: ${escapeHtml(workbook.origin)} · Scope: ${escapeHtml(workbook.visibilityScope)} · Source: ${escapeHtml(workbook.sourceStatus)} · Ingestion: ${escapeHtml(workbook.ingestionStatus)} · canAnswerFrom=${workbook.canAnswerFrom ? "true" : "false"}</span>
    `;
  }

  function spreadsheetValidationHtml(workbook) {
    const summary = spreadsheetValidationSummary(workbook);
    return `
      <strong>${escapeHtml(summary.status)}</strong>
      <span>${escapeHtml(String(summary.filledRows))} filled rows · ${escapeHtml(String(summary.filledCells))} filled cells · ${escapeHtml(workbook.sourceStatus)} / ${escapeHtml(workbook.ingestionStatus)} · ${workbook.canAnswerFrom ? "approved for answers" : "not approved for answers"}</span>
      ${summary.issues.length ? `<small>${escapeHtml(summary.issues.join(" · "))}</small>` : ""}
    `;
  }

  function setSpreadsheetFeedback(html) {
    const feedback = artifactBody?.querySelector("[data-spreadsheet-feedback]");
    if (feedback) feedback.innerHTML = html;
  }

  function csvEscape(value) {
    const stringValue = String(value || "");
    return /[",\n\r]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue;
  }

  function workbookToCsv(workbook) {
    const header = workbook.columns.map((column) => csvEscape(column.label));
    const rows = workbook.tableData
      .filter((row) => row.some((cell) => String(cell || "").trim()))
      .map((row) => workbook.columns.map((_, index) => csvEscape(row[index] || "")));
    return [header, ...rows].map((row) => row.join(",")).join("\n");
  }

  function safeDownloadName(title) {
    return `${String(title || "spreadsheet").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "spreadsheet"}.csv`;
  }

  function exportWorkbookCsv(artifactId = activeSpreadsheetId) {
    const workbook = getSpreadsheetWorkbook(artifactId);
    if (!workbook?.canExport) {
      setSpreadsheetFeedback("<strong>Export unavailable</strong><span>This workbook is not marked exportable.</span>");
      return false;
    }
    const blob = new Blob([workbookToCsv(workbook)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeDownloadName(workbook.title);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setSpreadsheetFeedback(`<strong>CSV export started</strong><span>${escapeHtml(workbook.title)} exported from local browser state. No server upload occurred.</span>`);
    return true;
  }

  function createAndOpenSpreadsheet(trigger) {
    const workbook = createBlankSpreadsheetWorkbook();
    spreadsheetStore.workbooks = [workbook, ...spreadsheetStore.workbooks].slice(0, MAX_SPREADSHEETS);
    activeSpreadsheetId = workbook.artifactId;
    saveSpreadsheetStore();
    syncSpreadsheetArtifacts();
    openArtifact(workbook.artifactId, trigger || composer);
    return workbook;
  }

  function isCreateSpreadsheetCommand(input) {
    return /^(create|new|make|start|add)\s+(a\s+|an\s+)?(blank\s+|new\s+)?(spreadsheet|sheet|workbook|table)$/i.test(normalizeArtifactCommandInput(input)) ||
      /^(create|new|make|start|add)\s+(spreadsheet|sheet|workbook|table)$/i.test(normalizeArtifactCommandInput(input));
  }

  function isSpreadsheetPickerCommand(input) {
    return /^(show|list|view|open)\s+(all\s+)?(spreadsheets|sheets|workbooks|tables)$/i.test(normalizeArtifactCommandInput(input)) ||
      /^(spreadsheets|sheets|workbooks|tables)$/i.test(normalizeArtifactCommandInput(input));
  }

  function isSpreadsheetAnswerabilityCommand(input) {
    return /(can|could|should|is|are).*(answer|trusted|approved|source truth).*(spreadsheet|sheet|workbook|table)|spreadsheet.*(approved|answerable|source truth)/i.test(normalizeArtifactCommandInput(input));
  }

  function isSpreadsheetExportCommand(input) {
    return /^(export|download)\s+(the\s+)?(spreadsheet|sheet|workbook|table|csv)$/i.test(normalizeArtifactCommandInput(input));
  }

  function isSpreadsheetValidateCommand(input) {
    return /^(validate|check|review)\s+(the\s+)?(spreadsheet|sheet|workbook|table)$/i.test(normalizeArtifactCommandInput(input));
  }

  function handleSpreadsheetAssistantCommand(input) {
    if (isCreateSpreadsheetCommand(input)) {
      const workbook = createAndOpenSpreadsheet(composer);
      addMessage("system", `<span>Created ${escapeHtml(workbook.title)} as a local editable spreadsheet artifact. It is Uncertain / Pending review and cannot be used as answer truth.</span>`);
      return true;
    }
    if (isSpreadsheetPickerCommand(input)) {
      addMessage("assistant", spreadsheetPickerHtml({ candidates: spreadsheetArtifacts() }));
      return true;
    }
    if (isSpreadsheetAnswerabilityCommand(input)) {
      const workbook = getSpreadsheetWorkbook(activeSpreadsheetId);
      const answer = workbook.canAnswerFrom
        ? `${workbook.title} is currently marked ${workbook.sourceStatus} / ${workbook.ingestionStatus} with canAnswerFrom=true. It can render and edit locally, and this seeded workbook is allowed in the demo answer posture.`
        : `${workbook.title} can render, edit, and export locally, but it cannot be used as approved answer truth because it is ${workbook.sourceStatus} / ${workbook.ingestionStatus} with canAnswerFrom=false. It needs review, compilation, and validation first.`;
      addMessage("assistant", `<p>${escapeHtml(answer)}</p>${spreadsheetPickerHtml({ candidates: spreadsheetArtifacts() })}`);
      return true;
    }
    if (isSpreadsheetExportCommand(input)) {
      const workbook = getSpreadsheetWorkbook(activeSpreadsheetId);
      const ok = exportWorkbookCsv(workbook.artifactId);
      addMessage("system", `<span>${ok ? `Exported ${escapeHtml(workbook.title)} as CSV from local browser state.` : `Could not export ${escapeHtml(workbook.title)}.`}</span>`);
      return true;
    }
    if (isSpreadsheetValidateCommand(input)) {
      const workbook = getSpreadsheetWorkbook(activeSpreadsheetId);
      addMessage("assistant", `<p>Spreadsheet validation is local and trust-aware.</p><div class="state-row"><div>${spreadsheetValidationHtml(workbook)}</div><em>${escapeHtml(workbook.canAnswerFrom ? "Answerable" : "Gated")}</em></div>`);
      return true;
    }
    return false;
  }

  function route(input) {
    const room = answerRooms.find((candidate) => candidate.test.test(input));
    if (room) return roomResponse(room, input);
    return {
      answer: "I can inspect the approved source pack, render registered artifacts, show the event ledger, search extracted local uploads, or explain why unapproved uploads cannot become source truth automatically.",
      actions: ["source-registry", "event-ledger", "document-inbox", "compiler-report"]
    };
  }

  function submitPrompt(value) {
    const input = String(value || "").trim();
    if (!input) return;
    setChromeReceded(true);
    addMessage("user", `<p>${escapeHtml(input)}</p>`);
    if (handleSpreadsheetAssistantCommand(input)) {
      return;
    }
    const artifactCommand = resolveArtifactCommand(input, { uploadedDocuments });
    if (artifactCommand.type === "direct_open") {
      addMessage("system", `<span>${escapeHtml(artifactCommand.statusMessage)}</span>`);
      requestAnimationFrame(() => openArtifact(artifactCommand.artifactId, composer));
      return;
    }
    if (artifactCommand.type === "ambiguous_picker") {
      addMessage("assistant", artifactPickerHtml(artifactCommand));
      return;
    }
    if (artifactCommand.type === "missing_artifact") {
      addMessage("assistant", missingArtifactHtml(artifactCommand));
      return;
    }
    const response = route(input);
    streamAssistantMessage(response.answer, response.actions, { follow: true });
  }

  function updateSpreadsheetSelection(cell) {
    if (!cell) return;
    const workbook = getSpreadsheetWorkbook(cell.dataset.sheetId);
    const rowIndex = Number(cell.dataset.rowIndex);
    const columnIndex = Number(cell.dataset.colIndex);
    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) return;
    activeSpreadsheetId = workbook.artifactId;
    workbook.selectedCell = { rowIndex, columnIndex };
    workbook.updatedAt = new Date().toISOString();
    saveSpreadsheetStore();
    artifactBody?.querySelectorAll("[data-spreadsheet-cell].is-selected").forEach((node) => node.classList.remove("is-selected"));
    cell.classList.add("is-selected");
    const nameBox = artifactBody?.querySelector("[data-spreadsheet-name-box]");
    const formula = artifactBody?.querySelector("[data-spreadsheet-formula]");
    if (nameBox) nameBox.textContent = workbookCellName(workbook, rowIndex, columnIndex);
    if (formula) formula.value = workbookCellValue(workbook, rowIndex, columnIndex);
  }

  function persistSpreadsheetCell(cell, trackHistory = false) {
    if (!cell) return;
    const workbook = getSpreadsheetWorkbook(cell.dataset.sheetId);
    const rowIndex = Number(cell.dataset.rowIndex);
    const columnIndex = Number(cell.dataset.colIndex);
    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) return;
    const before = cell.dataset.originalValue || "";
    const after = cell.textContent || "";
    setWorkbookCellValue(workbook, rowIndex, columnIndex, after);
    if (trackHistory) {
      recordWorkbookEdit(workbook, rowIndex, columnIndex, before, after);
      cell.dataset.originalValue = after;
    }
    saveSpreadsheetStore();
    updateSpreadsheetSelection(cell);
  }

  function updateSelectedCellFromFormula(input) {
    if (!input) return;
    const workbook = getSpreadsheetWorkbook(input.dataset.sheetId);
    const selected = workbook.selectedCell || { rowIndex: 0, columnIndex: 0 };
    const before = workbookCellValue(workbook, selected.rowIndex, selected.columnIndex);
    const after = input.value || "";
    setWorkbookCellValue(workbook, selected.rowIndex, selected.columnIndex, after);
    recordWorkbookEdit(workbook, selected.rowIndex, selected.columnIndex, before, after);
    saveSpreadsheetStore();
    const cell = artifactBody?.querySelector(`[data-spreadsheet-cell][data-row-index="${selected.rowIndex}"][data-col-index="${selected.columnIndex}"]`);
    if (cell) {
      cell.textContent = after;
      cell.dataset.originalValue = after;
      cell.classList.toggle("sheet-row-empty", !after);
      updateSpreadsheetSelection(cell);
    }
  }

  function rerenderOpenSpreadsheet() {
    const registryEntry = artifactRegistry.find((entry) => entry.artifactId === activeSpreadsheetId);
    const artifact = registryEntry ? artifacts[registryEntry.artifactId] : null;
    const renderer = registryEntry ? rendererRegistry[registryEntry.rendererId] : null;
    if (!registryEntry || !artifact || !renderer) return;
    const stateAdapter = stateAdapterRegistry[registryEntry.stateAdapterId] || stateAdapterRegistry.staticArtifactAdapter;
    const baseContext = { projectState, stateEvents, sourceRegistry, uploadedDocuments, compiledAnswerPack };
    const adaptedState = stateAdapter({ artifact, registryEntry, ...baseContext });
    renderer.render(artifact, registryEntry, { ...baseContext, adaptedState });
  }

  function undoSpreadsheetEdit(artifactId) {
    const workbook = getSpreadsheetWorkbook(artifactId);
    const edit = workbook.editHistory.pop();
    if (!edit) return;
    setWorkbookCellValue(workbook, edit.rowIndex, edit.columnIndex, edit.before);
    workbook.selectedCell = { rowIndex: edit.rowIndex, columnIndex: edit.columnIndex };
    workbook.redoHistory = Array.isArray(workbook.redoHistory) ? workbook.redoHistory : [];
    workbook.redoHistory.push(edit);
    saveSpreadsheetStore();
    rerenderOpenSpreadsheet();
    setSpreadsheetFeedback(`<strong>Undo applied</strong><span>${escapeHtml(workbookCellName(workbook, edit.rowIndex, edit.columnIndex))} restored to previous value.</span>`);
  }

  function redoSpreadsheetEdit(artifactId) {
    const workbook = getSpreadsheetWorkbook(artifactId);
    const edit = workbook.redoHistory.pop();
    if (!edit) return;
    setWorkbookCellValue(workbook, edit.rowIndex, edit.columnIndex, edit.after);
    workbook.selectedCell = { rowIndex: edit.rowIndex, columnIndex: edit.columnIndex };
    workbook.editHistory = Array.isArray(workbook.editHistory) ? workbook.editHistory : [];
    workbook.editHistory.push(edit);
    saveSpreadsheetStore();
    rerenderOpenSpreadsheet();
    setSpreadsheetFeedback(`<strong>Redo applied</strong><span>${escapeHtml(workbookCellName(workbook, edit.rowIndex, edit.columnIndex))} reapplied.</span>`);
  }

  function runSpreadsheetAction(button) {
    const artifactId = button?.dataset.sheetId || activeSpreadsheetId;
    const workbook = getSpreadsheetWorkbook(artifactId);
    switch (button?.dataset.spreadsheetAction) {
      case "share":
        setSpreadsheetFeedback("<strong>Share is not implemented</strong><span>This static local prototype does not transmit workbook data or create public share links.</span>");
        break;
      case "export":
        exportWorkbookCsv(artifactId);
        break;
      case "undo":
        undoSpreadsheetEdit(artifactId);
        break;
      case "redo":
        redoSpreadsheetEdit(artifactId);
        break;
      case "source":
        setSpreadsheetFeedback(spreadsheetSourceStatusHtml(workbook));
        break;
      case "validate":
        setSpreadsheetFeedback(spreadsheetValidationHtml(workbook));
        break;
      default:
        break;
    }
  }

  document.addEventListener("click", (event) => {
    const openTray = event.target.closest("[data-tray-open]");
    const closeTray = event.target.closest("[data-tray-close]");
    const importButton = event.target.closest("[data-document-import]");
    const spreadsheetCreateButton = event.target.closest("[data-spreadsheet-create]");
    const spreadsheetActionButton = event.target.closest("[data-spreadsheet-action]");
    const artifactButton = event.target.closest("[data-artifact-open]");
    const promptButton = event.target.closest("[data-prompt]");
    if (openTray) setTray(true);
    if (closeTray || event.target.closest("[data-tray-scrim]")) setTray(false);
    if (importButton) {
      documentInput?.click();
      return;
    }
    if (spreadsheetCreateButton) {
      const workbook = createAndOpenSpreadsheet(spreadsheetCreateButton);
      addMessage("system", `<span>Created ${escapeHtml(workbook.title)}. It is local, editable, and not approved for answers.</span>`);
      setTray(false);
      return;
    }
    if (spreadsheetActionButton) {
      runSpreadsheetAction(spreadsheetActionButton);
      return;
    }
    if (artifactButton) {
      openArtifact(artifactButton.getAttribute("data-artifact-open"), artifactButton);
      setTray(false);
    }
    if (promptButton) {
      submitPrompt(promptButton.getAttribute("data-prompt"));
      setTray(false);
    }
    if (event.target.closest("[data-artifact-close]")) closeArtifact();
  });

  document.addEventListener("focusin", (event) => {
    const cell = event.target.closest("[data-spreadsheet-cell]");
    if (!cell) return;
    cell.dataset.originalValue = cell.textContent || "";
    updateSpreadsheetSelection(cell);
  });

  document.addEventListener("input", (event) => {
    const cell = event.target.closest("[data-spreadsheet-cell]");
    if (cell) {
      persistSpreadsheetCell(cell, false);
      return;
    }
    if (event.target.matches("[data-spreadsheet-formula]")) {
      updateSelectedCellFromFormula(event.target);
    }
  });

  document.addEventListener("focusout", (event) => {
    const cell = event.target.closest("[data-spreadsheet-cell]");
    if (cell) {
      persistSpreadsheetCell(cell, true);
    }
  });

  document.addEventListener("keydown", (event) => {
    const cell = event.target.closest("[data-spreadsheet-cell]");
    if (cell && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      cell.blur();
    }
  });

  documentInput?.addEventListener("change", async (event) => {
    await importDocuments(event.target.files);
    event.target.value = "";
  });

  composer?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = textarea.value;
    textarea.value = "";
    textarea.style.height = "";
    submitPrompt(value);
  });

  textarea?.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 190)}px`;
  });

  textarea?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      composer.requestSubmit();
    }
  });

  shell?.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) > GESTURE_EPSILON) lockHorizontalViewport();
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.deltaY < -GESTURE_EPSILON) autoFollowStreaming = false;
    gestureOwnsChrome(event.deltaY, event.target);
  }, { passive: true });

  shell?.addEventListener("touchstart", (event) => {
    const touch = event.touches && event.touches[0];
    lastTouchX = touch ? touch.clientX : null;
    lastTouchY = touch ? touch.clientY : null;
  }, { passive: true });

  shell?.addEventListener("touchmove", (event) => {
    const touch = event.touches && event.touches[0];
    if (!touch || lastTouchY === null || lastTouchX === null) return;
    const lateralDelta = touch.clientX - lastTouchX;
    const fingerDelta = touch.clientY - lastTouchY;
    if (Math.abs(lateralDelta) > GESTURE_EPSILON) lockHorizontalViewport();
    if (Math.abs(lateralDelta) > Math.abs(fingerDelta)) {
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      return;
    }
    if (Math.abs(fingerDelta) >= GESTURE_EPSILON) {
      if (fingerDelta > GESTURE_EPSILON) autoFollowStreaming = false;
      gestureOwnsChrome(-fingerDelta, event.target);
    }
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  }, { passive: true });

  shell?.addEventListener("touchend", () => {
    lastTouchX = null;
    lastTouchY = null;
  }, { passive: true });

  stream?.addEventListener("scroll", () => {
    lockHorizontalViewport();
    const top = stream.scrollTop;
    const delta = top - lastScrollTop;
    const current = now();
    if (current - lastProgrammaticScrollAt < 120 || current - lastChromeGestureAt < 120) {
      lastScrollTop = top;
      return;
    }
    if (top <= 2) {
      requestChromeRecede(false);
    } else if (delta < -CHROME_SCROLL_THRESHOLD) {
      requestChromeRecede(false);
    }
    lastScrollTop = top;
  }, { passive: true });

  window.addEventListener("scroll", lockHorizontalViewport, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeArtifact();
      setTray(false);
    }
  });

  renderTrayActivity();
  renderSourceInboxStatus();
})();
