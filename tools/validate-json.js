#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

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
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    checked += 1;
    try {
      JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (error) {
      failures.push({
        file: path.relative(root, fullPath),
        error: error.message
      });
    }
  }
}

walk(root);

const report = {
  validator: "validate-json",
  checked,
  failures
};

console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
