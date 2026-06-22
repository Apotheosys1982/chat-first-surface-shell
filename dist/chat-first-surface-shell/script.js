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
  let lastScrollTop = 0;
  let lastTouchY = null;
  let lastFocusTarget = null;
  let lastChromeGestureAt = 0;
  let lastProgrammaticScrollAt = 0;
  let autoFollowStreaming = false;
  const GESTURE_EPSILON = 2;
  const STREAM_INTERVAL_MS = 18;
  const DOCUMENT_STORE_KEY = "chatFirstSurfaceDocuments.v1";
  const MAX_DOCUMENTS = 12;
  const MAX_PREVIEW_CHARS = 4200;
  const MAX_READABLE_BYTES = 750 * 1024;
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

  const sourceDocuments = Array.isArray(sourceRegistry.sources)
    ? sourceRegistry.sources.filter((source) => source.origin !== "userUpload")
    : [];

  function sourcePostureCopy() {
    if (shellMode === "builder") {
      return "These are the working source documents this local shell is allowed to explain. The readable label comes first; the actual repo filename stays visible as metadata for inspection.";
    }
    return "These are the approved source areas this assistant is allowed to explain. Technical file names stay available as metadata, but the primary labels are written for people.";
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
    if (/dashboard|project state/i.test(title)) return 'data-artifact-open="artifact-dashboard"';
    if (/receipt|checksum/i.test(title) || /receipt/i.test(status)) return 'data-artifact-open="validation-receipt"';
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
        <div class="state-list">${documentRows()}</div>
      </div>
    `;
  }

  async function importDocuments(files) {
    const selected = Array.from(files || []).filter(Boolean);
    if (!selected.length) return;

    const imported = [];
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
      let summary = `${file.type || "Unknown type"} · ${formatBytes(file.size)} · Imported ${new Date().toLocaleString()}`;

      if (readable) {
        try {
          const text = await readFileText(file);
          preview = text.slice(0, MAX_PREVIEW_CHARS).trim();
          ingestionStatus = preview.length ? "Extracted" : "Needs source map";
          extractionStatus = preview.length ? "extracted" : "failed";
          canSearch = Boolean(preview.length);
          summary = `${file.type || "Text file"} · ${formatBytes(file.size)} · ${preview.length ? "Extracted text preview is searchable locally; not approved as truth" : "No readable text found; source mapping needed"}`;
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
      ["document-inbox", "extracted-text", "source-map-draft", "source-registry"]
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
          <h3>Base pack is approved behavior. Runtime overlay is quarantined material.</h3>
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

  const artifacts = {
    "artifact-dashboard": {
      title: "Project state dashboard",
      meta: "Runtime state · Local build · Active",
      html: `
        <div class="state-board">
          <section class="state-panel state-panel-wide">
            <p class="state-label">Current focus</p>
            <h3>Ask. Render. Inspect. Return.</h3>
            <p>This shell now tracks its own working state: recent fixes, validation gates, source posture, and the current UI hardening thread.</p>
          </section>
          <section class="state-panel">
            <p class="state-label">Interaction</p>
            <strong>Chrome collapse</strong>
            <span>Full header and composer recede on scroll pressure, then return on reverse pressure.</span>
          </section>
          <section class="state-panel">
            <p class="state-label">Assistant</p>
            <strong>Bounded routes</strong>
            <span>Smalltalk, source, artifact, boundary, pricing, and project-state questions now route intentionally.</span>
          </section>
          <section class="state-panel">
            <p class="state-label">Validation</p>
            <strong>Targeted gates</strong>
            <span>Chat-first shell and chrome-collapse validators are the active checks for this prototype.</span>
          </section>
          <section class="state-panel">
            <p class="state-label">Latest event</p>
            <strong>${latestEvent ? escapeHtml(latestEvent.title) : "Not synced"}</strong>
            <span>${latestEvent ? escapeHtml(latestEvent.eventId) : "Run npm run sync:chat-first-state after creating receipts."}</span>
          </section>
          <section class="state-panel">
            <p class="state-label">Latest receipt</p>
            <strong>${latestReceipt ? escapeHtml(latestReceipt.label) : "Not synced"}</strong>
            <span>${latestReceipt ? escapeHtml(latestReceipt.path) : "Run npm run sync:chat-first-state after creating receipts."}</span>
          </section>
          <section class="state-panel">
            <p class="state-label">Latest checksum</p>
            <strong>${latestChecksum ? escapeHtml(latestChecksum.label) : "Not synced"}</strong>
            <span>${latestChecksum ? escapeHtml(latestChecksum.path) : "Checksum state has not been generated yet."}</span>
          </section>
        </div>
        <div class="state-section">
          <h3>Recent activity</h3>
          <div class="state-list">${activityRows()}</div>
        </div>
      `
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
      html: () => `
        <div class="state-section source-map-view">
          <h3>Approved source spine</h3>
          <p>${escapeHtml(sourcePostureCopy())}</p>
          <div class="state-list source-spine">${sourceRows()}</div>
        </div>
        <div class="state-section">
          <h3>Runtime source overlay</h3>
          <p>These are local browser imports added through the composer. They are quarantined source candidates, not deployed source-of-truth files and not durable compiled behavior.</p>
          <div class="state-list">${documentRows()}</div>
        </div>
      `
    },
    "source-registry": {
      title: "Source registry",
      meta: "Source lifecycle · Base pack + runtime overlay",
      html: () => `
        <div class="state-section">
          <h3>Base compiled sources</h3>
          <p>These records come from the generated source registry. They have explicit source and ingestion statuses plus answer/search/render permissions.</p>
          <div class="state-list">${sourceRegistryRows()}</div>
        </div>
        <div class="state-section">
          <h3>Runtime source overlay</h3>
          <p>Uploads stay local, quarantined, and untrusted. They can be inspected or searched when extracted, but they do not enter the base compiled answer pack.</p>
          <div class="state-list">${documentRows()}</div>
        </div>
      `
    },
    "document-inbox": {
      title: "Source inbox",
      meta: "Documents · Runtime overlay · Quarantined",
      html: () => documentInboxHtml()
    },
    "surface-diagnosis-draft": {
      title: "Surface Diagnosis Draft",
      meta: "Document stage · HTML-in-Canvas",
      rendererId: "htmlCanvasDocumentStage",
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
    "validation-receipt": {
      title: "Receipt stream",
      meta: "Receipt · Generated state · Active",
      html: `
        <div class="state-section receipt-stream-view">
          <h3>Latest receipts</h3>
          <p>Generated from the local receipt directory at ${escapeHtml(projectState.generatedAt || "unknown time")}.</p>
          <div class="state-list">${stateRows(recentReceipts, "No receipts found.")}</div>
        </div>
        <div class="state-section">
          <h3>Validation gates</h3>
          <div class="state-list">${stateRows(projectState.validations || [], "No validation gates registered.")}</div>
        </div>
        <div class="state-section">
          <h3>Checksums</h3>
          <div class="state-list">${stateRows(recentChecksums, "No checksum manifests found.")}</div>
        </div>
      `
    },
    "checklist": {
      title: "Build checklist",
      meta: "Checklist · Demo artifact · Active",
      html: `
        <ul class="artifact-list">
          <li>Shell opens directly into chat.</li>
          <li>Composer uses textarea message-box contract, not a pill.</li>
          <li>Artifact actions map to registered views.</li>
          <li>Side tray opens from the trigger side and respects mobile viewport ownership.</li>
          <li>All motion uses shared motion tokens and reduced-motion fallbacks.</li>
        </ul>
      `
    }
  };

  const rendererRegistry = {
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

  const artifactRegistry = [
    {
      artifactId: "artifact-dashboard",
      artifactType: "dashboard",
      title: "Project state dashboard",
      description: "Current shell status, recent receipts, validation gates, source posture, and working activity.",
      commandAliases: ["dashboard", "metrics", "report view", "board", "project state", "status"],
      rendererId: "project-state-dashboard-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "compiledProjectState",
      visibilityMode: "builder"
    },
    {
      artifactId: "source-map",
      artifactType: "sourceMap",
      title: "Source map",
      description: "Approved source spine plus local quarantined upload overlay.",
      commandAliases: ["source map", "sources", "approved sources", "source posture"],
      rendererId: "source-map-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "sourceRegistry",
      visibilityMode: "all"
    },
    {
      artifactId: "source-registry",
      artifactType: "sourceRegistry",
      title: "Source registry",
      description: "Source and ingestion status records for base sources and runtime overlays.",
      commandAliases: ["source registry", "registry", "source status", "ingestion status"],
      rendererId: "source-registry-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "sourceRegistry",
      visibilityMode: "all"
    },
    {
      artifactId: "document-inbox",
      artifactType: "sourceInbox",
      title: "Source inbox",
      description: "Local uploaded source candidates, extracted previews, and source-map needs.",
      commandAliases: ["inbox", "source inbox", "uploads", "uploaded files", "candidates"],
      rendererId: "source-inbox-renderer",
      sourceStatusRequirement: "Uncertain",
      ingestionStatusRequirement: "Uploaded",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "runtimeUploadOverlay",
      visibilityMode: "all"
    },
    {
      artifactId: "surface-diagnosis-draft",
      artifactType: "documentSurface",
      title: "Surface Diagnosis Draft",
      description: "A premium staged document artifact rendered from approved shell state.",
      commandAliases: ["draft", "document", "report", "canvas", "html canvas", "diagnosis draft"],
      rendererId: "htmlCanvasDocumentStage",
      stageType: "htmlInCanvas",
      stateAdapterId: "documentDraftAdapter",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "fullViewportArtifact",
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
      title: "Event ledger",
      description: "Receipt-backed Codex update events and state changes.",
      commandAliases: ["events", "event ledger", "recent changes", "changes"],
      rendererId: "event-ledger-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "stateEvents",
      visibilityMode: "builder"
    },
    {
      artifactId: "activity-log",
      artifactType: "eventLedger",
      title: "Recent hardening log",
      description: "Human-readable activity log for the current shell hardening sequence.",
      commandAliases: ["activity", "recent activity", "hardening log"],
      rendererId: "activity-log-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "projectState",
      visibilityMode: "builder"
    },
    {
      artifactId: "compiler-report",
      artifactType: "compilerReport",
      title: "Compiler report",
      description: "Compiled answer rooms, route seeds, and bounded runtime invariant.",
      commandAliases: ["compiler", "compiler report", "answer pack", "route compiler"],
      rendererId: "compiler-report-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "compiledAnswerPack",
      visibilityMode: "builder"
    },
    {
      artifactId: "validation-receipt",
      artifactType: "receipt",
      title: "Receipt stream",
      description: "Latest receipts, logs, checksums, and validation gate state.",
      commandAliases: ["receipt", "receipts", "proof", "validation", "checksum"],
      rendererId: "receipt-stream-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "projectState",
      visibilityMode: "builder"
    },
    {
      artifactId: "checklist",
      artifactType: "checklist",
      title: "Build checklist",
      description: "Seed checklist artifact for shell behavior and validation discipline.",
      commandAliases: ["checklist", "list", "steps", "task list", "sop", "procedure", "policy", "process", "operating procedure"],
      rendererId: "checklist-renderer",
      sourceStatusRequirement: "Active",
      ingestionStatusRequirement: "Compiled",
      renderMode: "artifactModal",
      editable: false,
      exportable: false,
      printable: false,
      origin: "authoredDemoArtifact",
      visibilityMode: "all"
    }
  ];

  const artifactCommandLexicon = [
    { command: "dashboard", aliases: ["dashboard", "metrics", "report view", "board"], artifactTypes: ["dashboard"], preferredArtifactId: "artifact-dashboard" },
    { command: "spreadsheet", aliases: ["spreadsheet", "sheet", "workbook", "csv", "table data"], artifactTypes: ["spreadsheet", "table"], missingType: "spreadsheet" },
    { command: "source map", aliases: ["source map", "sources", "approved sources", "source posture"], artifactTypes: ["sourceMap", "sourceRegistry"], preferredArtifactId: "source-map" },
    { command: "source registry", aliases: ["source registry", "registry", "source status", "ingestion status"], artifactTypes: ["sourceRegistry"], preferredArtifactId: "source-registry" },
    { command: "checklist", aliases: ["checklist", "list", "steps", "task list"], artifactTypes: ["checklist", "sop"], preferredArtifactId: "checklist" },
    { command: "SOP", aliases: ["sop", "procedure", "policy", "process", "operating procedure"], artifactTypes: ["sop", "checklist", "processMap"], preferredArtifactId: "checklist" },
    { command: "receipt", aliases: ["receipt", "receipts", "proof", "validation", "checksum"], artifactTypes: ["receipt", "validationReport"], preferredArtifactId: "validation-receipt" },
    { command: "inbox", aliases: ["inbox", "source inbox", "uploads", "uploaded files", "candidates"], artifactTypes: ["sourceInbox"], preferredArtifactId: "document-inbox" },
    { command: "events", aliases: ["events", "event ledger", "activity", "recent changes", "changes"], artifactTypes: ["eventLedger"], preferredArtifactId: "event-ledger" },
    { command: "compiler", aliases: ["compiler", "compiler report", "answer pack", "route compiler"], artifactTypes: ["compilerReport"], preferredArtifactId: "compiler-report" },
    { command: "draft", aliases: ["draft", "document", "doc", "report draft", "handoff", "writeup", "diagnosis draft"], artifactTypes: ["documentSurface"], preferredArtifactId: "surface-diagnosis-draft" },
    { command: "report", aliases: ["report", "diagnosis report", "surface report", "handoff report"], artifactTypes: ["documentSurface", "report"], preferredArtifactId: "surface-diagnosis-draft" },
    { command: "canvas", aliases: ["canvas", "html canvas", "html-in-canvas", "document stage", "stage"], artifactTypes: ["documentSurface", "report", "draft"], preferredArtifactId: "surface-diagnosis-draft" },
    { command: "table", aliases: ["table", "grid", "data table"], artifactTypes: ["table", "spreadsheet"], missingType: "table" }
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
    const artifact = artifacts[id];
    if (!artifact || !artifactLayer) return;
    const registryEntry = artifactRegistry.find((entry) => entry.artifactId === id);
    const renderer = rendererRegistry[registryEntry?.rendererId || artifact.rendererId];
    lastFocusTarget = trigger || document.activeElement;
    artifactTitle.textContent = artifact.title;
    artifactMeta.textContent = artifact.meta;
    if (renderer && typeof renderer.render === "function") {
      renderer.render(artifact, registryEntry, { projectState, stateEvents, sourceRegistry, uploadedDocuments, compiledAnswerPack });
    } else {
      artifactBody.innerHTML = typeof artifact.html === "function" ? artifact.html() : artifact.html;
    }
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
    shell?.classList.toggle("chrome-receded", Boolean(receded));
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
    setChromeReceded(deltaY > 0);
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
      const artifact = artifacts[id];
      if (!artifact) return "";
      return `<button type="button" class="artifact-action wm-motion-focusable" data-artifact-open="${id}">
        <span class="artifact-icon" aria-hidden="true">▧</span>
        <span><strong>${artifact.title}</strong><small>${artifact.meta}</small></span>
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

  function resolveArtifactCommand(input, context = {}) {
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

  function missingArtifactHtml(result) {
    return `
      <p>No ${escapeHtml(result.artifactType)} artifact is registered for this surface yet.</p>
      <p class="message-note">I can open the Source Inbox, show the Source Registry, or create a source-map draft path. Imported files stay quarantined until review, compilation, and validation.</p>
      ${actionsHtml(result.fallbackActions)}
    `;
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

  document.addEventListener("click", (event) => {
    const openTray = event.target.closest("[data-tray-open]");
    const closeTray = event.target.closest("[data-tray-close]");
    const importButton = event.target.closest("[data-document-import]");
    const artifactButton = event.target.closest("[data-artifact-open]");
    const promptButton = event.target.closest("[data-prompt]");
    if (openTray) setTray(true);
    if (closeTray || event.target.closest("[data-tray-scrim]")) setTray(false);
    if (importButton) {
      documentInput?.click();
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
    if (event.deltaY < -GESTURE_EPSILON) autoFollowStreaming = false;
    gestureOwnsChrome(event.deltaY, event.target);
  }, { passive: true });

  shell?.addEventListener("touchstart", (event) => {
    const touch = event.touches && event.touches[0];
    lastTouchY = touch ? touch.clientY : null;
  }, { passive: true });

  shell?.addEventListener("touchmove", (event) => {
    const touch = event.touches && event.touches[0];
    if (!touch || lastTouchY === null) return;
    const fingerDelta = touch.clientY - lastTouchY;
    if (Math.abs(fingerDelta) >= GESTURE_EPSILON) {
      if (fingerDelta > GESTURE_EPSILON) autoFollowStreaming = false;
      gestureOwnsChrome(-fingerDelta, event.target);
    }
    lastTouchY = touch.clientY;
  }, { passive: true });

  shell?.addEventListener("touchend", () => {
    lastTouchY = null;
  }, { passive: true });

  stream?.addEventListener("scroll", () => {
    const top = stream.scrollTop;
    const delta = top - lastScrollTop;
    const current = now();
    if (current - lastProgrammaticScrollAt < 120 || current - lastChromeGestureAt < 180) {
      lastScrollTop = top;
      return;
    }
    if (Math.abs(delta) > 10) {
      setChromeReceded(delta > 0);
    }
    lastScrollTop = top;
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeArtifact();
      setTray(false);
    }
  });

  renderTrayActivity();
  renderSourceInboxStatus();
})();
