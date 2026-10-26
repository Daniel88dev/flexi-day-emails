import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { createElement } from "react";
import { render } from "@react-email/render";
import DirectoryInvite, { subject } from "../emails/directory-invite";

const anchors = (html: string) =>
  [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((match) => ({
    href: match[1] as string,
    inner: match[2] as string,
  }));

describe("directory-invite", () => {
  let html = "";
  let text = "";

  before(async () => {
    html = await render(createElement(DirectoryInvite), { pretty: false });
    text = await render(createElement(DirectoryInvite), { plainText: true });
  });

  it("names the organization and never a group", () => {
    for (const part of [subject, html, text]) {
      assert.match(part, /\{\{organizationName\}\}/);
      assert.doesNotMatch(part, /groupName|inviteCode/);
    }
  });

  it("says it in English and then in Czech", () => {
    for (const part of [html, text]) {
      const english = part.indexOf("invited you to");
      const czech = part.indexOf("vás pozval");
      assert.ok(english >= 0, "English copy missing");
      assert.ok(czech > english, "Czech copy must follow the English");
    }
    assert.match(html, /lang="cs"/);
  });

  it("links both buttons to the invite URL, and addresses the person by name", () => {
    const buttons = anchors(html).filter((a) =>
      /Accept the invite|Přijmout pozvánku/.test(a.inner)
    );
    assert.equal(buttons.length, 2);
    for (const button of buttons) assert.equal(button.href, "{{inviteUrl}}");
    assert.match(text, /\{\{personName\}\}/);
    assert.match(text, /\{\{invitedEmail\}\}/);
    assert.match(text, /\{\{expiresIn\}\}/);
    assert.match(text, /\{\{expiresInCs\}\}/);
  });

  it("gives the Czech half its own fallback link and footer clause", () => {
    const czech = html.slice(html.indexOf('lang="cs"'));
    const fallbacks = anchors(czech).filter((a) => a.inner.includes("{{inviteUrl}}"));
    assert.equal(fallbacks.length, 1);
    assert.equal(fallbacks[0]?.href, "{{inviteUrl}}");
    assert.match(text, /zkopírujte tento odkaz/);
    assert.match(text, /nic se\s+nestane/);
  });
});
