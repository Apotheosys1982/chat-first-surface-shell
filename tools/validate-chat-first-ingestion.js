#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const targets = [
  {
    id: "chat-first-ingestion-source",
    publicDir: "assistants/chat-first-surface-shell/public"
  },
  {
    id: "chat-first-ingestion-build",
    publicDir: "dist/chat-first-surface-shell"
  }
];

const allowedSourceStatuses = ["Active", "Deprecated", "Uncertain", "Superseded"];
const allowedIngestionStatuses = ["Uploaded", "Extracted", "Pending review", "Compiled", "Approved", "Rejected", "Needs source map"];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseWindowAssignment(text, globalName) {
  const prefix = `window.${globalName} = `;
  if (!text.startsWith(prefix)) return null;
  return JSON.parse(text.slice(prefix.length).replace(/;\s*$/, ""));
}

function push(checks, target, check, ok, detail = "") {
  checks.push({ target, check, status: ok ? "pass" : "fail", detail });
}

function validateStatuses(records, statusKey, allowed) {
  return records.every((record) => allowed.includes(record[statusKey]));
}

function validateTarget(target, checks) {
  const htmlPath = `${target.publicDir}/index.html`;
  const scriptPath = `${target.publicDir}/script.js`;
  const stylesPath = `${target.publicDir}/styles.css`;
  const stateEventsPath = `${target.publicDir}/state-events.js`;
  const sourceRegistryPath = `${target.publicDir}/source-registry.js`;
  const answerPackPath = `${target.publicDir}/compiled-answer-pack.js`;

  for (const filePath of [htmlPath, scriptPath, stylesPath, stateEventsPath, sourceRegistryPath, answerPackPath]) {
    push(checks, target.id, "required_file", exists(filePath), filePath);
  }
  if (![htmlPath, scriptPath, stylesPath, stateEventsPath, sourceRegistryPath, answerPackPath].every(exists)) return;

  const html = read(htmlPath);
  const script = read(scriptPath);
  const styles = read(stylesPath);
  const eventLedger = parseWindowAssignment(read(stateEventsPath), "CHAT_FIRST_STATE_EVENTS") || [];
  const sourceRegistry = parseWindowAssignment(read(sourceRegistryPath), "CHAT_FIRST_SOURCE_REGISTRY") || {};
  const answerPack = parseWindowAssignment(read(answerPackPath), "CHAT_FIRST_ANSWER_PACK") || {};
  const sources = Array.isArray(sourceRegistry.sources) ? sourceRegistry.sources : [];
  const userUploadSources = sources.filter((source) => source.origin === "userUpload");
  const rooms = Array.isArray(answerPack.answerRooms) ? answerPack.answerRooms : [];

  const loadOrder = [
    "./project-state.js",
    "./state-events.js",
    "./source-registry.js",
    "./compiled-answer-pack.js",
    "./script.js"
  ].map((needle) => html.indexOf(needle));

  push(checks, target.id, "state_event_ledger_exists", Array.isArray(eventLedger) && eventLedger.every((event) =>
    event.eventId && event.eventType && event.timestamp !== undefined && event.title && Array.isArray(event.validationCommands)
  ), "state-events.js has structured Codex update events");
  push(checks, target.id, "source_registry_has_two_statuses", sources.length > 0 && sources.every((source) =>
    source.sourceStatus && source.ingestionStatus && source.origin && source.visibilityScope && "canAnswerFrom" in source
  ), "each source record has source status, ingestion status, origin, scope, and answer permission");
  push(checks, target.id, "source_status_values_allowed", validateStatuses(sources, "sourceStatus", allowedSourceStatuses), allowedSourceStatuses.join(", "));
  push(checks, target.id, "ingestion_status_values_allowed", validateStatuses(sources, "ingestionStatus", allowedIngestionStatuses), allowedIngestionStatuses.join(", "));
  push(checks, target.id, "compiled_answer_pack_loaded_before_runtime", loadOrder.every((index) => index >= 0) && loadOrder.every((index, i) => i === 0 || index > loadOrder[i - 1]), "compiled pack must load before script.js");
  push(checks, target.id, "compiled_pack_has_rooms", rooms.length >= 10 && answerPack.mode === "static_runtime_compiled_pack" && /Upload does not equal approved source/i.test(answerPack.invariant || ""), "compiled answer pack is behavior map, not raw memory");
  push(checks, target.id, "event_routes_compiled", rooms.some((room) => room.id === "event_ledger") && rooms.some((room) => room.id === "receipt_validation_status"), "event and receipt routes compiled");
  push(checks, target.id, "upload_routes_compiled", rooms.some((room) => room.id === "latest_upload_status") && rooms.some((room) => room.id === "upload_search") && rooms.some((room) => room.id === "source_approval_boundary"), "upload lifecycle routes compiled");
  push(checks, target.id, "runtime_uses_compiled_pack", /CHAT_FIRST_ANSWER_PACK/i.test(script) && /compiledAnswerPack\.answerRooms/i.test(script) && /new RegExp\(room\.pattern/i.test(script), "script consumes compiled answer pack");
  push(checks, target.id, "runtime_source_overlay_distinguished", /Runtime source overlay/i.test(script) && /base compiled answer pack/i.test(script) && /quarantined/i.test(script), "runtime overlay is separate from base pack");
  push(checks, target.id, "indexeddb_blob_path_exists", /indexedDB\.open\(["']chatFirstSurfaceSources["']/i.test(script) && /blobId/i.test(script), "IndexedDB used for local blob persistence where available");
  push(checks, target.id, "visible_source_inbox_storage_status", /data-source-inbox-status/i.test(html) && /Local Source Inbox/i.test(script) && /chatFirstSurfaceSources/i.test(script) && /chatFirstSurfaceDocuments\.v1/i.test(script) && /source-inbox-status/i.test(styles), "upload storage location is visible in UI and explains IndexedDB/localStorage");
  push(checks, target.id, "user_uploads_default_uncertain", /origin:\s*["']userUpload["']/i.test(script) && /let\s+sourceStatus\s*=\s*["']Uncertain["']/i.test(script), "uploads default to Uncertain");
  push(checks, target.id, "user_uploads_never_answerable", /canAnswerFrom:\s*false/i.test(script) && !/origin:\s*["']userUpload["'][\s\S]*canAnswerFrom:\s*true/i.test(script), "uploaded overlay records cannot answer from source truth");
  push(checks, target.id, "user_uploads_not_auto_approved", userUploadSources.every((source) => source.sourceStatus !== "Active" && source.ingestionStatus !== "Approved"), "registry must not ship auto-approved user uploads");
  push(checks, target.id, "unsupported_parser_boundary_copy", /PDFs?[\s\S]*DOCX[\s\S]*images[\s\S]*spreadsheets[\s\S]*metadata-only/i.test(script + JSON.stringify(answerPack)) && /parser\/OCR|Parser\/OCR|OCR/i.test(script + JSON.stringify(answerPack)), "PDF/DOCX/image/spreadsheet limits stated");
  push(checks, target.id, "search_upload_humble_copy", /Search is not the same as understanding/i.test(script) && /search (only )?extracted (local )?text|search this extracted preview/i.test(script + JSON.stringify(answerPack)), "upload search does not imply trust");
  push(checks, target.id, "compile_request_boundary", /review, approval, compilation, and validation|reviewed, source-mapped, approved/i.test(script + JSON.stringify(answerPack)), "compile path requires review and validation");
  push(checks, target.id, "artifact_views_registered", /"event-ledger"/i.test(script) && /"source-registry"/i.test(script) && /"compiler-report"/i.test(script) && /"source-map-draft"/i.test(script) && /"extracted-text"/i.test(script), "ingestion artifact views registered");
}

const checks = [];
for (const target of targets) validateTarget(target, checks);
const failures = checks.filter((check) => check.status === "fail");

console.log(JSON.stringify({
  validator: "validate-chat-first-ingestion",
  checked: checks.length,
  failures,
  checks
}, null, 2));

if (failures.length) process.exit(1);
