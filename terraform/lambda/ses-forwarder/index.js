"use strict";

// Forwards inbound SES mail to a personal address. SES will not send from an
// unverified "From:", so the header is rewritten to a verified domain address
// (FROM_EMAIL) and the original sender is preserved in Reply-To. The header
// rewriting is adapted from arithmetic/aws-lambda-ses-forwarder (MIT).

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SESClient, SendRawEmailCommand } = require("@aws-sdk/client-ses");

const s3 = new S3Client({});
const ses = new SESClient({});

const {
  MAIL_BUCKET,
  MAIL_KEY_PREFIX = "",
  FROM_EMAIL,
  FORWARD_TO,
  SUBJECT_PREFIX = "",
} = process.env;

function processMessage(emailData) {
  const match = emailData.match(/^((?:.+\r?\n)*)(\r?\n(?:.*\s+)*)/m);
  let header = match && match[1] ? match[1] : emailData;
  const body = match && match[2] ? match[2] : "";

  // Preserve the original sender for replies.
  if (!/^reply-to:[\t ]?/im.test(header)) {
    const from = header.match(/^from:[\t ]?(.*(?:\r?\n\s+.*)*\r?\n)/im);
    if (from && from[1]) header += "Reply-To: " + from[1];
  }

  // Replace "From:" with the verified sender, keeping the display name.
  header = header.replace(
    /^from:[\t ]?(.*(?:\r?\n\s+.*)*)/gim,
    (_m, from) =>
      "From: " + from.replace(/<(.*)>/, "").trim() + " <" + FROM_EMAIL + ">"
  );

  if (SUBJECT_PREFIX) {
    header = header.replace(
      /^subject:[\t ]?(.*)/gim,
      (_m, subject) => "Subject: " + SUBJECT_PREFIX + subject
    );
  }

  // These headers are invalid once From is rewritten; drop them.
  header = header.replace(/^return-path:[\t ]?(.*)\r?\n/gim, "");
  header = header.replace(/^sender:[\t ]?(.*)\r?\n/gim, "");
  header = header.replace(/^message-id:[\t ]?(.*)\r?\n/gim, "");
  header = header.replace(/^dkim-signature:[\t ]?.*\r?\n(\s+.*\r?\n)*/gim, "");

  return header + body;
}

exports.handler = async (event) => {
  const ses_ = event.Records[0].ses;
  const messageId = ses_.mail.messageId;
  const recipients = ses_.receipt.recipients;

  const obj = await s3.send(
    new GetObjectCommand({
      Bucket: MAIL_BUCKET,
      Key: MAIL_KEY_PREFIX + messageId,
    })
  );
  const raw = await obj.Body.transformToString();

  await ses.send(
    new SendRawEmailCommand({
      Source: FROM_EMAIL,
      Destinations: [FORWARD_TO],
      RawMessage: { Data: Buffer.from(processMessage(raw)) },
    })
  );

  console.log(
    `Forwarded ${messageId} (${recipients.join(", ")}) -> ${FORWARD_TO}`
  );
};
