#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "assistants/chat-first-surface-shell/public");
const distDir = path.join(root, "dist/chat-first-surface-shell");

const allowedSourceStatuses = ["Active", "Deprecated", "Uncertain", "Superseded"];
const allowedIngestionStatuses = ["Uploaded", "Extracted", "Pending review", "Compiled", "Approved", "Rejected", "Needs source map"];

const friendlyLabelBySlug = {
  "chat-first-controlled-ingestion-route-compiler": "Controlled ingestion + route compiler",
  "chat-first-precision-polish-mode-separation": "Precision polish + mode split",
  "chat-first-stream-autofollow": "Streaming auto-follow",
  "chat-first-scrollable-dynamic-tray-activity": "Scrollable activity tray",
  "chat-first-document-import-source-inbox": "Document import + source inbox",
  "chat-first-viewport-lock": "Viewport lock + mobile scroll",
  "chat-first-state-sync-layer": "State sync layer",
  "chat-first-artifact-modal-fullscreen": "Full-viewport artifacts",
  "chat-first-project-state-dashboard": "Project state dashboard",
  "artifact-command-router-registry-spine": "Artifact command router",
  "html-canvas-document-stage-spike": "HTML-in-Canvas document stage",
  "premium-chat-shell-ui-pass": "Premium shell UI pass",
  "bounded-assistant-routing-system-planning": "Routing system plan",
  "chat-first-premium-ui-planning-docs": "Premium UI planning docs",
  "sv2-history-geography-premium-print-asset-upgrade": "SV2 print asset upgrade"
};

const validationGates = [
  {
    command: "npm run validate:chat-first-shell",
    status: "required",
    purpose: "Shell UI, artifact, route, source-state, ingestion, and project-state invariants"
  },
  {
    command: "node tools/validate-chat-first-ingestion.js",
    status: "required",
    purpose: "Controlled ingestion, source registry, event ledger, and compiled answer-pack gates"
  },
  {
    command: "npm run validate:chrome-collapse",
    status: "required",
    purpose: "Full chrome collapse and motion invariant"
  },
  {
    command: "npm run validate:checksum",
    status: "required",
    purpose: "Latest checksum manifest integrity"
  }
];

const approvedPlanningSources = [
  {
    sourceId: "planning-chat-first-shell",
    title: "Assistant Shell Plan",
    path: "PLANNING_CHAT_FIRST_SURFACE_ASSISTANT_SHELL.md",
    sourceType: "planning_document",
    origin: "codex",
    visibilityScope: "devOnly",
    sourceStatus: "Active",
    ingestionStatus: "Approved",
    extractionStatus: "extracted",
    extractionMethod: "repo_text",
    mimeType: "text/markdown",
    sizeBytes: 0,
    contentHash: "",
    blobId: "",
    canSearch: true,
    canRender: true,
    canAnswerFrom: true,
    routeSeedStatus: "compiled",
    approvalMode: "repo_controlled",
    approvedBy: "Codex validated source spine",
    createdAt: "",
    updatedAt: "",
    summary: "Defines the assistant-as-app architecture and artifact rendering flow."
  },
  {
    sourceId: "planning-premium-ui",
    title: "Premium UI Plan",
    path: "PLANNING_PREMIUM_CHAT_UI_SYSTEM.md",
    sourceType: "planning_document",
    origin: "codex",
    visibilityScope: "devOnly",
    sourceStatus: "Active",
    ingestionStatus: "Approved",
    extractionStatus: "extracted",
    extractionMethod: "repo_text",
    mimeType: "text/markdown",
    sizeBytes: 0,
    contentHash: "",
    blobId: "",
    canSearch: true,
    canRender: true,
    canAnswerFrom: true,
    routeSeedStatus: "compiled",
    approvalMode: "repo_controlled",
    approvedBy: "Codex validated source spine",
    createdAt: "",
    updatedAt: "",
    summary: "Defines the visual language, chrome, composer, tray, and modal behavior."
  },
  {
    sourceId: "planning-offer-context",
    title: "Offer Context Plan",
    path: "PLANNING_OFFER_CONTEXT_ALIGNMENT.md",
    sourceType: "planning_document",
    origin: "codex",
    visibilityScope: "devOnly",
    sourceStatus: "Active",
    ingestionStatus: "Approved",
    extractionStatus: "extracted",
    extractionMethod: "repo_text",
    mimeType: "text/markdown",
    sizeBytes: 0,
    contentHash: "",
    blobId: "",
    canSearch: true,
    canRender: true,
    canAnswerFrom: true,
    routeSeedStatus: "compiled",
    approvalMode: "repo_controlled",
    approvedBy: "Codex validated source spine",
    createdAt: "",
    updatedAt: "",
    summary: "Defines the commercial context this shell is meant to support."
  },
  {
    sourceId: "planning-routing-system",
    title: "Routing System Plan",
    path: "PLANNING_BOUNDED_ASSISTANT_ROUTING_SYSTEM.md",
    sourceType: "planning_document",
    origin: "codex",
    visibilityScope: "devOnly",
    sourceStatus: "Active",
    ingestionStatus: "Approved",
    extractionStatus: "extracted",
    extractionMethod: "repo_text",
    mimeType: "text/markdown",
    sizeBytes: 0,
    contentHash: "",
    blobId: "",
    canSearch: true,
    canRender: true,
    canAnswerFrom: true,
    routeSeedStatus: "compiled",
    approvalMode: "repo_controlled",
    approvedBy: "Codex validated source spine",
    createdAt: "",
    updatedAt: "",
    summary: "Defines answer rooms, route precedence, confidence, lexicons, and artifact actions."
  }
];

function titleFromSlug(slug) {
  return friendlyLabelBySlug[slug] || slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function listLatest(dirName, extension, limit = 8) {
  const dir = path.join(root, dirName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .sort()
    .reverse()
    .slice(0, limit)
    .map((name) => {
      const match = name.match(/^(\d{8}T\d{6}Z)-(.+)\.[^.]+$/);
      const slug = match ? match[2] : name.replace(/\.[^.]+$/, "");
      return {
        path: `${dirName}/${name}`,
        filename: name,
        timestamp: match ? match[1] : "",
        label: titleFromSlug(slug),
        slug
      };
    });
}

function byTimestamp(items) {
  return new Map(items.filter((item) => item.timestamp).map((item) => [item.timestamp, item]));
}

const recentReceipts = listLatest("receipts", ".md", 8);
const recentLogs = listLatest("logs", ".log", 6);
const recentChecksums = listLatest("checksums", ".sha256", 6);
const logByTimestamp = byTimestamp(recentLogs);
const checksumByTimestamp = byTimestamp(recentChecksums);

const stateEvents = recentReceipts.map((receipt) => {
  const log = logByTimestamp.get(receipt.timestamp);
  const checksum = checksumByTimestamp.get(receipt.timestamp);
  return {
    eventId: `event-${receipt.timestamp || receipt.slug}`,
    timestamp: receipt.timestamp,
    eventType: "codex_update",
    title: receipt.label,
    summary: "Codex recorded a meaningful shell update with receipt-backed validation posture.",
    filesChanged: [],
    artifactsAffected: ["Project state dashboard", "Recent activity", "Receipt stream"],
    routesAffected: ["project_state", "receipts", "source_status"],
    validationCommands: validationGates.map((gate) => gate.command),
    receiptPath: receipt.path,
    logPath: log ? log.path : "",
    checksumPath: checksum ? checksum.path : "",
    status: checksum ? "Compiled" : "Pending review",
    nextRecommendedAction: checksum
      ? "Inspect the receipt or render the current project dashboard."
      : "Generate and validate the checksum for this event."
  };
});

const receiptSources = recentReceipts.map((receipt) => {
  const checksum = checksumByTimestamp.get(receipt.timestamp);
  return {
    sourceId: `receipt-${receipt.timestamp || receipt.slug}`,
    title: receipt.label,
    path: receipt.path,
    sourceType: "codex_receipt",
    origin: "codex",
    visibilityScope: "devOnly",
    sourceStatus: "Active",
    ingestionStatus: checksum ? "Compiled" : "Pending review",
    extractionStatus: "extracted",
    extractionMethod: "repo_text",
    mimeType: "text/markdown",
    sizeBytes: 0,
    contentHash: "",
    blobId: "",
    canSearch: true,
    canRender: true,
    canAnswerFrom: Boolean(checksum),
    routeSeedStatus: checksum ? "compiled" : "pending_review",
    approvalMode: checksum ? "checksum_validated" : "pending_checksum",
    approvedBy: checksum ? "Codex checksum gate" : "",
    createdAt: receipt.timestamp,
    updatedAt: receipt.timestamp,
    summary: "Receipt-backed project state event generated during shell hardening.",
    checksumPath: checksum ? checksum.path : ""
  };
});

const sourceRegistry = {
  generatedAt: new Date().toISOString(),
  source: "tools/sync-chat-first-state.js",
  sourceStatuses: allowedSourceStatuses,
  ingestionStatuses: allowedIngestionStatuses,
  policy: {
    invariant: "Upload does not equal approved source. Event does not equal truth. Ingestion comes before answer.",
    uploadedDefaultSourceStatus: "Uncertain",
    uploadedDefaultIngestionStatus: "Uploaded",
    approvalRule: "User uploads may be inspected or searched locally, but they do not become Active or Approved without source review and compilation."
  },
  sources: [...approvedPlanningSources, ...receiptSources]
};

const state = {
  generatedAt: new Date().toISOString(),
  source: "tools/sync-chat-first-state.js",
  latestEventId: stateEvents[0]?.eventId || "",
  recentReceipts,
  recentLogs,
  recentChecksums,
  validations: validationGates
};

function writeWindowAssignment(fileName, globalName, value) {
  const outPath = path.join(publicDir, fileName);
  const distPath = path.join(distDir, fileName);
  const js = `window.${globalName} = ${JSON.stringify(value, null, 2)};\n`;
  fs.writeFileSync(outPath, js);
  fs.mkdirSync(path.dirname(distPath), { recursive: true });
  fs.writeFileSync(distPath, js);
  return path.relative(root, outPath);
}

const projectStatePath = writeWindowAssignment("project-state.js", "CHAT_FIRST_PROJECT_STATE", state);
const eventPath = writeWindowAssignment("state-events.js", "CHAT_FIRST_STATE_EVENTS", stateEvents);
const sourceRegistryPath = writeWindowAssignment("source-registry.js", "CHAT_FIRST_SOURCE_REGISTRY", sourceRegistry);

console.log(JSON.stringify({
  status: "ok",
  outPath: projectStatePath,
  eventPath,
  sourceRegistryPath,
  latestReceipt: state.recentReceipts[0]?.path || "",
  latestEvent: stateEvents[0]?.eventId || "",
  receiptCount: state.recentReceipts.length,
  eventCount: stateEvents.length,
  sourceCount: sourceRegistry.sources.length,
  checksumCount: state.recentChecksums.length
}, null, 2));
