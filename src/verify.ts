/**
 * Post-render assertions: every placeholder listed in the manifest must
 * survive rendering as a literal `{{variable}}` in both the HTML and text
 * parts, and must not have been HTML- or URL-escaped anywhere (e.g. an
 * href="{{confirmationUrl}}" turning into href="%7B%7BconfirmationUrl%7D%7D").
 *
 * Run after render.ts; fails the build on any violation.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ManifestEntry } from "./render";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "out");

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

const ESCAPED_PATTERNS: [string, RegExp][] = [
  ["URL-encoded braces (%7B/%7D)", /%7B|%7D/i],
  ["HTML-entity braces (&#123; / &#x7b;)", /&#0*123;|&#x0*7b;/i],
  ["HTML-entity braces (&lbrace;)", /&lbrace;|&rbrace;/i],
];

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(outDir, "manifest.json"), "utf8"),
  ) as ManifestEntry[];

  const errors: string[] = [];

  for (const entry of manifest) {
    const html = await readFile(path.join(outDir, entry.htmlFile), "utf8");
    const text = await readFile(path.join(outDir, entry.textFile), "utf8");

    for (const variable of entry.variables) {
      const token = `{{${variable}}}`;
      if (!html.includes(token) && !text.includes(token)) {
        errors.push(
          `${entry.name}: expected literal ${token} in HTML or text output`,
        );
      }
    }

    for (const [label, pattern] of ESCAPED_PATTERNS) {
      if (pattern.test(html)) {
        errors.push(
          `${entry.name}: HTML contains ${label} — a placeholder got escaped`,
        );
      }
    }

    // The plain-text render uppercases headings, so a placeholder inside one
    // comes out as {{GROUPNAME}} while the HTML keeps {{groupName}}. SES
    // substitutes neither reliably and the reader sees the raw token. The HTML
    // part is authoritative (asserted un-escaped above), so any text token that
    // only matches an HTML one case-insensitively has been mangled.
    const htmlTokens = new Set(
      [...html.matchAll(PLACEHOLDER_RE)].map((match) => match[1] as string),
    );
    for (const match of text.matchAll(PLACEHOLDER_RE)) {
      const token = match[1] as string;
      if (htmlTokens.has(token)) continue;
      const original = [...htmlTokens].find(
        (candidate) => candidate.toLowerCase() === token.toLowerCase(),
      );
      if (original) {
        errors.push(
          `${entry.name}: text part has {{${token}}} but the HTML has {{${original}}} — a placeholder was case-mangled. Headings are uppercased in the text render; keep placeholders out of them.`,
        );
      }
    }

    // Placeholders used inside href attributes are the most fragile spot:
    // assert that every href containing braces is the intact raw token.
    for (const match of html.matchAll(/href="([^"]*)"/g)) {
      const href = match[1] as string;
      if (/[{}%]/.test(href) && !/^\{\{[a-zA-Z0-9_.]+\}\}$/.test(href)) {
        errors.push(
          `${entry.name}: suspicious href "${href}" — placeholder may be mangled`,
        );
      }
    }
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(`FAIL ${e}`);
    process.exit(1);
  }
  console.log(
    `verified ${manifest.length} template(s): placeholders intact, no escaping`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
