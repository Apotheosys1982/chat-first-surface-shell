#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const ignoredDirs = new Set([".git", ".netlify", "node_modules"]);
const failures = [];
let checked = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    checked += 1;
    const result = spawnSync(process.execPath, ["--check", fullPath], {
      cwd: root,
      encoding: "utf8"
    });
    if (result.status !== 0) {
      failures.push({
        file: path.relative(root, fullPath),
        stderr: result.stderr.trim()
      });
    }
  }
}

walk(root);

const report = {
  validator: "validate-js-syntax",
  checked,
  failures
};

console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
