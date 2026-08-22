/**
 * Renders every template in emails/ to out/ as:
 *   out/<templateName>.html  — HTML part (pretty: false)
 *   out/<templateName>.txt   — plain-text part
 *   out/manifest.json        — template name, subject, expected variables
 *
 * Templates are rendered with no props, so their literal `{{placeholder}}`
 * defaults end up in the output for SES to substitute at send time.
 */
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement, type ComponentType } from "react";
import { render } from "@react-email/render";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const emailsDir = path.join(root, "emails");
const outDir = path.join(root, "out");

export interface ManifestEntry {
  /** Template base name, e.g. "email-confirmation". */
  name: string;
  /** SES Subject part (may contain placeholders). */
  subject: string;
  /** Placeholder variables found in subject/html/text. */
  variables: string[];
  htmlFile: string;
  textFile: string;
}

interface TemplateModule {
  default: ComponentType;
  subject: string;
}

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function extractVariables(...parts: string[]): string[] {
  const vars = new Set<string>();
  for (const part of parts) {
    for (const match of part.matchAll(PLACEHOLDER_RE)) {
      vars.add(match[1] as string);
    }
  }
  return [...vars].sort();
}

async function main() {
  const files = (await readdir(emailsDir))
    .filter((f) => f.endsWith(".tsx"))
    .sort();
  if (files.length === 0) {
    throw new Error(`No templates found in ${emailsDir}`);
  }

  await mkdir(outDir, { recursive: true });
  const manifest: ManifestEntry[] = [];

  for (const file of files) {
    const name = path.basename(file, ".tsx");
    const mod = (await import(
      pathToFileURL(path.join(emailsDir, file)).href
    )) as Partial<TemplateModule>;

    if (typeof mod.default !== "function") {
      throw new Error(`${file}: missing default export (React component)`);
    }
    if (typeof mod.subject !== "string" || mod.subject.length === 0) {
      throw new Error(`${file}: missing "subject" string export`);
    }

    const element = createElement(mod.default);
    const html = await render(element, { pretty: false });
    const text = await render(element, { plainText: true });

    const htmlFile = `${name}.html`;
    const textFile = `${name}.txt`;
    await writeFile(path.join(outDir, htmlFile), html, "utf8");
    await writeFile(path.join(outDir, textFile), text, "utf8");

    manifest.push({
      name,
      subject: mod.subject,
      variables: extractVariables(mod.subject, html, text),
      htmlFile,
      textFile,
    });
    console.log(`rendered ${name} (${manifest.at(-1)?.variables.join(", ")})`);
  }

  await writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );
  console.log(`wrote manifest.json with ${manifest.length} template(s)`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
