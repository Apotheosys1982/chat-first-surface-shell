#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const candidateRoots = [
  "assistants",
  "dist",
  "framework/templates"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function walk(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  const results = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".netlify") continue;
    const relative = path.join(dir, entry.name).replaceAll(path.sep, "/");
    if (entry.isDirectory()) results.push(...walk(relative));
    if (entry.isFile() && entry.name === "styles.css") results.push(relative);
  }
  return results;
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

function cssBlocks(css, selector) {
  const blocks = [];
  let searchFrom = 0;
  while (searchFrom < css.length) {
    const index = css.indexOf(selector, searchFrom);
    if (index === -1) break;
    const open = css.indexOf("{", index);
    if (open === -1) break;
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") depth -= 1;
      if (depth === 0) {
        blocks.push(css.slice(index, i + 1));
        searchFrom = i + 1;
        break;
      }
    }
    if (searchFrom <= index) break;
  }
  return blocks;
}

function publicDirForCss(cssPath) {
  return path.dirname(cssPath).replaceAll(path.sep, "/");
}

function push(checks, target, check, ok, detail = "") {
  checks.push({ target, check, status: ok ? "pass" : "fail", detail });
}

function validatesChatWorkspace(publicDir, css, script, checks) {
  const workspaceBlock = firstCssBlock(css, ".chat-workspace");
  const headerBlock = firstCssBlock(css, ".workspace-header");
  const composerBlock = firstCssBlock(css, ".assistant-composer");
  const streamBlock = firstCssBlock(css, ".message-stream");
  const recededStreamBlock = firstCssBlock(css, ".chrome-receded .message-stream");
  const recededHeaderBlock = firstCssBlock(css, ".chrome-receded .workspace-header");
  const recededComposerBlock = firstCssBlock(css, ".chrome-receded .assistant-composer");

  push(checks, publicDir, "chat_workspace_no_normal_flow_chrome_rows", !/grid-template-rows\s*:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/i.test(workspaceBlock), "scroll-receded chrome cannot reserve auto rows");
  push(checks, publicDir, "chat_header_out_of_layout_flow", /position\s*:\s*(absolute|fixed)/i.test(headerBlock), "header must float above stream");
  push(checks, publicDir, "chat_composer_out_of_layout_flow", /position\s*:\s*(absolute|fixed)/i.test(composerBlock), "composer must float above stream");
  push(checks, publicDir, "chat_stream_owns_viewport", /height\s*:\s*var\(--viewport-safe-height\)/i.test(streamBlock), "stream owns viewport height");
  push(checks, publicDir, "chat_recede_shrinks_top_reserved_space", /padding-top\s*:\s*calc\((?:14|12|16|18|20)px\s*\+\s*env\(safe-area-inset-top\)\)/i.test(recededStreamBlock), "top reserved space must shrink");
  push(checks, publicDir, "chat_recede_shrinks_bottom_reserved_space", /padding-bottom\s*:\s*calc\((?:14|16|18|20|22)px\s*\+\s*env\(safe-area-inset-bottom\)\)/i.test(recededStreamBlock), "bottom reserved space must shrink");
  push(checks, publicDir, "chat_chrome_motion_transform_opacity", /transform\s*:/i.test(recededHeaderBlock) && /opacity\s*:\s*0/i.test(recededHeaderBlock) && /transform\s*:/i.test(recededComposerBlock) && /opacity\s*:\s*0/i.test(recededComposerBlock), "chrome uses transform/opacity");
  push(checks, publicDir, "chat_script_controls_recede_state", /chrome-receded/.test(script), "script toggles chrome-receded");
  push(checks, publicDir, "chat_gesture_direction_controls_recede_state", /addEventListener\(["']wheel["']/i.test(script) && /addEventListener\(["']touchmove["']/i.test(script) && /gestureOwnsChrome/i.test(script), "wheel/touch direction must not depend only on scrollTop movement");
  push(checks, publicDir, "chat_viewport_horizontal_lock", /overflow-x\s*:\s*clip/i.test(css) && /overscroll-behavior-x\s*:\s*none/i.test(css) && /touch-action\s*:\s*pan-y/i.test(css), "viewport must only pan vertically");
  push(checks, publicDir, "chat_stream_scroll_owns_chrome", /canHandleChromeGesture[\s\S]*\[data-message-stream\]/i.test(script) && /stream\?\.addEventListener\(["']scroll["']/i.test(script) && /requestChromeRecede\(true\)/i.test(script), "message stream scroll state owns chrome recede on mobile");
}

function validatesAssistantPanel(publicDir, css, checks) {
  const panelBlock = firstCssBlock(css, ".assistant-panel");
  const readingChromeBlocks = cssBlocks(css, ".assistant-panel.is-reading .wm-assistant-chrome");
  const readingBodyBlocks = cssBlocks(css, ".assistant-panel.is-reading .assistant-body");
  const readingConversationBlocks = cssBlocks(css, ".assistant-panel.is-reading .conversation");
  const readingPanelBlocks = cssBlocks(css, ".assistant-panel.is-reading");
  const readingChromeText = readingChromeBlocks.join("\n");
  const readingBodyText = readingBodyBlocks.join("\n");
  const readingConversationText = readingConversationBlocks.join("\n");
  const readingPanelText = readingPanelBlocks.join("\n");
  const bodyText = cssBlocks(css, ".assistant-body").join("\n");
  const conversationText = cssBlocks(css, ".conversation").join("\n");
  const usesChromeRecede = Boolean(readingChromeText);
  if (!usesChromeRecede) return;

  const panelGridIsSafe = /grid-template-rows\s*:\s*minmax\(0,\s*1fr\)/i.test(panelBlock) ||
    /grid-template-rows\s*:\s*minmax\(0,\s*1fr\)/i.test(readingPanelText);
  const variableShrinkIsSafe = /--assistant-top-space\s*:\s*(?:8|10|12|14|16|18|20)px/i.test(readingPanelText) &&
    /--assistant-bottom-space\s*:\s*(?:8|10|12|14|16|18|20)px/i.test(readingPanelText) &&
    /padding[^;]*var\(--assistant-top-space\)/i.test(`${bodyText}\n${conversationText}`) &&
    /padding[^;]*var\(--assistant-bottom-space\)/i.test(`${bodyText}\n${conversationText}`);
  const topShrink = /padding-top\s*:\s*(?:max|calc)\([^;]*env\(safe-area-inset-top\)[^;]*\)/i.test(`${readingBodyText}\n${readingConversationText}`) ||
    /padding\s*:\s*(?:max|calc)\([^;]*env\(safe-area-inset-top\)[^;]*\)/i.test(`${readingBodyText}\n${readingConversationText}`) ||
    variableShrinkIsSafe;
  const bottomShrink = /padding-bottom\s*:\s*(?:max|calc)\([^;]*env\(safe-area-inset-bottom\)[^;]*\)/i.test(`${readingBodyText}\n${readingConversationText}`) ||
    /padding\s*:[^;]*(?:max|calc)\([^;]*env\(safe-area-inset-bottom\)[^;]*\)/i.test(`${readingBodyText}\n${readingConversationText}`) ||
    variableShrinkIsSafe;

  push(checks, publicDir, "assistant_panel_grid_releases_chrome_rows", panelGridIsSafe || variableShrinkIsSafe, "reading state must not reserve header/body/composer rows");
  push(checks, publicDir, "assistant_results_reclaim_top_space", topShrink, "assistant results top padding shrinks");
  push(checks, publicDir, "assistant_results_reclaim_bottom_space", bottomShrink, "assistant results bottom padding shrinks");
  push(checks, publicDir, "assistant_chrome_transform_opacity", /transform\s*:\s*translate3d/i.test(readingChromeText) && /opacity\s*:\s*0/i.test(readingChromeText), "assistant chrome uses transform/opacity");
}

const checks = [];
for (const cssPath of candidateRoots.flatMap(walk).sort()) {
  const publicDir = publicDirForCss(cssPath);
  const scriptPath = `${publicDir}/script.js`;
  const css = read(cssPath);
  const script = exists(scriptPath) ? read(scriptPath) : "";
  const declaresChatChrome = css.includes(".chrome-receded") && css.includes(".chat-workspace");
  const declaresAssistantReadingChrome = css.includes(".assistant-panel.is-reading .wm-assistant-chrome");
  if (!declaresChatChrome && !declaresAssistantReadingChrome) continue;
  if (declaresChatChrome) validatesChatWorkspace(publicDir, css, script, checks);
  if (declaresAssistantReadingChrome) validatesAssistantPanel(publicDir, css, checks);
}

const failures = checks.filter((check) => check.status === "fail");

console.log(JSON.stringify({
  validator: "validate-chrome-collapse-invariant",
  checked: checks.length,
  failures,
  checks
}, null, 2));

if (failures.length) process.exit(1);
