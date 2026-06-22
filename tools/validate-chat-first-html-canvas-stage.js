#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const targets = [
  {
    id: "chat-first-html-canvas-source",
    publicDir: "assistants/chat-first-surface-shell/public"
  },
  {
    id: "chat-first-html-canvas-build",
    publicDir: "dist/chat-first-surface-shell"
  }
];

const requiredCommands = ["draft", "document", "report", "canvas", "html canvas", "diagnosis draft"];
const requiredRendererFields = [
  "rendererId",
  "artifactTypesSupported",
  "stageType",
  "renderFunctionName",
  "supportsHTMLInCanvas",
  "supportsEdit",
  "supportsExport",
  "supportsPrint",
  "supportsSnapshot",
  "closeBehavior",
  "validationRules"
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
  const htmlPath = `${target.publicDir}/index.html`;
  const scriptPath = `${target.publicDir}/script.js`;
  const cssPath = `${target.publicDir}/styles.css`;

  for (const filePath of [htmlPath, scriptPath, cssPath]) {
    push(checks, target.id, "required_file", exists(filePath), filePath);
  }
  if (![htmlPath, scriptPath, cssPath].every(exists)) return;

  const script = read(scriptPath);
  const css = read(cssPath);
  const submitIndex = script.indexOf("function submitPrompt");
  const resolveIndex = script.indexOf("resolveArtifactCommand(input", submitIndex);
  const routeIndex = script.indexOf("const response = route(input)", submitIndex);

  push(checks, target.id, "renderer_registry_exists", /const\s+rendererRegistry\s*=\s*{/i.test(script), "renderer registry object");
  push(checks, target.id, "html_canvas_renderer_exists", /htmlCanvasDocumentStage/i.test(script), "htmlCanvasDocumentStage renderer");
  for (const field of requiredRendererFields) {
    push(checks, target.id, `renderer_field_${field}`, script.includes(field), field);
  }
  push(checks, target.id, "document_surface_artifact_exists", /artifactId:\s*["']surface-diagnosis-draft["']/i.test(script) && /artifactType:\s*["']documentSurface["']/i.test(script), "surface-diagnosis-draft documentSurface artifact");
  push(checks, target.id, "document_stage_registry_shape", /rendererId:\s*["']htmlCanvasDocumentStage["']/i.test(script) && /stageType:\s*["']htmlInCanvas["']/i.test(script) && /stateAdapterId:\s*["']documentDraftAdapter["']/i.test(script), "artifact points at htmlInCanvas renderer");
  for (const command of requiredCommands) {
    const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    push(checks, target.id, `command_${command.replace(/\s+/g, "_")}_opens_stage`, new RegExp(`["']${escaped}["']`, "i").test(script), command);
  }
  push(checks, target.id, "resolver_runs_before_answer_route", resolveIndex !== -1 && routeIndex !== -1 && resolveIndex < routeIndex, "artifact commands run before route(input)");
  push(checks, target.id, "document_command_status_copy", /Opening document stage\./i.test(script), "short status copy");
  push(checks, target.id, "native_html_canvas_attempt", /drawElementImage/i.test(script) && /requestPaint/i.test(script) && /layoutsubtree/i.test(script), "attempts browser-native draw-element path");
  push(checks, target.id, "native_status_visible", /Renderer:\s*HTML-in-Canvas active/i.test(script) && /native HTML-in-Canvas unavailable/i.test(script) && /fallback active/i.test(script), "visible renderer status states");
  push(checks, target.id, "fallback_dom_exists", /data-html-canvas-fallback/i.test(script) && /fallback\.innerHTML\s*=\s*documentNode\.outerHTML/i.test(script), "controlled fallback content");
  push(checks, target.id, "premium_document_content", /Surface Diagnosis Draft/i.test(script) && /Turning messy business knowledge into a command surface/i.test(script) && /diagnosis-table/i.test(script), "document-stage proof content");
  push(checks, target.id, "artifact_layer_close_preserved", /function\s+closeArtifact\s*\(/i.test(script) && /data-artifact-close/i.test(read(htmlPath)), "close returns to chat");
  push(checks, target.id, "upload_quarantine_preserved", /canAnswerFrom:\s*false/i.test(script) && /Uncertain/i.test(script) && /review,\s*compilation,\s*and\s*validation/i.test(script), "upload rules remain bounded");
  push(checks, target.id, "no_live_llm_or_server_upload_added", !/api\.openai|OpenAI|chat\.completions|fetch\(["']https?:/i.test(script), "no live model/server call in runtime");
  push(checks, target.id, "stage_css_exists", /html-canvas-stage/i.test(css) && /diagnosis-document/i.test(css) && /renderer-status/i.test(css), "stage visual system");
}

const checks = [];
for (const target of targets) validateTarget(target, checks);

const sourceScript = exists("assistants/chat-first-surface-shell/public/script.js")
  ? read("assistants/chat-first-surface-shell/public/script.js")
  : "";
const buildScript = exists("dist/chat-first-surface-shell/script.js")
  ? read("dist/chat-first-surface-shell/script.js")
  : "";
push(checks, "chat-first-html-canvas-mirror", "source_dist_script_mirrored", sourceScript === buildScript, "script.js mirror parity");

const sourceCss = exists("assistants/chat-first-surface-shell/public/styles.css")
  ? read("assistants/chat-first-surface-shell/public/styles.css")
  : "";
const buildCss = exists("dist/chat-first-surface-shell/styles.css")
  ? read("dist/chat-first-surface-shell/styles.css")
  : "";
push(checks, "chat-first-html-canvas-mirror", "source_dist_styles_mirrored", sourceCss === buildCss, "styles.css mirror parity");

const failures = checks.filter((check) => check.status === "fail");

console.log(JSON.stringify({
  validator: "validate-chat-first-html-canvas-stage",
  checked: checks.length,
  failures,
  checks
}, null, 2));

if (failures.length) process.exit(1);
