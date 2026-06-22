#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const files = {
  protocol: "docs/LATTICE_LIVE_ARTIFACT_REVIEW_PROTOCOL.md",
  workOrder: "docs/LIVE_ARTIFACT_EVAL_WORK_ORDER.md",
  quickStart: "docs/AGENT_QUICK_START.md",
  deployment: "docs/DEPLOYMENT.md",
  readme: "README.md",
  packageJson: "package.json",
  sourceManifest: "assistants/chat-first-surface-shell/source-manifest.json",
  syncScript: "tools/sync-chat-first-state.js"
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function push(checks, check, ok, detail = "") {
  checks.push({ check, status: ok ? "pass" : "fail", detail });
}

const checks = [];

for (const [key, relativePath] of Object.entries(files)) {
  push(checks, `${key}_exists`, exists(relativePath), relativePath);
}

if (checks.some((check) => check.status === "fail")) {
  console.log(JSON.stringify({
    validator: "validate-live-artifact-evaluation-protocol",
    checked: checks.length,
    failures: checks.filter((check) => check.status === "fail"),
    checks
  }, null, 2));
  process.exit(1);
}

const protocol = read(files.protocol);
const workOrder = read(files.workOrder);
const quickStart = read(files.quickStart);
const deployment = read(files.deployment);
const readme = read(files.readme);
const packageJson = JSON.parse(read(files.packageJson));
const sourceManifest = JSON.parse(read(files.sourceManifest));
const syncScript = read(files.syncScript);

push(checks, "three_review_modes_declared",
  /Static Review Mode/i.test(protocol) &&
    /Behavior Review Mode/i.test(protocol) &&
    /Evidence Review Mode/i.test(protocol),
  "static, behavior, evidence"
);

push(checks, "codex_is_execution_layer",
  /Codex is the execution layer/i.test(protocol) &&
    /reviewers must not claim live behavior is working unless Codex has run/i.test(protocol),
  "reviewer interprets; Codex executes"
);

push(checks, "reviewer_prompt_requires_live_checklist",
  /Live Artifact Evaluation Checklist/i.test(protocol) &&
    /exact URLs, viewport sizes, clicks, typed commands, expected outcomes, console checks/i.test(protocol),
  "review prompt tells reviewers to create executable behavior instructions"
);

push(checks, "evidence_package_minimum_fields",
  [
    "url",
    "commit",
    "deployId",
    "viewport",
    "browserSurface",
    "commandsTested",
    "expectedOutcomes",
    "actualOutcomes",
    "passFail",
    "consoleStatus",
    "receiptPath"
  ].every((field) => protocol.includes(field)),
  "minimum evidence schema"
);

push(checks, "work_order_has_core_commands",
  [
    "`dashboard`",
    "`artifacts`",
    "`source map`",
    "`inbox`",
    "`events`",
    "`compiler`",
    "`receipt`",
    "`draft`",
    "`spreadsheet`",
    "`table`"
  ].every((command) => workOrder.includes(command)),
  "core shell command matrix"
);

push(checks, "work_order_expects_spreadsheet_artifact",
  /\|\s*`spreadsheet`\s*\|\s*Opens `Staged spreadsheet`\./i.test(workOrder) &&
    /\|\s*`table`\s*\|\s*Opens `Staged spreadsheet`\./i.test(workOrder),
  "spreadsheet and table are live artifact commands"
);

push(checks, "work_order_has_negative_and_upload_checks",
  /Negative And Boundary Checks/i.test(workOrder) &&
    /Upload Quarantine Check/i.test(workOrder) &&
    /Mobile Viewport Check/i.test(workOrder),
  "negative, upload, mobile checks"
);

push(checks, "work_order_requires_receipt",
  /Receipt Requirement/i.test(workOrder) &&
    /console status/i.test(workOrder) &&
    /viewport metrics/i.test(workOrder) &&
    /URL, commit, and deploy ID/i.test(workOrder),
  "live result must be saved as a receipt"
);

push(checks, "readme_links_protocol_docs",
  readme.includes("docs/AGENT_QUICK_START.md") &&
    readme.includes("docs/LATTICE_LIVE_ARTIFACT_REVIEW_PROTOCOL.md") &&
    readme.includes("docs/LIVE_ARTIFACT_EVAL_WORK_ORDER.md"),
  "README documentation links"
);

push(checks, "source_manifest_counts_protocol_sources",
  sourceManifest.normalized_record_count >= 7 &&
    sourceManifest.source_fields_used.includes("agent quick start") &&
    sourceManifest.source_fields_used.includes("lattice live artifact review protocol") &&
    sourceManifest.source_fields_used.includes("live artifact evaluation work order"),
  "source manifest includes review protocol docs"
);

push(checks, "sync_includes_protocol_sources",
  /agent-quick-start/i.test(syncScript) &&
    /live-artifact-review-protocol/i.test(syncScript) &&
    /live-artifact-eval-work-order/i.test(syncScript) &&
    /Live artifact evaluation protocol/i.test(syncScript),
  "generated source registry includes protocol sources"
);

push(checks, "quick_start_has_do_not_build_boundary",
  /Do Not Build Next/i.test(quickStart) &&
    /Do not implement sockets yet/i.test(quickStart) &&
    /Do not build twelve artifacts at once/i.test(quickStart) &&
    /Build the next artifact through the registry/i.test(quickStart),
  "incoming agents get a hard build boundary"
);

push(checks, "quick_start_has_operator_block",
  /Ten Command Operator Block/i.test(quickStart) &&
    /npm run validate/i.test(quickStart) &&
    /Live Evidence Rule/i.test(quickStart),
  "one-page operator checklist"
);

push(checks, "deployment_documents_cross_repo_cli_fallback",
  /cross-repo CLI path/i.test(deployment) &&
    /surface-assistant-feature-surface\/node_modules\/\.bin\/netlify/i.test(deployment) &&
    /explicit `--site e69fb33f-e59a-4e37-9c4c-67d9963b8a5a`/i.test(deployment),
  "Netlify CLI fallback is documented as tooling, not identity"
);

push(checks, "validate_script_wired",
  packageJson.scripts["validate:live-artifact-eval"] === "node tools/validate-live-artifact-evaluation-protocol.js" &&
    /validate:live-artifact-eval/.test(packageJson.scripts.validate),
  "package validation gate"
);

const failures = checks.filter((check) => check.status === "fail");

console.log(JSON.stringify({
  validator: "validate-live-artifact-evaluation-protocol",
  checked: checks.length,
  failures,
  checks
}, null, 2));

process.exit(failures.length ? 1 : 0);
