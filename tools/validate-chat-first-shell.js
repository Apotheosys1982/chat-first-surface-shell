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

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function latestFile(dirName, extension) {
  const dir = path.join(root, dirName);
  if (!fs.existsSync(dir)) return "";
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .sort()
    .pop() || "";
}

function firstCssBlock(css, selector) {
  const index = css.indexOf(selector);
  if (index === -1) return "";
  const open = css.indexOf("{", index);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") depth -= 1;
    if (depth === 0) return css.slice(index, i + 1);
  }
  return "";
}

function cssRuleBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s+");
  const matches = Array.from(css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([\\s\\S]*?)\\}`, "gi")));
  return matches.length ? matches[matches.length - 1][1] : "";
}

function push(checks, target, check, ok, detail = "") {
  checks.push({ target, check, status: ok ? "pass" : "fail", detail });
}

function validateTarget(target, checks) {
  const htmlPath = `${target.publicDir}/index.html`;
  const cssPath = `${target.publicDir}/styles.css`;
  const scriptPath = `${target.publicDir}/script.js`;
  const projectStatePath = `${target.publicDir}/project-state.js`;
  const stateEventsPath = `${target.publicDir}/state-events.js`;
  const sourceRegistryPath = `${target.publicDir}/source-registry.js`;
  const answerPackPath = `${target.publicDir}/compiled-answer-pack.js`;
  const latestReceipt = latestFile("receipts", ".md");

  for (const filePath of [htmlPath, cssPath, scriptPath, projectStatePath, stateEventsPath, sourceRegistryPath, answerPackPath]) {
    push(checks, target.id, "required_file", exists(filePath), filePath);
  }
  if (!exists(htmlPath) || !exists(cssPath) || !exists(scriptPath) || !exists(projectStatePath) || !exists(stateEventsPath) || !exists(sourceRegistryPath) || !exists(answerPackPath)) return;

  const html = read(htmlPath);
  const css = read(cssPath);
  const script = read(scriptPath);
  const projectState = read(projectStatePath);
  const stateEvents = read(stateEventsPath);
  const sourceRegistry = read(sourceRegistryPath);
  const answerPack = read(answerPackPath);
  const syncScript = exists("tools/sync-chat-first-state.js") ? read("tools/sync-chat-first-state.js") : "";
  const scriptOrder = [
    "./project-state.js",
    "./state-events.js",
    "./source-registry.js",
    "./compiled-answer-pack.js",
    "./script.js"
  ].map((needle) => html.indexOf(needle));
  const sourceMapStart = script.indexOf('"source-map"');
  const sourceMapEnd = sourceMapStart === -1 ? -1 : script.indexOf('"validation-receipt"', sourceMapStart);
  const sourceMapBlock = sourceMapStart === -1
    ? ""
    : script.slice(sourceMapStart, sourceMapEnd === -1 ? script.length : sourceMapEnd);
  const trayRendererStart = script.indexOf("function renderTrayActivity");
  const trayRendererEnd = trayRendererStart === -1 ? -1 : script.indexOf("function sourceRows", trayRendererStart);
  const trayRendererBlock = trayRendererStart === -1
    ? ""
    : script.slice(trayRendererStart, trayRendererEnd === -1 ? script.length : trayRendererEnd);

  const workspaceBlock = firstCssBlock(css, ".chat-workspace");
  const headerBlock = firstCssBlock(css, ".workspace-header");
  const composerBlock = firstCssBlock(css, ".assistant-composer");
  const streamBlock = firstCssBlock(css, ".message-stream");
  const sideTrayBlock = firstCssBlock(css, ".side-tray");
  const trayActivityBlock = firstCssBlock(css, ".tray-activity");
  const trayActivityListBlock = firstCssBlock(css, ".tray-activity-list");
  const artifactLayerBlock = firstCssBlock(css, ".artifact-layer");
  const artifactPanelBlock = firstCssBlock(css, ".artifact-panel");
  const artifactHeaderBlock = firstCssBlock(css, ".artifact-header");
  const recededStreamBlock = firstCssBlock(css, ".chrome-receded .message-stream");
  const recededHeaderBlock = firstCssBlock(css, ".chrome-receded .workspace-header");
  const recededComposerBlock = firstCssBlock(css, ".chrome-receded .assistant-composer");
  const iconButtonBlock = firstCssBlock(css, ".icon-button");
  const artifactIconBlock = firstCssBlock(css, ".artifact-icon");
  const recentItemStrongBlock = cssRuleBlock(css, ".recent-item strong");

  push(checks, target.id, "assistant_shell_is_first_view", /<main class=["']chat-workspace["']/i.test(html), "main.chat-workspace");
  push(checks, target.id, "surface_mode_declared", /<html[^>]+data-surface-mode=["']builder["']/i.test(html) && /shellMode/i.test(script), "builder/demo copy mode declared");
  push(checks, target.id, "native_textarea_composer", /<textarea[^>]+name=["']question["']/i.test(html), "textarea[name=question]");
  push(
    checks,
    target.id,
    "composer_plus_imports_document",
    /<button[^>]+class=["']composer-tool["'][^>]+data-document-import/i.test(html) &&
      !/<button[^>]+class=["']composer-tool["'][^>]+data-artifact-open/i.test(html),
    "composer plus must import documents, not open a decorative artifact"
  );
  push(
    checks,
    target.id,
    "document_file_input_exists",
    /<input[^>]+data-document-input[^>]+type=["']file["'][^>]+multiple/i.test(html),
    "hidden multi-file document input"
  );
  push(checks, target.id, "composer_not_pill", !/border-radius\s*:\s*999px/i.test(composerBlock + firstCssBlock(css, ".composer-row")), "no 999px composer radius");
  push(checks, target.id, "viewport_horizontal_lock_declared", /overflow-x\s*:\s*clip/i.test(css) && /overscroll-behavior-x\s*:\s*none/i.test(css) && /touch-action\s*:\s*pan-y/i.test(css), "viewport must only pan vertically");
  push(checks, target.id, "stream_horizontal_lock_declared", /overflow-x\s*:\s*clip/i.test(streamBlock) && /overscroll-behavior-x\s*:\s*none/i.test(streamBlock) && /touch-action\s*:\s*pan-y/i.test(streamBlock) && /-webkit-overflow-scrolling\s*:\s*touch/i.test(streamBlock), "message stream must be mobile-native vertical scroller");
  push(checks, target.id, "closed_tray_stays_inside_viewport", /clip-path\s*:\s*inset\(0\s+100%\s+0\s+0\)/i.test(sideTrayBlock) && /visibility\s*:\s*hidden/i.test(sideTrayBlock) && !/translateX\s*\(\s*calc\(\s*-100%/i.test(sideTrayBlock), "closed tray must clip in place instead of creating offscreen horizontal overflow");
  push(checks, target.id, "horizontal_scroll_lock_runtime", /function\s+lockHorizontalViewport\s*\(/i.test(script) && /window\.scrollX/i.test(script) && /scrollLeft\s*=\s*0/i.test(script), "runtime clamps accidental horizontal scroll");
  push(checks, target.id, "stream_scroll_owns_chrome_motion", /canHandleChromeGesture[\s\S]*\[data-message-stream\]/i.test(script) && /stream\?\.addEventListener\(["']scroll["']/i.test(script) && /requestChromeRecede\(true\)/i.test(script), "raw touchmove should not fight the message stream scroll state");
  push(checks, target.id, "header_controls_not_nested_pills", /border\s*:\s*0/i.test(iconButtonBlock) && /background\s*:\s*transparent/i.test(iconButtonBlock), "header icon controls should be borderless by default");
  push(checks, target.id, "artifact_icons_not_nested_pills", /border\s*:\s*0/i.test(artifactIconBlock), "artifact icons should not be framed mini-pills");
  push(checks, target.id, "motion_tokens_linked", html.includes("./motion/motion-tokens.css"), "motion token stylesheet");
  push(checks, target.id, "project_state_loaded_before_runtime", scriptOrder.every((index) => index >= 0) && scriptOrder.every((index, i) => i === 0 || index > scriptOrder[i - 1]), "project state, events, source registry, and compiled pack must load before runtime");
  push(checks, target.id, "latest_receipt_rendered_in_state", latestReceipt ? projectState.includes(`receipts/${latestReceipt}`) : false, latestReceipt ? `receipts/${latestReceipt}` : "no receipt");
  push(checks, target.id, "project_state_has_receipt_stream", /recentReceipts/i.test(projectState) && /recentChecksums/i.test(projectState) && /generatedAt/i.test(projectState), "generated receipt/checksum state");
  push(checks, target.id, "state_event_ledger_loaded", /CHAT_FIRST_STATE_EVENTS/i.test(stateEvents) && /codex_update/i.test(stateEvents), "generated event ledger");
  push(checks, target.id, "source_registry_loaded", /CHAT_FIRST_SOURCE_REGISTRY/i.test(sourceRegistry) && /sourceStatus/i.test(sourceRegistry) && /ingestionStatus/i.test(sourceRegistry), "generated source registry");
  push(checks, target.id, "compiled_answer_pack_loaded", /CHAT_FIRST_ANSWER_PACK/i.test(answerPack) && /answerRooms/i.test(answerPack), "compiled answer pack");
  push(checks, target.id, "state_sync_generates_friendly_labels", /friendlyLabelBySlug/i.test(syncScript) && /Precision polish \+ mode split/i.test(syncScript) && /Scrollable activity tray/i.test(syncScript), "state sync should not render raw filename slugs as primary copy");
  push(checks, target.id, "tray_exists", /data-tray/i.test(html) && /data-tray-open/i.test(html), "left tray controls");
  push(checks, target.id, "artifact_layer_exists", /data-artifact-layer/i.test(html) && /data-artifact-open/i.test(html), "artifact renderer layer");
  push(checks, target.id, "tray_tracks_recent_activity", /Recent activity/i.test(html) && /Project state dashboard/i.test(html) && /Recent hardening log/i.test(html), "tray must expose recent project activity");
  push(checks, target.id, "tray_activity_has_dynamic_target", /data-tray-activity-list/i.test(html), "recent activity render target");
  push(checks, target.id, "tray_owns_scroll_container", /display\s*:\s*flex/i.test(sideTrayBlock) && /overflow\s*:\s*hidden/i.test(sideTrayBlock) && /max-height\s*:\s*var\(--viewport-safe-height\)/i.test(sideTrayBlock), "tray shell owns viewport");
  push(
    checks,
    target.id,
    "tray_activity_region_can_scroll",
    /min-height\s*:\s*0/i.test(trayActivityBlock) &&
      /overflow\s*:\s*hidden/i.test(trayActivityBlock) &&
      /overflow-y\s*:\s*auto/i.test(trayActivityListBlock) &&
      (/overscroll-behavior\s*:\s*contain/i.test(trayActivityListBlock) || /overscroll-behavior-y\s*:\s*contain/i.test(trayActivityListBlock)) &&
      /overscroll-behavior-x\s*:\s*none/i.test(trayActivityListBlock),
    "recent activity list must scroll internally without horizontal pan"
  );
  push(checks, target.id, "tray_activity_hydrates_from_project_state", /renderTrayActivity/i.test(script) && /trayActivityList\.innerHTML/i.test(script) && /recentReceipts\.slice/i.test(script), "tray recent activity hydrated from project state");
  push(checks, target.id, "tray_activity_uses_compact_metadata", /function trayActivityMeta/i.test(script) && /trayActivityMeta\(item\)/i.test(trayRendererBlock) && !/item\.detail/i.test(trayRendererBlock), "tray must not expose long receipt paths as primary visible card copy");
  push(checks, target.id, "tray_activity_text_clamps", /text-overflow\s*:\s*ellipsis/i.test(css) && /white-space\s*:\s*nowrap/i.test(css), "recent activity metadata must clamp instead of overlapping");
  push(checks, target.id, "tray_activity_titles_single_line", /white-space\s*:\s*nowrap/i.test(recentItemStrongBlock) && /text-overflow\s*:\s*ellipsis/i.test(recentItemStrongBlock) && /overflow\s*:\s*hidden/i.test(recentItemStrongBlock), "recent activity titles must not overlap adjacent rows");
  push(checks, target.id, "project_state_artifacts_registered", /"artifact-dashboard"\s*:\s*{[\s\S]*Project state dashboard/i.test(script) && /"activity-log"\s*:\s*{[\s\S]*Recent hardening log/i.test(script), "dashboard and activity log artifacts");
  push(checks, target.id, "document_inbox_artifact_registered", /"document-inbox"\s*:\s*{[\s\S]*Source inbox/i.test(script), "document inbox artifact");
  push(checks, target.id, "document_import_runtime_exists", /DOCUMENT_STORE_KEY/i.test(script) && /FileReader/i.test(script) && /localStorage/i.test(script) && /importDocuments/i.test(script), "File API + localStorage document intake");
  push(checks, target.id, "document_import_route_exists", /"id":\s*"upload_lifecycle_orientation"/i.test(answerPack) && /document\|upload\|attach\|import\|file/i.test(answerPack), "assistant route for document import questions");
  push(checks, target.id, "project_state_route_exists", /what\\s\+changed|recent\\s\+activity|event_ledger|receipt_validation_status/i.test(script + answerPack), "assistant must route project-state questions");
  push(checks, target.id, "artifact_modal_full_viewport", /position\s*:\s*fixed/i.test(artifactLayerBlock) && /inset\s*:\s*0/i.test(artifactLayerBlock) && /padding\s*:\s*0/i.test(artifactLayerBlock), "artifact layer starts at viewport edge");
  push(checks, target.id, "artifact_panel_owns_viewport", /height\s*:\s*var\(--viewport-safe-height\)/i.test(artifactPanelBlock) && /width\s*:\s*100%/i.test(artifactPanelBlock) && /border-radius\s*:\s*0/i.test(artifactPanelBlock), "artifact panel must take full viewport");
  push(checks, target.id, "artifact_panel_motion_uses_tokens", /transform\s*:/i.test(artifactPanelBlock) && /var\(--wm-motion-duration-standard\)/i.test(artifactPanelBlock), "artifact panel open motion must use shared motion tokens");
  push(checks, target.id, "artifact_header_safe_top", /env\(safe-area-inset-top\)/i.test(artifactHeaderBlock) && /backdrop-filter/i.test(artifactHeaderBlock), "artifact header sits at top with safe-area");
  push(checks, target.id, "source_map_not_card_bullets", /Approved source spine[\s\S]*state-list/i.test(sourceMapBlock) && !/<ul class=["']artifact-list["']/i.test(sourceMapBlock), "source map uses professional rows, not bullet cards");
  push(checks, target.id, "source_map_uses_friendly_labels", /Assistant Shell Plan/i.test(sourceRegistry) && /Premium UI Plan/i.test(sourceRegistry) && /Offer Context Plan/i.test(sourceRegistry) && /Routing System Plan/i.test(sourceRegistry), "source map primary labels should be human-readable");
  push(checks, target.id, "source_map_preserves_file_metadata", /state-meta/i.test(script) && /PLANNING_CHAT_FIRST_SURFACE_ASSISTANT_SHELL\.md/i.test(sourceRegistry), "filenames remain inspectable as metadata");
  push(checks, target.id, "mode_aware_source_copy_exists", /function sourcePostureCopy/i.test(script) && /shellMode === ["']builder["']/i.test(script), "source map copy must separate builder and buyer/demo posture");
  push(checks, target.id, "artifact_open_resets_scroll", /artifactBody\.scrollTop\s*=\s*0/i.test(script), "artifact views open at the top");

  push(checks, target.id, "workspace_not_grid_chrome_rows", !/grid-template-rows\s*:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/i.test(workspaceBlock), "chrome must not reserve grid rows");
  push(checks, target.id, "header_removed_from_layout_flow", /position\s*:\s*absolute/i.test(headerBlock) || /position\s*:\s*fixed/i.test(headerBlock), "header absolute/fixed");
  push(checks, target.id, "composer_removed_from_layout_flow", /position\s*:\s*absolute/i.test(composerBlock) || /position\s*:\s*fixed/i.test(composerBlock), "composer absolute/fixed");
  push(checks, target.id, "message_stream_owns_viewport", /height\s*:\s*var\(--viewport-safe-height\)/i.test(streamBlock), "message stream viewport height");
  push(checks, target.id, "message_stream_padding_is_animated", /padding-top[\s\S]*var\(--wm-motion-duration-standard\)/i.test(streamBlock) && /padding-bottom[\s\S]*var\(--wm-motion-duration-standard\)/i.test(streamBlock), "animated padding");
  push(checks, target.id, "chrome_recede_reclaims_top_space", /padding-top\s*:\s*calc\(14px\s*\+\s*env\(safe-area-inset-top\)\)/i.test(recededStreamBlock), "top padding shrinks");
  push(checks, target.id, "chrome_recede_reclaims_bottom_space", /padding-bottom\s*:\s*calc\(18px\s*\+\s*env\(safe-area-inset-bottom\)\)/i.test(recededStreamBlock), "bottom padding shrinks");
  push(checks, target.id, "header_motion_uses_transform_opacity", /transform\s*:/i.test(recededHeaderBlock) && /opacity\s*:\s*0/i.test(recededHeaderBlock), "header transform + opacity");
  push(checks, target.id, "composer_motion_uses_transform_opacity", /transform\s*:/i.test(recededComposerBlock) && /opacity\s*:\s*0/i.test(recededComposerBlock), "composer transform + opacity");
  push(checks, target.id, "scroll_direction_controls_chrome", /chrome-receded/.test(script) && /delta\s*>\s*CHROME_SCROLL_THRESHOLD/.test(script) && /requestChromeRecede\(true\)/i.test(script), "scroll delta toggles chrome");
  push(checks, target.id, "gesture_direction_controls_chrome", /addEventListener\(["']wheel["']/i.test(script) && /addEventListener\(["']touchmove["']/i.test(script) && /gestureOwnsChrome/i.test(script), "wheel/touch direction toggles chrome without requiring scrollTop movement");
  push(checks, target.id, "smalltalk_route_exists", /how\\s\+are\\s\+you|hello|hey/i.test(answerPack) && /I’m here and ready|I'm here and ready/i.test(answerPack), "simple greetings must not hit generic fallback");
  push(
    checks,
    target.id,
    "streaming_auto_follow_exists",
    /let\s+autoFollowStreaming\s*=\s*false/i.test(script) &&
      /function\s+scrollStreamToBottom\s*\(/i.test(script) &&
      /streamAssistantMessage\(response\.answer,\s*response\.actions,\s*\{\s*follow:\s*true\s*\}\)/i.test(script),
    "fresh submitted answers must auto-follow while streaming"
  );
  push(
    checks,
    target.id,
    "streaming_tick_scrolls_while_following",
    /if\s*\(\s*shouldFollow\s*&&\s*autoFollowStreaming\s*\)\s*\{\s*scrollStreamToBottom\(\)/i.test(script),
    "streaming ticks must pull the message viewport downward"
  );
  push(
    checks,
    target.id,
    "streaming_follow_releases_after_actions",
    /requestAnimationFrame\(\(\)\s*=>\s*\{\s*scrollStreamToBottom\(\);\s*autoFollowStreaming\s*=\s*false;\s*\}\)/i.test(script),
    "stream auto-follow must stop after the final rendered actions land"
  );
  push(
    checks,
    target.id,
    "user_scroll_can_cancel_stream_follow",
    /event\.deltaY\s*<\s*-GESTURE_EPSILON[\s\S]*autoFollowStreaming\s*=\s*false/i.test(script) &&
      /fingerDelta\s*>\s*GESTURE_EPSILON[\s\S]*autoFollowStreaming\s*=\s*false/i.test(script),
    "manual upward pressure must take control away from auto-follow"
  );
}

const checks = [];
for (const target of targets) validateTarget(target, checks);
const failures = checks.filter((check) => check.status === "fail");

console.log(JSON.stringify({
  validator: "validate-chat-first-shell",
  checked: checks.length,
  failures,
  checks
}, null, 2));

if (failures.length) process.exit(1);
