#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const targets = [
  {
    id: "chat-first-renderer-contract-source",
    publicDir: "assistants/chat-first-surface-shell/public"
  },
  {
    id: "chat-first-renderer-contract-build",
    publicDir: "dist/chat-first-surface-shell"
  }
];

const allowedRendererByVisualContract = {
  dashboard: ["dashboardStageRenderer"],
  spreadsheet: ["spreadsheetStageRenderer"],
  document: ["htmlCanvasDocumentStage", "documentStageRenderer"],
  checklist: ["checklistStageRenderer"],
  sourceMap: ["sourceMapStageRenderer"],
  receipt: ["receiptProofRenderer"],
  nativeControl: ["nativeShellPanelRenderer"]
};

const requiredCanonical = [
  {
    artifactId: "project-state-dashboard",
    artifactPlane: "work",
    visualContract: "dashboard",
    rendererId: "dashboardStageRenderer"
  },
  {
    artifactId: "staged-spreadsheet",
    artifactPlane: "work",
    visualContract: "spreadsheet",
    rendererId: "spreadsheetStageRenderer"
  },
  {
    artifactId: "surface-diagnosis-draft",
    artifactPlane: "work",
    visualContract: "document",
    rendererId: "htmlCanvasDocumentStage"
  },
  {
    artifactId: "source-map",
    artifactPlane: "work",
    visualContract: "sourceMap",
    rendererId: "sourceMapStageRenderer"
  },
  {
    artifactId: "checklist",
    artifactPlane: "work",
    visualContract: "checklist",
    rendererId: "checklistStageRenderer"
  },
  {
    artifactId: "receipts-directory",
    artifactPlane: "work",
    visualContract: "receipt",
    rendererId: "receiptProofRenderer"
  }
];

const rendererMarkers = [
  {
    id: "dashboard_visual_grammar",
    markers: ["dashboard-stage", "dashboard-metric", "dashboard-timeline", "dashboard-status-strip"]
  },
  {
    id: "spreadsheet_visual_grammar",
    markers: ["spreadsheet-shell", "spreadsheet-grid", "spreadsheet-formula-bar", "sheet-column-header", "sheet-cell", "sheet-tab-strip"]
  },
  {
    id: "document_visual_grammar",
    markers: ["html-canvas-stage", "diagnosis-document", "diagnosis-status-row", "diagnosis-table"]
  },
  {
    id: "checklist_visual_grammar",
    markers: ["checklist-runner", "check-step-list", "check-step", "process-meta-row"]
  },
  {
    id: "source_map_visual_grammar",
    markers: ["source-governance", "source-status-board", "ingestion-matrix", "answerability-badge"]
  },
  {
    id: "receipt_visual_grammar",
    markers: ["receipt-proof", "receipt-stamp", "validation-command-board", "proof-timeline"]
  }
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function push(checks, target, check, ok, detail = "") {
  checks.push({ target, check, status: ok ? "pass" : "fail", detail });
}

function extractRegistry(script) {
  const match = script.match(/const artifactRegistry = (\[[\s\S]*?\n  \]);\n\n  const artifactCommandLexicon/);
  if (!match) return null;
  try {
    return Function(`return ${match[1]}`)();
  } catch (error) {
    return null;
  }
}

function cssRuleBlocks(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(css.matchAll(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "gi"))).map((match) => match[0]);
}

function validateTarget(target, checks) {
  const scriptPath = `${target.publicDir}/script.js`;
  const cssPath = `${target.publicDir}/styles.css`;
  if (!exists(scriptPath) || !exists(cssPath)) {
    push(checks, target.id, "required_files_exist", false, `${scriptPath}, ${cssPath}`);
    return;
  }

  const script = read(scriptPath);
  const css = read(cssPath);
  const combined = `${script}\n${css}`;
  const registry = extractRegistry(script);
  push(checks, target.id, "artifact_registry_parseable", Array.isArray(registry), "artifact registry literal");
  if (!Array.isArray(registry)) return;

  for (const entry of registry) {
    push(checks, target.id, `artifactPlane_${entry.artifactId}`, Boolean(entry.artifactPlane), `${entry.artifactId}.artifactPlane`);
    push(checks, target.id, `visualContract_${entry.artifactId}`, Boolean(entry.visualContract), `${entry.artifactId}.visualContract`);
    push(
      checks,
      target.id,
      `work_${entry.artifactId}_not_native_shell`,
      entry.artifactPlane !== "work" || entry.rendererId !== "nativeShellPanelRenderer",
      `${entry.artifactId} -> ${entry.rendererId}`
    );
    const allowed = allowedRendererByVisualContract[entry.visualContract] || [];
    push(
      checks,
      target.id,
      `renderer_matches_${entry.artifactId}_${entry.visualContract || "missing"}`,
      allowed.includes(entry.rendererId),
      `${entry.visualContract} -> ${entry.rendererId}`
    );
  }

  for (const contract of requiredCanonical) {
    const entry = registry.find((candidate) => candidate.artifactId === contract.artifactId);
    push(checks, target.id, `canonical_${contract.artifactId}_exists`, Boolean(entry), contract.artifactId);
    if (!entry) continue;
    push(
      checks,
      target.id,
      `canonical_${contract.artifactId}_visual_contract`,
      entry.artifactPlane === contract.artifactPlane &&
        entry.visualContract === contract.visualContract &&
        entry.rendererId === contract.rendererId,
      `${entry.artifactPlane} / ${entry.visualContract} / ${entry.rendererId}`
    );
  }

  for (const rendererId of [
    "dashboardStageRenderer",
    "spreadsheetStageRenderer",
    "sourceMapStageRenderer",
    "receiptProofRenderer",
    "checklistStageRenderer",
    "htmlCanvasDocumentStage"
  ]) {
    push(checks, target.id, `renderer_registered_${rendererId}`, script.includes(`rendererId: "${rendererId}"`), rendererId);
  }

  push(
    checks,
    target.id,
    "open_artifact_sets_visual_contract_dataset",
    /dataset\.visualContract\s*=\s*registryEntry\.visualContract/i.test(script) &&
      /dataset\.artifactPlane\s*=\s*registryEntry\.artifactPlane/i.test(script),
    "artifact panel gets visual-contract data"
  );

  for (const markerSet of rendererMarkers) {
    push(
      checks,
      target.id,
      markerSet.id,
      markerSet.markers.every((marker) => combined.includes(marker)),
      markerSet.markers.join(", ")
    );
  }

  const spreadsheetRowBlocks = cssRuleBlocks(css, ".spreadsheet-row");
  const spreadsheetHeaderBlocks = cssRuleBlocks(css, ".spreadsheet-header");
  push(
    checks,
    target.id,
    "spreadsheet_keeps_grid_on_mobile",
    !spreadsheetHeaderBlocks.some((block) => /display\s*:\s*none/i.test(block)) &&
      !spreadsheetRowBlocks.some((block) => /grid-template-columns\s*:\s*1fr/i.test(block)) &&
      !/\.spreadsheet-row\s*>\s*div::before/i.test(css) &&
      /role=["']grid["']/i.test(script) &&
      /sheet-column-header/i.test(script) &&
      /spreadsheet-formula-bar/i.test(script),
    "spreadsheet renderer must stay a grid, not collapse into card rows"
  );
}

const checks = [];
for (const target of targets) validateTarget(target, checks);
const failures = checks.filter((check) => check.status === "fail");

console.log(JSON.stringify({
  validator: "validate-chat-first-renderer-visual-contracts",
  checked: checks.length,
  failures,
  checks
}, null, 2));

process.exit(failures.length ? 1 : 0);
