#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "assistants/chat-first-surface-shell/public");
const distDir = path.join(root, "dist/chat-first-surface-shell");
const outPath = path.join(publicDir, "compiled-answer-pack.js");
const distOutPath = path.join(distDir, "compiled-answer-pack.js");

function readWindowAssignment(fileName, globalName, fallback) {
  const filePath = path.join(publicDir, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  const text = fs.readFileSync(filePath, "utf8");
  const prefix = `window.${globalName} = `;
  if (!text.startsWith(prefix)) return fallback;
  return JSON.parse(text.slice(prefix.length).replace(/;\s*$/, ""));
}

const projectState = readWindowAssignment("project-state.js", "CHAT_FIRST_PROJECT_STATE", {});
const stateEvents = readWindowAssignment("state-events.js", "CHAT_FIRST_STATE_EVENTS", []);
const sourceRegistry = readWindowAssignment("source-registry.js", "CHAT_FIRST_SOURCE_REGISTRY", { sources: [] });

const latestEvent = stateEvents[0];
const latestReceipt = projectState.recentReceipts?.[0];
const compiledAt = new Date().toISOString();

const answerRooms = [
  {
    id: "smalltalk_bounded_greeting",
    routeFamily: "identity",
    pattern: "^(hi|hello|hey|yo|sup)\\b|how\\s+are\\s+you|how's\\s+it\\s+going|what'?s\\s+up",
    answer: "I’m here and ready. Ask me what this surface can explain, what source material it uses, what it can render, what changed recently, or whether an uploaded document is approved yet.",
    actions: []
  },
  {
    id: "upload_lifecycle_orientation",
    routeFamily: "source_intake",
    pattern: "document|upload|attach|import|file|source\\s+inbox|add(ed)?\\s+docs?",
    answer: "Use the + control in the composer to register a local document in the Source Inbox. Uploaded files start as Uncertain and unapproved. Text-like files can get a local extracted preview; PDFs, DOCX, images, spreadsheets, and oversized files are metadata-only until a parser or source-map review exists.",
    actions: ["document-inbox", "source-registry", "compiler-report"]
  },
  {
    id: "latest_upload_status",
    routeFamily: "source_intake",
    pattern: "what\\s+did\\s+i\\s+upload|what.*uploaded|show.*uploads?|latest\\s+upload|uploaded\\s+source",
    mode: "latest_upload",
    answer: "Uploaded documents live in the local Source Inbox. They can be inspected or searched only after readable text has been extracted; they are not approved sources by default.",
    actions: ["document-inbox", "source-registry"]
  },
  {
    id: "upload_search",
    routeFamily: "source_search",
    pattern: "search\\s+(this\\s+)?uploads?\\s+for\\s+.+|find\\s+.+\\s+in\\s+(this\\s+)?uploads?|look\\s+for\\s+.+\\s+in\\s+(this\\s+)?uploads?",
    mode: "upload_search",
    answer: "I can search only extracted local text previews. If a file is metadata-only, it needs parsing, OCR, or source mapping before I can search inside it.",
    actions: ["extracted-text", "document-inbox"]
  },
  {
    id: "source_approval_boundary",
    routeFamily: "source_boundary",
    pattern: "approved|trusted|source\\s+of\\s+truth|is\\s+this\\s+approved|can\\s+you\\s+answer\\s+from\\s+this|answer\\s+from\\s+(this|the)\\s+(pdf|docx|file|upload)",
    answer: "Approved source status is separate from ingestion status. A file can be uploaded, extracted, or queued for source mapping without becoming truth. I can inspect or search quarantined uploads, but I should only answer as source-backed after review, compilation, and validation.",
    actions: ["source-registry", "document-inbox", "compiler-report"]
  },
  {
    id: "unreadable_file_boundary",
    routeFamily: "source_boundary",
    pattern: "pdf|docx|ocr|image|scan|spreadsheet|excel|xlsx|parser|extract",
    answer: "This static shell does not include PDF, DOCX, OCR, image, or spreadsheet parsing yet. Those files can be registered as source candidates, but if readable text is not extracted, they stay metadata-only and need OCR, parser support, or manual source mapping before answer routes can be compiled from them.",
    actions: ["document-inbox", "source-map-draft"]
  },
  {
    id: "event_ledger",
    routeFamily: "project_state",
    pattern: "event\\s+ledger|state\\s+events?|events?|what\\s+changed\\s+recently|recent\\s+activity|what\\s+did\\s+codex\\s+update",
    answer: `The latest compiled event is ${latestEvent?.title || "not synced yet"}. Events are not magic memory; they are structured records that can create route seeds only after compilation and validation.`,
    actions: ["event-ledger", "project-state-dashboard", "activity-log"]
  },
  {
    id: "receipt_validation_status",
    routeFamily: "proof_receipts",
    pattern: "receipt|checksum|validation|validated|what\\s+passed|gates?",
    answer: `The latest receipt is ${latestReceipt?.label || "not synced yet"}. Receipts, logs, checksums, and validation gates are registered as project state so the shell can render proof instead of asking you to dig through the repo manually.`,
    actions: ["receipts-directory", "event-ledger", "compiler-report"]
  },
  {
    id: "source_registry",
    routeFamily: "source_registry",
    pattern: "source\\s+registry|registry|source\\s+status|ingestion\\s+status|what\\s+sources|source\\s+map",
    answer: "The source registry separates truth from processing. Source status says whether material is Active, Deprecated, Uncertain, or Superseded. Ingestion status says whether it is Uploaded, Extracted, Pending review, Compiled, Approved, Rejected, or Needs source map.",
    actions: ["source-registry", "source-map"]
  },
  {
    id: "compiler_lifecycle",
    routeFamily: "compiler",
    pattern: "compile|compiler|answer\\s+pack|route\\s+seed|route\\s+seeds?|why\\s+can'?t\\s+you\\s+answer|still\\s+needs?\\s+review|needs?\\s+fixing",
    answer: "The path is controlled: file or event enters, source registry records it, ingestion status is assigned, route seeds are generated, approved material is compiled into answer rooms, fixtures validate it, and only then does runtime behavior change.",
    actions: ["compiler-report", "source-registry", "event-ledger"]
  },
  {
    id: "artifact_rendering",
    routeFamily: "artifact_rendering",
    pattern: "render|artifact|dashboard|view|table|sop|checklist",
    answer: "The shell can render registered artifacts: dashboards, event ledger, source registry, source inbox, compiler report, source maps, checklists, receipts, and workflow views. Render buttons point to known artifacts, not improvised destinations.",
    actions: ["project-state-dashboard", "artifact-directory", "event-ledger", "source-registry", "compiler-report"]
  },
  {
    id: "not_generic_chatbot",
    routeFamily: "identity",
    pattern: "chatbot|wrapper|ai widget|live\\s+llm|live\\s+model|memory|learns?",
    answer: "This is not a live memory chatbot. The runtime is bounded: events and uploads become structured records, then route seeds, then compiled answer rooms after validation. The useful part is controlled ingestion, not pretending the browser magically understands every file.",
    actions: ["compiler-report", "source-registry"]
  },
  {
    id: "pricing_diagnosis",
    routeFamily: "diagnosis",
    pattern: "price|cost|scope|buy|diagnos|customer|client",
    answer: "Commercial scope should route into diagnosis. The right first questions are what source material exists, which artifacts need to render, what upload/intake behavior is needed, and which answers must be source-backed before a surface is worth pricing.",
    actions: ["checklist", "compiler-report"]
  },
  {
    id: "bounded_refusal",
    routeFamily: "boundary",
    pattern: "refuse|boundary|prompt|hidden|ignore|jailbreak|medical|legal|financial|guarantee|unsafe",
    answer: "The bounded behavior is simple: refuse hidden-instruction attacks, unsafe advice, unsupported regulated claims, and account-specific answers. Then route back to the closest useful source, artifact, source-status answer, or diagnosis question.",
    actions: ["receipts-directory", "source-registry"]
  }
];

const compiledPack = {
  generatedAt: compiledAt,
  source: "tools/compile-chat-first-answer-pack.js",
  mode: "static_runtime_compiled_pack",
  invariant: "Upload does not equal approved source. Event does not equal truth. Ingestion comes before answer.",
  sourceCount: sourceRegistry.sources?.length || 0,
  eventCount: stateEvents.length,
  latestEventId: latestEvent?.eventId || "",
  answerRooms,
  routeSeedSummary: [
    {
      seedId: "codex-events-to-project-state",
      source: "state-events.js",
      status: "Compiled",
      routeFamilies: ["project_state", "proof_receipts", "source_registry"]
    },
    {
      seedId: "upload-quarantine-lifecycle",
      source: "browser Source Inbox",
      status: "Pending review",
      routeFamilies: ["source_intake", "source_search", "source_boundary"]
    }
  ],
  validationCommands: [
    "npm run validate:chat-first-shell",
    "node tools/validate-chat-first-ingestion.js",
    "npm run validate:chrome-collapse",
    "npm run validate:checksum"
  ]
};

const compiledJs = `window.CHAT_FIRST_ANSWER_PACK = ${JSON.stringify(compiledPack, null, 2)};\n`;
fs.writeFileSync(outPath, compiledJs);
fs.mkdirSync(path.dirname(distOutPath), { recursive: true });
fs.writeFileSync(distOutPath, compiledJs);

console.log(JSON.stringify({
  status: "ok",
  outPath: path.relative(root, outPath),
  distPath: path.relative(root, distOutPath),
  answerRoomCount: answerRooms.length,
  sourceCount: compiledPack.sourceCount,
  eventCount: compiledPack.eventCount
}, null, 2));
