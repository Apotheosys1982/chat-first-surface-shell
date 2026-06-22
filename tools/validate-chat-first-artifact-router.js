#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const targets = [
  {
    id: "chat-first-shell-source",
    publicDir: "assistants/chat-first-surface-shell/public"
  },
  {
    id: "chat-first-shell-build",
    publicDir: "dist/chat-first-surface-shell"
  }
];

const requiredCommands = [
  "artifacts",
  "dashboard",
  "spreadsheet",
  "source map",
  "checklist",
  "sop",
  "receipt",
  "inbox",
  "events",
  "compiler",
  "draft",
  "document",
  "report",
  "canvas",
  "html canvas",
  "table"
];

const requiredSeededArtifacts = [
  "artifact-directory",
  "project-state-dashboard",
  "source-map",
  "document-inbox",
  "event-ledger",
  "compiler-report",
  "staged-spreadsheet",
  "receipts-directory",
  "checklist",
  "surface-diagnosis-draft"
];

const canonicalArtifactContracts = [
  {
    artifactId: "project-state-dashboard",
    artifactType: "dashboard",
    rendererId: "dashboardStageRenderer",
    stateAdapterId: "projectStateDashboardAdapter"
  },
  {
    artifactId: "artifact-directory",
    artifactType: "artifactDirectory",
    rendererId: "nativeShellPanelRenderer",
    stateAdapterId: "artifactDirectoryAdapter"
  },
  {
    artifactId: "source-map",
    artifactType: "sourceMap",
    rendererId: "sourceMapStageRenderer",
    stateAdapterId: "sourceMapAdapter"
  },
  {
    artifactId: "document-inbox",
    artifactType: "sourceInbox",
    rendererId: "nativeShellPanelRenderer",
    stateAdapterId: "sourceInboxAdapter"
  },
  {
    artifactId: "event-ledger",
    artifactType: "eventLedger",
    rendererId: "nativeShellPanelRenderer",
    stateAdapterId: "eventLedgerAdapter"
  },
  {
    artifactId: "compiler-report",
    artifactType: "compilerReport",
    rendererId: "nativeShellPanelRenderer",
    stateAdapterId: "compilerReportAdapter"
  },
  {
    artifactId: "staged-spreadsheet",
    artifactType: "spreadsheet",
    rendererId: "spreadsheetStageRenderer",
    stateAdapterId: "spreadsheetStageAdapter"
  },
  {
    artifactId: "receipts-directory",
    artifactType: "receiptsDirectory",
    rendererId: "receiptProofRenderer",
    stateAdapterId: "receiptStreamAdapter"
  },
  {
    artifactId: "surface-diagnosis-draft",
    artifactType: "documentSurface",
    rendererId: "htmlCanvasDocumentStage",
    stateAdapterId: "documentDraftAdapter"
  },
  {
    artifactId: "checklist",
    artifactType: "checklist",
    rendererId: "checklistStageRenderer",
    stateAdapterId: "checklistAdapter"
  }
];

const canonicalCommandTargets = [
  ["dashboard", "project-state-dashboard"],
  ["artifacts", "artifact-directory"],
  ["source map", "source-map"],
  ["inbox", "document-inbox"],
  ["events", "event-ledger"],
  ["compiler", "compiler-report"],
  ["checklist", "checklist"],
  ["SOP", "checklist"],
  ["receipt", "receipts-directory"],
  ["draft", "surface-diagnosis-draft"],
  ["report", "surface-diagnosis-draft"],
  ["canvas", "surface-diagnosis-draft"]
];

const requiredRegistryFields = [
  "artifactId",
  "artifactType",
  "artifactPlane",
  "visualContract",
  "title",
  "description",
  "commandAliases",
  "rendererId",
  "sourceStatusRequirement",
  "ingestionStatusRequirement",
  "renderMode",
  "editable",
  "exportable",
  "printable",
  "origin",
  "visibilityMode",
  "stateAdapterId",
  "stageMode",
  "sourceDependencies",
  "status",
  "actions"
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function registryContractExists(script, contract) {
  const fields = [
    ["artifactId", contract.artifactId],
    ["artifactType", contract.artifactType],
    ["rendererId", contract.rendererId],
    ["stateAdapterId", contract.stateAdapterId]
  ];
  const pattern = fields
    .map(([field, value]) => `${field}:\\s*["']${escapeRegExp(value)}["']`)
    .join("[\\s\\S]*");
  return new RegExp(pattern, "i").test(script);
}

function commandPrefersArtifact(script, command, artifactId) {
  return new RegExp(
    `command:\\s*["']${escapeRegExp(command)}["'][\\s\\S]*?preferredArtifactId:\\s*["']${escapeRegExp(artifactId)}["']`,
    "i"
  ).test(script);
}

function validateTarget(target, checks) {
  const scriptPath = `${target.publicDir}/script.js`;
  if (!exists(scriptPath)) {
    push(checks, target.id, "runtime_script_exists", false, scriptPath);
    return;
  }

  const script = read(scriptPath);
  const submitIndex = script.indexOf("function submitPrompt");
  const resolveCallIndex = script.indexOf("resolveArtifactCommand(input", submitIndex);
  const routeCallIndex = script.indexOf("const response = route(input)", submitIndex);

  push(checks, target.id, "artifact_registry_exists", /const\s+artifactRegistry\s*=\s*\[/i.test(script), "registry-shaped artifact catalog");
  push(checks, target.id, "command_lexicon_exists", /const\s+artifactCommandLexicon\s*=\s*\[/i.test(script), "artifact command lexicon");
  push(checks, target.id, "resolver_exists", /function\s+resolveArtifactCommand\s*\(/i.test(script), "resolveArtifactCommand(input, context)");
  push(checks, target.id, "resolver_runs_before_answer_route", resolveCallIndex !== -1 && routeCallIndex !== -1 && resolveCallIndex < routeCallIndex, "submitPrompt should check artifact commands before route(input)");
  push(checks, target.id, "direct_open_path_exists", /type:\s*["']direct_open["']/i.test(script) && /openArtifact\(artifactCommand\.artifactId/i.test(script), "clear command opens artifact directly");
  push(checks, target.id, "legacy_dashboard_id_removed", !/artifact-dashboard/i.test(script), "dashboard must not keep the legacy artifact-dashboard path");
  push(checks, target.id, "legacy_receipt_id_removed", !/validation-receipt/i.test(script), "receipts must not keep the legacy validation-receipt path");
  push(checks, target.id, "canonical_dashboard_id_registered", /artifactId:\s*["']project-state-dashboard["'][\s\S]*artifactType:\s*["']dashboard["'][\s\S]*rendererId:\s*["']dashboardStageRenderer["'][\s\S]*stateAdapterId:\s*["']projectStateDashboardAdapter["']/i.test(script), "one canonical staged dashboard artifact");
  push(checks, target.id, "artifact_directory_registered", /artifactId:\s*["']artifact-directory["'][\s\S]*artifactType:\s*["']artifactDirectory["'][\s\S]*rendererId:\s*["']nativeShellPanelRenderer["']/i.test(script), "artifact list is a registered control-plane artifact");
  push(checks, target.id, "open_artifact_registry_selected_renderer", /const\s+registryEntry\s*=\s*artifactRegistry\.find/i.test(script) && /rendererRegistry\[registryEntry\.rendererId\]/i.test(script) && /stateAdapterRegistry\[registryEntry\.stateAdapterId\]/i.test(script), "openArtifact must choose adapter and renderer from registry");
  push(checks, target.id, "artifact_directory_clicks_same_open_path", /function\s+artifactDirectoryHtml\s*\([\s\S]*data-artifact-open="\$\{escapeHtml\(entry\.artifactId\)\}"/i.test(script), "artifact directory rows use data-artifact-open with registry artifact IDs");
  push(checks, target.id, "ambiguous_picker_path_exists", /type:\s*["']ambiguous_picker["']/i.test(script) && /function\s+artifactPickerHtml\s*\(/i.test(script), "multiple matches produce compact picker");
  push(checks, target.id, "missing_artifact_path_exists", /type:\s*["']missing_artifact["']/i.test(script) && /No \${escapeHtml\(result\.artifactType\)} artifact is registered/i.test(script), "missing commands produce compact fallback");
  push(checks, target.id, "status_message_is_short", /Opening document stage\./i.test(script) && /Opening \$\{matches\[0\]\.title\.toLowerCase\(\)\}\./i.test(script), "direct command status copy");

  for (const contract of canonicalArtifactContracts) {
    push(
      checks,
      target.id,
      `canonical_${contract.artifactId}_contract`,
      registryContractExists(script, contract),
      `${contract.artifactId} -> ${contract.rendererId} / ${contract.stateAdapterId}`
    );
  }

  for (const [command, artifactId] of canonicalCommandTargets) {
    push(
      checks,
      target.id,
      `command_${command.replace(/\s+/g, "_")}_prefers_${artifactId}`,
      commandPrefersArtifact(script, command, artifactId),
      `${command} -> ${artifactId}`
    );
  }

  push(
    checks,
    target.id,
    "spreadsheet_table_artifact_seeded",
    /artifactId:\s*["']staged-spreadsheet["'][\s\S]*?artifactType:\s*["']spreadsheet["'][\s\S]*?stateAdapterId:\s*["']spreadsheetStageAdapter["']/i.test(script) &&
      /function\s+spreadsheetStageHtml\s*\(/i.test(script) &&
      !/command:\s*["']spreadsheet["'][\s\S]*?missingType:\s*["']spreadsheet["']/i.test(script) &&
      !/command:\s*["']table["'][\s\S]*?missingType:\s*["']table["']/i.test(script),
    "spreadsheet and table commands must resolve registered spreadsheet artifacts"
  );
  push(
    checks,
    target.id,
    "spreadsheet_commands_do_not_force_seed_artifact",
    !/command:\s*["']spreadsheet["'][\s\S]*?preferredArtifactId:\s*["']staged-spreadsheet["']/i.test(script) &&
      !/command:\s*["']table["'][\s\S]*?preferredArtifactId:\s*["']staged-spreadsheet["']/i.test(script),
    "spreadsheet/table commands must allow picker behavior when multiple workbook artifacts exist"
  );
  push(
    checks,
    target.id,
    "spreadsheet_picker_create_path_exists",
    /function\s+spreadsheetPickerHtml\s*\(/i.test(script) &&
      /data-spreadsheet-create/i.test(script) &&
      /createBlankSpreadsheetWorkbook/i.test(script),
    "spreadsheet picker includes a local create path"
  );

  for (const command of requiredCommands) {
    const escaped = escapeRegExp(command);
    push(checks, target.id, `command_${command.replace(/\s+/g, "_")}_registered`, new RegExp(`["']${escaped}["']`, "i").test(script), command);
  }

  for (const artifactId of requiredSeededArtifacts) {
    push(checks, target.id, `seeded_${artifactId}_exists`, script.includes(`artifactId: "${artifactId}"`) && script.includes(`"${artifactId}": {`), artifactId);
  }

  for (const field of requiredRegistryFields) {
    push(checks, target.id, `registry_field_${field}`, script.includes(field), field);
  }

  push(checks, target.id, "source_trust_preserved", /canAnswerFrom:\s*false/i.test(script) && /Uncertain/i.test(script) && /review,\s*compilation,\s*and\s*validation/i.test(script), "uploads stay quarantined");
  push(checks, target.id, "natural_language_route_preserved", /function\s+route\s*\(/i.test(script) && /streamAssistantMessage\(response\.answer,\s*response\.actions/i.test(script), "answer-room route still exists");
}

const checks = [];
for (const target of targets) validateTarget(target, checks);
const failures = checks.filter((check) => check.status === "fail");

console.log(JSON.stringify({
  validator: "validate-chat-first-artifact-router",
  checked: checks.length,
  failures,
  checks
}, null, 2));

if (failures.length) process.exit(1);
