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
  "artifact-dashboard",
  "source-map",
  "document-inbox",
  "event-ledger",
  "compiler-report",
  "validation-receipt",
  "checklist",
  "surface-diagnosis-draft"
];

const requiredRegistryFields = [
  "artifactId",
  "artifactType",
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
  "visibilityMode"
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
  push(checks, target.id, "ambiguous_picker_path_exists", /type:\s*["']ambiguous_picker["']/i.test(script) && /function\s+artifactPickerHtml\s*\(/i.test(script), "multiple matches produce compact picker");
  push(checks, target.id, "missing_artifact_path_exists", /type:\s*["']missing_artifact["']/i.test(script) && /No \${escapeHtml\(result\.artifactType\)} artifact is registered/i.test(script), "missing commands produce compact fallback");
  push(checks, target.id, "status_message_is_short", /Opening document stage\./i.test(script) && /Opening \$\{matches\[0\]\.title\.toLowerCase\(\)\}\./i.test(script), "direct command status copy");

  for (const command of requiredCommands) {
    const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
