#!/usr/bin/env node
/**
 * Lightweight build gate for a static, dependency-free site: no bundler, so
 * this script stands in for "lint + test + build" by checking the things
 * that actually break a static site —
 *   1. every local .js file parses (syntax check only, nothing is executed)
 *   2. every local href/src/srcset reference in the .html files resolves to
 *      a real file, so a typo in a path or a missing image fails loudly
 *   3. a couple of content-integrity rules specific to this project (no
 *      bracketed placeholders, no invented contact details) so a future
 *      edit can't accidentally reintroduce fabricated content.
 *
 * Run with: node scripts/verify.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
let failures = 0;

function fail(message) {
  console.error(`  FAIL  ${message}`);
  failures += 1;
}

function pass(message) {
  console.log(`  ok    ${message}`);
}

function listFiles(dir, ext, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "source-images") continue;
      listFiles(full, ext, out);
    } else if (full.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

// 1. JS syntax check ---------------------------------------------------------
console.log("Checking JavaScript syntax...");
for (const file of listFiles(path.join(ROOT, "js"), ".js")) {
  const code = fs.readFileSync(file, "utf8");
  try {
    new vm.Script(code, { filename: file });
    pass(path.relative(ROOT, file));
  } catch (err) {
    fail(`${path.relative(ROOT, file)} — ${err.message}`);
  }
}
for (const file of listFiles(path.join(ROOT, "scripts"), ".js")) {
  const code = fs.readFileSync(file, "utf8");
  try {
    new vm.Script(code, { filename: file });
    pass(path.relative(ROOT, file));
  } catch (err) {
    fail(`${path.relative(ROOT, file)} — ${err.message}`);
  }
}

// 2. Local link / asset integrity across all HTML pages ---------------------
console.log("\nChecking local links and asset references...");
const htmlFiles = listFiles(ROOT, ".html");
const singlePattern = /(?:href|src)="([^"]+)"/g;
const srcsetPattern = /srcset="([^"]+)"/g;

function checkCandidate(file, candidate) {
  if (!candidate) return;
  if (/^(https?:|mailto:|tel:|#|data:)/.test(candidate)) return;
  const withoutQuery = candidate.split(/[?#]/)[0];
  const resolved = path.join(path.dirname(file), withoutQuery);
  if (!fs.existsSync(resolved)) {
    fail(`${path.relative(ROOT, file)} references missing file: ${candidate}`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  let match;
  while ((match = singlePattern.exec(html))) {
    checkCandidate(file, match[1]);
  }
  while ((match = srcsetPattern.exec(html))) {
    const candidates = match[1].split(",").map((s) => s.trim().split(/\s+/)[0]);
    candidates.forEach((c) => checkCandidate(file, c));
  }
}
if (failures === 0) pass("all local href/src/srcset references resolve");

// 3. Content-integrity guards -------------------------------------------------
console.log("\nChecking for placeholder or fabricated content...");
const suspiciousPatterns = [/\[.*TBD.*\]/i, /\[.*placeholder.*\]/i, /lorem ipsum/i, /555-0100/];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(html)) {
      fail(`${path.relative(ROOT, file)} contains suspicious placeholder text matching ${pattern}`);
    }
  }
}
if (failures === 0) pass("no placeholder markers found in HTML output");

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
