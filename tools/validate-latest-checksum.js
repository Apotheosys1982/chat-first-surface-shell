#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const checksumDir = path.join(root, "checksums");

if (!fs.existsSync(checksumDir)) {
  console.error("No checksums directory found.");
  process.exit(1);
}

const manifests = fs.readdirSync(checksumDir)
  .filter((file) => file.endsWith(".sha256"))
  .sort();

if (!manifests.length) {
  console.error("No checksum manifests found.");
  process.exit(1);
}

const latest = path.join("checksums", manifests[manifests.length - 1]);
const result = spawnSync("shasum", ["-a", "256", "-c", latest], {
  cwd: root,
  encoding: "utf8"
});

const report = {
  validator: "validate-latest-checksum",
  manifest: latest,
  status: result.status === 0 ? "pass" : "fail",
  stdout: result.stdout.trim().split(/\n/).filter(Boolean),
  stderr: result.stderr.trim()
};

console.log(JSON.stringify(report, null, 2));
process.exit(result.status || 0);
