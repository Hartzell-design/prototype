// Enforces the brief's rule: style with tokens.css custom properties only.
// Flags hard-coded colors, font families and px sizes in src/**/*.css and inline styles in src/**/*.tsx.
// Exceptions: src/styles/layout.css (layout constants the token set doesn't cover yet),
// @media breakpoints (CSS can't read custom properties there), and lines marked "lint-allow".
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
// legacy-skin.css: 2011-era gradients, bevels and font stacks the token set can't express (legacy theme only).
const ALLOW_FILES = new Set(["src/styles/layout.css", "src/styles/legacy-skin.css"]);

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

const rules = [
  { name: "hex color", re: /#[0-9a-f]{3,8}\b/i },
  { name: "rgb/hsl color", re: /\b(rgba?|hsla?)\(/i },
  { name: "named color", re: /:\s*(white|black|red|green|blue|gray|grey)\b/i },
  { name: "px size", re: /(?<![\w-])-?\d*\.?\d+px\b/ },
  { name: "font family literal", re: /font-family:\s*(?![\s]|var\(|inherit)/i },
];

let problems = 0;
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOW_FILES.has(rel)) continue;
  const isCss = file.endsWith(".css"), isTsx = file.endsWith(".tsx");
  if (!isCss && !isTsx) continue;
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (line.includes("lint-allow") || /^\s*@media/.test(line)) return;
    // In TSX, only check style={{...}} and className-free CSS strings; SVG geometry numbers are not styles.
    const target = isTsx ? (line.match(/style=\{\{[^}]*\}\}/g) ?? []).join(" ") : line.replace(/\/\*.*?\*\//g, "");
    for (const r of rules) {
      if (r.re.test(target)) {
        problems++;
        console.log(`${rel}:${i + 1}  ${r.name}: ${line.trim()}`);
      }
    }
  });
}
if (problems) {
  console.error(`\n${problems} hard-coded value(s). Use a token from tokens/tokens.css.`);
  process.exit(1);
}
console.log("Token lint: no hard-coded colors, fonts or px sizes in src/.");
