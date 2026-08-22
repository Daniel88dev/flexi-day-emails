/**
 * Idempotent upsert of rendered templates into AWS SES (SESv2 API).
 *
 * For each entry in out/manifest.json:
 *   UpdateEmailTemplate  → NotFound?  CreateEmailTemplate
 *
 * Update-first rather than Get-then-write: it halves the calls in the common
 * case (every template already exists), which matters because SES throttles
 * this API hard — see PACE_MS.
 *
 * Naming convention: flexi-day-<templateName>-<stage>
 *   e.g. flexi-day-email-confirmation-prod
 *
 * Env:
 *   STAGE       required, "dev" | "prod"
 *   AWS_REGION  optional, defaults to eu-central-1 (flexi-day-be's region)
 *
 * Credentials come from the default AWS provider chain (locally: your AWS
 * profile; in CI: the GitHub Actions OIDC role). Running twice is safe, and so
 * is re-running after a partial failure — each template is written on its own.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CreateEmailTemplateCommand,
  NotFoundException,
  SESv2Client,
  TooManyRequestsException,
  UpdateEmailTemplateCommand,
} from "@aws-sdk/client-sesv2";
import type { ManifestEntry } from "./render";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "out");

const STAGES = ["dev", "prod"] as const;
type Stage = (typeof STAGES)[number];

/**
 * SES caps the template-management API (Create/Update/Delete/GetEmailTemplate)
 * at ~1 request per second, account-wide — a much lower quota than sending.
 * Firing the whole manifest back-to-back trips TooManyRequestsException part
 * way through, and the SDK's default retry budget (a few hundred ms) is far too
 * short to ride out a per-second quota. So pace ourselves, with headroom.
 */
const PACE_MS = 1_200;

/** Enough to outlast a burst from a concurrent sync or the AWS console. */
const MAX_ATTEMPTS = 6;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Next moment we are allowed to call SES, as an epoch ms. */
let nextSlot = 0;

const pace = async (): Promise<void> => {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + PACE_MS;
  if (wait > 0) await sleep(wait);
};

/**
 * The quota is account-wide, so we can still be throttled while perfectly
 * paced — another sync, or someone in the console, shares the budget. Back off
 * and retry rather than failing a half-finished sync.
 */
const isThrottled = (err: unknown): boolean =>
  err instanceof TooManyRequestsException ||
  (err as { name?: string } | null)?.name === "TooManyRequestsException";

const sendPaced = async <T>(
  label: string,
  send: () => Promise<T>,
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    await pace();
    try {
      return await send();
    } catch (err) {
      if (!isThrottled(err) || attempt >= MAX_ATTEMPTS) throw err;
      const backoff = PACE_MS * 2 ** attempt;
      console.warn(
        `  ${label}: throttled by SES, retrying in ${(backoff / 1000).toFixed(
          1,
        )}s ` + `(attempt ${String(attempt)}/${String(MAX_ATTEMPTS - 1)})`,
      );
      await sleep(backoff);
      nextSlot = Date.now();
    }
  }
};

function getStage(): Stage {
  const stage = process.env.STAGE;
  if (!stage || !(STAGES as readonly string[]).includes(stage)) {
    throw new Error(
      `STAGE must be one of ${STAGES.join(", ")} (got "${stage ?? ""}")`,
    );
  }
  return stage as Stage;
}

async function main() {
  const stage = getStage();
  const region = process.env.AWS_REGION ?? "eu-central-1";
  const client = new SESv2Client({ region });

  const manifest = JSON.parse(
    await readFile(path.join(outDir, "manifest.json"), "utf8"),
  ) as ManifestEntry[];

  let synced = 0;
  try {
    for (const entry of manifest) {
      const templateName = `flexi-day-${entry.name}-${stage}`;
      const TemplateContent = {
        Subject: entry.subject,
        Html: await readFile(path.join(outDir, entry.htmlFile), "utf8"),
        Text: await readFile(path.join(outDir, entry.textFile), "utf8"),
      };

      try {
        await sendPaced(templateName, () =>
          client.send(
            new UpdateEmailTemplateCommand({
              TemplateName: templateName,
              TemplateContent,
            }),
          ),
        );
        console.log(`updated ${templateName} (${region})`);
      } catch (err) {
        if (!(err instanceof NotFoundException)) throw err;
        await sendPaced(templateName, () =>
          client.send(
            new CreateEmailTemplateCommand({
              TemplateName: templateName,
              TemplateContent,
            }),
          ),
        );
        console.log(`created ${templateName} (${region})`);
      }
      synced += 1;
    }
  } catch (err) {
    // Every template is written independently, so say how far we got: a re-run
    // only has to redo the rest, and re-doing all of it is harmless anyway.
    console.error(
      `\nfailed after ${String(synced)}/${String(
        manifest.length,
      )} template(s) — ` + `re-run \`npm run sync:${stage}\` to finish.\n`,
    );
    throw err;
  }

  console.log(
    `synced ${String(manifest.length)} template(s) to stage "${stage}"`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
