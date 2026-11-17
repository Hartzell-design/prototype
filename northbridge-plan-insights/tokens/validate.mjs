#!/usr/bin/env node
// Validates tokens.json and checks it against the dashboard HTML it was extracted from.
// Usage: node validate.mjs [currentHtml] [legacyHtml]
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flatten } from "./build.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const CUR_HTML = process.argv[2] ?? "/workspace/prototypes/engagement-dashboard/index.html";
const LEG_HTML = process.argv[3] ?? "/tmp/engagement-dashboard-pre-redesign.html";
const TYPES = new Set(["color","dimension","fontFamily","fontWeight","number","duration","cubicBezier","shadow","typography","border","strokeStyle","gradient","transition"]);
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.error("FAIL " + msg); } };
const section = (t) => console.log("\n# " + t);

section("1. JSON parses");
let doc;
try { doc = JSON.parse(readFileSync(join(DIR, "tokens.json"), "utf8")); ok(true); console.log("tokens.json OK"); }
catch (e) { ok(false, "tokens.json: " + e.message); process.exit(1); }
for (const f of ["figma/primitives.json", "figma/semantic.northbridge-2026.json", "figma/semantic.legacy.json"]) {
  try { JSON.parse(readFileSync(join(DIR, f), "utf8")); ok(true); } catch (e) { ok(false, f + ": " + e.message); }
}

section("2. DTCG shape ($value + known $type on every token)");
const sets = { primitive: flatten(doc.primitive), "northbridge-2026": flatten(doc["northbridge-2026"]), legacy: flatten(doc.legacy) };
for (const [name, toks] of Object.entries(sets)) {
  for (const t of toks) ok(TYPES.has(t.type), `${name}:${t.path.join(".")} has type ${t.type}`);
  console.log(`${name}: ${toks.length} tokens`);
}

section("3. Every {alias} resolves (primitive + each semantic set), with matching types");
const index = (toks) => new Map(toks.map((t) => [t.path.join("."), t]));
const P = index(sets.primitive);
const aliasesIn = (v) => typeof v === "string" ? [...v.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1])
  : Array.isArray(v) ? v.flatMap(aliasesIn) : v && typeof v === "object" ? Object.values(v).flatMap(aliasesIn) : [];
const COMPOSITE_PART = { fontFamily:"fontFamily", fontSize:"dimension", fontWeight:"fontWeight", lineHeight:"number", letterSpacing:"dimension", color:"color", offsetX:"dimension", offsetY:"dimension", blur:"dimension", spread:"dimension" };
function resolve(map, path, seen = new Set()) {
  if (seen.has(path)) throw new Error("cycle at " + path);
  const t = map.get(path); if (!t) throw new Error("missing " + path);
  const m = typeof t.token.$value === "string" && t.token.$value.match(/^\{([^{}]+)\}$/);
  return m ? resolve(map, m[1], new Set([...seen, path])) : t;
}
let aliasCount = 0;
for (const name of ["primitive", "northbridge-2026", "legacy"]) {
  const map = new Map([...P, ...index(sets[name])]);
  for (const t of sets[name]) {
    const v = t.token.$value;
    for (const a of aliasesIn(v)) {
      aliasCount++;
      try {
        const target = resolve(map, a);
        let expected = t.type;
        if (typeof v === "object") { // alias inside a composite: find which key it sits under
          const parts = Array.isArray(v) ? v : [v];
          const key = parts.flatMap((p) => Object.entries(p)).find(([, x]) => x === `{${a}}`)?.[0];
          expected = COMPOSITE_PART[key] ?? expected;
        }
        ok(target.type === expected, `${name}:${t.path.join(".")} -> {${a}} is ${target.type}, expected ${expected}`);
      } catch (e) { ok(false, `${name}:${t.path.join(".")} -> {${a}}: ${e.message}`); }
    }
  }
}
console.log(`${aliasCount} alias references checked`);

section("4. Both semantic modes have identical token paths and types");
const sig = (toks) => toks.map((t) => t.path.join(".") + ":" + t.type).sort().join("\n");
ok(sig(sets["northbridge-2026"]) === sig(sets.legacy), "semantic sets differ in shape");
console.log(`${sets.legacy.length} semantic tokens in each mode`);

section("5. Primitive colors exist in the source HTML");
const cur = readFileSync(CUR_HTML, "utf8").toUpperCase(), leg = existsSync(LEG_HTML) ? readFileSync(LEG_HTML, "utf8").toUpperCase() : null;
ok(leg !== null, "legacy HTML missing: " + LEG_HTML);
const norm = (s) => s.replace(/\s+/g, "");
const curN = norm(cur), legN = norm(leg ?? "");
const added = [];
for (const t of sets.primitive.filter((t) => t.type === "color")) {
  const hex = t.token.$value.toUpperCase(), src = t.token.$extensions?.["com.northbridge"]?.source ?? "both";
  let needles = [hex];
  if (/^#(.)\1(.)\2(.)\3$/.test(hex)) needles.push("#" + hex[1] + hex[3] + hex[5] + "\"", "#" + hex[1] + hex[3] + hex[5] + ";", "#" + hex[1] + hex[3] + hex[5] + "}", "#" + hex[1] + hex[3] + hex[5] + " ", "#" + hex[1] + hex[3] + hex[5] + ")");
  if (hex.length === 9) { // #RRGGBBAA -> rgba(r,g,b
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    needles = [`RGBA(${r},${g},${b}`];
  }
  if (t.token.$extensions?.["com.northbridge"]?.added) { added.push(t.path.join(".")); continue; }
  const inCur = needles.some((n) => curN.includes(n)), inLeg = needles.some((n) => legN.includes(n));
  const found = src === "northbridge-2026" ? inCur : src === "legacy" ? inLeg : (inCur || inLeg);
  ok(found, `${t.path.join(".")} ${hex} (source ${src}) not found in HTML`);
}
// alpha values: check the exact alpha too
for (const t of sets.primitive.filter((t) => t.type === "color" && t.token.$value.length === 9)) {
  const d = t.token.$description.match(/rgba\([^)]*\)/i)?.[0];
  if (!d) continue;
  const [r, g, b, a] = d.replace(/rgba\(|\)/gi, "").split(",").map(Number);
  const hexA = Math.round(a * 255).toString(16).padStart(2, "0").toUpperCase();
  ok(t.token.$value.toUpperCase() === "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase() + hexA, `${t.path.join(".")} hex8 != ${d}`);
}
console.log(added.length ? "Added (not in HTML): " + added.join(", ") : "No added colors: every primitive color appears in the source HTML");

section("6. Semantic tokens match the dashboards' own :root variables");
const rootVars = (html) => Object.fromEntries([...html.match(/:ROOT\{([\s\S]*?)\n\}/)[1].matchAll(/--([\w-]+):([^;]+);/g)].map((m) => [m[1].toLowerCase(), m[2].trim()]));
const MAP = { "bg.canvas":"bg", "text.primary":"ink", "text.secondary":"ink2", "text.muted":"muted", "text.faint":"faint", "border.default":"line", "border.subtle":"line2",
  "surface.inverse":"side", "surface.inverse-hover":"side2", "border.inverse":"side-line", "accent.primary":"nb", "accent.secondary":"nb2", "accent.soft":"nb-soft",
  "accent.highlight":"glacier", "status.positive.fg":"obs", "status.positive.bg":"obs-bg", "status.positive.border":"obs-line", "status.warning.fg":"inf",
  "status.warning.bg":"inf-bg", "status.warning.border":"inf-line", "status.info.fg":"no", "status.info.bg":"no-bg", "status.info.border":"no-line",
  "status.negative.fg":"warn", "status.negative.bg":"warn-bg", "focus.ring":"nb2", "shape.radius-card":"r" };
for (const [name, html] of [["northbridge-2026", cur], ["legacy", leg]]) {
  const vars = rootVars(html), map = new Map([...P, ...index(sets[name])]);
  let n = 0;
  for (const [tok, v] of Object.entries(MAP)) {
    const val = String(resolve(map, tok).token.$value).toUpperCase();
    ok(val === vars[v].toUpperCase(), `${name}: ${tok}=${val} but --${v}=${vars[v]}`); n++;
  }
  console.log(`${name}: ${n} semantic tokens match :root`);
}

section("7. tokens.css regenerates identically");
try { console.log(execFileSync(process.execPath, [join(DIR, "build.mjs"), "--check"], { encoding: "utf8" }).trim()); ok(true); }
catch (e) { ok(false, "build --check: " + (e.stdout || e.message)); }

section("8. Brand rules");
const all = ["tokens.json", "tokens.css", "README.md", "build.mjs"].filter((f) => existsSync(join(DIR, f))).map((f) => readFileSync(join(DIR, f), "utf8")).join("\n");
const banned = new RegExp(["van", "guard"].join(""), "i");
ok(!banned.test(all), "banned firm name found");
const hsl = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s, l]; };
const ERROR_RED = new Set(["#B42318"]); // standard error red, only used for status.negative
for (const t of sets.primitive.filter((t) => t.type === "color")) {
  const hex = t.token.$value.slice(0, 7).toUpperCase(), [h, s, l] = hsl(hex);
  const maroonish = (h < 15 || h > 330) && s > 0.25 && l < 0.45;
  ok(!maroonish || ERROR_RED.has(hex), `${t.path.join(".")} ${hex} reads as maroon/burgundy`);
}
for (const k of ["accent.primary", "surface.brand"]) for (const m of ["northbridge-2026", "legacy"]) {
  const v = resolve(new Map([...P, ...index(sets[m])]), k).token.$value; const [h] = hsl(v);
  ok(h > 90 && h < 200, `${m}:${k} ${v} is not green/teal`);
}

console.log(`\n${fails ? "FAILED" : "ALL CHECKS PASSED"}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
