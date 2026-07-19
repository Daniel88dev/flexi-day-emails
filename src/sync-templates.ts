/**
 * Idempotent upsert of rendered templates into AWS SES (SESv2 API).
 *
 * For each entry in out/manifest.json:
 *   GetEmailTemplate  → exists?  UpdateEmailTemplate : CreateEmailTemplate
 *
 * Naming convention: flexi-day-<templateName>-<stage>
 *   e.g. flexi-day-email-confirmation-prod
 *
 * Env:
 *   STAGE       required, "dev" | "prod"
 *   AWS_REGION  optional, defaults to eu-central-1 (flexi-day-be's region)
 *
 * Credentials come from the default AWS provider chain (locally: your AWS
 * profile; in CI: the GitHub Actions OIDC role). Running twice is safe.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CreateEmailTemplateCommand,
  GetEmailTemplateCommand,
  NotFoundException,
  SESv2Client,
  UpdateEmailTemplateCommand,
} from "@aws-sdk/client-sesv2";
import type { ManifestEntry } from "./render.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "out");

const STAGES = ["dev", "prod"] as const;
type Stage = (typeof STAGES)[number];

function getStage(): Stage {
  const stage = process.env.STAGE;
  if (!stage || !(STAGES as readonly string[]).includes(stage)) {
    throw new Error(
      `STAGE must be one of ${STAGES.join(", ")} (got "${stage ?? ""}")`
    );
  }
  return stage as Stage;
}

async function main() {
  const stage = getStage();
  const region = process.env.AWS_REGION ?? "eu-central-1";
  const client = new SESv2Client({ region });

  const manifest = JSON.parse(
    await readFile(path.join(outDir, "manifest.json"), "utf8")
  ) as ManifestEntry[];

  for (const entry of manifest) {
    const templateName = `flexi-day-${entry.name}-${stage}`;
    const content = {
      Subject: entry.subject,
      Html: await readFile(path.join(outDir, entry.htmlFile), "utf8"),
      Text: await readFile(path.join(outDir, entry.textFile), "utf8"),
    };

    let exists = true;
    try {
      await client.send(
        new GetEmailTemplateCommand({ TemplateName: templateName })
      );
    } catch (err) {
      if (err instanceof NotFoundException) {
        exists = false;
      } else {
        throw err;
      }
    }

    if (exists) {
      await client.send(
        new UpdateEmailTemplateCommand({
          TemplateName: templateName,
          TemplateContent: content,
        })
      );
      console.log(`updated ${templateName} (${region})`);
    } else {
      await client.send(
        new CreateEmailTemplateCommand({
          TemplateName: templateName,
          TemplateContent: content,
        })
      );
      console.log(`created ${templateName} (${region})`);
    }
  }
  console.log(`synced ${manifest.length} template(s) to stage "${stage}"`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
