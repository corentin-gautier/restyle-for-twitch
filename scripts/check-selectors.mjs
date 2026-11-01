#!/usr/bin/env node
// Compiles the stylesheet in memory and looks in its selectors for the shapes
// the "Performance" rules forbid (.claude/agents/scss-editor.md). Selectors
// already recorded in selector-baseline.json are tolerated; a new one fails.
//
//   node scripts/check-selectors.mjs                   check
//   node scripts/check-selectors.mjs --update-baseline record the current state
//   node scripts/check-selectors.mjs --hook            as a Claude Code hook: reads
//     the edited path on stdin, ignores anything outside src/scss/, exit 2 on failure
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(ROOT, "scripts/selector-baseline.json");
const SCOPE = 'html:not([data-rs="off"])';
const POSITION = /:(first|last|only|nth)-(child|of-type|last-child|last-of-type)|:nth-child|:nth-of-type|:nth-last/;
const LARGE_CONTAINER = /(\.twilight-main|#live-channel-stream-information|\.channel-root|\.right-column)\b/;

// Splits on the separators found outside brackets, parentheses and strings.
function split(text, isSeparator) {
  const parts = [];
  let depth = 0, quote = null, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "\\") i++;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (!depth && isSeparator(c)) {
      parts.push(text.slice(start, i), c);
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

// Selectors of every style rule, at-rules opened. Minified or readable input.
function selectorsOf(css) {
  const found = new Set();
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let start = 0, quote = null;
  const stack = [];
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "{") {
      const head = clean.slice(start, i).trim();
      stack.push(head);
      if (!head.startsWith("@")) {
        split(head, (s) => s === ",").filter((p) => p !== ",").forEach((s) => found.add(s.trim()));
      }
      start = i + 1;
    } else if (c === "}") {
      stack.pop();
      start = i + 1;
    } else if (c === ";") start = i + 1;
  }
  return [...found].filter((s) => !/^(from|to|\d+%)$/.test(s));
}

function compoundsOf(selector) {
  // Combinators are normalised to one character, spaces standing for descendants.
  const tidy = selector.trim().replace(/\s*([>+~])\s*/g, "$1").replace(/\s+/g, " ");
  const parts = split(tidy, (c) => c === " " || c === ">" || c === "+" || c === "~");
  const compounds = [];
  for (let i = 0; i < parts.length; i += 2) compounds.push({ text: parts[i], before: parts[i - 1] ?? null });
  return compounds;
}

// A compound's own part, without what sits in the parentheses of its pseudo-classes.
function own(text) {
  let out = "", depth = 0;
  for (const c of text) {
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (!depth) out += c;
  }
  return out;
}
const isBroad = (text) => !/[.#[]/.test(own(text)) && !text.includes(":where(") && !text.startsWith("::");
const whereBodies = (text) => [...text.matchAll(/:where\(/g)].map((m) => {
  let depth = 1, i = m.index + 7;
  for (; i < text.length && depth; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
  }
  return text.slice(m.index + 7, i - 1);
});

function check(selector) {
  const issues = [];
  const body = selector.startsWith(SCOPE) ? selector.slice(SCOPE.length) : selector;
  const compounds = compoundsOf(body);
  const subject = compounds[compounds.length - 1];
  const hasHas = body.includes(":has(");

  if (/:has\([^]*:has\(/.test(body) && compounds.some((c) => {
    const at = c.text.indexOf(":has(");
    return at >= 0 && c.text.includes(":has(", at + 1) && hasNestedHas(c.text);
  })) issues.push("nested-has");
  if (/:is\([^)]*:has\(/.test(body)) issues.push("has-in-is");
  for (const [i, c] of compounds.entries()) {
    if (!c.text.includes(":has(")) continue;
    if (isBroad(c.text)) issues.push("unguarded-has");
    if (i < compounds.length - 1) issues.push("has-on-ancestor");
    if (LARGE_CONTAINER.test(own(c.text))) issues.push("has-on-large-container");
  }
  if (compounds.length > 1 && isBroad(subject.text)) {
    const earlier = compounds.slice(0, -1);
    if (subject.before === "+" || subject.before === "~" || earlier.some((c) => POSITION.test(c.text))) {
      issues.push("unguarded-subject");
    }
    if (earlier.some((c) => /\[class[*^$~|]?=/.test(c.text))) issues.push("generated-class-ahead");
  }
  if (subject.before === "~" && !/[.#[]/.test(own(subject.text)) && compounds.slice(0, -1).some((c) => POSITION.test(c.text))) {
    issues.push("position-then-sibling");
  }
  for (const c of compounds) {
    for (const guard of whereBodies(c.text)) {
      if (/\[(class|style|aria-)/.test(guard)) issues.push("bad-guard-scope");
    }
  }
  return hasHas || issues.length ? [...new Set(issues)] : [];
}

function hasNestedHas(text) {
  for (const m of text.matchAll(/:has\(/g)) {
    let depth = 1, i = m.index + 5;
    for (; i < text.length && depth; i++) {
      if (text[i] === "(") depth++;
      else if (text[i] === ")") depth--;
      if (depth && text.startsWith(":has(", i)) return true;
    }
  }
  return false;
}

function compile() {
  const warnings = [];
  const { css } = sass.compile(join(ROOT, "src/scss/restyle.scss"), {
    loadPaths: [join(ROOT, "src/scss")],
    style: "compressed",
    logger: { warn: (message) => warnings.push(message), debug() {} },
  });
  return { css, warnings };
}

const args = process.argv.slice(2);
if (args.includes("--hook")) {
  let path = "";
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    path = input.tool_input?.file_path ?? "";
  } catch {}
  if (!path.includes("/src/scss/")) process.exit(0);
}
const fail = args.includes("--hook") ? 2 : 1;

let compiled;
try {
  compiled = compile();
} catch (error) {
  console.error(`Sass failed:\n${error.message}`);
  process.exit(fail);
}
const results = {};
for (const selector of selectorsOf(compiled.css)) {
  const issues = check(selector);
  if (issues.length) results[selector] = issues;
}
const size = Buffer.byteLength(compiled.css);

if (args.includes("--update-baseline")) {
  writeFileSync(BASELINE, `${JSON.stringify({ size, selectors: results }, null, 1)}\n`);
  console.log(`Baseline: ${Object.keys(results).length} tolerated selectors, ${(size / 1024).toFixed(1)} KB.`);
  process.exit(0);
}

let baseline = { size, selectors: {} };
try {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
} catch {}
const fresh = Object.entries(results).filter(([s, issues]) => issues.some((i) => !baseline.selectors[s]?.includes(i)));
const gone = Object.keys(baseline.selectors).filter((s) => !results[s]).length;

if (compiled.warnings.length) console.error(`Sass warnings:\n${compiled.warnings.join("\n")}`);
for (const [selector, issues] of fresh) console.error(`${issues.join(", ")}\n  ${selector}`);
if (fresh.length || compiled.warnings.length) {
  console.error(`\n${fresh.length} selector(s) break the rules under "Performance" in .claude/agents/scss-editor.md.`);
  process.exit(fail);
}
const delta = size - baseline.size;
console.log(`Selectors OK. ${(size / 1024).toFixed(1)} KB (${delta >= 0 ? "+" : ""}${delta} bytes).${gone ? ` ${gone} tolerated selector(s) gone: run --update-baseline.` : ""}`);
